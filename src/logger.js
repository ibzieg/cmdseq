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
const colors = require('colors');

const Screen = require('./screen');

const LogLevels = {
  Info: colors.gray('\u21D2'),
  Warn: colors.yellow('\u26A0'),
  Error: colors.red('\u2717'),
  Debug: colors.magenta('d'),
  Confirm: colors.green('\u2713'),
  Music: colors.cyan('\u266A'),
};


class Logger {
  constructor(name) {
    this.name = name;
  }

  log(logLevel, message) {
    const { name } = this;

    const text = `${logLevel} (${colors.gray(name)}) ${message}`;
    if (Screen.Instance) {
      Screen.Instance.log(text);
    } else {
      console.log(text);
    }
  }

  info(message) {
    this.log(LogLevels.Info, message);
  }

  warn(message) {
    this.log(LogLevels.Warn, message);
  }

  debug(message) {
    this.log(LogLevels.Debug, message);
  }

  error(message) {
    this.log(LogLevels.Error, message);
  }

  confirm(message) {
    this.log(LogLevels.Confirm, message);
  }

  music(message) {
    this.log(LogLevels.Music, message);
  }
}

function create(name) {
  return new Logger(name);
}

module.exports = {
  create,
};
