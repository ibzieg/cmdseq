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

const logger = require('./logger');

// -----------------------------------------------------------------------------

const PARTS_PER_QUANT = 48;

const log = logger.create('player');

// -----------------------------------------------------------------------------

function runStepEvent({
  cc1,
  cc2,
  instrument,
  mod1,
  mod2,
  stepEvent,
}) {
  if (stepEvent && instrument) {
    const { pitch, velocity } = stepEvent;
    instrument.play(pitch, velocity, 100);

    if (mod1 && stepEvent.mod1) {
      mod1.controlChange(cc1, stepEvent.mod1);
    }

    if (mod2 && stepEvent.mod2) {
      mod2.controlChange(cc2, stepEvent.mod2);
    }
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
    this.loopCount = 0;
    this.startCount = 0;
    this.stepCount = 0;
  }

  next() {
    this.loopCount += 1;
    this.startCount = 0;
    this.stepCount = 0;
  }


  clock({
    cc1,
    cc2,
    clockCount,
    instrument,
    mod1,
    mod2,
    ppq,
    sequence,
    shouldLoop,
  }) {
    const { steps, rate } = sequence;

    const clockMod = Math.floor(ppq / rate);

    let eventDidExecute = false;

    if (clockCount % clockMod === 0) {
      const { stepCount } = this;

      if (shouldLoop || this.startCount === 0) {
        const { length } = steps;
        const stepIndex = stepCount % length;
        const stepEvent = steps[stepIndex];

        eventDidExecute = runStepEvent({
          cc1,
          cc2,
          instrument,
          mod1,
          mod2,
          stepEvent,
        });

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
