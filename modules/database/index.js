var async = require('async');
var _ = require('underscore');
var elasticsearch = require('elasticsearch');

function Search(config, callback) {
	var that = this;
	this._ready = false;
	this.index = config.server.index;
	this.settings = config.settings || {};
	this.excluded = config.excluded || [];

	_info('Connecting to ElasticSearch ['  + config.server.host + ']');
	this.client = new elasticsearch.Client({ host: config.server.host });

	this.types = config.types;
	this.pub = {};

	this.ids = {
		current: (+(new Date())),
		count: 0
	};

	this.generateId = function () {
		var date = (+(new Date()));

		if (date !== this.ids.current)
			this.ids.count = 0;
		this.ids.current = date;
		this.ids.count++;
		return "" + (+this.ids.current) + this.ids.count;
	}

	this.init = function (callback) {
		if (this._ready) { return callback(null, true); }
		async.waterfall([
			function (next) {
				if (global._RESETDB_ === true)
					return that.dropIndex(function () { return next(null); });
				return next();
			},
			// Check if index exists
			function (next) {
				_info('Creating index ...');
				return that.createIndex(next);
			},
			// Put mapping for types
			function (res, next) {
				async.each(_.values(this.types), function (el, asynCb) {
					el._inited = false;
				}, next);
			},
			// Refresh index for search
			function (next) {
				_info('Refreshing indexes ... [' + that.index + ']');
				that.client.indices.refresh({index: that.index }, next);
			}
		], function (err) {
			if (!err) {
				that._ready = true;
				_info('Ready to search !');
			}
			callback(err, that._ready);
		});
	};

	this.get = function (type, id, callback) {
		if (!this.types[type])
			return callback(null, true);
		if (typeof id !== 'string')
			id = id.toString();
		this.client.get({
			index: this.index,
			type: type,
			id: id
		}, function (err, data) {
			if (err || !data.found)
				return callback('Not found');
			return callback(null, data._source);
		});
	}

	this.delete = function (type, id, callback) {
		if (!this.types[type])
			return callback(null, true);
		if (typeof id !== 'string')
			id = id.toString();
		this.client.delete({
			index: this.index,
			type: type,
			id: id
		}, function (err, data) {
			return callback(err, data);
		});
	};

	// Index document
	this.save = function (type, doc, callback) {
		if (!this.types[type])
			return callback(null, doc);
		doc.id = doc.id || doc._id || this.generateId();
		doc.dateUpdate = new Date();
		doc.dateCreation = doc.dateCreation || new Date();
		_info('Indexing [' + type + '] [' + doc.id + ']');
		async.waterfall([
			function (next) {
				that.createMapping(type, next);
			},
			function (res, next) {
				that.client.index({
					id: doc.id || doc._id || this.generateId(),
					type: type,
					index: that.index,
					body: doc
				}, function (err, data) {
					if (err)
						return callback(type +' [ ' + doc.id + '] failed to index.');
					_info('Indexed [' + type + '] [' + doc.id + ']');
					return callback(null, doc);
				});
			}
		], callback);
	};

	// Search algorythm
	this.search = function (type, query, callback) {
		var _query;
		if (!this.types[type])
			return callback(null, null);
		if (query.id !== undefined) {
			_query = _.defaults(query, { index: this.index, type: type });
			return that.client.get(_query, function (err, data) {
				return callback(err, (!err && data._source ? data._source : null));
			});
		}
		_query = { "from" : 0, "size" : 25, "sort": "_score", "query": { "bool": { "must": [], "should": [], "must_not": [] }}};
		
		for (var key in query) {
			var where = 'must';
			var originalKey = key;
			var lastchar = key[key.length - 1];
			key = key.substr(0, key.length - 1);
			switch (lastchar) {
				case '!':
					where = "must_not";
					break;
				case '~':
					where = "should";
					break;
				default:
					key += lastchar;
					break;
			}
			if (!key.length) { continue; }
			switch (key) {
				case 'limit':
					if (query.limit > 0 && query.limit < 300)
						_query.size = query.limit;
					break;
				case 'start':
					if (query.start > 0)
						_query.from = query.start;
					break;
				case 'range':
					if (query.from !== undefined && query.to !== undefined) {
						var range = { "range": {}};
						range.range[query.range] = {gte: query.from, lt: query.to};
						_query.query.bool[where].push(range);
					}
					break;
				case 'q':
					if (typeof query.q !== 'string' || !query.q.length) {
						break;
					}
					var fields = ((typeof query.fields === 'string' && query.fields.length) ? query.fields.split(',') : ['_all']);
					if (query.q.indexOf(',') !== -1) {
						query.q = query.q.split(',');
					} else {
						query.q = [query.q];
					}
					for (var i in fields) {
						for (var j in query.q) {
							var query_type = "fuzzy_like_this";
							var field = "like_text" || fields[i];
							var should = {};
							should[query_type] = {};
							should[query_type][field] = query.q[j];
							_query.query.bool.should.push(should);
						}
					}
					break;
				default:
					var term;
					if (this.excluded.indexOf(key) !== -1)
						break;
					if (typeof query.originalKey === 'string' && query[originalKey].indexOf(',') !== -1) {
						term = {"terms": {}};
						term.terms[key] = query[originalKey].split(',');
					} else if (Array.isArray(query[originalKey])) {
						term = {"terms": {}};
						term.terms[key] = query[originalKey];
					} else {
						term = {"term": {}};
						term.term[key] = query[originalKey];
					}
					_query.query.bool[where].push(term);
					break;
			}
		}
		async.waterfall([
			function (next) {
				that.createMapping(type, next);
			},
			function (ok, next) {
				that.client.search({
					index: that.index,
					type: type,
					body: _query
				}, function (err, res) {
					return next(null, _outResults(res, _query));
				});
			}
		], callback);
	};

	this.createMapping = function (type, callback) {
		var _type = this.types[type];
		var that = this;
		if (!_type || _type._inited)
			return callback(null, {ok: true});
		async.waterfall([
			function (next) {
				that.client.indices.getMapping({
					index: that.index,
					type: type
				}, next);
			},
			function (mapping, status, next) {
				if (_.keys(mapping).length)
					return next(null, null);
				var body = {};
				body[type] = _type.mapping;
				that.client.indices.putMapping({ index: that.index, type: type, body: body, local: true }, function (err, status) {
					if (err) return next(true);
					return next(null);
				});
			},
		], function (err, res) {
			if (err)
				return callback('Mapping insertion failed for type [' + type + '].');
			_type._inited = true;
			callback(null, { ok: true });
		});
	};

	this.createIndex = function (callback) {
		var that = this;
		async.waterfall([
			function (next) {
				that.client.indices.exists({
					index: that.index,
				}, function (err, data) {
					next(err, data);
				});
			},
			function (exists, next) {
				if (exists)
					return next(null, null);
				that.client.indices.create({
					index: that.index,
					body: { "settings" : that.settings}
				}, next);
			}
		], function (err, data) {
			return callback((err ? err : null), (err ? null : true));
		});
	};

	// Delete documents
	this.drop = function (type, callback) {
		if (!this.types[type])
			return callback(null, true);
		this.client.deleteByQuery({
			index: this.index,
			body: { query: { bool: { must: {"match_all": {}}}}}
		}, function (err, data) {
			return callback((err ? err : null), (err ? null : true));
		});
	};

	// Delete database (index)
	this.dropIndex = function (callback) {
		this.client.indices.delete({
			index: this.index
		}, function (err, data) {
			if (!err) { that._ready = false; }
			return callback((err ? err : null), (err ? null : true));
		});
	};

	(function () {
		var _types = _.keys(that.types);
		for (var i in _types) {
			that.pub[_types[i]] = {};
			that.pub[_types[i]].save = that.save.bind(that, _types[i]);
			that.pub[_types[i]].drop = that.drop.bind(that, _types[i]);
			that.pub[_types[i]].delete = that.delete.bind(that, _types[i]);
			that.pub[_types[i]].search = that.search.bind(that, _types[i]);
			that.pub[_types[i]].get = that.get.bind(that, _types[i]);
		}
	})();
	
	this.pub.init = this.init.bind(this);

	return this.pub;
}

function _outResults(res, query) {
	var ret;

	res = res || {hits: {total: 0, hits: []}};

	ret = {
		start: query.from,
		limit: query.size,
		total: (res.hits ? res.hits.total : 0),
		count: (res.hits && res.hits.hits ? res.hits.hits.length : 0),
		hits: []
	};
	if (res.hits && res.hits.hits) {
		for (var i in res.hits.hits) {
			var obj = res.hits.hits[i];
			obj._source._score = obj._score;
			ret.hits.push(obj._source);
		}
	}
	return ret;
}

/*
{
	q : partial search on all
	fields=[name] : Q dans les champs suivants
	*range=[name] : champs de range
	*from=[range value]: range value
	*to=[range value]: range value
	*limit=[result] : retour
	*start=[doc départ] : départ
}
*/

/*
{
	from: start,
	limit: size
	total: total.hits,
	count: hits.count,
	hits: [];
}
*/

module.exports = Search;