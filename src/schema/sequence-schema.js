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
const { isNull, isEmpty } = require('lodash');

const { isMidiNumber, isValidNoteEvent } = require('./note-event-schema');

// -----------------------------------------------------------------------------

const isRate = (value) => value >= 1;

const SequenceSchema = superstruct({
  types: {
    midiNumber: isMidiNumber,
    noteEvent: (value) => isNull(value) || isValidNoteEvent(value),
    rate: isRate,
  },
})({
  name: 'string',
  rate: 'rate',
  steps: ['noteEvent?'],
});

const isValidSequence = (value) => {
  const [error] = SequenceSchema.validate(value);
  return isEmpty(error);
};

// -----------------------------------------------------------------------------

module.exports = {
  SequenceSchema,
  isValidSequence,
};
