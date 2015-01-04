var serveStatic = require('serve-static');

module.exports = ['http', function (io, http) {
	var _plugin = io.register('static');

	_plugin('serve', function (folder) {
		http._app.use(serveStatic(folder));
	});
}];