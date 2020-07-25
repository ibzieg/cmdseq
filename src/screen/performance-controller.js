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
const PropTypes = require('prop-types');

const CommandBox = require('./command-box');

// -----------------------------------------------------------------------------

const SCREEN_WIDTH = 100;

// -----------------------------------------------------------------------------

function PerformanceController({
  log,
  onCommandInput,
  onFunctionKey,
  onExit,
  emitter,
}) {
  const statusText = ' cmdseq';
  return React.createElement(
    'element',
    undefined,
    React.createElement(
      'box',
      {
        top: 0,
        left: 0,
        width: '100%',
        height: 3,
        border: {
          type: 'line',
        },
        style: {
          border: {
            fg: 'magenta',
          },
        },
      },
      statusText,
    ),
    React.createElement(
      CommandBox,
      {
        top: 3,
        left: 0,
        height: '95%',
        width: '100%',
        log,
        emitter,
        onCommandInput,
        onFunctionKey,
        onExit,
      },
    ),
  );
}

PerformanceController.propTypes = {
  log: PropTypes.any.isRequired,
  emitter: PropTypes.shape({}).isRequired,
  onCommandInput: PropTypes.func.isRequired,
  onExit: PropTypes.func.isRequired,
  onFunctionKey: PropTypes.func.isRequired,
};

// -----------------------------------------------------------------------------

module.exports = PerformanceController;
