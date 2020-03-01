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

const {
  combineReducers, configureStore, getDefaultMiddleware,
} = require('@reduxjs/toolkit');

const logger = require('../support/logger');

const log = logger.create('store');

const { tracks } = require('./tracks');
const { performance } = require('./performance-store');

function actionLog({ getState }) {
  return (next) => (action) => {
    log.delta(`${action.type} { ${Object.keys(action.payload)} }`);

    // Call the next dispatch method in the middleware chain.
    const returnValue = next(action);

    // This will likely be the action itself, unless
    // a middleware further in chain changed it.
    return returnValue;
  };
}

const store = configureStore({
  reducer: combineReducers({
    tracks: tracks.reducer,
    performance: performance.reducer,
  }),
  middleware: [...getDefaultMiddleware(), actionLog],
});

module.exports = store;
