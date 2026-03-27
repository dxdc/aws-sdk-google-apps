/**
 * Polyfills for Google Apps Script V8 runtime compatibility.
 *
 * Google Apps Script's V8 runtime lacks many browser and Node.js APIs
 * that the AWS SDK depends on. These polyfills bridge the gap using
 * GAS-native equivalents (Utilities, XmlService, etc.).
 */

// ---------- Timer polyfills ----------
// GAS is synchronous, so setTimeout/setInterval execute immediately after sleeping.
// These return numeric IDs for compatibility with the AWS SDK's internal timer wrappers.
// Note: state is stored on the function object to avoid var-hoisting issues
// when AwsSdk.gs loads before Polyfill.gs in GAS alphabetical file order.

/**
 * Polyfill for setTimeout. Blocks the thread with Utilities.sleep() then
 * invokes the callback. Returns a numeric timer ID for clearTimeout compatibility.
 * @param {Function} handler - The function to execute after the delay.
 * @param {number} ms - The delay in milliseconds.
 * @param {...*} args - Additional arguments passed to the handler.
 * @returns {number} A numeric timer ID.
 */
function setTimeout(handler, ms) {
  if (!setTimeout._timers) {
    setTimeout._counter = 0;
    setTimeout._timers = {};
  }
  var id = ++setTimeout._counter;
  setTimeout._timers[id] = true;
  var args = Array.prototype.slice.call(arguments, 2);

  if (ms > 0) {
    Utilities.sleep(ms);
  }

  if (setTimeout._timers[id]) {
    delete setTimeout._timers[id];
    handler.apply(null, args);
  }

  return id;
}

/**
 * Polyfill for clearTimeout. Marks the timer as cancelled so the handler
 * will not execute if it hasn't already.
 * @param {number} id - The timer ID returned by setTimeout.
 */
function clearTimeout(id) {
  if (setTimeout._timers) {
    delete setTimeout._timers[id];
  }
}

/**
 * Polyfill for setInterval. In GAS's synchronous environment, this executes
 * the callback once (equivalent to setTimeout) since there is no event loop.
 * @param {Function} handler - The function to execute.
 * @param {number} ms - The interval in milliseconds.
 * @param {...*} args - Additional arguments passed to the handler.
 * @returns {number} A numeric timer ID.
 */
function setInterval(handler, ms) {
  return setTimeout.apply(null, arguments);
}

/**
 * Polyfill for clearInterval.
 * @param {number} id - The timer ID returned by setInterval.
 */
function clearInterval(id) {
  clearTimeout(id);
}

// ---------- Console polyfill ----------
// GAS V8 has console.log but may lack console.warn/error/info in some contexts.
// Ensure all standard console methods exist, mapping to Logger.log.

var console = (typeof console !== 'undefined' && console) || {};
['log', 'warn', 'error', 'info'].forEach((method) => {
  if (typeof console[method] !== 'function') {
    console[method] = function () {
      Logger.log.apply(Logger, arguments);
    };
  }
});

// ---------- Blob polyfill ----------
if (typeof Blob === 'undefined') {
  // eslint-disable-next-line no-useless-assignment -- GAS global polyfill consumed by other scripts
  var Blob = (parts, options) => {
    const contentType = options && options.type ? options.type : 'application/octet-stream';
    const data = parts
      .map((part) => {
        return typeof part === 'string' ? part : part.toString();
      })
      .join('');
    return Utilities.newBlob(data, contentType);
  };
}

// ---------- Base64 polyfills ----------
if (typeof atob === 'undefined') {
  // eslint-disable-next-line no-useless-assignment -- GAS global polyfill consumed by other scripts
  var atob = (base64) => {
    return Utilities.newBlob(Utilities.base64Decode(base64)).getDataAsString();
  };
}
if (typeof btoa === 'undefined') {
  // eslint-disable-next-line no-useless-assignment -- GAS global polyfill consumed by other scripts
  var btoa = (str) => {
    return Utilities.base64Encode(str);
  };
}

// ---------- TextEncoder / TextDecoder polyfills ----------
if (typeof TextEncoder === 'undefined') {
  var TextEncoder = function () {};
  TextEncoder.prototype.encode = function (str) {
    return Utilities.newBlob(str).getBytes();
  };
}
if (typeof TextDecoder === 'undefined') {
  var TextDecoder = function () {};
  TextDecoder.prototype.decode = function (byteArray) {
    return Utilities.newBlob(byteArray).getDataAsString();
  };
}

// ---------- URL polyfill ----------
if (typeof URL === 'undefined') {
  // eslint-disable-next-line no-useless-assignment -- GAS global polyfill consumed by other scripts
  var URL = {
    createObjectURL: (blob) => {
      return 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
    },
    revokeObjectURL: () => {
      // No operation needed in Apps Script
    },
  };
}

// ---------- Buffer polyfill ----------
if (typeof Buffer === 'undefined') {
  var Buffer = function (arr) {
    this.data = arr;
  };
  Buffer.from = (input, encoding) => {
    if (typeof input === 'string') {
      if (encoding === 'base64') {
        return Utilities.base64Decode(input);
      } else {
        return Utilities.newBlob(input).getBytes();
      }
    } else if (Array.isArray(input)) {
      return input;
    }
    return input;
  };
  Buffer.isBuffer = (obj) => {
    return obj instanceof Buffer;
  };
}

// ---------- navigator polyfill ----------
// AWS SDK checks for navigator.userAgent to build the User-Agent header.
if (typeof navigator === 'undefined') {
  // eslint-disable-next-line no-useless-assignment -- GAS global polyfill consumed by other scripts
  var navigator = {
    userAgent: 'GoogleAppsScript',
  };
}

// ---------- process polyfill ----------
// AWS SDK reads process.env for AWS_PROFILE, AWS_EXECUTION_ENV, etc.
// Ensure process and process.env exist so these lookups return undefined
// rather than throwing a ReferenceError.
if (typeof process === 'undefined') {
  // eslint-disable-next-line no-useless-assignment -- GAS global polyfill consumed by other scripts
  var process = { env: {}, version: 'v0.0.0' };
} else if (typeof process.env === 'undefined') {
  process.env = {};
}
