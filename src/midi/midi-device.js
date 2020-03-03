/* eslint-disable no-underscore-dangle */
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
const midi = require('midi');

const logger = require('../support/logger');

const ExternalDevices = require('./external-devices');

// -----------------------------------------------------------------------------

const Log = logger.create('midi-device');

// -----------------------------------------------------------------------------

class MidiDevice {
  static get devices() {
    return ExternalDevices.devices;
  }

  static listOutputPorts() {
    // eslint-disable-next-line new-cap
    const output = new midi.output();
    const portCount = output.getPortCount();
    for (let i = 0; i < portCount; i += 1) {
      const portName = output.getPortName(i);
      Log.info(portName);
    }
  }

  static listInputPorts() {
    // eslint-disable-next-line new-cap
    const input = new midi.input();
    const portCount = input.getPortCount();
    for (let i = 0; i < portCount; i += 1) {
      const portName = input.getPortName(i);
      Log.info(portName);
    }
  }

  // eslint-disable-next-line consistent-return
  static getInstance(deviceOptions) {
    // eslint-disable-next-line consistent-return,no-restricted-syntax,prefer-const
    for (let deviceKey of Object.keys(ExternalDevices.devices)) {
      // eslint-disable-next-line prefer-const
      let device = ExternalDevices.devices[deviceKey];
      if (device.names[0] === deviceOptions.names[0]) {
        let deviceInstance = MidiDevice._deviceInstances[deviceKey];
        if (!(deviceInstance instanceof MidiDevice)) {
          deviceInstance = new MidiDevice(deviceOptions);
          deviceInstance.open();
          MidiDevice._deviceInstances[deviceKey] = deviceInstance;
        }
        return deviceInstance;
      }
    }
  }

  get options() {
    return this._options;
  }

  get input() {
    return this._inputPort;
  }

  get inputStatus() {
    return this._inputPortStatus;
  }

  get output() {
    return this._outputPort;
  }

  get outputStatus() {
    return this._outputPortStatus;
  }

  constructor(options) {
    this._options = options;
  }

  open() {
    this.openInput();
    this.openOutput();
  }

  openInput() {
    // eslint-disable-next-line new-cap
    const input = new midi.input();
    let foundPort = false;
    const portCount = input.getPortCount();
    for (let i = 0; i < portCount; i += 1) {
      const portName = input.getPortName(i);
      if (this.options.names.indexOf(portName) >= 0) {
        input.openPort(i);
        foundPort = true;
        Log.confirm(`${portName}: Input port open`);
      }
    }

    if (!foundPort) {
      Log.error(
        `No Input MIDI Output devices found matching ${this.options.names}`,
      );
    }
    this._inputPortStatus = foundPort;
    this._inputPort = input;
  }

  openOutput() {
    // eslint-disable-next-line new-cap
    const output = new midi.output();
    const portCount = output.getPortCount();
    let foundPort = false;
    for (let i = 0; i < portCount; i += 1) {
      const portName = output.getPortName(i);
      if (this.options.names.indexOf(portName) >= 0) {
        output.openPort(i);
        foundPort = true;
        Log.confirm(`${portName}: Output port open`);
      }
    }
    if (!foundPort) {
      Log.error(`No MIDI Output devices found matching ${this.options.names}`);
    }
    this._outputPortStatus = foundPort;
    this._outputPort = output;
  }

  play(channel, note, velocity, duration) {
    const noteOnStatus = 144 + channel - 1;
    const noteOffStatus = 128 + channel - 1;

    if (this.outputStatus) {
      try {
        this.output.sendMessage([noteOnStatus, note, velocity]);
      } catch (ex) {
        Log.error(
          `Failed to send MIDI message [${noteOnStatus},${note},${velocity}]: ${ex}`,
        );
      }
      setTimeout(() => {
        try {
          this.output.sendMessage([noteOffStatus, note, velocity]);
        } catch (ex) {
          Log.error(
            `Failed to send MIDI message [${noteOnStatus},${note},${velocity}]: ${ex}`,
          );
        }
      }, duration);
    }
  }

  noteOn(channel, note, velocity) {
    const noteOnStatus = 144 + channel - 1;
    if (this.outputStatus) {
      try {
        this.output.sendMessage([noteOnStatus, note, velocity]);
      } catch (ex) {
        Log.error(
          `Failed to send MIDI message [${noteOnStatus},${note},${velocity}]: ${ex}`,
        );
      }
    }
  }

  noteOff(channel, note, velocity) {
    const noteOffStatus = 128 + channel - 1;
    if (this.outputStatus) {
      try {
        this.output.sendMessage([noteOffStatus, note, velocity]);
      } catch (ex) {
        Log.error(
          `Failed to send MIDI message [${noteOffStatus},${note},${velocity}]: ${ex}`,
        );
      }
    }
  }

  controlChange(channel, controlNumber, value) {
    const status = 176 + channel - 1;
    if (this.outputStatus) {
      try {
        this.output.sendMessage([status, controlNumber, value]);
      } catch (ex) {
        Log.error(
          `Failed to send MIDI message [${status},${controlNumber},${value}]: ${ex}`,
        );
      }
    }
  }

  allNotesOff(channel) {
    this.controlChange(channel, 123, 0);
  }
}

MidiDevice._deviceInstances = [];

// -----------------------------------------------------------------------------

module.exports = MidiDevice;
