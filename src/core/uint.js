'use strict';

/*eslint new-cap: 1*/

const assert = require('assert');
const utils = require('./utils');
const sjcl = utils.sjcl;

//
// Abstract UInt class
//
// Base class for UInt classes
//

function UInt() {
  // Internal form: NaN or sjcl.bn
  this._value = NaN;
}

UInt.json_rewrite = function(j, opts) {
  return this.from_json(j).to_json(opts);
};

// Return a new UInt from j.
UInt.from_generic = function(j) {
  if (j instanceof this) {
    return j.clone();
  }

  return (new this()).parse_generic(j);
};

// Return a new UInt from j.
UInt.from_hex = function(j) {
  if (j instanceof this) {
    return j.clone();
  }

  return (new this()).parse_hex(j);
};

// Return a new UInt from j.
UInt.from_json = function(j) {
  if (j instanceof this) {
    return j.clone();
  }

  return (new this()).parse_json(j);
};

// Return a new UInt from j.
UInt.from_bits = function(j) {
  if (j instanceof this) {
    return j.clone();
  }

  return (new this()).parse_bits(j);
};

// Return a new UInt from j.
UInt.from_bytes = function(j) {
  if (j instanceof this) {
    return j.clone();
  }

  return (new this()).parse_bytes(j);
};

// Return a new UInt from j.
UInt.from_bn = function(j) {
  if (j instanceof this) {
    return j.clone();
  }

  return (new this()).parse_bn(j);
};

// Return a new UInt from j.
UInt.from_number = function(j) {
  if (j instanceof this) {
    return j.clone();
  }

  return (new this()).parse_number(j);
};

UInt.is_valid = function(j) {
  return this.from_json(j).is_valid();
};

UInt.prototype.clone = function() {
  return this.copyTo(new this.constructor());
};

UInt.prototype.checkHexInput = function(j) {
  const width = this.constructor.width;
  assert(typeof width === 'number', 'UInt missing width');

  return new RegExp(`^[0-9A-F]{${width * 2}}$`).test(j);
};

// Returns copy.
UInt.prototype.copyTo = function(d) {
  d._value = this._value;

  if (this._version_byte !== undefined) {
    d._version_byte = this._version_byte;
  }

  if (typeof d._update === 'function') {
    d._update();
  }

  return d;
};

UInt.prototype.equals = function(d) {
  return this.is_valid() && d.is_valid() && this._value.equals(d._value);
};

UInt.prototype.is_valid = function() {
  return this._value instanceof sjcl.bn;
};

UInt.prototype.is_zero = function() {
  return this.is_valid() && this._value.equals(new sjcl.bn(0));
};

/**
 * Update any derivative values.
 *
 * This allows subclasses to maintain caches of any data that they derive from
 * the main _value. For example, the Currency class keeps the currency type, the
 * currency code and other information about the currency cached.
 *
 * The reason for keeping this mechanism in this class is so every subclass can
 * call it whenever it modifies the internal state.
 *
 * @return {void}
 */
UInt.prototype._update = function() {
  // Nothing to do by default. Subclasses will override this.
};

// value = NaN on error.
UInt.prototype.parse_generic = function(j) {
  const subclass = this.constructor;

  assert(typeof subclass.width === 'number', 'UInt missing width');

  switch (j) {
    case undefined:
    case '0':
    case subclass.STR_ZERO:
    case subclass.ACCOUNT_ZERO:
    case subclass.HEX_ZERO:
      this._value = new sjcl.bn(0);
      break;

    case '1':
    case subclass.STR_ONE:
    case subclass.ACCOUNT_ONE:
    case subclass.HEX_ONE:
      this._value = new sjcl.bn(1);
      break;

    default:
      switch (String(j).length) {
        case subclass.width:
          let hex = utils.arrayToHex(utils.stringToArray(j));
          this._value = new sjcl.bn(hex, 16);
          break;
        case subclass.width * 2:
          if (this.checkHexInput(j)) {
            this._value = new sjcl.bn(j, 16);
          }
          break;
        default:
          this._value = NaN;
      }
  }

  this._update();

  return this;
};

UInt.prototype.parse_hex = function(j) {
  if (this.checkHexInput(j)) {
    this._value = new sjcl.bn(j, 16);
  } else {
    this._value = NaN;
  }

  this._update();

  return this;
};

UInt.prototype.parse_bits = function(j) {
  if (sjcl.bitArray.bitLength(j) === this.constructor.width * 8) {
    this._value = sjcl.bn.fromBits(j);
    // let bytes = sjcl.codec.bytes.fromBits(j);
    // this.parse_bytes(bytes);
  } else {
    this._value = NaN;
  }

  this._update();

  return this;
};


UInt.prototype.parse_bytes = function(j) {
  if (Array.isArray(j) && j.length === this.constructor.width) {
    let bits = sjcl.codec.bytes.toBits(j);
    this._value = sjcl.bn.fromBits(bits);
  } else {
    this._value = NaN;
  }

  this._update();

  return this;
};


UInt.prototype.parse_json = UInt.prototype.parse_hex;

UInt.prototype.parse_bn = function(j) {
  if ((j instanceof sjcl.bn) && j.bitLength() <= this.constructor.width * 8) {
    this._value = new sjcl.bn(j);
  } else {
    this._value = NaN;
  }

  this._update();

  return this;
};

UInt.prototype.parse_number = function(j) {
  this._value = NaN;

  if (typeof j === 'number' && isFinite(j) && j >= 0) {
    this._value = new sjcl.bn(j);
  }

  this._update();

  return this;
};

// Convert from internal form.
UInt.prototype.to_bytes = function() {
  if (!this.is_valid()) {
    return null;
  }

  return sjcl.codec.bytes.fromBits(this.to_bits());
};

UInt.prototype.to_hex = function() {
  if (!this.is_valid()) {
    return null;
  }

  return sjcl.codec.hex.fromBits(this.to_bits()).toUpperCase();
};

UInt.prototype.to_json = UInt.prototype.to_hex;

UInt.prototype.to_bits = function() {
  if (!this.is_valid()) {
    return null;
  }

  return this._value.toBits(this.constructor.width * 8);
};

UInt.prototype.to_bn = function() {
  if (!this.is_valid()) {
    return null;
  }

  let bits = this.to_bits();

  return sjcl.bn.fromBits(bits);
};

exports.UInt = UInt;

// vim:sw=2:sts=2:ts=8:et
