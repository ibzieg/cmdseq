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
const { first, isEmpty } = require('lodash');

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


function getInstrumentFileName(name) {
  return `${performanceDir}/${name}.yaml`;
}

class Performance {
  constructor() {
    this.watchers = new Map();
    this.players = new Map();

    this.hasPerformanceFileLoaded = false;

    this.stopCount = 0;
    this.sceneIndex = 0;
    this.clockCount = 0;
  }

  // eslint-disable-next-line class-methods-use-this
  handleStoreStateChange() {
    // const state = store.getState();
    // const firstTrack = selectFirstTrack(state);
    // log.debug(firstTrack.sequences[0].name);
  }

  // eslint-disable-next-line class-methods-use-this
  handleTrackFileChange(trackConfig) {
    const { dispatch } = store;
    dispatch(putTrack(trackConfig));
  }

  handlePerformanceFileChange(perfConfig) {
    const { dispatch } = store;
    dispatch(putPerformance(perfConfig));
    if (!this.hasPerformanceFileLoaded) {
      // eslint-disable-next-line no-use-before-define
      this.performanceFileDidLoad();
      this.hasPerformanceFileLoaded = true;
    }
    this.watchTrackConfigs();
  }

  handleCommandInput(commandText = '') {
    const state = store.getState();
    const tracks = selectTracks(state);

    const [trackName, cmdName, ...args] = commandText.split(' ');

    const track = tracks[trackName];
    if (track) {
      const { generator } = track;

      switch (cmdName) {
        case 'generate':
          const seqName = first(args);
          const newSeq = generateSequence(generator);

          const newTrack = {
            ...track,
            sequences: [
              ...track.sequences.filter((s) => s.name !== seqName),
              {
                name: seqName,
                steps: newSeq,
              },
            ],
          };

          if (this.watchers.has(trackName)) {
            const watcher = this.watchers.get(trackName);
            watcher.writeFile(newTrack);
          }

          return true;
        default:
          return false;
      }
    }
    return false;
  }

  watchPerformanceConfig() {
    const name = performanceName;
    if (!this.watchers.has(name)) {
      this.watchers.set(name, new StateFileWatcher(
        getInstrumentFileName(name), {
          schema: PerformanceSchema,
          onLoad: (config) => this.handlePerformanceFileChange(config),
        },
      ));
    }
  }

  watchTrackConfigs() {
    const instruments = selectInstruments(store.getState());
    instruments.forEach((instrument) => {
      const { name } = instrument;

      if (!this.watchers.has(name)) {
        this.watchers.set(name, new StateFileWatcher(
          getInstrumentFileName(name), {
            schema: TrackConfig,
            onLoad: (config) => this.handleTrackFileChange(config),
          },
        ));
      }

      if (!this.players.has(name)) {
        this.players.set(name, new SequencePlayer());
      }
    });
  }

  resetPlayers() {
    this.players.forEach((player) => player.reset());
  }

  reset() {
    this.sceneIndex = 0;
    this.resetPlayers();
  }

  midiStop() {
    this.stopCount += 1;
    if (this.stopCount <= 1) {
      log.music('Clock Stop');
    } else {
      log.music('Clock Reset');
    }
    this.reset();
  }

  midiStart() {
    this.stopCount = 0;
    log.music('Clock Start');
  }

  midiClock() {
    const state = store.getState();
    const loopScene = selectLoop(state);
    const scenes = selectScenes(state);
    const tracks = selectTracks(state);

    let scene = scenes[this.sceneIndex % scenes.length];
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

      const player = this.players.get(name);
      if (player && !isEmpty(play)) {
        const seqNameIndex = player.loopCount;
        const seqName = play[seqNameIndex % play.length];
        const sequence = sequences.find((s) => s.name === seqName);

        const shouldLoop = isEmpty(follow);
        if (launchNext) {
          player.next();
        }
        eventDidExecute = player.clock(this.clockCount, playback, sequence, shouldLoop);
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
      this.sceneIndex += 1;
      this.resetPlayers();
    }

    this.clockCount += 1;
  }

  setupStore() {
    store.subscribe(() => this.handleStoreStateChange());
    this.watchPerformanceConfig();
  }

  setupMidi() {
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
      clock: () => this.midiClock(),
      start: () => this.midiStart(),
      stop: () => this.midiStop(),
    });
  }

  performanceFileDidLoad() {
    this.setupMidi();
  }

  run() {
    this.setupStore();
    this.setupMidi();
  }
}

// -----------------------------------------------------------------------------

module.exports = Performance;
