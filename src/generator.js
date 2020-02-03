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
const { superstruct } = require('superstruct');
const { isEmpty, reverse } = require('lodash');

const { isMidiNumber, getRandomInt, makeRandomNoteEvent } = require('./midi-event');

// -----------------------------------------------------------------------------

const GeneratorType = {
  quadrant: 'quadrant',
  eculid: 'euclid',
  eighth: 'eighth',
  quarter: 'quarter',
  half: 'half',
  accel: 'accel',
  ritard: 'ritard',
};

const isGeneratorType = value => !isEmpty(GeneratorType[value]);

const Generator = superstruct({
  types: {
    generatorType: isGeneratorType,
    midiNumber: isMidiNumber,
  },
})({
  length: 'number',
  steps: 'number',
  type: 'generatorType?',
  notes: ['number'],
});

const generatorDefaults = {
  length: 16,
  steps: 4,
  type: 'quadrant',
  notes: [36, 42, 48],
};

const isGenerator = value => {
  const [error] = Generator.validate(value);
  return isEmpty(error);
};

// -----------------------------------------------------------------------------

/**
 * Euclidean common divisor algorithm
 * @param P Pattern sets with equal distribution
 * @param R Remainder sets to be distributed
 * @returns {*}
 */
function euclid(P, R) {
  if (R.length < 2) {
    // Reached final remainder. Concatenate the results;
    return [...P, ...R].reduce((result, item) => [...result, ...item], []);
  }
  const len = Math.min(P.length, R.length);
  const p = [];
  const r = [];
  let j = 0;
  for (; j < len; j++) {
    p.push([...P[j], ...R[j]]);
  }
  if (len < P.length) {
    for (; j < P.length; j++) {
      r.push(P[j]);
    }
  } else if (len < R.length) {
    for (; j < R.length; j++) {
      r.push(R[j]);
    }
  }
  return euclid(p, r);
}

function makeEuclidPattern(nextNote, { length, steps }) {
  const n = length;
  const k = steps;
  let i;
  const p = [];
  for (i = 0; i < k; i += 1) {
    p.push([nextNote()]);
  }
  const r = [];
  for (i = 0; i < n - k; i += 1) {
    r.push([null]);
  }

  return euclid(p, r);
}

/***
 *
 * @param nextNote
 * @param config
 * @returns {Array}
 */
function makeQuadrantPattern(nextNote, { length, steps }) {
  let n = length;
  let k = steps;

  let seq = [];

  let i;
  for (i = 0; i < n; i++) {
    seq[i] = null;
  }

  let [n1, n2] = randomSplit(n);
  let [m1, m2] = randomSplit(n1);
  let [m3, m4] = randomSplit(n2);

  let [k1, k2] = randomSplit(k);
  let [p1, p2] = randomSplit(k1);
  let [p3, p4] = randomSplit(k2);

  assignRandomSteps(seq, 0, m1 - 1, p1, nextNote);
  assignRandomSteps(seq, m1, m1 + m2 - 1, p2, nextNote);
  assignRandomSteps(
    seq,
    m1 + m2,
    m1 + m2 + m3 - 1,
    p3,
    nextNote
  );
  assignRandomSteps(
    seq,
    m1 + m2 + m3,
    m1 + m2 + m3 + m4 - 1,
    p4,
    nextNote
  );

  return seq;
}

/***
 *
 * @param n
 * @returns {*[]}
 */
function randomSplit(n) {
  let a = Math.random() > 0.5 ? Math.floor(n / 2) : Math.ceil(n / 2);
  let b = n - a;
  return [a, b];
}

/***
 *
 * @param seq
 * @param min
 * @param max
 * @param stepCount
 * @param nextNote
 */
function assignRandomSteps(seq, min, max, stepCount, nextNote) {
  let i, j;
  let done = false;
  for (i = 0; i < stepCount; i++) {
    while (!done) {
      j = getRandomInt(min, max);
      if (seq[j] == null) {
        seq[j] = nextNote();
        done = true;
      }
    }
  }
}

/***
 *
 * @param makeSnare
 * @param config
 * @returns {Array}
 */
function makeQuarterPattern(nextNote, { length }) {
  let quarter = Math.round(length / 4);
  let seq = [];
  for (let i = 0; i < length; i++) {
    if (i % quarter === 0) {
      seq.push(nextNote());
    } else {
      seq.push(null);
    }
  }

  return seq;
}

/***
 *
 * @param nextNote
 * @param config
 * @returns {Array}
 */
function makeHalfPattern(nextNote, config) {
  let length = config.length;

  let quarter = Math.round(length / 4);
  let half = Math.round(length / 2);

  let seq = [];

  for (let i = 0; i < length; i++) {
    if (i % quarter === 0 && i % half !== 0) {
      seq.push(nextNote());
    } else {
      seq.push(null);
    }
  }

  return seq;
}

function makeEighthPattern(nextNote, { length }) {
  const eighth = Math.round(length / 8);
  const seq = [];
  for (let i = 0; i < length; i++) {
    if (i % eighth !== 0) {
      seq.push(nextNote());
    } else {
      seq.push(null);
    }
  }
  return seq;
}

/***
 *
 * @param nextNote
 * @param config
 * @returns {Array}
 */
function makeExponentialPattern(nextNote, { length, steps }) {
  const n = length;
  const k = steps;

  let seq = [];
  let i, s;
  for (i = 0; i < n; i++) {
    seq[i] = null;
  }

  for (i = 0; i < n; i += s) {
    seq[i] = nextNote();
    s = Math.ceil((n - i) / k);
    if (s === 0) {
      break;
    }
  }

  return seq;
}

// -----------------------------------------------------------------------------

function generateSequence({
  length, steps, type, notes,
}) {
  const nextNote = () => {
    const options = {};
    if (!isEmpty(notes)) {
      options.pitch = notes[getRandomInt(0, notes.length-1)];
    }
    return makeRandomNoteEvent(options);
  };

  switch (type) {
    case GeneratorType.eighth:
      return makeEighthPattern(nextNote, { length, steps });
    case GeneratorType.half:
      return makeHalfPattern(nextNote, { length, steps });
    case GeneratorType.quarter:
      return makeQuarterPattern(nextNote, { length, steps });
    case GeneratorType.quadrant:
      return makeQuadrantPattern(nextNote, { length, steps });
    case GeneratorType.accel:
      return makeExponentialPattern(nextNote, { length, steps });
    case GeneratorType.ritard:
      return reverse(makeExponentialPattern(nextNote, { length, steps }));
    case GeneratorType.eculid:
    default: return makeEuclidPattern(nextNote, { length, steps });
  }
}

// -----------------------------------------------------------------------------

module.exports = {
  Generator,
  isGenerator,
  generatorDefaults,
  generateSequence,
};
