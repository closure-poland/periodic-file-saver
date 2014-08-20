var PeriodicFileSaver = require('./PeriodicFileSaver');

var saver = new PeriodicFileSaver('./save-test.dummy', 500);

saver.on('writeSuccess', function(operationData){
	console.info('* Saved content: %s', operationData.content);
});
saver.on('error', function(writeError){
	console.error('* ERROR: %s', writeError);
});

// Since the saver only saves at 500ms from the first write request, the first save() will be overridden by the second one.
saver.save('discarded value');
saver.save('eventual value');

// After the first write is complete, subsequent write requests will start a new 500ms timer.
setTimeout(function(){
	saver.save('another eventual value');
}, 1200);