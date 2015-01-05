global._TEST_ = true;
global._RESETDB_ = true;
// Load the server
var server = require('../index.js');
global.request = require('supertest')('http://localhost:' + process.env.PORT || 1338);

suite('Initialize the server', function () {
	before('Should wait for server initialization', function (done) {
		server.init(done);
	});
	test('Server should be ready', function (done) {
		global._info = function () {};
		done();
	});
});

// require('./offers');
// require('./resume');
require('./search');