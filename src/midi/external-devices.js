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
const devices = {
  BeatStepPro: {
    names: [
      'Arturia BeatStep Pro Arturia BeatStepPro',
      'Arturia BeatStep Pro 20:0',
      'Arturia BeatStep Pro 24:0',
      'Arturia BeatStep Pro 28:0',
    ],
  },
  Minilogue: {
    names: ['minilogue SOUND', 'minilogue 24:1', 'minilogue 28:1'],
  },
  MOTU828x: {
    names: ['828x MIDI Port'],
  },
  Midisport: {
    names: [
      'USB Uno MIDI Interface',
      'USB Uno MIDI Interface 28:0',
      'USB Uno MIDI Interface 20:0',
      'USB Uno MIDI Interface:USB Uno MIDI Interface MIDI 1 20:0',
    ],
  },
  IAC1: {
    names: ['IAC Driver Bus 1'],
  },
};

/** *
 *
 */
const instruments = {
  UnoBSPSeq1: {
    device: devices.Midisport,
    channel: 1,
  },
  UnoBSPSeq2: {
    device: devices.Midisport,
    channel: 2,
  },
  UnoBSPDrum: {
    device: devices.Midisport,
    channel: 14,
  },
  BSPSeq1: {
    device: devices.BeatStepPro,
    channel: 1,
  },
  BSPSeq2: {
    device: devices.BeatStepPro,
    channel: 2,
  },
  BSPDrum: {
    device: devices.BeatStepPro,
    channel: 14,
  },
  Minilogue: {
    device: devices.Minilogue,
    channel: 1,
  },
  UnoKorg: {
    device: devices.Midisport,
    channel: 12,
  },
  Juno106: {
    device: devices.Midisport,
    channel: 13,
  },
  NordG2A: {
    // device: MidiDevice.devices.MOTU828x,
    device: devices.Midisport,
    channel: 7,
  },
  IAC1ch1: {
    device: devices.IAC1,
    channel: 1,
  },
  IAC1ch2: {
    device: devices.IAC1,
    channel: 2,
  },
  IAC1drum: {
    device: devices.IAC1,
    channel: 14,
  },
};

const drumMap = [
  36,
  38,
  39,
  42,
  46,
  49,
  75,
  67,
];

module.exports = {
  devices,
  instruments,
  drumMap,
};
