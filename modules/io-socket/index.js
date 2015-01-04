module.exports = ['http', function (io, http) {
	var _sockets = require('socket.io')(http._server);
	var _plugin = io.register('socket');
	
	_plugin('on', function () {
		http.launch();
		_sockets.on.apply(_sockets, arguments);
	});
}];