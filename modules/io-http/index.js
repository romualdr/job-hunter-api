var inspector = require('schema-inspector');
var async = require('async');

/*----------------

 Private methods

----------------*/

/*
	@desc: Merging check tool
	@return: 
	@params: Parameters
*/

function _arrangeParam(value) {
	if (value && value.indexOf && value.indexOf(',') !== -1) {
		return value.split(',');
	}
	return value;
}

/*
	@desc: Merge parameters for request
	@return: 
	@params: Parameters
*/
function _mergeParams(req, callback) {
	var hash = req.query || {};
	for (var key in hash) {
		hash[key] = _arrangeParam(hash[key]);
	}
	for (var key in req.body) {
		hash[key] = req.body[key];
	}
	for (var key in req.params) {
		if (parseInt(key, 10).toString() !== key) // is not a number
			hash[key] = _arrangeParam(req.params[key]);
	}
	// console.log(hash);
	return callback(null, hash);
};

/*
	@desc: Remove forbidden keys
	@return: Return clean hash
	@params: Object
*/
function _removeForbidden(forbiddens, hash) {
	for (var key in hash) {
		if (typeof key === 'string' && (forbiddens.indexOf(key) !== -1 || key.indexOf('_') === 0))
			delete hash[key];
		else if (typeof hash[key] === "object")
			_removeForbidden(forbiddens, hash[key]);
	}
	return hash;
}

/*
	@desc: Bind parameters to default process for routing
	@return: null
	@params: validation function or hash, function(params, callback)
*/
function _bind(io, validation, fn) {
	// If validation is not a function, make it one !
	if (validation && typeof validation !== "function") {
		validation = (function (schema) {
			schema = { type: 'object', 'properties': schema };
			return function (hash, callback) {
				inspector.validate(schema, hash, function (err, result) {
					if (err) return callback(err);
					if (result && !result.valid) return callback(result.error);
					return callback(null, hash);
				});
			}
		})(validation);
	}


	return function (req, res, next) {
		async.waterfall([
			function (next2) {
				return _mergeParams(req, next2);
			},
			function (hash, next2) {
				if (!validation) return next2(null, hash);
				return validation(hash, function (err, hash) {
					if (err && io.plugins.http._error) return next2(io.plugins.http._error(err));
					if (err) return next2(err);
					return next2(null, hash);
				});
			},
			function (hash, next2) {
				if (typeof fn !== 'function') return next2(null, fn);
				if (req.session) {
					if (req.user) { req.session.user = req.user };
					return fn(hash, next2, req.session, {req: req, res: res});
				}
				else if (req.user) {
					return fn(hash, next2, req.user, {req: req, res: res});
				}
				return fn(hash, next2, null, {req: req, res: res});
			}
		], function (err, result) {
			if (err) return res.status(err.status || 500).send((typeof err === 'string' ? { message: err } : err));
			return res.send(_removeForbidden(io.config.http.filter || ['password'], result));
		});
	};
}

/*----------------

 Public methods

----------------*/

module.exports = function (io) {
	var _express = require('express');
	var _bodyParser = require('body-parser');
	var _app = _express();
	var _server = require('http').Server(_app);
	var _plugin = io.register('http');
	var _launched = false;

	_app.use(_bodyParser.json());
	_app.use(_bodyParser.urlencoded());

	_plugin('_server', _server);
	_plugin('_app', _app);

	_plugin('launch', function (port) {
		if (!_launched) {
			_server.listen(io.config.http.port || 3000);
			_launched = true;
		}
	});

	/*
		@desc: Middleware handler
		@params: function(params, callback)
	*/

	_plugin('use', function (fn) {
		_app.use(function (req, res, next) {
			async.waterfall([
				function (next2) {
					return _mergeParams(req, next2);
				},
				function (hash, next2) {
					if (typeof fn !== 'function') return next2(null, fn);
					if (req.session) {
						return fn(hash, next2, req.session, {req: req, res: res});
					}
					return fn(hash, next2, null, {req: req, res: res});
				}
			], function (err, result) {
				if (err) return res.status(err.status || 500).send((typeof err === 'string' ? { message: err } : err));
				return next();
			});
		});
	});
	
	/*
		@desc: Bind to express
		@params: HTTP Method, path, function(params, callback)
	*/
	_plugin('on', function (method, path, validation, fn) {
		this.launch();

		if (validation && !fn) {
			fn = validation;
			validation = null;
		}
		var _apply = (Array.isArray(fn) ? fn : [fn]);


		if (!_app[method])
			throw "Method [" + method + "] unknown.";
		_apply.unshift(path);
		_apply.push(_bind(io, validation, _apply.pop()));
		_app[method].apply(_app, _apply);//(path, _bind(io, validation, fn));
	});

	_plugin('param', function () {

	});

	/*
		@desc: Pure middleware handler
		@params: function(params, callback)
	*/
	_plugin('attach', function (fn) {
		_app.use(fn);
	});

	/*
		@desc: Bind error handler
		@params: handler
	*/
	_plugin('error', function (fn) {
		_plugin('_error', fn);
	});
}