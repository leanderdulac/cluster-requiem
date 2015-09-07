var Promise = require('bluebird');

var Requiem = function() {
	this.waitlist = [];
};

Requiem.prototype.track = function(fn) {
	var finishIt = null;

	var promise = new Promise(function(resolve) {
		var result = fn && fn(resolve);

		if (result && result.then) {
			resolve(result);
		}

		finishIt = resolve;
	})
	.bind(this)
	.finally(function() {
		this.waitlist.splice(this.waitlist.indexOf(promise), 1);
	});

	this.waitlist.push(promise);

	var tracker = function() {
		process.nextTick(finishIt);
	};
	
	tracker.done = tracker;

	return tracker;
};

Requiem.prototype.shutdown = function() {
	return Promise.all(this.waitlist);
};

module.exports = Requiem;


