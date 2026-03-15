async function setTimeout() {
  const args = Array.prototype.slice.call(arguments);
  const handler = args.shift();
  const ms = args.shift();
  Utilities.sleep(ms);

  return handler.apply(this, args);
}

// Polyfill for Blob (using Utilities.newBlob)
if (typeof Blob === 'undefined') {
  var Blob = (parts, options) => {
    const contentType = options && options.type ? options.type : 'application/octet-stream';
    // For maximal compatibility, handle parts that may be non-strings by converting them
    const data = parts
      .map((part) => {
        return typeof part === 'string' ? part : part.toString();
      })
      .join('');
    return Utilities.newBlob(data, contentType);
  };
}

// Polyfill for atob and btoa (base64 encoding/decoding)
if (typeof atob === 'undefined') {
  var atob = (base64) => {
    // Decodes base64 into a string
    return Utilities.newBlob(Utilities.base64Decode(base64)).getDataAsString();
  };
}
if (typeof btoa === 'undefined') {
  var btoa = (str) => {
    // Encodes a string into base64
    return Utilities.base64Encode(str);
  };
}

// Polyfill for TextEncoder and TextDecoder for UTF-8 conversions
if (typeof TextEncoder === 'undefined') {
  var TextEncoder = function () {};
  TextEncoder.prototype.encode = function (str) {
    // Returns a byte array using UTF-8 encoding
    return Utilities.newBlob(str).getBytes();
  };
}
if (typeof TextDecoder === 'undefined') {
  var TextDecoder = function () {};
  TextDecoder.prototype.decode = function (byteArray) {
    // Converts a byte array back to a string assuming UTF-8
    return Utilities.newBlob(byteArray).getDataAsString();
  };
}

// Polyfill for URL.createObjectURL and URL.revokeObjectURL
if (typeof URL === 'undefined') {
  var URL = {
    createObjectURL: (blob) => {
      // Returns a data URI as a minimal substitute
      return 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
    },
    revokeObjectURL: () => {
      // No operation needed in Apps Script
    },
  };
}

// Minimal Buffer polyfill
if (typeof Buffer === 'undefined') {
  var Buffer = function (arr) {
    this.data = arr;
  };
  Buffer.from = (input, encoding) => {
    if (typeof input === 'string') {
      if (encoding === 'base64') {
        // Decode base64 into a byte array
        return Utilities.base64Decode(input);
      } else {
        // Default to UTF-8 conversion
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
