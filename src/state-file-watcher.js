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
const fs = require('fs');

const { safeLoad } = require('js-yaml');

const logger = require('./logger');

// -----------------------------------------------------------------------------

class StateFileWatcher {
  loadFile() {
    const { filename, schema, log } = this;
    try {
      const text = fs.readFileSync(filename, 'utf8');
      const json = safeLoad(text);
      const [error, data] = schema.validate(json);
      if (error) {
        const message = `Failed to load. Expected type '${error.type}' at '${error.path}'`;
        log.error(message);
        // console.log(error);
      } else {
        log.confirm('Loaded from disk');
        this.onLoad(data);
        return data;
      }
    } catch (error) {
      log.error(error);
    }
    return undefined/* null */;
  }

  constructor(filename, { schema, onLoad = () => {} }) {
    this.filename = filename;
    this.schema = schema;
    this.onLoad = onLoad;
    this.log = logger.create(filename);
    this.createWatcher();
    this.log.info(`Watching ${filename}`);
    this.loadFile();
  }

  createWatcher() {
    // eslint-disable-next-line no-unused-vars
    this.watcher = fs.watch(this.filename, (event, filename) => {
      this.loadFile();
    });
  }

  close() {
    this.watcher.close();
  }
}

module.exports = StateFileWatcher;
