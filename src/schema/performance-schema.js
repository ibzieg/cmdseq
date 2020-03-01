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

const { isValidInstrument } = require('./instrument-schema');
const { isValidScene } = require('./scene-schema');
const { isValidController } = require('./controller-schema');

// -----------------------------------------------------------------------------

const PerformanceSchema = superstruct({
  types: {
    controller: isValidController,
    instrument: isValidInstrument,
    scene: isValidScene,
  },
})({
  controller: 'controller',
  instruments: ['instrument'],
  loop: 'string?',
  scenes: ['scene'],
});

const isValidPerformance = (value) => {
  const [error] = PerformanceSchema.validate(value);
  return isEmpty(error);
};

// -----------------------------------------------------------------------------

module.exports = {
  PerformanceSchema,
  isValidPerformance,
};
