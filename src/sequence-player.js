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
const MidiInstrument = require('./midi/midi-instrument');
const ExternalDevices = require('./midi/external-devices');


function runStepEvent(stepEvent, midiInstrument) {
  if (stepEvent && midiInstrument) {
    const {
      pitch, velocity, duration, mod1, mod2,
    } = stepEvent;
    midiInstrument.play(pitch, velocity, 250);
  }
}

class SequencePlayer {
  constructor() {
    this.reset();
  }

  reset() {
    this.clockCount = 0;
    this.stepIndex = 0;
  }

  clock(playbackOptions, sequence) {
    this.clockCount += 1;
    const { clockCount } = this;
    const { rate, device, channel } = playbackOptions;

    if (clockCount % rate === 0) {
      this.stepIndex += 1;
      const { stepIndex } = this;

      const { steps } = sequence;
      const { length } = steps;
      const stepEvent = steps[stepIndex % length];

      const instrument = new MidiInstrument({
        channel,
        device: ExternalDevices.devices[device],
      });

      runStepEvent(stepEvent, instrument);
    }
  }
}

module.exports = SequencePlayer;
