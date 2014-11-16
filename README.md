cluster-requiem
===============
Enhacements for the `cluster` module in order to handle graceful shutdowns with jobs that aren't associated with a socket.

History
-------
Node `cluster` modules garantees that all server sockets will be closed before exiting the process, but this doesn't extends to all other jobs that can't be interrupted.
This makes the `cluster` module useless when combined with softwares like [PM2](https://github.com/Unitech/PM2) as long standing jobs that don't have a client requets associated with it will die when you reload the server.

This module solves this by adding `trackers` which holds the server up until all they finishes their jobs.

Usage
-----
Install it
```sh
npm install --save cluster-requiem
```

Initialize and prepare servers
```javascript
var http = require('http');
var cluster = require('cluster');
var requiem = require('./lib');

if (cluster.isMaster) {
	var worker = cluster.fork();
	
	setTimeout(function() {
		console.log('disconnecting', worker.id);
		worker.disconnect(function() {
			console.log('done');
		});
	}, 2000);
} else {
	var longJobThatCantBeInterrupted = function(callback) {
		setTimeout(function() {
			console.log('job done');
			callback();
		}, 10000);
	};

	requiem.initialize();

	requiem.on('begin', function() {
		console.log('grabs the violin')
	});

	var server = http.createServer(function(err, req) {
			req.writeHead(200);
			req.write('Hello world!');
	});

	requiem.track(function(callback) {
			longJobThatCantBeInterrupted(callback);
	});

	server.listen(8080);
	requiem.trackSocket(server);

	console.log('listening')
}
```

    Note: You need to track server sockets in case of a graceful shutdown(PM2 for instance, sends the 'shutdown' event before trying to kill the process). If you don't do this the server will stil receive connections while it waits for all trackers to finish.
    Under high load this will potentially lead the server to never close, making PM2 kill long standing jobs as it can't handle they.

