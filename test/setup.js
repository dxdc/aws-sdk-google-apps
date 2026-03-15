/**
 * Test setup: Mock Google Apps Script globals so source files can be loaded in Node.
 */

// Mock Google Apps Script Logger
global.Logger = {
  log: jest.fn(),
};

// Mock Google Apps Script Utilities
global.Utilities = {
  sleep: jest.fn(),
  newBlob: jest.fn((data, contentType) => ({
    getDataAsString: () => (typeof data === 'string' ? data : String(data)),
    getBytes: () => (typeof data === 'string' ? Array.from(Buffer.from(data)) : data),
    getContentType: () => contentType || 'application/octet-stream',
  })),
  base64Decode: jest.fn((str) => Array.from(Buffer.from(str, 'base64'))),
  base64Encode: jest.fn((str) => Buffer.from(str).toString('base64')),
};

// Mock Google Apps Script XmlService
global.XmlService = {
  parse: jest.fn(),
};

// Mock AWS global
global.AWS = {
  Config: jest.fn(),
  config: {},
  S3: jest.fn(),
  SES: jest.fn(),
  Lambda: jest.fn(),
  EC2: jest.fn(),
};
