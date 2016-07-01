var gulp = require('gulp'),
    htmlReplace = require('gulp-html-replace'),
    htmlmin = require('gulp-htmlmin'),
    minifyInline = require('gulp-minify-inline'),
    gutil = require('gulp-util'),
    webpack = require('webpack'),
    webpackConfig = require('./webpack.config.js')

gulp.task('build', function() {
  gulp.src('src/index.html')
    .pipe(htmlReplace({'js': 'bundle.js'}))
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(minifyInline())
    .pipe(gulp.dest('dist/'));

  webpack(webpackConfig, function(err, stats) {
    if(err) throw new gutil.PluginError('webpack', err);
    gutil.log('[webpack]', stats.toString({
      //output options
    }));
  });
});

gulp.task('default', ['build']);
