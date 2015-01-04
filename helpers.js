var _ = require('underscore');
var helpers = {};

helpers.merge = function _mergeObject(oldObj, newObj) {
	for (var key in newObj) {
		if (_.isObject(newObj[key])) {
			oldObj[key] = oldObj[key] || {};
			oldObj[key] = _mergeObject(oldObj[key], newObj[key]);
		} else {
			oldObj[key] = newObj[key];
		}
	}
	return oldObj;
};

module.exports = helpers;