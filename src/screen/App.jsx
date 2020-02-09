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
const EventEmitter = require('events');

const React = require('react');

const requireJsx = require('./require-jsx');

const PerformanceController = requireJsx(`${__dirname}/PerformanceController.jsx`);

// -----------------------------------------------------------------------------

class App extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      data: {},
      scene: { options: {}, tracks: [] },
      log: [],
    };

    this.eventEmitter = new EventEmitter();
  }

  addLogLine(text) {
    if (this._mounted) {
      this.eventEmitter.emit('log', text);
    }
  }

  componentDidMount() {
    this._mounted = true;
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  render() {
    return (
      <PerformanceController
        data={this.state.data}
        scene={this.state.scene}
        log={this.state.log}
        emitter={this.eventEmitter}
        onCommandInput={this.props.onCommandInput}
        onFunctionKey={this.props.onFunctionKey}
        onExit={this.props.onExit}
      />
    );
  }
}

// -----------------------------------------------------------------------------

module.exports = App;
