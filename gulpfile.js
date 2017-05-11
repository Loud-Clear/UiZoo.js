'use strict';

let gulp = require('gulp'),
	spawn = require('child_process').spawn,
	server = require('gulp-develop-server'),
	rollup = require('rollup'),
	rConfig = require('./rollup.config'),
	chalk = require('chalk'),
	nodemon = require("gulp-nodemon"),
	exec = require('child_process').exec,
	babel = require('gulp-babel');

let nodemonStream;

gulp.task("compile:client", bundleClient);
gulp.task('compile:server', compileServer);
gulp.task('compile:config', compileConfig);

gulp.task("server:start", startNodemonServer);
gulp.task("server:restart", restartNodemonServer);

gulp.task("compile:demo", moveDemo);

gulp.task("compile", ["compile:client", "compile:server", "compile:config"]);

// WATCH
// =====
gulp.task("default", ["compile", "server:start", "watch"]);

gulp.task("watch", () => {
	gulp.watch(["src/client/**/*"], ["compile:client"]);
	gulp.watch(["src/server/**/*"], ["compile:server", "server:restart"]);
	gulp.watch(["config/user.config.js"], ["compile:config"]);
});

function bundleClient() {
	return rollup.rollup(rConfig)
		.then(bundle => {
			bundle.write({
				format: 'iife',
				dest: 'build/client/index.js',
				globals: {
					react: 'React',
					'react-dom': 'ReactDOM',
				},
			});
		})
		.catch(err => {
			console.error(chalk.red(err.message));
			console.error(chalk.grey(err.formatted && err.formatted.replace('Error: ' + err.message + '\n', '')));
		});
}

function compileServer() {
	var result = gulp
		.src(['./src/server/**/*.js', '!./node_modules/**/*'])
		.pipe(babel({
			presets: ['es2015', "node6"],
		}))
		.on("error", handleError)
		.pipe(gulp.dest('./build/server'))

	return result && moveServer();
}

function moveServer() {
	return gulp.src(['./src/server/**/*', '!./src/server/**/*.js', '!./node_modules/**/*'])
		.pipe(gulp.dest("./build/server"));
}

function compileConfig() {
	return gulp
		.src(['./config/*'])
		.pipe(babel({
			presets: ['es2015', "node6"],
		}))
		.on("error", handleError)
		.pipe(gulp.dest('./build/config'));
}

function startNodemonServer() {
	nodemonStream = nodemon({
		script: './build/server/app.js',
		ext: 'js html',
		watch: false,
	})
}

function restartNodemonServer() {
	if (nodemonStream) {
		nodemonStream.emit('restart', 0);
	} else {
		startNodemonServer();
	}
}

function moveDemo() {
	return gulp
		.src(["./demo/**/*"])
		.pipe(gulp.dest("./build/data"));
}

function handleError(error) {
	console.error(chalk.red(error.message));
	console.error(chalk.grey(error.formatted && err.formatted.replace('Error: ' + error.message + '\n', '')));

	this.emit('end')
}