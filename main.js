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
const commander = require('commander');

const app = require('./package.json');
const Performance = require('./src/performance');
const Screen = require('./src/screen');
const logger = require('./src/support/logger');

// -----------------------------------------------------------------------------

const program = new commander.Command();
const log = logger.create('main');

// -----------------------------------------------------------------------------

(function main() {
  program.requiredOption('-p, --performance <filename>', 'Performance Yaml File');
  program.requiredOption('-n, --no-gui', 'Disable GUI');
  program.parse(process.argv);

  const perf = new Performance({
    filename: program.performance,
  });

  const showGui = program.gui;

  if (showGui) {
    Screen.create({
      onExit: () => {
        log.info('Exiting');
        process.exit(0);
      },
      onCommandInput: (text) => {
        log.command(`${text}`);
        try {
          const wasHandled = perf.handleCommandInput(text);
          if (!wasHandled) {
            const result = eval(text); // eslint-disable-line no-eval
            log.info(`> ${result}`);
          }
        } catch (error) {
          log.error(error);
        }
      },
      onFunctionKey: (event) => {
        log.debug(`Function key pressed: ${event}`);
      },
    });
  }

  try {
    log.info(`${app.name} ${app.version}`);

    perf.run();
  } catch (error) {
    log.error('Unhandled Exception:');
    log.error(error.message);
  }
}());
