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
const logger = require('../support/logger');

const MidiDevice = require('./midi-device');
const ExternalDevices = require('./external-devices');

// -----------------------------------------------------------------------------

const log = logger.create('midi-instrument');

// -----------------------------------------------------------------------------

class MidiInstrument {
  get channel() {
    return this.options.channel;
  }

  get isConnected() {
    return this.midiDevice.outputStatus;
  }

  constructor({ channel, device }) {
    this.options = {
      channel,
    };
    const deviceConfig = ExternalDevices.devices[device];
    this.midiDevice = MidiDevice.getInstance(deviceConfig);
  }

  controlChange(controlNumber, value) {
    const status = 176 + this.channel - 1;
    if (controlNumber > 0
      && controlNumber < 128
      && value > 0
      && value < 128) {
      this.midiDevice.output.sendMessage([status, controlNumber, value]);
    }
  }

  play(note, velocity, duration) {
    const noteOnStatus = 144 + this.channel - 1;
    const noteOffStatus = 128 + this.channel - 1;

    if (this.midiDevice.outputStatus) {
      try {
        this.midiDevice.output.sendMessage([noteOnStatus, note, velocity]);
        // log.music(`Output MIDI message [${noteOnStatus},${note},${velocity}]`);
      } catch (ex) {
        log.error(
          `Failed to send MIDI message [${noteOnStatus},${note},${velocity}]: ${ex}`,
        );
      }
      setTimeout(() => {
        try {
          this.midiDevice.output.sendMessage([noteOffStatus, note, velocity]);
          // log.music(`Output MIDI message [${noteOnStatus},${note},${velocity}]`);
        } catch (ex) {
          log.error(
            `Failed to send MIDI message [${noteOnStatus},${note},${velocity}]: ${ex}`,
          );
        }
      }, duration);
    }
  }
}

// -----------------------------------------------------------------------------

module.exports = MidiInstrument;
