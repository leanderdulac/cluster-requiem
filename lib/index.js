var cluster = require('cluster');
var Promise = require('bluebird');
var Requiem = require('./requiem');

var requiem = new Requiem();

var shutdownCluster = function() {
	if (cluster.isWorker) {
		return new Promise(function(resolve) {
			process.once('disconnect', resolve);
			cluster.worker.disconnect();
		});
	}
};

exports.initialize = function() {
	process.on('shutdown', function() {
		exports.begin();
	});
};

exports.track = function(fn) {
	return requiem.track(fn);
};

exports.createTracker = function(fn) {
	return requiem.track(fn);
};

exports.begin = function() {
	return Promise.bind(this)
	.then(function() {
		return shutdownCluster();
	})
	.then(function() {
		return requiem.shutdown();
	})
	.then(function() {
		process.exit(0);
	});
};

