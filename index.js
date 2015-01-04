var async = require('async');
global._RESETDB_ = false;
global._TEST_ = (global._TEST_ || process.env.TEST ? true : false)
global._PRODUCTION_ = (process.env.NODE_ENV === "production" ? true : false);
global.io = new (require('./modules/io-core'))({
	plugins: ['http'],
	http: {
		port: process.env.PORT || 1338
	}
});
global.helpers = require('./helpers');
global.database = new (require('./modules/database'))(require('./config/database'));

io.http.use(function (params, callback, connected, settings) {
	settings.res.header('Access-Control-Allow-Origin', '*');
    settings.res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    settings.res.header('Access-Control-Allow-Headers', 'Content-Type,x-api-user,x-api-token');
    return callback(null);
});

if (_TEST_) {
	require('./features/offers.js');
	require('./features/resumes.js');
	module.exports = database;
	return;
}

database.init(function () {
	require('./features/offers.js');
	require('./features/resumes.js');
});