/**
 * Created by Mat on 28/01/2016.
 */
var gulp = require('gulp'),
    wiredep = require('wiredep').stream,
    inject = require('gulp-inject'),
    gulpif = require('gulp-if'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    clean = require('gulp-clean'),
    cleanCSS = require('gulp-clean-css'),
    useref = require('gulp-useref'),
    closure = require('gulp-closure-compiler-service'),
    debug = require('gulp-debug'),
    zip = require('gulp-zip');
var closureCompiler = require('google-closure-compiler').gulp();

gulp.task('wavesurfer', function () {
    // We need to build wavesurfer since the package only deploys minified files
    // and has no unminified file anywhere
    var ws_src = ['src/wavesurfer.js',
            'src/util.js',
            'src/webaudio.js',
            'src/mediaelement.js',
            'src/drawer.js',
            'src/drawer.*.js',
            'src/html-init.js'
        ],
        fileNames = [];
    ws_src.forEach(function (n) {
        fileNames.push('bower_components/wavesurfer.js/' + n);
    });
    return gulp.src(fileNames)
        .pipe(concat('wavesurfer.js'))
        .pipe(gulp.dest('./build'));
});

gulp.task('buildtest', ['wavesurfer'], function(done) {
    return gulp.src('./test/karma.conf.js', {cwd: './'})
        .pipe(wiredep({ignorePath: '../'}))
        .pipe(gulp.dest('./'));
});

gulp.task('build', ['wavesurfer'], function () {
    // inject all of the js dependencies into the html
    var sources = gulp.src(['./extdata/*.js', '!./src/**/*.conf.js', './src/**/*.js', './src/**/*.css'], {read: false, cwd: './'});
    return gulp.src('./src/window.html', {cwd: './'})
        .pipe(inject(sources, {relative: false, addRootSlash: false}))
        .pipe(wiredep({ignorePath: '../'}))
        .pipe(gulp.dest('./'));
});

gulp.task('cleandist', function () {
    // clean dist folder
    return gulp.src('./dist', {read: false})
        .pipe(clean());
});

gulp.task('copyfiles', ['cleandist'], function () {
    // copy view templates
    gulp.src('./views/**/*', {base: './'})
        .pipe(gulp.dest('dist'));
    // copy external data
    gulp.src('./extdata/**/*', {base: './'})
        .pipe(gulp.dest('dist'));
    // copy images
    gulp.src('./img/**/*', {base: './'})
        .pipe(gulp.dest('dist'));
    // copy testing media folder
    gulp.src('./media/**/*', {base: './'})
        .pipe(gulp.dest('dist'));
    gulp.src('./fonts/**/*', {base: './'})
        .pipe(gulp.dest('dist'));
    gulp.src('./languages/**/*', {base: './'})
        .pipe(gulp.dest('dist'));
    gulp.src('./_locales/**/*', {base: './'})
        .pipe(gulp.dest('dist'));
    gulp.src('./icons/**/*', {base: './'})
        .pipe(gulp.dest('dist'));
    gulp.src(['background.js', 'manifest.json'])
        .pipe(gulp.dest('dist'));
    // build the final root html with a single minified js
});

gulp.task('deploy', ['copyfiles', 'cleandist'], function () {
    return gulp.src('./window.html')
        .pipe(useref({'noconcat':false}))
        .pipe(gulpif('*.js', closureCompiler({
            //compilation_level: 'WHITESPACE_ONLY',
            compilation_level: 'SIMPLE_OPTIMIZATIONS',
            language_in: 'ECMASCRIPT6',
            language_out: 'ECMASCRIPT5',
            js_output_file: 'scripts/combined.js'
            })))
        .pipe(gulpif('*.css', cleanCSS({debug: true})))
        .pipe(debug({title: 'x:'}))
        .pipe(gulp.dest('dist'));
});


gulp.task('zip', ['deploy'], function () {
    return gulp.src('./dist/**/*', {base: './dist'})
        .pipe(zip('aikuma-ng-chrome.zip'))
        .pipe(gulp.dest('dist'));
});


