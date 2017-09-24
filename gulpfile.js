var gulp = require('gulp');
var autoprefixer = require('gulp-autoprefixer');
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');
var path = require('path');
var del = require('del');
var gutil = require('gulp-util');
var gulpif = require('gulp-if');
var minifyCss = require('gulp-minify-css');
var uglifyjs = require('gulp-uglify');
var imagemin = require('gulp-imagemin');
var imageminJpegRecompress = require('imagemin-jpeg-recompress');

var paths = {
    styles: 'static/css/**/*.{scss,css}',
    scripts: 'static/js/**/*.js',
    images: 'static/images/**/*.{jpg,jpeg,png,svg,gif}',
};

var destination = 'build/';

var reportError = function(error) {
/*    if ('CI' in process.env && process.env.CI === 'true') {
        process.exit(1);
    }*/
    notify({
        title: error.plugin + ' failed!',
        message: error.message
    }).write(error);

    // Prevent the 'watch' task from stopping
    this.emit('end');
};

gulp.task('clean', function() {
    // Must be synchronous if we're going to use this task as a dependency
    del.sync(destination + '/');
});

gulp.task('styles', function() {
    return gulp.src(paths.styles)
        .pipe(plumber({
            errorHandler: reportError
        }))
        .pipe(sass())
        .on('error', reportError)
        .pipe(autoprefixer())
        .pipe(minifyCss())
        .pipe(gulp.dest(destination + '/styles'));
});

gulp.task('scripts', function() {
    return gulp.src(paths.scripts)
        .pipe(uglifyjs())
        .pipe(gulp.dest(destination + '/scripts'));
});

gulp.task('images', function() {
    return gulp.src(paths.images)
        .pipe(imagemin([
            imagemin.gifsicle(),
            imageminJpegRecompress(),   
            imagemin.optipng(),
            imagemin.svgo()
        ]))
        .pipe(gulp.dest(destination + '/images'));
});


gulp.task('watch', ['default'], function() {
    function deleter() {
        var replaceFunc = null;
        if (typeof arguments[0] === 'string') {
            var before = arguments[0];
            var after = arguments[1];
            replaceFunc = function(file) {
                return file.replace(before, after);
            };
        }
        else if (typeof arguments[0] === 'function') {
            replaceFunc = arguments[0];
        }
        return function(event) {
            if (event.type == 'deleted') {
                var file = path.relative('./', event.path);
                if (typeof replaceFunc === 'function') {
                    file = replaceFunc(file);
                }
                del(file);
                gutil.log('Deleted file', '\'' + file + '\'');
            }
        };
    }

    var srcToBuildDeleter = deleter('static/', destination + '/');

    gulp.watch(paths.styles, ['styles'])
        .on('change', deleter(function(file) {
            return file.replace('static/', destination + '/')
                .replace(/\.scss$/, '.css');
        }));
    gulp.watch(paths.scripts, ['scripts'])
        .on('change', srcToBuildDeleter);
    gulp.watch(paths.images, ['images'])
        .on('change', srcToBuildDeleter);
});

gulp.task('build', ['styles', 'scripts', 'images',]);

gulp.task('default', ['clean'], function() {
    gulp.run('build');
});
