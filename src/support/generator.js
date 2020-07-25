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
const { isEmpty, reverse } = require('lodash');

const { GeneratorType } = require('../schema/generator-schema');

const { getRandomInt, makeRandomNoteEvent } = require('./midi-data');


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
  for (; j < len; j += 1) {
    p.push([...P[j], ...R[j]]);
  }
  if (len < P.length) {
    for (; j < P.length; j += 1) {
      r.push(P[j]);
    }
  } else if (len < R.length) {
    for (; j < R.length; j += 1) {
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

/** *
 *
 * @param n
 * @returns {*[]}
 */
function randomSplit(n) {
  const a = Math.random() > 0.5 ? Math.floor(n / 2) : Math.ceil(n / 2);
  const b = n - a;
  return [a, b];
}

/** *
 *
 * @param seq
 * @param min
 * @param max
 * @param stepCount
 * @param nextNote
 */
function assignRandomSteps(seq, min, max, stepCount, nextNote) {
  let i;
  let j;
  let done = false;
  const nextSeq = [...seq];
  for (i = 0; i < stepCount; i += 1) {
    while (!done) {
      j = getRandomInt(min, max);
      if (isEmpty(nextSeq[j])) {
        nextSeq[j] = nextNote();
        done = true;
      }
    }
  }
  return nextSeq;
}

/** *
 *
 * @param nextNote
 * @param config
 * @returns {Array}
 */
function makeQuadrantPattern(nextNote, { length, steps }) {
  const n = length;
  const k = steps;

  let seq = [];

  let i;
  for (i = 0; i < n; i += 1) {
    seq[i] = null;
  }

  const [n1, n2] = randomSplit(n);
  const [m1, m2] = randomSplit(n1);
  const [m3, m4] = randomSplit(n2);

  const [k1, k2] = randomSplit(k);
  const [p1, p2] = randomSplit(k1);
  const [p3, p4] = randomSplit(k2);

  seq = assignRandomSteps(seq, 0, m1 - 1, p1, nextNote);
  seq = assignRandomSteps(seq, m1, m1 + m2 - 1, p2, nextNote);
  seq = assignRandomSteps(
    seq,
    m1 + m2,
    m1 + m2 + m3 - 1,
    p3,
    nextNote,
  );
  seq = assignRandomSteps(
    seq,
    m1 + m2 + m3,
    m1 + m2 + m3 + m4 - 1,
    p4,
    nextNote,
  );

  return seq;
}


/** *
 *
 * @param makeSnare
 * @param config
 * @returns {Array}
 */
function makeQuarterPattern(nextNote, { length }) {
  const quarter = Math.round(length / 4);
  const seq = [];
  for (let i = 0; i < length; i += 1) {
    if (i % quarter === 0) {
      seq.push(nextNote());
    } else {
      seq.push(null);
    }
  }

  return seq;
}

/** *
 *
 * @param nextNote
 * @param config
 * @returns {Array}
 */
function makeHalfPattern(nextNote, config) {
  const { length } = config;

  const quarter = Math.round(length / 4);
  const half = Math.round(length / 2);

  const seq = [];

  for (let i = 0; i < length; i += 1) {
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
  for (let i = 0; i < length; i += 1) {
    if (i % eighth !== 0) {
      seq.push(nextNote());
    } else {
      seq.push(null);
    }
  }
  return seq;
}

/** *
 *
 * @param nextNote
 * @param config
 * @returns {Array}
 */
function makeExponentialPattern(nextNote, { length, steps }) {
  const n = length;
  const k = steps;

  const seq = [];
  let i; let
    s;
  for (i = 0; i < n; i += 1) {
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
      options.pitch = notes[getRandomInt(0, notes.length - 1)];
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
    case GeneratorType.euclid:
    default: return makeEuclidPattern(nextNote, { length, steps });
  }
}

// -----------------------------------------------------------------------------

module.exports = {
  generateSequence,
};
