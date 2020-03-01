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

// -----------------------------------------------------------------------------

const isMidiNumber = (value) => value >= 0 && value <= 127;
const isMidiChannel = (value) => isNumber(value) && value >= 0 && value <= 16;

const NoteEventSchema = superstruct({
  types: {
    midiNumber: isMidiNumber,
  },
})({
  pitch: 'midiNumber',
  velocity: 'midiNumber',
  duration: 'string',
  mod1: 'midiNumber',
  mod2: 'midiNumber',
});

const isValidNoteEvent = (value) => {
  const [error] = NoteEventSchema.validate(value);
  return isEmpty(error);
};

// -----------------------------------------------------------------------------

module.exports = {
  NoteEventSchema,
  isMidiNumber,
  isMidiChannel,
  isValidNoteEvent,
};
