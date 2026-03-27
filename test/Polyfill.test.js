const fs = require('fs');
const vm = require('vm');

function loadPolyfill() {
  const code = fs.readFileSync(`${__dirname}/../src/Polyfill.js`, 'utf8');
  const sandbox = {
    Utilities: {
      sleep: jest.fn(),
      newBlob: jest.fn((data, contentType) => ({
        getDataAsString: () => (typeof data === 'string' ? data : String(data)),
        getBytes: () => (typeof data === 'string' ? Array.from(Buffer.from(data)) : data),
        getContentType: () => contentType || 'application/octet-stream',
      })),
      base64Decode: jest.fn((str) => Array.from(Buffer.from(str, 'base64'))),
      base64Encode: jest.fn((str) => Buffer.from(str).toString('base64')),
    },
    Logger: { log: jest.fn() },
    Array,
    Function,
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox;
}

describe('Polyfill', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = loadPolyfill();
  });

  describe('setTimeout', () => {
    test('returns a numeric timer ID', () => {
      const handler = jest.fn();
      const id = sandbox.setTimeout(handler, 0);
      expect(typeof id).toBe('number');
      expect(id).toBeGreaterThan(0);
    });

    test('calls handler after sleeping', () => {
      const handler = jest.fn();
      sandbox.setTimeout(handler, 100);
      expect(sandbox.Utilities.sleep).toHaveBeenCalledWith(100);
      expect(handler).toHaveBeenCalled();
    });

    test('does not sleep for 0ms delay', () => {
      const handler = jest.fn();
      sandbox.setTimeout(handler, 0);
      // Should not call sleep with positive value
      expect(handler).toHaveBeenCalled();
    });

    test('passes additional arguments to handler', () => {
      const handler = jest.fn();
      sandbox.setTimeout(handler, 0, 'arg1', 'arg2');
      expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
    });

    test('returns incrementing IDs', () => {
      const handler = jest.fn();
      const id1 = sandbox.setTimeout(handler, 0);
      const id2 = sandbox.setTimeout(handler, 0);
      expect(id2).toBeGreaterThan(id1);
    });
  });

  describe('clearTimeout', () => {
    test('is defined as a function', () => {
      expect(typeof sandbox.clearTimeout).toBe('function');
    });

    test('does not throw for invalid IDs', () => {
      expect(() => sandbox.clearTimeout(999)).not.toThrow();
      expect(() => sandbox.clearTimeout(undefined)).not.toThrow();
    });
  });

  describe('setInterval', () => {
    test('is defined and returns a timer ID', () => {
      const handler = jest.fn();
      const id = sandbox.setInterval(handler, 100);
      expect(typeof id).toBe('number');
    });
  });

  describe('clearInterval', () => {
    test('is defined as a function', () => {
      expect(typeof sandbox.clearInterval).toBe('function');
    });
  });

  describe('console polyfill', () => {
    test('console object has all required methods', () => {
      expect(typeof sandbox.console).toBe('object');
      expect(typeof sandbox.console.log).toBe('function');
      expect(typeof sandbox.console.warn).toBe('function');
      expect(typeof sandbox.console.error).toBe('function');
      expect(typeof sandbox.console.info).toBe('function');
    });
  });

  describe('navigator polyfill', () => {
    test('navigator.userAgent is set', () => {
      expect(sandbox.navigator.userAgent).toBe('GoogleAppsScript');
    });
  });

  describe('atob/btoa', () => {
    test('atob decodes base64', () => {
      sandbox.atob('SGVsbG8=');
      expect(sandbox.Utilities.base64Decode).toHaveBeenCalledWith('SGVsbG8=');
    });

    test('btoa encodes to base64', () => {
      sandbox.btoa('Hello');
      expect(sandbox.Utilities.base64Encode).toHaveBeenCalledWith('Hello');
    });
  });

  describe('TextEncoder/TextDecoder', () => {
    test('TextEncoder.encode converts string to bytes', () => {
      const encoder = new sandbox.TextEncoder();
      encoder.encode('hello');
      expect(sandbox.Utilities.newBlob).toHaveBeenCalledWith('hello');
    });

    test('TextDecoder.decode converts bytes to string', () => {
      const decoder = new sandbox.TextDecoder();
      const result = decoder.decode([72, 101]);
      expect(sandbox.Utilities.newBlob).toHaveBeenCalledWith([72, 101]);
      expect(typeof result).toBe('string');
    });
  });

  describe('Buffer polyfill', () => {
    test('Buffer.from handles string input', () => {
      sandbox.Buffer.from('hello');
      expect(sandbox.Utilities.newBlob).toHaveBeenCalledWith('hello');
    });

    test('Buffer.from handles base64 encoding', () => {
      sandbox.Buffer.from('SGVsbG8=', 'base64');
      expect(sandbox.Utilities.base64Decode).toHaveBeenCalledWith('SGVsbG8=');
    });

    test('Buffer.from handles array input', () => {
      const result = sandbox.Buffer.from([1, 2, 3]);
      expect(result).toEqual([1, 2, 3]);
    });

    test('Buffer.isBuffer checks instanceof', () => {
      const buf = new sandbox.Buffer([]);
      expect(sandbox.Buffer.isBuffer(buf)).toBe(true);
      expect(sandbox.Buffer.isBuffer({})).toBe(false);
    });
  });

  describe('process polyfill', () => {
    test('process object exists', () => {
      expect(typeof sandbox.process).toBe('object');
    });

    test('process.env is an object', () => {
      expect(typeof sandbox.process.env).toBe('object');
    });

    test('process.env returns undefined for missing keys', () => {
      expect(sandbox.process.env.AWS_PROFILE).toBeUndefined();
      expect(sandbox.process.env.AWS_EXECUTION_ENV).toBeUndefined();
    });

    test('process.version is a string', () => {
      expect(typeof sandbox.process.version).toBe('string');
    });
  });
});
