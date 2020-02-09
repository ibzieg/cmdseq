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

const requireJsx = require('./require-jsx');

const CommandBox = requireJsx(`${__dirname}/CommandBox.jsx`);

// -----------------------------------------------------------------------------

const SCREEN_HEIGHT = 30;
const SCREEN_WIDTH = 100;

// -----------------------------------------------------------------------------

function PerformanceController({
  log, onCommandInput, onFunctionKey, onExit, emitter,
}) {
  return (
    <element>
      <box
        top={0}
        left={0}
        width={SCREEN_WIDTH - 2}
        height={3}
        border={{ type: 'line' }}
        style={{
          border: { fg: 'magenta' },
        }}
      >
        {' cmdseq'}
      </box>

      <CommandBox
        top={3}
        left={0}
        height={32}
        width={SCREEN_WIDTH - 2}
        log={log}
        emitter={emitter}
        onCommandInput={onCommandInput}
        onFunctionKey={onFunctionKey}
        onExit={onExit}
      />
    </element>
  );
}

// -----------------------------------------------------------------------------

module.exports = PerformanceController;
