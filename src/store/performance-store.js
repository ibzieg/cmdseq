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

// -----------------------------------------------------------------------------

const performanceStore = createSlice({
  name: 'performance',
  initialState: {},
  reducers: {
    putPerformance: {
      reducer(state, action) {
        const { performance } = action.payload;
        return performance;
      },
      prepare(performance) {
        return { payload: { performance } };
      },
    },
  },
});

// -----------------------------------------------------------------------------

const selectPerformance = (state) => state.performance;

const selectController = createSelector(
  selectPerformance,
  (performanceState) => performanceState.controller,
);

const selectInstruments = createSelector(
  selectPerformance,
  (performanceState) => performanceState.instruments,
);

const selectLoop = createSelector(
  selectPerformance,
  (performanceState) => performanceState.loop,
);

const selectScenes = createSelector(
  selectPerformance,
  (performanceState) => performanceState.scenes,
);

// -----------------------------------------------------------------------------

module.exports = {
  performance: performanceStore,
  ...performanceStore.actions,
  selectController,
  selectInstruments,
  selectScenes,
  selectLoop,
};
