/* eslint-disable no-underscore-dangle */
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
const React = require('react');
const blessed = require('blessed');
const { render } = require('react-blessed');

const App = require('./app');

// -----------------------------------------------------------------------------

let _instance;

// -----------------------------------------------------------------------------

class Screen {
  static get instance() {
    return _instance;
  }

  static create(options) {
    if (_instance instanceof Screen) {
      throw new Error('Screen instance has already been created');
    } else {
      _instance = new Screen(options);
    }
  }

  constructor(options) {
    const { onExit, onCommandInput, onFunctionKey } = options;

    const handleOnExit = () => {
      if (onExit) {
        onExit();
      } else {
        process.exit(0);
      }
    };

    const screen = blessed.screen({
      autoPadding: true,
      dockBorders: true,
      smartCSR: true,
      title: 'cmdseq',
    });

    // eslint-disable-next-line no-unused-vars
    screen.key(['escape', 'q', 'C-c'], (ch, key) => {
      handleOnExit();
    });

    this.appComponent = render(
      React.createElement(App, {
        onCommandInput,
        onFunctionKey,
        onExit: handleOnExit,
      }),
      screen,
    );
  }

  log(text) {
    this.appComponent.addLogLine(text);
  }
}

// -----------------------------------------------------------------------------

module.exports = Screen;
