const fs = require('fs');
const vm = require('vm');

function loadCrypto() {
  const code = fs.readFileSync(`${__dirname}/../src/Crypto.js`, 'utf8');
  // Pass typed array constructors into the sandbox so instanceof checks work
  const sandbox = {
    Math,
    Int8Array,
    Uint8Array,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Uint8ClampedArray,
    Error,
    crypto: {},
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox;
}

describe('Crypto polyfill', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = loadCrypto();
  });

  test('getRandomValues fills Uint8Array with values', () => {
    const arr = new Uint8Array(16);
    const result = sandbox.getRandomValues(arr);
    expect(result).toBe(arr);
    // At least some values should be non-zero (statistically near-certain for 16 bytes)
    expect(arr.some((v) => v !== 0)).toBe(true);
  });

  test('getRandomValues fills Int8Array', () => {
    const arr = new Int8Array(8);
    sandbox.getRandomValues(arr);
    expect(arr.length).toBe(8);
  });

  test('getRandomValues fills Uint16Array', () => {
    const arr = new Uint16Array(4);
    sandbox.getRandomValues(arr);
    expect(arr.length).toBe(4);
  });

  test('getRandomValues fills Int32Array', () => {
    const arr = new Int32Array(4);
    sandbox.getRandomValues(arr);
    expect(arr.length).toBe(4);
  });

  test('getRandomValues fills Uint8ClampedArray', () => {
    const arr = new Uint8ClampedArray(8);
    sandbox.getRandomValues(arr);
    expect(arr.length).toBe(8);
  });

  test('getRandomValues throws for non-typed arrays', () => {
    expect(() => sandbox.getRandomValues([1, 2, 3])).toThrow();
    expect(() => sandbox.getRandomValues('string')).toThrow();
  });

  test('getRandomValues throws for arrays > 65536 bytes', () => {
    const arr = new Uint8Array(65537);
    expect(() => sandbox.getRandomValues(arr)).toThrow();
  });

  test('getRandomValues works for exactly 65536 bytes', () => {
    const arr = new Uint8Array(65536);
    expect(() => sandbox.getRandomValues(arr)).not.toThrow();
  });

  test('crypto.getRandomValues is assigned', () => {
    expect(typeof sandbox.crypto.getRandomValues).toBe('function');
  });
});
