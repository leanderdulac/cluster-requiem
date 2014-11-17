var async = require('async');

var Item = function(data) {
	this.data = data;
	this.next = null;
	this.prev = null;
};

var LinkedList = function() {
	this.head = null;
	this.tail = null;
};

LinkedList.prototype.push = function(data) {
	var item = new Item(data);

	item.prev = this.tail;

	if (this.tail) {
		this.tail.next = item;
	} else {
		this.head = item;
	}

	this.tail = item;

	return item;
};

LinkedList.prototype.remove = function(node) {
	if (node.prev) {
		node.prev.next = node.next;
	} else {
		this.head = node.next;
	}

	if (node.next) {
		node.next.prev = node.prev;
	} else {
		this.tail = node.prev;
	}
};

LinkedList.prototype.iterateAsync = function(iter, callback) {
	var self = this;
	var node = this.head;

	async.whilst(function() {
		return !!node;
	}, function(cb) {
		iter(node, function(err) {
			if (err) {
				return cb(err);
			}

			node = node.next;
			cb();
		});
	}, function() {
		callback();
	});
};

LinkedList.prototype.toArray = function() {
	var result = [];
	var node = this.head;

	while(node) {
		result.push(node);
		node = node.next;
	}

	return result;
};

module.exports = LinkedList;

