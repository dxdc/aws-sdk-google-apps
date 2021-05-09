/*eslint-env node*/

const fs = require('fs');
const readline = require('readline');

const gulp = require('gulp');
const del = require('del');
const include = require('gulp-include');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const minify = require('gulp-minify');

// Copy files of the project
gulp.task('copy', () => {
  return gulp.src('src/*').pipe(gulp.dest('dist'));
});

// Clear the dist folder
gulp.task('del', () => {
  return del('dist/*');
});

gulp.task('sdk', async () => {
  const copyright = await new Promise((resolve) => {
    let lines = [];
    let lineReader = readline.createInterface({
      input: require('fs').createReadStream(__dirname + '/src-sdk/aws-sdk.js'),
    });
    lineReader.on('line', (line) => {
      if (/^\/\//.test(line)) {
        lines.push(line);
      } else {
        lineReader.close();
        lineReader.removeAllListeners();
        resolve(lines);
      }
    });
  })
    .then((data) => data.join('\n') + '\n')
    .catch((err) => console.error(err));

  return gulp
    .src('./src-sdk/aws-sdk.template.js')
    .pipe(include())
    .on('error', console.log)
    .pipe(
      replace(/(AWS.XHRClient = AWS\.util\.inherit)/, (match, p1, offset) => {
        const data = fs.readFileSync('./src-sdk/xhrClient.part.js', { encoding: 'utf8', flag: 'r' });
        console.log('xhrClient: Inserted ' + data.length + ' bytes at offset ' + offset);
        return data + p1;
      }),
    )
    .pipe(
      replace(/(AWS.HttpClient.prototype = AWS\.XHRClient\.prototype;)/, (match, p1, offset) => {
        const data = fs.readFileSync('./src-sdk/httpClient.part.js', { encoding: 'utf8', flag: 'r' });
        console.log('httpClient: Inserted ' + data.length + ' bytes at offset ' + offset);
        return data;
      }),
    )
    .pipe(
      replace(/(if \(window.ActiveXObject\))/, (match, p1, offset) => {
        const data = fs.readFileSync('./src-sdk/xmlParser.part.js', { encoding: 'utf8', flag: 'r' });
        console.log('xmlParser: Inserted ' + data.length + ' bytes at offset ' + offset);
        return data + ' else ' + p1;
      }),
    )
    .pipe(
      minify({
        noSource: true,
        ext: {
          src: '.js',
          min: '.js',
        },
        mangle: false,
        compress: {
          // drop_console: true,
        },
        output: {
          // beautify: true,
          // indent_level: 2,
        },
      }),
    )
    .pipe(replace(/^/, copyright))
    .pipe(rename('AwsSdk.js'))
    .pipe(gulp.dest('dist'));
});

// The default task of gulp
gulp.task('default', gulp.series('del', 'copy', 'sdk'));
