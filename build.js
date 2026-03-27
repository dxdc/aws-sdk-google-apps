#!/usr/bin/env node

/**
 * Build script for aws-sdk-google-apps.
 *
 * Replaces the Gulp-based build pipeline with a lightweight Node.js script
 * that has zero runtime dependencies beyond what Node.js provides.
 *
 * Steps:
 *  1. Clean the dist/ directory
 *  2. Copy src/* files to dist/
 *  3. Build the patched AWS SDK:
 *     a. Read aws-sdk.template.js and inline the aws-sdk.js include
 *     b. Apply three regex patches (xhrClient, httpClient, xmlParser)
 *     c. Minify the result (optional, requires terser)
 *     d. Prepend the copyright header
 *     e. Write to dist/AwsSdk.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SRC_DIR = path.join(__dirname, 'src');
const SDK_DIR = path.join(__dirname, 'src-sdk');
const DIST_DIR = path.join(__dirname, 'dist');

// ---------- Helpers ----------

function log(msg) {
  console.log(`[build] ${msg}`);
}

function cleanDist() {
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });
  log('Cleaned dist/');
}

function copySrc() {
  const files = fs.readdirSync(SRC_DIR);
  let count = 0;
  for (const file of files) {
    const src = path.join(SRC_DIR, file);
    const dest = path.join(DIST_DIR, file);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dest);
      count++;
    }
  }
  log(`Copied ${count} files from src/ to dist/`);
}

// ---------- SDK Build ----------

function extractCopyright(sdkPath) {
  return new Promise((resolve, reject) => {
    const lines = [];
    const rl = readline.createInterface({
      input: fs.createReadStream(sdkPath),
    });
    rl.on('line', (line) => {
      if (/^\/\//.test(line)) {
        lines.push(line);
      } else {
        rl.close();
        rl.removeAllListeners();
        resolve(lines.join('\n') + '\n');
      }
    });
    rl.on('error', reject);
  });
}

function inlineInclude(templateContent) {
  // Replaces  //=include aws-sdk.js  with the actual file content (may be indented)
  return templateContent.replace(/^\s*\/\/=include (.+)$/m, (match, filename) => {
    const includePath = path.join(SDK_DIR, filename.trim());
    log(`Including ${filename} (${(fs.statSync(includePath).size / 1024 / 1024).toFixed(1)} MB)`);
    return fs.readFileSync(includePath, 'utf8');
  });
}

function applyPatch(content, pattern, patchFile, label) {
  const patchContent = fs.readFileSync(path.join(SDK_DIR, patchFile), 'utf8');
  const regex = new RegExp(escapeRegExp(pattern));

  if (!regex.test(content)) {
    throw new Error(`Patch target not found for ${label}: "${pattern.substring(0, 60)}..."`);
  }

  return content.replace(regex, (match, offset) => {
    log(`${label}: Inserted ${patchContent.length} bytes at offset ${offset}`);
    if (label === 'xhrClient') {
      return patchContent + match;
    } else if (label === 'httpClient') {
      return patchContent;
    } else if (label === 'xmlParser') {
      return patchContent + ' else ' + match;
    }
    return match;
  });
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function minifySdk(content) {
  try {
    const { minify } = require('terser');
    log('Minifying with terser...');
    const result = await minify(content, {
      mangle: false,
      compress: {},
      output: {},
      sourceMap: false,
    });
    if (result.error) {
      throw result.error;
    }
    log(`Minified: ${(content.length / 1024 / 1024).toFixed(1)} MB → ${(result.code.length / 1024 / 1024).toFixed(1)} MB`);
    return result.code;
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      log('terser not found, skipping minification (install with: npm i -D terser)');
      return content;
    }
    throw e;
  }
}

async function buildSdk() {
  const sdkPath = path.join(SDK_DIR, 'aws-sdk.js');
  const templatePath = path.join(SDK_DIR, 'aws-sdk.template.js');

  // Extract copyright header
  const copyright = await extractCopyright(sdkPath);

  // Read template and inline the SDK
  let content = fs.readFileSync(templatePath, 'utf8');
  content = inlineInclude(content);

  // Apply patches
  content = applyPatch(content, 'AWS.XHRClient = AWS.util.inherit', 'xhrClient.part.js', 'xhrClient');

  content = applyPatch(content, 'AWS.HttpClient.prototype = AWS.XHRClient.prototype;', 'httpClient.part.js', 'httpClient');

  content = applyPatch(content, 'if (window.ActiveXObject)', 'xmlParser.part.js', 'xmlParser');

  // Minify
  content = await minifySdk(content);

  // Prepend copyright
  content = copyright + content;

  // Write output
  const outputPath = path.join(DIST_DIR, 'AwsSdk.js');
  fs.writeFileSync(outputPath, content, 'utf8');
  log(`Wrote ${outputPath} (${(Buffer.byteLength(content) / 1024 / 1024).toFixed(1)} MB)`);
}

// ---------- Main ----------

async function main() {
  const start = Date.now();
  log('Starting build...');

  cleanDist();
  copySrc();
  await buildSdk();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  log(`Build complete in ${elapsed}s`);
}

main().catch((err) => {
  console.error('[build] ERROR:', err.message);
  process.exit(1);
});
