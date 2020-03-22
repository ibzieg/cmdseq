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
/* eslint-disable react/no-string-refs */
const React = require('react');
const PropTypes = require('prop-types');

// -----------------------------------------------------------------------------

class CommandBox extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      commandHistoryIndex: 0,
      commandHistory: [],
    };
  }

  componentDidMount() {
    const { emitter } = this.props;

    setTimeout(() => {
      const { commandInput } = this.refs;
      commandInput.focus();
    }, 0);

    emitter.on('log', this.appendLog.bind(this));
  }

  appendLog(text) {
    this.refs.log.insertBottom(text);
    this.refs.log.setScrollPerc(100);

    // force render
    // eslint-disable-next-line react/no-unused-state
    this.setState({ lastMessage: text });
  }

  handleKeypress(ch, key) {
    const { onFunctionKey } = this.props;
    const { commandHistory, commandHistoryIndex } = this.state;
    const { commandInput } = this.refs;
    const fkeys = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12'];

    if (fkeys.indexOf(key.name) >= 0) {
      if (typeof onFunctionKey === 'function') {
        onFunctionKey(fkeys.indexOf(key.name));
      }
    } else if (key.name === 'up' || (key.ctrl && key.name === 'p')) {
      const nextIndex = Math.max(commandHistoryIndex - 1, 0);
      const cmd = commandHistory[nextIndex];
      commandInput.setValue(cmd);
      this.setState({ commandHistoryIndex: nextIndex });
    } else if (key.name === 'down' || (key.ctrl && key.name === 'n')) {
      const nextIndex = Math.min(
        commandHistoryIndex + 1,
        commandHistory.length,
      );
      const cmd = commandHistory[nextIndex];
      commandInput.setValue(cmd);
      this.setState({ commandHistoryIndex: nextIndex });
    } else if (key.ctrl && key.name === 'c') {
      commandInput.clearValue();
      this.setState({ commandHistoryIndex: commandHistory.length });
    } else {
      this.setState({ commandHistoryIndex: commandHistory.length });
    }
  }

  handleSubmit(value) {
    const {
      onCommandInput, onExit,
    } = this.props;
    const {
      commandHistory,
    } = this.state;
    const { commandInput } = this.refs;

    commandInput.clearValue();
    commandInput.focus();
    if (value === 'exit') {
      onExit();
    } else {
      if (onCommandInput) {
        onCommandInput(value);
      }
      this.setState({
        commandHistory: [...commandHistory, value],
        commandHistoryIndex: commandHistory.length + 1,
      });
    }
  }

  render() {
    const {
      top, left, width, height,
    } = this.props;

    return React.createElement('box', {
      top,
      left,
      width,
      height,
      style: {
        border: { fg: 'white' },
      },
    },
    [
      React.createElement('box', {
        border: { type: 'line' },
        height: height - 3,
        key: 'log-box',
        left: 0,
        ref: 'log',
        scrollable: true,
        top: 0,
        width,
        style: {
          border: { fg: 'white' },
        },
      }),
      React.createElement('textbox', {
        border: { type: 'line' },
        height: 3,
        inputOnFocus: true,
        key: 'command-input',
        keys: true,
        left: 0,
        mouse: true,
        ref: 'commandInput',
        scrollable: true,
        top: height - 4,
        width,
        style: {
          border: { fg: 'white' },
        },
        onKeypress: this.handleKeypress.bind(this),
        onSubmit: this.handleSubmit.bind(this),
      }),
    ]);
  }
}

CommandBox.propTypes = {
  emitter: PropTypes.shape({
    on: PropTypes.func,
  }).isRequired,
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  onCommandInput: PropTypes.func.isRequired,
  onExit: PropTypes.func.isRequired,
  onFunctionKey: PropTypes.func.isRequired,
};

// -----------------------------------------------------------------------------

module.exports = CommandBox;
