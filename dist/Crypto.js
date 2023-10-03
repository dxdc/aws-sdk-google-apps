/**
 * @module getRandomValuesPolyfill
 *
 * This module serves as a polyfill for the crypto.getRandomValues API. It's designed
 * to provide a similar interface for generating cryptographically random values in
 * environments where the native API is not available.
 *
 * Limitations:
 * Not Cryptographically Secure: This implementation uses JavaScript's Math.random(),
 * which is not suitable for cryptographic purposes.
 *
 * Attribution:
 * This polyfill is based on the react-native-get-random-values package available at:
 * https://github.com/LinusU/react-native-get-random-values
 *
 * @example
 * const randomArray = new Uint8Array(10).fill(0);
 * getRandomValues(randomArray);
 */

// Custom Error classes
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
 * @param {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Uint8ClampedArray} array
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
