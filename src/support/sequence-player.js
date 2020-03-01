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
const MidiInstrument = require('../midi/midi-instrument');
const ExternalDevices = require('../midi/external-devices');

const logger = require('./logger');

// -----------------------------------------------------------------------------

const PARTS_PER_QUANT = 48;


// eslint-disable-next-line no-unused-vars
const log = logger.create('player');

// -----------------------------------------------------------------------------

function runStepEvent(stepEvent, midiInstrument) {
  if (stepEvent && midiInstrument) {
    const {
      // eslint-disable-next-line no-unused-vars
      pitch, velocity, duration, mod1, mod2,
    } = stepEvent;
    midiInstrument.play(pitch, velocity, 100);
    return true;
  }
  return false;
}

// -----------------------------------------------------------------------------

class SequencePlayer {
  constructor() {
    this.reset();
  }

  reset() {
    this.stepCount = 0;
    this.loopCount = 0;
    this.startCount = 0;
  }

  next() {
    this.loopCount += 1;
    this.stepCount = 0;
    this.startCount = 0;
  }


  clock(clockCount, instrumentOptions, sequence, shouldLoop = true) {
    const { device, channel } = instrumentOptions;
    const { steps, rate } = sequence;

    const clockMod = Math.floor(PARTS_PER_QUANT / rate);

    let eventDidExecute = false;

    if (clockCount % clockMod === 0) {
      const { stepCount } = this;

      if (shouldLoop || this.startCount === 0) {
        const { length } = steps;
        const stepIndex = stepCount % length;
        const stepEvent = steps[stepIndex];

        const instrument = new MidiInstrument({
          channel,
          device: ExternalDevices.devices[device],
        });

        eventDidExecute = runStepEvent(stepEvent, instrument);

        this.stepCount = (stepCount + 1) % length;
        if (this.stepCount === 0) {
          this.loopCount += 1;
          this.startCount += 1;
        }
      }
    }

    return eventDidExecute;
  }
}

// -----------------------------------------------------------------------------

module.exports = SequencePlayer;
