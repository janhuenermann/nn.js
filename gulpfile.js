var gulp = require('gulp');
var watch = require('gulp-watch');
var srcmap = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

var paths = {
	js: [ 'lib/nn.init.js', 'lib/nn.math.js', 'lib/**/*.nn.js', 'lib/nn.export.js' ]
};

gulp.task('make', function() {
    return  gulp.src(paths.js)
    			.pipe(srcmap.init())
    			.pipe(concat('nn.js'))
    			.pipe(srcmap.write())
    			.pipe(gulp.dest('build'));
});

gulp.task('watch', function () {
	gulp.watch(paths.js, [ 'make' ]);
});