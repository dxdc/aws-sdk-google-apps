/**
 * @module getRandomValuesPolyfill
 *
 * Polyfill for the crypto.getRandomValues API for Google Apps Script.
 *
 * Uses Utilities.getUuid() (available natively in GAS) to generate
 * random bytes. Each UUID v4 provides 16 bytes derived from a
 * cryptographic random source.
 *
 * @example
 * const randomArray = new Uint8Array(10).fill(0);
 * getRandomValues(randomArray);
 */

class TypeMismatchError extends Error {}
class QuotaExceededError extends Error {}

/**
 * Extracts random bytes from a UUID v4 string.
 * UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx (32 hex chars, 16 bytes)
 * @param {string} uuid - A UUID v4 string.
 * @returns {number[]} Array of 16 byte values.
 */
function uuidToBytes(uuid) {
  var hex = uuid.replace(/-/g, '');
  var bytes = [];
  for (var i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes;
}

/**
 * Fills a typed array's underlying byte buffer with random values
 * using Utilities.getUuid().
 * @param {TypedArray} array - The typed array to fill.
 * @returns {TypedArray} The same array, filled with random values.
 */
function fillRandomValues(array) {
  var byteView = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
  var bytesNeeded = byteView.length;
  var offset = 0;

  while (offset < bytesNeeded) {
    var bytes = uuidToBytes(Utilities.getUuid());
    for (var i = 0; i < bytes.length && offset < bytesNeeded; i++, offset++) {
      byteView[offset] = bytes[i];
    }
  }

  return array;
}

/**
 * Fills a typed array with random values.
 * @param {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Uint8ClampedArray} array - The typed array to fill.
 * @returns {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Uint8ClampedArray} The same array, filled with random values.
 * @throws {TypeMismatchError} If the argument is not a typed integer array.
 * @throws {QuotaExceededError} If the array exceeds 65536 bytes.
 */
function getRandomValues(array) {
  if (
    !(
      array instanceof Int8Array ||
      array instanceof Uint8Array ||
      array instanceof Int16Array ||
      array instanceof Uint16Array ||
      array instanceof Int32Array ||
      array instanceof Uint32Array ||
      array instanceof Uint8ClampedArray
    )
  ) {
    throw new TypeMismatchError(`Expected an integer array, received ${typeof array}`);
  }

  if (array.byteLength > 65536) {
    throw new QuotaExceededError('Can only request a maximum of 65536 bytes');
  }

  return fillRandomValues(array);
}

var crypto = crypto || {};

if (typeof crypto.getRandomValues !== 'function') {
  crypto.getRandomValues = getRandomValues;
}
