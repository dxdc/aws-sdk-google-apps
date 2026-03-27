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

  // Console polyfill
  t.assertTypeof('console.log is a function', console.log, 'function');
  t.assertTypeof('console.warn is a function', console.warn, 'function');
  t.assertTypeof('console.error is a function', console.error, 'function');
  t.assertTypeof('console.info is a function', console.info, 'function');

  // Blob polyfill
  var blob = Blob(['hello'], { type: 'text/plain' });
  t.assertTrue('Blob returns a GAS blob', typeof blob.getDataAsString === 'function');
  t.assertEqual('Blob content is correct', blob.getDataAsString(), 'hello');
  t.assertEqual('Blob content type is correct', blob.getContentType(), 'text/plain');

  // Base64 polyfills
  var encoded = btoa('Hello, World!');
  t.assertTypeof('btoa returns a string', encoded, 'string');
  var decoded = atob(encoded);
  t.assertEqual('atob(btoa(x)) round-trips', decoded, 'Hello, World!');

  // TextEncoder / TextDecoder
  var encoder = new TextEncoder();
  var bytes = encoder.encode('ABC');
  t.assertTrue('TextEncoder.encode returns array-like', bytes.length === 3);

  var decoder = new TextDecoder();
  var str = decoder.decode(bytes);
  t.assertEqual('TextDecoder.decode round-trips', str, 'ABC');

  // URL polyfill
  t.assertTypeof('URL.createObjectURL is a function', URL.createObjectURL, 'function');
  t.assertTypeof('URL.revokeObjectURL is a function', URL.revokeObjectURL, 'function');

  var testBlob = Utilities.newBlob('test', 'text/plain');
  var dataUri = URL.createObjectURL(testBlob);
  t.assertTrue('URL.createObjectURL returns data URI', dataUri.indexOf('data:text/plain;base64,') === 0);

  // Buffer polyfill
  t.assertTypeof('Buffer.from is a function', Buffer.from, 'function');
  t.assertTypeof('Buffer.isBuffer is a function', Buffer.isBuffer, 'function');

  var bufFromStr = Buffer.from('hello');
  t.assertTrue('Buffer.from(string) returns bytes', Array.isArray(bufFromStr) && bufFromStr.length > 0);

  var bufFromB64 = Buffer.from(Utilities.base64Encode('test'), 'base64');
  t.assertTrue('Buffer.from(base64) decodes', Array.isArray(bufFromB64));

  var bufFromArr = Buffer.from([1, 2, 3]);
  t.assertEqual('Buffer.from(array) passes through', bufFromArr, [1, 2, 3]);

  // navigator polyfill
  t.assertEqual('navigator.userAgent is GoogleAppsScript', navigator.userAgent, 'GoogleAppsScript');

  // process polyfill
  t.assertTypeof('process.env is an object', process.env, 'object');
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

  // getRandomValues
  t.assertTypeof('crypto.getRandomValues is a function', crypto.getRandomValues, 'function');

  var arr = new Uint8Array(16);
  var result = crypto.getRandomValues(arr);
  t.assertTrue('getRandomValues returns the same array', result === arr);
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

  // Different typed arrays
  var u32 = new Uint32Array(4);
  crypto.getRandomValues(u32);
  t.assertEqual('getRandomValues works with Uint32Array', u32.length, 4);

  var i8 = new Int8Array(8);
  crypto.getRandomValues(i8);
  t.assertEqual('getRandomValues works with Int8Array', i8.length, 8);

  // Type mismatch
  t.assertThrows('getRandomValues rejects Float64Array', () => {
    crypto.getRandomValues(new Float64Array(4));
  });

  // uuidToBytes
  var bytes = uuidToBytes('550e8400-e29b-41d4-a716-446655440000');
  t.assertEqual('uuidToBytes returns 16 bytes', bytes.length, 16);
  t.assertEqual('uuidToBytes first byte', bytes[0], 0x55);

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

  // Core services exist
  t.assertTypeof('Utilities is defined', Utilities, 'object');
  t.assertTypeof('Logger is defined', Logger, 'object');
  t.assertTypeof('UrlFetchApp is defined', UrlFetchApp, 'object');

  // Utilities methods
  t.assertTypeof('Utilities.sleep is a function', Utilities.sleep, 'function');
  t.assertTypeof('Utilities.base64Encode is a function', Utilities.base64Encode, 'function');
  t.assertTypeof('Utilities.base64Decode is a function', Utilities.base64Decode, 'function');
  t.assertTypeof('Utilities.newBlob is a function', Utilities.newBlob, 'function');
  t.assertTypeof('Utilities.getUuid is a function', Utilities.getUuid, 'function');

  // Utilities.base64Encode/Decode round-trip
  var original = 'GAS test data: 123 !@#';
  var b64 = Utilities.base64Encode(original);
  var roundTrip = Utilities.newBlob(Utilities.base64Decode(b64)).getDataAsString();
  t.assertEqual('Utilities base64 round-trip', roundTrip, original);

  // Utilities.getUuid format
  var uuid = Utilities.getUuid();
  t.assertTrue('Utilities.getUuid matches UUID format', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuid));

  // Utilities.newBlob
  var blob = Utilities.newBlob('test content', 'text/plain', 'test.txt');
  t.assertEqual('Blob getDataAsString', blob.getDataAsString(), 'test content');
  t.assertEqual('Blob getContentType', blob.getContentType(), 'text/plain');
  t.assertEqual('Blob getName', blob.getName(), 'test.txt');

  // XmlService
  t.assertTypeof('XmlService is defined', XmlService, 'object');
  var doc = XmlService.parse('<root><child>text</child></root>');
  t.assertTrue('XmlService.parse returns a document', doc !== null);
  var root = doc.getRootElement();
  t.assertEqual('XmlService root element name', root.getName(), 'root');

  // AWS global
  t.assertTypeof('AWS global is defined', AWS, 'object');
  t.assertTypeof('AWS.S3 constructor exists', AWS.S3, 'function');

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
