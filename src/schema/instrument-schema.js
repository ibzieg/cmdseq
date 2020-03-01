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
const { superstruct } = require('superstruct');
const { isEmpty, isNumber } = require('lodash');

const { isMidiNumber } = require('../midi-event');

// -----------------------------------------------------------------------------

const InstrumentSchema = superstruct({
  types: {
    midiNumber: isMidiNumber,
    midiChannel: (value) => isNumber(value) && value >= 0 && value <= 16,
  },
})({
  name: 'string',
  device: 'string',
  channel: 'midiChannel',
  quantize: 'boolean?',
  cc1: 'midiNumber?',
  cc2: 'midiNumber?',
});

const isValidInstrument = (value) => {
  const [error] = InstrumentSchema.validate(value);
  return isEmpty(error);
};

// -----------------------------------------------------------------------------

module.exports = {
  InstrumentSchema,
  isValidInstrument,
};
