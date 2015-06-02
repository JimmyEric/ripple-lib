'use strict';

/* eslint-disable max-len */

const assert = require('assert-diff');
const lodash = require('lodash');
const ripple = require('ripple-lib');
const fixtures = require('./fixtures/uint');

function runTestCase(rippleType, inputMethod, outputMethod, test) {
  let val = rippleType[inputMethod](test.input);

  assert.strictEqual(val.is_valid(), String(test.expected) !== 'null', 'validity check failed: ' + test.input);

  val = val[outputMethod]();

  function errMsg() {
    return 'output check failed for '
    + typeof test.input + ': ' + test.input
    + ', expected ' + val + ' to be '
    + (test.expected === 'null' ? NaN : test.expected);
  }

  if (test.expected === 'null') {
    // XXX
    // UInt160.to_json() returns NaN rather than null if
    // input is invalid. JSON.stringify(NaN) === 'null'
    assert.strictEqual(lodash.isNaN(val), true, errMsg());
  } else {
    assert.deepEqual(val, test.expected, errMsg());
  }
}

function makeTests(uIntType) {
  describe(uIntType, function() {
    let rippleType = ripple[uIntType];
    let tests = fixtures[uIntType];

    assert(rippleType && tests);

    lodash.each(tests, (test, key) => {
      // Example: from_json().to_bytes()
      let [, inputMethod, outputMethod] = /^(\w+)\(\)\.(\w+)\(\)$/.exec(key);

      assert(inputMethod && outputMethod);

      it(key, () => {
        test.forEach(
          lodash.partial(runTestCase, rippleType, inputMethod, outputMethod));
      });
    });
  });
}

['UInt128', 'UInt160', 'UInt256'].forEach(makeTests);
