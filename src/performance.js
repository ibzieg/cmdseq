/* eslint-disable no-use-before-define */
/*
 * Copyright 2020, Ian Zieg
 *
 * This file is part of a program called "cmdseq"
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
const fs = require('fs');

const { safeDump } = require('js-yaml');
const { isEmpty } = require('lodash');

const store = require('./store');
const {
  putTrack,
  selectTracks,
} = require('./store/tracks');
const {
  putPerformance,
  selectController,
  selectInstruments,
  selectLoop,
  selectScenes,
} = require('./store/performance-store');
const StateFileWatcher = require('./state-file-watcher');
const { TrackConfig } = require('./schema/track-config');
const { MidiController, MidiDevice } = require('./midi');
const { generatorDefaults, generateSequence } = require('./generator');
const SequencePlayer = require('./sequence-player');
const { PerformanceSchema } = require('./schema/performance-schema');
const logger = require('./logger');

const log = logger.create('config');

// -----------------------------------------------------------------------------

const performanceDir = 'config';
const performanceName = 'performance';

const watchers = new Map();
const players = new Map();

let hasPerformanceFileLoaded = false;

let stopCount = 0;
let sceneIndex = 0;
let clockCount = 0;

// -----------------------------------------------------------------------------

// eslint-disable-next-line no-unused-vars
function writeDefaultConfig() {
  let track = {};
  try {
    track = TrackConfig({
      playback: {
        rate: 4,
      },
      generator: generatorDefaults,
      sequences: [
        {
          name: 'intro',
          steps: generateSequence(generatorDefaults),
        },
        {
          name: 'A',
          steps: generateSequence({ ...generatorDefaults, type: 'euclid', steps: 5 }),
        },
        {
          name: 'B',
          steps: generateSequence({ ...generatorDefaults, type: 'euclid', steps: 6 }),
        },
        {
          name: 'quarter',
          steps: generateSequence({ ...generatorDefaults, type: 'quarter' }),
        },
        {
          name: 'half',
          steps: generateSequence({ ...generatorDefaults, type: 'half' }),
        },
        {
          name: 'eighth',
          steps: generateSequence({ ...generatorDefaults, type: 'eighth' }),
        },
        {
          name: 'euclid8',
          steps: generateSequence({ ...generatorDefaults, type: 'euclid', steps: 8 }),
        },
        {
          name: 'accel',
          steps: generateSequence({ ...generatorDefaults, type: 'accel', steps: 4 }),
        },
        {
          name: 'ritard',
          steps: generateSequence({ ...generatorDefaults, type: 'ritard', steps: 4 }),
        },
      ],
    });
  } catch (error) {
    log.error('Error generating default track:');
    log.error(error);
  }

  const yaml = safeDump(track, {
    flowLevel: 4,
    // sortKeys: true,
  });
  fs.writeFileSync('./output.yaml', yaml);
}

function handleStoreStateChange() {
  // const state = store.getState();
  // const firstTrack = selectFirstTrack(state);
  // log.debug(firstTrack.sequences[0].name);
}

function handleTrackFileChange(trackConfig) {
  const { dispatch } = store;
  dispatch(putTrack(trackConfig));
}

function handlePerformanceFileChange(perfConfig) {
  const { dispatch } = store;
  dispatch(putPerformance(perfConfig));
  if (!hasPerformanceFileLoaded) {
    // eslint-disable-next-line no-use-before-define
    performanceFileDidLoad();
    hasPerformanceFileLoaded = true;
  }
  watchTrackConfigs();
}

function getInstrumentFileName(name) {
  return `${performanceDir}/${name}.yaml`;
}

function watchPerformanceConfig() {
  const name = performanceName;
  if (!watchers.has(name)) {
    watchers.set(name, new StateFileWatcher(
      getInstrumentFileName(name), {
        schema: PerformanceSchema,
        onLoad: handlePerformanceFileChange,
      },
    ));
  }
}

function watchTrackConfigs() {
  const instruments = selectInstruments(store.getState());
  instruments.forEach((instrument) => {
    const { name } = instrument;

    if (!watchers.has(name)) {
      watchers.set(name, new StateFileWatcher(
        getInstrumentFileName(name), {
          schema: TrackConfig,
          onLoad: handleTrackFileChange,
        },
      ));
    }

    if (!players.has(name)) {
      players.set(name, new SequencePlayer());
    }
  });
}

function resetPlayers() {
  players.forEach((player) => player.reset());
}

function reset() {
  sceneIndex = 0;
  resetPlayers();
}

function midiStop() {
  stopCount += 1;
  if (stopCount <= 1) {
    log.music('Clock Stop');
  } else {
    log.music('Clock Reset');
  }
  reset();
}

function midiStart() {
  stopCount = 0;
  log.music('Clock Start');
}

function midiClock() {
  const state = store.getState();
  const loopScene = selectLoop(state);
  const scenes = selectScenes(state);
  const tracks = selectTracks(state);

  let scene = scenes[sceneIndex % scenes.length];
  if (loopScene) {
    const findLoopScene = scenes.find((s) => s.name === loopScene);
    if (findLoopScene) {
      scene = findLoopScene;
    }
  }

  const { repeat } = scene;
  let readyNextScene = false;

  const playTrack = (sceneTrack, launchNext = false) => {
    const {
      name, play, follow, master,
    } = sceneTrack;
    if (!tracks[name]) {
      return;
    }
    const { playback, sequences } = tracks[name];

    let eventDidExecute = false;

    const player = players.get(name);
    if (player && !isEmpty(play)) {
      const seqNameIndex = player.loopCount;
      const seqName = play[seqNameIndex % play.length];
      const sequence = sequences.find((s) => s.name === seqName);

      const shouldLoop = isEmpty(follow);
      if (launchNext) {
        player.next();
      }
      eventDidExecute = player.clock(clockCount, playback, sequence, shouldLoop);
    }

    // Play any tracks that are following this one
    scene.tracks.forEach((t) => {
      if (t.follow === name) {
        playTrack(t, eventDidExecute);
      }
    });

    if (master && player) {
      if (player.startCount >= repeat) {
        readyNextScene = true;
      }
    }
  };

  // Start by playing all the non-followers
  scene.tracks.forEach((t) => {
    if (isEmpty(t.follow)) {
      playTrack(t);
    }
  });

  if (readyNextScene) {
    sceneIndex += 1;
    resetPlayers();
  }

  clockCount += 1;
}

function setupStore() {
  store.subscribe(handleStoreStateChange);
  watchPerformanceConfig();
}

function setupMidi() {
  const state = store.getState();
  const { device, channel } = selectController(state);
  const midiDevice = MidiDevice.devices[device];

  // eslint-disable-next-line no-unused-vars
  const midiController = new MidiController({
    device: midiDevice,
    channel,
    receiveMessage: (status, d1, d2) => {
      log.music(`MIDI Receive: ${status} ${d1} ${d2}`);
    },
    clock: midiClock,
    start: midiStart,
    stop: midiStop,
  });
}

function performanceFileDidLoad() {
  setupMidi();
}

function run() {
  setupStore();
  setupMidi();
}

// -----------------------------------------------------------------------------

module.exports = {
  run,
};
