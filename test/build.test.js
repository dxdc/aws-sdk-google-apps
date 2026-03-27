const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');

describe('Build', () => {
  beforeAll(() => {
    execSync('npm run build', { cwd: path.join(__dirname, '..'), timeout: 60000 });
  });

  test('dist directory exists', () => {
    expect(fs.existsSync(DIST_DIR)).toBe(true);
  });

  test('AwsSdk.js is generated', () => {
    const sdkPath = path.join(DIST_DIR, 'AwsSdk.js');
    expect(fs.existsSync(sdkPath)).toBe(true);
    const stat = fs.statSync(sdkPath);
    // SDK should be at least 500KB after minification
    expect(stat.size).toBeGreaterThan(500 * 1024);
  });

  test('all source files are copied to dist', () => {
    const expectedFiles = [
      'Config.js',
      'Crypto.js',
      'EC2.js',
      'Lambda.js',
      'Polyfill.js',
      'S3.js',
      'Ses.js',
      'Xml.js',
      'DynamoDB.js',
      'SNS.js',
      'SQS.js',
      'Examples.js',
    ];
    for (const file of expectedFiles) {
      expect(fs.existsSync(path.join(DIST_DIR, file))).toBe(true);
    }
  });

  test('AwsSdk.js contains copyright header', () => {
    const content = fs.readFileSync(path.join(DIST_DIR, 'AwsSdk.js'), 'utf8');
    expect(content.startsWith('//')).toBe(true);
  });

  test('AwsSdk.js contains the XHRGoogleClient patch', () => {
    const content = fs.readFileSync(path.join(DIST_DIR, 'AwsSdk.js'), 'utf8');
    expect(content).toContain('XHRGoogleClient');
  });

  test('AwsSdk.js contains the httpClient patch', () => {
    const content = fs.readFileSync(path.join(DIST_DIR, 'AwsSdk.js'), 'utf8');
    expect(content).toContain('UrlFetchApp');
  });

  test('AwsSdk.js contains the xmlParser patch', () => {
    const content = fs.readFileSync(path.join(DIST_DIR, 'AwsSdk.js'), 'utf8');
    expect(content).toContain('XmlService');
  });

  test('appsscript.json is copied', () => {
    expect(fs.existsSync(path.join(DIST_DIR, 'appsscript.json'))).toBe(true);
  });
});
