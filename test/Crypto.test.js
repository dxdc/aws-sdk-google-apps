const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');

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
    parseInt,
    crypto: {},
    Utilities: {
      getUuid: () => crypto.randomUUID(),
    },
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

  test('getRandomValues uses Utilities.getUuid()', () => {
    let callCount = 0;
    sandbox.Utilities.getUuid = () => {
      callCount++;
      return 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
    };
    const arr = new Uint8Array(32);
    sandbox.getRandomValues(arr);
    // 32 bytes needs 2 UUIDs (16 bytes each)
    expect(callCount).toBe(2);
  });

  test('getRandomValues produces different values across calls', () => {
    const arr1 = new Uint8Array(16);
    const arr2 = new Uint8Array(16);
    sandbox.getRandomValues(arr1);
    sandbox.getRandomValues(arr2);
    // Extremely unlikely to be equal with real random UUIDs
    expect(arr1.join(',')).not.toBe(arr2.join(','));
  });
});
