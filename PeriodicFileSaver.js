var fs = require('fs');
var EventEmitter = require('events').EventEmitter;

/**
 * A periodic (delayed) file saver is a component used for caching file saves in memory and flushing them to disk when possible. When a need arises to gather some results incoming over a fast medium (such as numerous AJAX/socket messages per second), it is wasteful to write a single file as many times as there are updates.
 * A PeriodicFileSaver object will only perform saves after a certain delay from the first write request, giving subsequent requests a chance to change the value to be written in memory before the actual I/O work.
 * @constructor
 * @param {string} filePath The path to which the content will be saved. Any previous content is replaced on every actual write, as the file is opened with the 'w' mode.
 * @param {number} saveDelay The number of milliseconds to wait from the initial write request for a flush to occur. After each successful write, new write requests will start a new countdown of saveDelay ms.
 * @extends {external:EventEmitter}
 */
function PeriodicFileSaver(filePath, saveDelay){
	EventEmitter.call(this);
	this._filePath = String(filePath);
	this._saveTimer = null;
	this._contentToSave = null;
	this._delay = Number(saveDelay);
}
PeriodicFileSaver.prototype = new EventEmitter();

PeriodicFileSaver.prototype._doWrite = function _doWrite(){
	var self = this;
	this._saveTimer = null;
	var content = self._contentToSave;
	fs.writeFile(self._filePath, content, {
		// Set file mode to 0644...
		mode: 420,
		flag: 'w'
	}, function(error){
		if(error){
			self.emit('error', error);
			return;
		}
		self.emit('writeSuccess', { content: content });
	});
};

/**
 * Request that certain content be put in the file in the nearest future (within saveDelay ms).
 * If multiple requests come in before the flushing starts, the last request wins, i.e. only the latest data is written.
 * @param {string|external:Buffer} content The content to eventually write.
 */
PeriodicFileSaver.prototype.save = function save(content){
	// Always update the content to save to the destination file.
	this._contentToSave = content;
	// If a save is pending, we do not have to do anything else - since we have updated the content in a critical section, the timeout handler will simply pick up the new value and use it while saving.
	if(!this._saveTimer){
		// Otherwise, we have to set up a new timer.
		this._saveTimer = setTimeout(this._doWrite.bind(this), this._delay);
	}
};

module.exports = PeriodicFileSaver;