/* eslint-disable no-underscore-dangle,no-bitwise */
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
const colors = require('colors');

const logger = require('../support/logger');

const MidiDevice = require('./midi-device');

// -----------------------------------------------------------------------------

const log = logger.create('midi-controller');

// -----------------------------------------------------------------------------

class MidiController {
  constructor(options) {
    this._options = options;

    this._lastClockTime = process.hrtime();
    this._tickDurations = [];
    this._bpm = 0;

    const { device } = options;
    if (device) {
      this.initializeDevice(device);
    }
  }

  initializeDevice(device) {
    this._midiDevice = MidiDevice.getInstance(device);
    if (this._midiDevice.input) {
      this._midiDevice.input.ignoreTypes(true, false, true);
      this._midiDevice.input.on('message', this.receiveMessage.bind(this));
    } else {
      log.warn('MIDI Input unavailable');
    }
  }

  receiveMessage(deltaTime, message) {
    let status = message[0];
    const d1 = message[1];
    const d2 = message[2];
    if (status >= 128 && status <= 239) {
      const channel = status & 0b00001111;
      status &= 0b011110000;
      if (channel === this._options.channel - 1) {
        if (typeof this._options.receiveMessage === 'function') {
          this._options.receiveMessage(status, d1, d2);
        }
        switch (status) {
          case 144: // Note on
            // log.info(`Controller Note On:  ${colors.cyan(d1)} Velocity: ${colors.cyan(d2)}`);
            break;
          case 128: // Note off
            // log.info(`Controller Note Off: ${colors.gray(d1)} Velocity: ${colors.gray(d2)}`);
            break;
          case 176: // Control Change
            // log.info(`Controller Change: ${colors.magenta(d1)} Value: ${colors.magenta(d2)}`);
            break;
          default:
            log.info(
              `Controller Message: ${colors.red(d1)},  ${colors.red(d2)}`,
            );
        }
      }
    } else {
      switch (status) {
        case 242: // Song Position Pointer
          // log.music(`Song Position Pointer ${d1} ${d2}`);
          break;
        case 248: // Timing
          this.clock();
          break;
        case 250: // Start
          this.start();
          // log.music(`System: Start ${status}`);
          break;
        case 252:
          this.stop();
          // log.music(`System: Stop ${status}`);
          break; // Stop
        default:
          log.info(`System: ${status}`);
      }
    }
  }

  updateClock(duration) {
    const historyLength = 36; // TODO Move constant
    const ppq = 24; // TODO Move constant
    this._tickDurations.push(duration);
    this._tickDurations = this._tickDurations.splice(
      Math.max(0, this._tickDurations.length - historyLength),
      historyLength,
    );
    const tickMillis = this._tickDurations.reduce((sum, value) => sum + value)
      / this._tickDurations.length;
    const beatMillis = tickMillis * ppq;
    const millisPerMin = 60000;
    this._bpm = Math.round(millisPerMin / beatMillis);
  }

  clock() {
    const lastClockDur = process.hrtime(this._lastClockTime);
    this._lastClockTime = process.hrtime();
    const tickDuration = lastClockDur[0] / 1000.0 + lastClockDur[1] / 1000000.0;
    this.updateClock(tickDuration);

    if (this._options.clock) {
      this._options.clock(this._bpm);
    }
  }

  start() {
    if (this._options.start) {
      this._options.start();
    }
  }

  stop() {
    if (this._options.stop) {
      this._options.stop();
    }
  }

  outputTransportRun() {
    this._midiDevice.output.sendMessage([250]);
  }

  outputTransportStop() {
    this._midiDevice.output.sendMessage([252]);
  }

  outputTransportClock() {
    this._midiDevice.output.sendMessage([248]);
  }
}

// -----------------------------------------------------------------------------

module.exports = MidiController;
