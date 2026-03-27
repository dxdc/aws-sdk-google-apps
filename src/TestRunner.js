/**
 * Lightweight test runner for Google Apps Script.
 *
 * Run `runAllTests()` from the Apps Script editor to execute every test suite.
 * Results are logged via Logger and returned as a summary object.
 *
 * Individual suites can be run independently:
 *   testPolyfills(), testCrypto(), testXml(), testConfig(), testGasEnvironment()
 */

// ---------------------------------------------------------------------------
// Mini test harness
// ---------------------------------------------------------------------------

/**
 * Create a lightweight test context for collecting pass/fail results.
 * @param {string} suiteName - Name of the test suite.
 * @returns {Object} Harness with assert helpers and a results summary.
 */
function _createTestHarness(suiteName) {
  var passed = 0;
  var failed = 0;
  var errors = [];

  function _assert(name, fn) {
    try {
      fn();
      passed++;
      Logger.log('  PASS: ' + name);
    } catch (e) {
      failed++;
      var msg = '  FAIL: ' + name + ' — ' + e.message;
      Logger.log(msg);
      errors.push(msg);
    }
  }

  function assertEqual(name, actual, expected) {
    _assert(name, () => {
      var a = JSON.stringify(actual);
      var e = JSON.stringify(expected);
      if (a !== e) {
        throw new Error('expected ' + e + ' but got ' + a);
      }
    });
  }

  function assertTrue(name, value) {
    _assert(name, () => {
      if (!value) {
        throw new Error('expected truthy but got ' + JSON.stringify(value));
      }
    });
  }

  function assertFalse(name, value) {
    _assert(name, () => {
      if (value) {
        throw new Error('expected falsy but got ' + JSON.stringify(value));
      }
    });
  }

  function assertTypeof(name, value, expectedType) {
    _assert(name, () => {
      if (typeof value !== expectedType) {
        throw new Error('expected typeof ' + expectedType + ' but got ' + typeof value);
      }
    });
  }

  function assertThrows(name, fn) {
    _assert(name, () => {
      var threw = false;
      try {
        fn();
      } catch (_) {
        threw = true;
      }
      if (!threw) {
        throw new Error('expected function to throw');
      }
    });
  }

  function assertAtLeast(name, actual, minimum) {
    _assert(name, () => {
      if (actual < minimum) {
        throw new Error('expected at least ' + minimum + ' but got ' + actual);
      }
    });
  }

  function summary() {
    var line = suiteName + ': ' + passed + ' passed, ' + failed + ' failed';
    Logger.log(line);
    return { suite: suiteName, passed: passed, failed: failed, errors: errors };
  }

  return {
    assertEqual: assertEqual,
    assertTrue: assertTrue,
    assertFalse: assertFalse,
    assertTypeof: assertTypeof,
    assertThrows: assertThrows,
    assertAtLeast: assertAtLeast,
    summary: summary,
  };
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

/**
 * Test all polyfills defined in Polyfill.js.
 * @returns {Object} Suite results.
 */
function testPolyfills() {
  Logger.log('--- Polyfill Tests ---');
  var t = _createTestHarness('Polyfills');

  // Timer polyfills
  var timerRan = false;
  var id = setTimeout(() => {
    timerRan = true;
  }, 0);
  t.assertTrue('setTimeout executes handler', timerRan);
  t.assertTypeof('setTimeout returns a number', id, 'number');

  var intervalRan = false;
  var iid = setInterval(() => {
    intervalRan = true;
  }, 0);
  t.assertTrue('setInterval executes handler', intervalRan);
  t.assertTypeof('setInterval returns a number', iid, 'number');

  // clearTimeout prevents execution
  var cleared = false;
  var cid = ++_timerCounter;
  _activeTimers[cid] = true;
  clearTimeout(cid);
  t.assertFalse('clearTimeout removes timer', _activeTimers[cid]);

  // setTimeout passes extra args
  var receivedArgs = [];
  setTimeout(
    (a, b) => {
      receivedArgs = [a, b];
    },
    0,
    'hello',
    42,
  );
  t.assertEqual('setTimeout passes extra arguments', receivedArgs, ['hello', 42]);

  // setTimeout actually sleeps for the specified duration
  var t0 = Date.now();
  setTimeout(() => {}, 1000);
  var elapsed = Date.now() - t0;
  t.assertAtLeast('setTimeout delays ~1s', elapsed, 900);

  // setInterval also sleeps
  var t1 = Date.now();
  setInterval(() => {}, 500);
  var elapsed2 = Date.now() - t1;
  t.assertAtLeast('setInterval delays ~500ms', elapsed2, 400);

  // setTimeout with 0ms does not add significant delay
  var t2 = Date.now();
  setTimeout(() => {}, 0);
  var elapsed3 = Date.now() - t2;
  t.assertTrue('setTimeout(0) completes quickly (<200ms)', elapsed3 < 200);

  // Console polyfill — verify methods actually log without throwing
  console.log('console.log test');
  console.warn('console.warn test');
  console.error('console.error test');
  console.info('console.info test');
  t.assertTrue('console.log runs without error', true);

  // Blob polyfill
  var blob = Blob(['hello'], { type: 'text/plain' });
  t.assertEqual('Blob content is correct', blob.getDataAsString(), 'hello');
  t.assertEqual('Blob content type is correct', blob.getContentType(), 'text/plain');

  // Blob concatenates multiple parts
  var multiBlob = Blob(['foo', 'bar', 'baz'], { type: 'text/plain' });
  t.assertEqual('Blob concatenates parts', multiBlob.getDataAsString(), 'foobarbaz');

  // Blob defaults to application/octet-stream
  var defaultBlob = Blob(['data']);
  t.assertEqual('Blob default content type', defaultBlob.getContentType(), 'application/octet-stream');

  // Base64 polyfills
  var encoded = btoa('Hello, World!');
  var decoded = atob(encoded);
  t.assertEqual('atob(btoa(x)) round-trips', decoded, 'Hello, World!');

  // btoa produces standard base64
  t.assertEqual('btoa("ABC") is correct', btoa('ABC'), 'QUJD');
  t.assertEqual('atob("QUJD") is correct', atob('QUJD'), 'ABC');

  // empty string round-trips
  t.assertEqual('btoa/atob empty string', atob(btoa('')), '');

  // TextEncoder / TextDecoder
  var encoder = new TextEncoder();
  var bytes = encoder.encode('ABC');
  t.assertEqual('TextEncoder.encode length', bytes.length, 3);

  var decoder = new TextDecoder();
  var str = decoder.decode(bytes);
  t.assertEqual('TextDecoder.decode round-trips', str, 'ABC');

  // TextEncoder/Decoder with longer string
  var longStr = 'The quick brown fox jumps over the lazy dog';
  var longBytes = encoder.encode(longStr);
  t.assertEqual('TextEncoder encodes correct length', longBytes.length, longStr.length);
  t.assertEqual('TextDecoder decodes long string', decoder.decode(longBytes), longStr);

  // URL polyfill — verify data URI is decodable
  var testBlob = Utilities.newBlob('test', 'text/plain');
  var dataUri = URL.createObjectURL(testBlob);
  t.assertTrue('URL.createObjectURL starts with data:', dataUri.indexOf('data:text/plain;base64,') === 0);

  // Extract base64 portion and verify it decodes back
  var b64Part = dataUri.split(',')[1];
  var decodedUri = atob(b64Part);
  t.assertEqual('URL.createObjectURL data URI decodes correctly', decodedUri, 'test');

  // revokeObjectURL doesn't throw
  URL.revokeObjectURL(dataUri);
  t.assertTrue('URL.revokeObjectURL runs without error', true);

  // Buffer polyfill
  var bufFromStr = Buffer.from('hello');
  t.assertTrue('Buffer.from(string) returns bytes', Array.isArray(bufFromStr) && bufFromStr.length === 5);

  // Verify Buffer.from(string) bytes match the actual content
  var bufDecoded = Utilities.newBlob(bufFromStr).getDataAsString();
  t.assertEqual('Buffer.from(string) decodes back to original', bufDecoded, 'hello');

  // Buffer.from with base64 encoding
  var bufFromB64 = Buffer.from(btoa('test'), 'base64');
  var b64Decoded = Utilities.newBlob(bufFromB64).getDataAsString();
  t.assertEqual('Buffer.from(base64) decodes correctly', b64Decoded, 'test');

  // Buffer.from(array) passes through unchanged
  var bufFromArr = Buffer.from([1, 2, 3]);
  t.assertEqual('Buffer.from(array) passes through', bufFromArr, [1, 2, 3]);

  // Buffer.isBuffer
  var bufInstance = new Buffer([10, 20]);
  t.assertTrue('Buffer.isBuffer returns true for Buffer', Buffer.isBuffer(bufInstance));
  t.assertFalse('Buffer.isBuffer returns false for array', Buffer.isBuffer([1, 2]));
  t.assertFalse('Buffer.isBuffer returns false for string', Buffer.isBuffer('hello'));

  // navigator polyfill
  t.assertEqual('navigator.userAgent is GoogleAppsScript', navigator.userAgent, 'GoogleAppsScript');
  t.assertTypeof('navigator is an object', navigator, 'object');

  // process polyfill — verify missing env vars return undefined (not throw)
  t.assertEqual('process.env.NONEXISTENT is undefined', process.env.NONEXISTENT, undefined);
  t.assertEqual('process.env.AWS_PROFILE is undefined', process.env.AWS_PROFILE, undefined);
  t.assertTypeof('process.version is a string', process.version, 'string');

  return t.summary();
}

/**
 * Test the crypto / getRandomValues polyfill.
 * @returns {Object} Suite results.
 */
function testCrypto() {
  Logger.log('--- Crypto Tests ---');
  var t = _createTestHarness('Crypto');

  // getRandomValues — fills array with random data
  var arr = new Uint8Array(16);
  var result = crypto.getRandomValues(arr);
  t.assertTrue('getRandomValues returns the same array reference', result === arr);
  t.assertEqual('getRandomValues fills correct length', result.length, 16);

  // Verify at least some bytes are non-zero (statistically near certain for 16 bytes)
  var hasNonZero = false;
  for (var i = 0; i < result.length; i++) {
    if (result[i] !== 0) {
      hasNonZero = true;
      break;
    }
  }
  t.assertTrue('getRandomValues produces non-zero bytes', hasNonZero);

  // Two calls should produce different output (statistically near certain)
  var arr2 = new Uint8Array(16);
  crypto.getRandomValues(arr2);
  var same = true;
  for (var j = 0; j < 16; j++) {
    if (arr[j] !== arr2[j]) {
      same = false;
      break;
    }
  }
  t.assertFalse('getRandomValues produces unique output across calls', same);

  // Uint32Array — verify values are actual 32-bit integers
  var u32 = new Uint32Array(4);
  crypto.getRandomValues(u32);
  t.assertEqual('getRandomValues Uint32Array length', u32.length, 4);
  var hasLargeValue = false;
  for (var k = 0; k < u32.length; k++) {
    if (u32[k] > 255) {
      hasLargeValue = true;
      break;
    }
  }
  t.assertTrue('Uint32Array has values > 255 (multi-byte)', hasLargeValue);

  // Int8Array — verify values can be negative
  var i8 = new Int8Array(32);
  crypto.getRandomValues(i8);
  var hasNeg = false;
  for (var m = 0; m < i8.length; m++) {
    if (i8[m] < 0) {
      hasNeg = true;
      break;
    }
  }
  t.assertTrue('Int8Array produces negative values', hasNeg);

  // Uint8ClampedArray
  var clamped = new Uint8ClampedArray(8);
  crypto.getRandomValues(clamped);
  var allInRange = true;
  for (var n = 0; n < clamped.length; n++) {
    if (clamped[n] < 0 || clamped[n] > 255) {
      allInRange = false;
      break;
    }
  }
  t.assertTrue('Uint8ClampedArray values in 0-255 range', allInRange);

  // Type mismatch — rejects non-integer typed arrays
  t.assertThrows('getRandomValues rejects Float64Array', () => {
    crypto.getRandomValues(new Float64Array(4));
  });
  t.assertThrows('getRandomValues rejects Float32Array', () => {
    crypto.getRandomValues(new Float32Array(4));
  });

  // Quota exceeded — rejects arrays > 65536 bytes
  t.assertThrows('getRandomValues rejects > 65536 bytes', () => {
    crypto.getRandomValues(new Uint8Array(65537));
  });

  // Exactly 65536 bytes should succeed
  var maxArr = new Uint8Array(65536);
  crypto.getRandomValues(maxArr);
  t.assertEqual('getRandomValues accepts exactly 65536 bytes', maxArr.length, 65536);

  // uuidToBytes — verify known UUID parsing
  var bytes = uuidToBytes('550e8400-e29b-41d4-a716-446655440000');
  t.assertEqual('uuidToBytes returns 16 bytes', bytes.length, 16);
  t.assertEqual('uuidToBytes byte 0', bytes[0], 0x55);
  t.assertEqual('uuidToBytes byte 1', bytes[1], 0x0e);
  t.assertEqual('uuidToBytes byte 2', bytes[2], 0x84);
  t.assertEqual('uuidToBytes last byte', bytes[15], 0x00);

  return t.summary();
}

/**
 * Test XML utility functions (Xml.js).
 * @returns {Object} Suite results.
 */
function testXml() {
  Logger.log('--- XML Tests ---');
  var t = _createTestHarness('XML');

  // xmlElementToJson - simple object
  var doc1 = XmlService.parse('<root><name>Alice</name><age>30</age></root>');
  var json1 = xmlElementToJson(doc1.getRootElement());
  t.assertEqual('xmlElementToJson simple object', json1, { name: 'Alice', age: '30' });

  // xmlElementToJson - item array
  var doc2 = XmlService.parse('<root><item>a</item><item>b</item><item>c</item></root>');
  var json2 = xmlElementToJson(doc2.getRootElement());
  t.assertEqual('xmlElementToJson item array', json2, ['a', 'b', 'c']);

  // xmlElementToJson - member array
  var doc3 = XmlService.parse('<root><member>x</member><member>y</member></root>');
  var json3 = xmlElementToJson(doc3.getRootElement());
  t.assertEqual('xmlElementToJson member array', json3, ['x', 'y']);

  // xmlElementToJson - nested structure
  var doc4 = XmlService.parse('<root><user><name>Bob</name></user></root>');
  var json4 = xmlElementToJson(doc4.getRootElement());
  t.assertEqual('xmlElementToJson nested', json4, { user: { name: 'Bob' } });

  // xmlElementToJson - duplicate keys become arrays
  var doc5 = XmlService.parse('<root><tag>1</tag><tag>2</tag></root>');
  var json5 = xmlElementToJson(doc5.getRootElement());
  t.assertEqual('xmlElementToJson duplicate keys', json5, { tag: ['1', '2'] });

  // getElementsByTagName
  var doc6 = XmlService.parse('<root><a><b>1</b></a><b>2</b></root>');
  var tags = getElementsByTagName(doc6.getRootElement(), 'b');
  t.assertEqual('getElementsByTagName finds nested', tags, ['1', '2']);

  return t.summary();
}

/**
 * Test initConfig (Config.js) by verifying AWS.config is set correctly.
 * @returns {Object} Suite results.
 */
function testConfig() {
  Logger.log('--- Config Tests ---');
  var t = _createTestHarness('Config');

  if (typeof AWS === 'undefined') {
    Logger.log('  SKIP: AWS global not available (AwsSdk.js not loaded)');
    return t.summary();
  }

  // Save and restore original config
  var originalConfig = AWS.config;

  // Standard keys
  initConfig({
    region: 'us-west-2',
    accessKeyId: 'AKIATEST',
    secretAccessKey: 'secretTest',
  });
  t.assertEqual('initConfig sets region', AWS.config.region, 'us-west-2');
  t.assertEqual('initConfig sets accessKeyId', AWS.config.credentials.accessKeyId, 'AKIATEST');
  t.assertEqual('initConfig sets secretAccessKey', AWS.config.credentials.secretAccessKey, 'secretTest');

  // Legacy keys
  initConfig({
    region: 'eu-west-1',
    accessKey: 'AKIALEGACY',
    secretKey: 'secretLegacy',
  });
  t.assertEqual('initConfig legacy accessKey', AWS.config.credentials.accessKeyId, 'AKIALEGACY');
  t.assertEqual('initConfig legacy secretKey', AWS.config.credentials.secretAccessKey, 'secretLegacy');

  // Session token
  initConfig({
    region: 'us-east-1',
    accessKeyId: 'AKIATEMP',
    secretAccessKey: 'secretTemp',
    sessionToken: 'tokenValue',
  });
  t.assertEqual('initConfig sets sessionToken', AWS.config.credentials.sessionToken, 'tokenValue');

  // Restore
  AWS.config = originalConfig;

  return t.summary();
}

/**
 * Test GAS environment basics — validates that expected GAS globals are present
 * and behave correctly. Useful for catching runtime regressions.
 * @returns {Object} Suite results.
 */
function testGasEnvironment() {
  Logger.log('--- GAS Environment Tests ---');
  var t = _createTestHarness('GAS Environment');

  // Utilities.sleep — verify it actually pauses
  var sleepStart = Date.now();
  Utilities.sleep(500);
  var sleepElapsed = Date.now() - sleepStart;
  t.assertAtLeast('Utilities.sleep(500) pauses ~500ms', sleepElapsed, 400);

  // Utilities.base64Encode/Decode round-trip
  var original = 'GAS test data: 123 !@#';
  var b64 = Utilities.base64Encode(original);
  var roundTrip = Utilities.newBlob(Utilities.base64Decode(b64)).getDataAsString();
  t.assertEqual('Utilities base64 round-trip', roundTrip, original);

  // Utilities.base64Encode produces correct output for known input
  t.assertEqual('Utilities.base64Encode("ABC")', Utilities.base64Encode('ABC'), 'QUJD');

  // Utilities.base64Decode returns byte array
  var decodedBytes = Utilities.base64Decode('QUJD');
  t.assertEqual('Utilities.base64Decode length', decodedBytes.length, 3);

  // Utilities.getUuid — format and uniqueness
  var uuid1 = Utilities.getUuid();
  var uuid2 = Utilities.getUuid();
  t.assertTrue('Utilities.getUuid matches UUID format', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuid1));
  t.assertTrue('Utilities.getUuid produces unique values', uuid1 !== uuid2);

  // Utilities.newBlob — full behavior
  var blob = Utilities.newBlob('test content', 'text/plain', 'test.txt');
  t.assertEqual('Blob getDataAsString', blob.getDataAsString(), 'test content');
  t.assertEqual('Blob getContentType', blob.getContentType(), 'text/plain');
  t.assertEqual('Blob getName', blob.getName(), 'test.txt');

  // Blob getBytes and back
  var blobBytes = blob.getBytes();
  t.assertTrue('Blob getBytes returns array', Array.isArray(blobBytes) || blobBytes.length > 0);
  var blobFromBytes = Utilities.newBlob(blobBytes).getDataAsString();
  t.assertEqual('Blob bytes round-trip to string', blobFromBytes, 'test content');

  // XmlService — parse and extract
  var doc = XmlService.parse('<root><child attr="val">text</child></root>');
  var root = doc.getRootElement();
  t.assertEqual('XmlService root element name', root.getName(), 'root');
  var child = root.getChild('child');
  t.assertEqual('XmlService child text', child.getText(), 'text');
  t.assertEqual('XmlService child attribute', child.getAttribute('attr').getValue(), 'val');

  // XmlService — create and output
  var newRoot = XmlService.createElement('test');
  newRoot.setText('value');
  var output = XmlService.getRawFormat().format(newRoot);
  t.assertTrue('XmlService output contains element', output.indexOf('<test>value</test>') !== -1);

  // Logger — verify log works and returns content
  Logger.clear();
  Logger.log('test log message');
  var logOutput = Logger.getLog();
  t.assertTrue('Logger.log captures output', logOutput.indexOf('test log message') !== -1);

  // AWS global — verify service constructors exist (only if AwsSdk.js is loaded)
  if (typeof AWS !== 'undefined') {
    t.assertTypeof('AWS.S3 is a constructor', AWS.S3, 'function');
    t.assertTypeof('AWS.SES is a constructor', AWS.SES, 'function');
    t.assertTypeof('AWS.DynamoDB is a constructor', AWS.DynamoDB, 'function');
    t.assertTypeof('AWS.Lambda is a constructor', AWS.Lambda, 'function');
    t.assertTypeof('AWS.Config is a constructor', AWS.Config, 'function');
  } else {
    Logger.log('  SKIP: AWS constructor checks (AwsSdk.js not loaded)');
  }

  return t.summary();
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Run all test suites. Execute this function from the Apps Script editor
 * (Run > runAllTests) or from the custom menu.
 *
 * @returns {Object} Combined results with totals and per-suite breakdowns.
 */
function runAllTests() {
  Logger.log('========================================');
  Logger.log('  AWS SDK GAS — Internal Test Runner');
  Logger.log('========================================\n');

  var suites = [testPolyfills, testCrypto, testXml, testConfig, testGasEnvironment];

  var results = [];
  var totalPassed = 0;
  var totalFailed = 0;

  for (var i = 0; i < suites.length; i++) {
    Logger.log('');
    try {
      var result = suites[i]();
      results.push(result);
      totalPassed += result.passed;
      totalFailed += result.failed;
    } catch (e) {
      var errorResult = { suite: suites[i].name, passed: 0, failed: 1, errors: [e.message] };
      results.push(errorResult);
      totalFailed++;
      Logger.log('SUITE ERROR: ' + suites[i].name + ' — ' + e.message);
    }
  }

  Logger.log('\n========================================');
  Logger.log('  TOTAL: ' + totalPassed + ' passed, ' + totalFailed + ' failed');
  Logger.log('========================================');

  return { passed: totalPassed, failed: totalFailed, suites: results };
}

/**
 * Add a custom menu to the spreadsheet/document to run tests from the UI.
 * Attach this to an onOpen trigger or run it manually once.
 */
function onOpenTestMenu() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('AWS SDK Tests')
      .addItem('Run All Tests', 'runAllTests')
      .addItem('Test Polyfills', 'testPolyfills')
      .addItem('Test Crypto', 'testCrypto')
      .addItem('Test XML', 'testXml')
      .addItem('Test Config', 'testConfig')
      .addItem('Test GAS Environment', 'testGasEnvironment')
      .addToUi();
  } catch (_) {
    // Not in a UI context (standalone script, etc.) — skip menu creation
  }
}
