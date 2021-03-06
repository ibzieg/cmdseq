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
const { dirname, resolve } = require('path');

const { first, get, isEmpty } = require('lodash');

const store = require('./store');
const {
  putTrack,
  selectTracks,
} = require('./store/tracks-store');
const {
  putPerformance,
  selectController,
  selectInstruments,
  selectLoop,
  selectScenes,
} = require('./store/performance-store');
const StateFileWatcher = require('./support/state-file-watcher');
const { TrackSchema } = require('./schema/track-schema');
const { MidiController, MidiDevice, MidiInstrument } = require('./midi');
const { generateSequence } = require('./support/generator');
const SequencePlayer = require('./support/sequence-player');
const { PerformanceSchema } = require('./schema/performance-schema');
const logger = require('./support/logger');

// -----------------------------------------------------------------------------

const log = logger.create('config');

// -----------------------------------------------------------------------------


class Performance {
  get directory() {
    return dirname(this.filename);
  }

  get filename() {
    const { filename } = this.options;
    return resolve(filename);
  }

  constructor(options) {
    this.options = { ...options };

    this.watchers = new Map();
    this.players = new Map();

    this.hasPerformanceFileLoaded = false;

    this.stopCount = 0;
    this.sceneIndex = 0;
    this.clockCount = 0;
  }

  getInstrumentFileName(name) {
    return `${this.directory}/${name}.yaml`;
  }

  // eslint-disable-next-line class-methods-use-this
  handleStoreStateChange() {
    // Do something when the store state changes
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
    const instruments = selectInstruments(state);

    const [trackName, cmdName, ...args] = commandText.split(' ');

    const track = tracks[trackName];
    if (track) {
      const { generator } = track;

      /* eslint-disable no-case-declarations */
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
                rate: 4, // TODO Move Constant
                steps: newSeq,
              },
            ],
          };

          if (this.watchers.has(trackName)) {
            const watcher = this.watchers.get(trackName);
            watcher.writeFile(newTrack);
          }

          return true;

        case 'play':
          const [pitch, velocity, duration] = args;
          const instrumentOpts = instruments.find((inst) => inst.name === trackName);
          const instrument = new MidiInstrument(instrumentOpts);
          instrument.play(pitch, velocity || 120);
          return true;

        default:
          return false;
      }
      /* eslint-enable no-case-declarations */
    }
    return false;
  }

  watchPerformanceConfig() {
    const name = this.filename;
    if (!this.watchers.has(name)) {
      this.watchers.set(name, new StateFileWatcher(
        this.filename, {
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
          this.getInstrumentFileName(name), {
            schema: TrackSchema,
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
    const controller = selectController(state);
    const loopScene = selectLoop(state);
    const scenes = selectScenes(state);
    const instruments = selectInstruments(state);
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

    const masterTrack = scene.tracks.find((t) => t.master);
    let { ppq } = controller;
    if (masterTrack) {
      const masterPlayer = this.players.get(masterTrack.name);
      if (masterPlayer && !isEmpty(scene.ppq)) {
        const ppqIndex = masterPlayer.startCount % scene.ppq.length;
        ppq = scene.ppq[ppqIndex];
      }
    }

    const playTrack = (sceneTrack, launchNext = false) => {
      const {
        name, play, follow, master,
      } = sceneTrack;
      if (!tracks[name]) {
        return;
      }
      const { sequences } = tracks[name];

      let eventDidExecute = false;

      const player = this.players.get(name);
      const instrumentOpts = instruments.find((inst) => inst.name === name);
      if (instrumentOpts && player && !isEmpty(play)) {
        const seqNameIndex = player.loopCount;
        const seqName = play[seqNameIndex % play.length];
        const sequence = sequences.find((s) => s.name === seqName) || { rate: 1, steps: [null, null, null, null] };

        const shouldLoop = isEmpty(follow);
        if (launchNext) {
          player.next();
        }

        // Send Clock event to player
        const instrument = new MidiInstrument(instrumentOpts);
        const mod1 = instrumentOpts.mod1
          ? new MidiInstrument(instrumentOpts.mod1)
          : undefined;
        const mod2 = instrumentOpts.mod2
          ? new MidiInstrument(instrumentOpts.mod2)
          : undefined;
        eventDidExecute = player.clock({
          cc1: get(instrumentOpts, 'mod1.cc', undefined),
          cc2: get(instrumentOpts, 'mod2.cc', undefined),
          clockCount: this.clockCount,
          instrument,
          mod1,
          mod2,
          ppq,
          sequence,
          shouldLoop,
        });
      }

      // Play any tracks that are following this one
      scene.tracks.forEach((t) => {
        if (t.follow === name) {
          playTrack(t, eventDidExecute);
        }
      });

      if (master && player) {
        // TODO Use master startCount to index a PPQ list
        // If there is no ppQ list, use the default from the Controller
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
