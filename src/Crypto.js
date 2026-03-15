/**
 * @module getRandomValuesPolyfill
 *
 * Polyfill for the crypto.getRandomValues API for Google Apps Script.
 *
 * WARNING: NOT CRYPTOGRAPHICALLY SECURE
 * This implementation uses Math.random(), which is a PRNG and not suitable
 * for cryptographic purposes. It is used here solely because GAS does not
 * expose the Web Crypto API. The AWS SDK uses crypto.getRandomValues() for
 * generating unique request IDs, NOT for key generation or encryption, so
 * this is acceptable for that use case.
 *
 * Attribution:
 * Based on the react-native-get-random-values package:
 * https://github.com/LinusU/react-native-get-random-values
 *
 * @example
 * const randomArray = new Uint8Array(10).fill(0);
 * getRandomValues(randomArray);
 */

class TypeMismatchError extends Error {}
class QuotaExceededError extends Error {}

function getInsecureRandomValues(array) {
  for (let i = 0, r; i < array.length; i++) {
    if ((i & 0x03) === 0) {
      r = Math.random() * 0x100000000;
    }
    array[i] = (r >>> ((i & 0x03) << 3)) & 0xff;
  }

  return array;
}

/**
 * Fills a typed array with pseudo-random values.
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

  return getInsecureRandomValues(array);
}

var crypto = crypto || {};

if (typeof crypto.getRandomValues !== 'function') {
  crypto.getRandomValues = getRandomValues;
}
