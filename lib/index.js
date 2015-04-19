var util = require('util');
var async = require('async');
var events = require('events');
var cluster = require('cluster');
var LinkedList = require('./linkedlist');

var Tracker = function() {
	events.EventEmitter.call(this);
};

util.inherits(Tracker, events.EventEmitter);

Tracker.prototype.done = function() {
	this.emit('done');
};

var Requiem = function() {
	events.EventEmitter.call(this);

	this.state = 'ready';
	this.options = {};
	this.trackers = new LinkedList();
};

util.inherits(Requiem, events.EventEmitter);

Requiem.prototype.initialize = function(options) {
	if (!options) {
		options = {
			handleShutdown: true,
			patchCluster: true
		};
	}

	this.options = options;

	if (options.patchCluster && cluster.isWorker) {
		this._patchCluster();
	}

	if (options.handleShutdown) {
		this._handleShutdown();
	}
};

Requiem.prototype.createTracker = function() {
	var self = this;
	var tracker = new Tracker();
	
	var item = this.trackers.push(tracker);

	tracker.once('done', function() {
		self.trackers.remove(item);
	});

	return tracker;
};

Requiem.prototype.track = function(callback) {
	var tracker = this.createTracker();

	callback(function() {
		tracker.done();
	});

	return tracker;
};

Requiem.prototype.begin = function(cb) {
	var self = this;

	if (this.state == 'dead') {
		return cb();
	}

	if (cb) {
		this.on('dead', cb);
	}

	if (this.state != 'ready') {
		return;
	}

	this.state = 'preparing';

	self.emit('begin');

	// Grab the violin, the requiem is starting!
	this._waitAllTrackers(function() {
		self.state = 'dead';
		self.emit('dead');
	});
};

Requiem.prototype._patchCluster = function() {
	var self = this;
	var disconnect = cluster.worker.disconnect;

	cluster.worker.disconnect = function() {
		self.begin(function() {
			if (cluster.isWorker && cluster.worker.isConnected()) {
				// Try to do a clean exit
				disconnect.apply(cluster.worker);
			} else {
				process.exit(0);
			}
		});
	};
};

Requiem.prototype._handleShutdown = function() {
	var self = this;

	process.on('message', function(msg) {
		if (msg == 'shutdown') {
			self.begin(function() {
				if (cluster.isWorker && cluster.worker.isConnected()) {
					// Try to do a clean exit
					cluster.worker.destroy();
				} else {
					process.exit(0);
				}
			});
		}
	});
};

Requiem.prototype._waitAllTrackers = function(cb) {
	this.trackers.iterateAsync(function(tracker, cb) {
		tracker.data.once('done', function() {
			cb();
		});
	}, cb);
};

module.exports = new Requiem();

