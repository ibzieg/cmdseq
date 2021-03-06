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
const { isEmpty } = require('lodash');

const { isMidiNumber } = require('../schema/note-event-schema');

// -----------------------------------------------------------------------------

const GeneratorType = {
  quadrant: 'quadrant',
  euclid: 'euclid',
  eighth: 'eighth',
  quarter: 'quarter',
  half: 'half',
  accel: 'accel',
  ritard: 'ritard',
};

const isGeneratorType = (value) => !isEmpty(GeneratorType[value]);

// -----------------------------------------------------------------------------

const GeneratorSchema = superstruct({
  types: {
    generatorType: isGeneratorType,
    midiNumber: isMidiNumber,
  },
})({
  length: 'number',
  steps: 'number',
  type: 'generatorType?',
  notes: ['number'],
});

const isValidGenerator = (value) => {
  const [error] = GeneratorSchema.validate(value);
  return isEmpty(error);
};

// -----------------------------------------------------------------------------

module.exports = {
  GeneratorSchema,
  GeneratorType,
  isValidGenerator,
};
