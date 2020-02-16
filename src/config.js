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
const { first } = require('lodash');

const store = require('./store');
const { putTrack, selectFirstTrack } = require('./store/tracks');
const StateFileWatcher = require('./state-file-watcher');
const { TrackConfig } = require('./track-config');
const { MidiController, MidiDevice } = require('./midi');
const { generatorDefaults, generateSequence } = require('./generator');
const SequencePlayer = require('./sequence-player');
const logger = require('./logger');

const log = logger.create('config');

// -----------------------------------------------------------------------------

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

function watchConfigFile() {
  const configFilename = 'config/mono1.yaml';

  const trackWatcher = new StateFileWatcher(
    configFilename, {
      schema: TrackConfig,
      onLoad: handleTrackFileChange,
    },
  );
}

function setupStore() {
  store.subscribe(handleStoreStateChange);
  watchConfigFile();
}

function setupMidi() {
  // log.info('Input Ports:');
  // MidiDevice.listInputPorts();
  // log.info('Output Ports:');
  // MidiDevice.listOutputPorts();

  const player = new SequencePlayer();

  let stopCount = 0;

  this.controller = new MidiController({
    // device: MidiDevice.devices.Midisport,
    device: MidiDevice.devices.IAC1,
    channel: 7,
    receiveMessage: (status, d1, d2) => {
      log.music(`MIDI Receive: ${status} ${d1} ${d2}`);
    },
    clock: () => {
      const state = store.getState();
      const track = selectFirstTrack(state);
      const { playback, sequences } = track;
      const sequence = first(sequences);

      // log.music('clock');
      player.clock(playback, sequence);
    },
    start: () => {
      stopCount = 0;
      log.music('Clock Start');
    },
    stop: () => {
      stopCount += 1;
      if (stopCount <= 1) {
        log.music('Clock Stop');
      } else {
        log.music('Clock Reset');
        player.reset();
      }
    },
  });
}

// -----------------------------------------------------------------------------

module.exports = {
  writeDefaultConfig,
  watchConfigFile,
  setupStore,
  setupMidi,
};
