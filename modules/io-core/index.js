var _instance = null;

function IO(config) {
	if (_instance)
		return _instance.plugins;
	this.config = config || {};
	this.info('Initializing IO ...');
	this.plugins = {};
	this.pub = {};

	this.info('Initializing Plugins ...');
	for (var i in this.config.plugins) {
		if (!this.loadPlugin(this.config.plugins[i]))
			throw "Unable to initalize IO";
	}
	this.info('IO successfully initialized');
	_instance = this;
	return this.pub;
}

/*
	@desc: Register plugin 
*/
IO.prototype.register = function(name, fnName, fn) {
	if (!this.plugins.hasOwnProperty(name)) {
		this.plugins[name] = {};
		this.pub[name] = {};
		this.config[name] = this.config[name] || {};
	}
	if (fnName || fn) {
		if (this.plugins[name][fnName])
			console.log('Warning -> [' + fnName + '] already declared for plugin [' + name + ']');
		this.plugins[name][fnName] = fn;
		if (fnName.indexOf('_') !== 0)
			this.pub[name][fnName] = fn;
	}
	return this.register.bind(this, name);
};

/*
	@desc: Initialise plugin
*/
IO.prototype.loadPlugin = function(name) {
	var plugin = null;
	var fn = null;
	var _call = [this];

	if (this.plugins[name])
		return true;

	// Load plugin
	try { plugin = require(__dirname + '/../io-' + name); }
	catch (e) { this.debug('Unable to load plugin [' + name + '][' + e.message + ']'); return false; }

	// If no deps, instanciate directly
	if (typeof plugin === "function") {
		fn = plugin;
	} else if (Array.isArray(plugin) && (fn = plugin.splice(plugin.length - 1)[0]) && typeof fn === 'function') {
		for (var i in plugin) {
			if (!this.plugins[plugin[i]] && !this.loadPlugin(plugin[i]))
				return false;
			_call.push(this.plugins[plugin[i]]);
		}
	} else {
		this.debug('Unable to load plugin [' + name + '][No function found]');
		return false;
	}
	fn.apply(plugin, _call);
	return true;
};

/*
	@desc: Reset module
*/
IO.prototype.reset = function(options) {
	delete _instance;
	_instance = null;
	return new IO(options);
};

IO.prototype.info = function () {
	if (this.config.INFO !== false) {
		var now = new Date();
		process.stderr.write('\033[36;1m> Info - ' + now.getDate() + '-' + (now.getMonth() + 1) + '-' + now.getFullYear() + ' ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds());
		process.stderr.write(':\033[0m \033[36m');
		process.stderr.write('\033[0m');
		console.error.apply(null, Array.prototype.slice.call(arguments));
	}
};

IO.prototype.debug = function () {
	if (this.config.DEBUG !== false) {
		var now = new Date();
		process.stderr.write('\033[31;1m> Debug - ' + now.getDate() + '-' + (now.getMonth() + 1) + '-' + now.getFullYear() + ' ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds());
		process.stderr.write(':\033[0m \033[31m');
		console.error.apply(null, Array.prototype.slice.call(arguments));
		process.stderr.write('\033[0m');
	}
};

global._info = function () {
	var now = new Date();
	process.stderr.write('\033[36;1m> Info - ' + now.getDate() + '-' + (now.getMonth() + 1) + '-' + now.getFullYear() + ' ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds());
	process.stderr.write(':\033[0m \033[36m');
	process.stderr.write('\033[0m');
	console.error.apply(null, Array.prototype.slice.call(arguments));
}

module.exports = IO;