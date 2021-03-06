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

function getRandomInt(min, max) {
  const n = Math.random() * (max - min + 1) + min;
  return Math.floor(n);
}

const MIN_VELOCITY = 24;
const MAX_VELOCITY = 127;
const MIN_CC_VALUE = 12;
const MAX_CC_VALUE = 112;
const DEFAULT_PITCH = 60;

function makeRandomNoteEvent(options = {}) {
  return {
    pitch: DEFAULT_PITCH,
    velocity: getRandomInt(MIN_VELOCITY, MAX_VELOCITY),
    duration: '8n',
    mod1: getRandomInt(MIN_CC_VALUE, MAX_CC_VALUE),
    mod2: getRandomInt(MIN_CC_VALUE, MAX_CC_VALUE),
    ...options,
  };
}

// -----------------------------------------------------------------------------

module.exports = {
  getRandomInt,
  makeRandomNoteEvent,
};
