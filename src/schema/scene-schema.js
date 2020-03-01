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

const SceneTrack = superstruct({
  types: {
  },
})({
  name: 'string',
  follow: 'string?',
  master: 'boolean?',
  play: ['string?'],
});

const isSceneTrack = (value) => {
  const [error] = SceneTrack.validate(value);
  return isEmpty(error);
};

// -----------------------------------------------------------------------------

const SceneSchema = superstruct({
  types: {
    sceneTrack: isSceneTrack,
  },
})({
  name: 'string',
  repeat: 'number',
  tracks: ['sceneTrack'],
});

const isValidScene = (value) => {
  const [error] = SceneSchema.validate(value);
  return isEmpty(error);
};

// -----------------------------------------------------------------------------

module.exports = {
  SceneSchema,
  isValidScene,
};
