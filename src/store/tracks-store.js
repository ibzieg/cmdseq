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
const { createSlice } = require('@reduxjs/toolkit');
const { createSelector } = require('reselect');
const { first } = require('lodash');

const tracksStore = createSlice({
  name: 'tracks',
  initialState: {},
  reducers: {
    putTrack: {
      reducer(state, action) {
        const { track } = action.payload;
        return {
          ...state,
          [track.name]: track,
        };
      },
      prepare(track) {
        return { payload: { track } };
      },
    },
    removeTrack: {
      reducer(state, action) {
        const { name } = action.payload;
        const nextState = { ...state };
        delete nextState[name];
        return nextState;
      },
      prepare(name) {
        return { payload: { name } };
      },
    },
  },
});

const selectTracks = (state) => state.tracks;

const selectFirstTrack = createSelector(
  selectTracks,
  (tracksState) => tracksState[first(Object.keys(tracksState))],
);

module.exports = {
  tracks: tracksStore,
  ...tracksStore.actions,
  selectFirstTrack,
  selectTracks,
};
