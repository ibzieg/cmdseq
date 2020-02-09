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
const app = require('./package.json');
const { setupStore } = require('./src/config');
const Screen = require('./src/screen');
const logger = require('./src/logger');

// -----------------------------------------------------------------------------

const log = logger.create('main');

Screen.create({
  onExit: () => {
    log.info('Exiting');
    process.exit(0)
  },
  onCommandInput: (text) => {
    log.info(`λ ${text}`);
  },
});

(function main() {
  try {
    log.info(`${app.name} ${app.version}`);
    setupStore();
  } catch (error) {
    log.error('Unhandled Exception:');
    log.error(error);
  }
}());
