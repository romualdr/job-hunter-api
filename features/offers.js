var DB = database.Offers;

function getOffer(req, res, next) {
	DB.get(req.param('id'), function (err, res) {
		if (!err)
			req.params.doc = res;
		next();
	});
};

io.http.on('get', '/offers', function (params, callback) {
	return DB.search(params, callback);
});

io.http.on('post', '/offers', {
	"name": { type: "string", minLength: 3 },
	"email": { type: "string", pattern: ['email'] },
	"secret": { type: "string", minLength: 6 },
	"phone": { type: "string", minLength: 3 },
	"company": {
		type: "object",
		properties: {
			"name": { type: "string", minLength: 3 },
			"address": { type: "string", minLength: 6 },
			"city": { type: "string", minLength: 3 },
			"country": { type: "string", minLength: 3 },
			"description": { type: "string", minLength: 3 },
			"website": { type: "string", minLength: 3 }
		}
	},
	"description": { type: "string", minLength: 3 },
	"requirements": { type: "array", items: { type: "string", minLength: 1 }, optional: true },
	"price": {
		type: "object",
		properties: {
			"min": { type: "number", min: 1 },
			"max": { type: "number", min: 1 }
		}
	},
	"type": { type: "string", minLength: 1 }
}, function (params, callback) {
	params.email = params.email.toLowerCase();
	params._secret = params.secret;
	delete params.secret;
	DB.save(params, callback);
});

io.http.on('get', '/offers/:id', {
	"id": { type: "string", minLength: 14 } 
},[getOffer, function (params, callback) {
	if (!params.doc) return callback('Not found');
	return callback(null, params.doc);
}]);

io.http.on('put', '/offers/:id', {
	"id": { type: "string", minLength: 14 },
	"secret": { type: "string", minLength: 6 },
	"name": { type: "string", minLength: 3, optional: true },
	"phone": { type: "string", minLength: 3, optional: true },
	"company": {
		type: "object",
		optional: true,
		properties: {
			"name": { type: "string", minLength: 3, optional: true },
			"address": { type: "string", minLength: 6, optional: true },
			"city": { type: "string", minLength: 3, optional: true },
			"country": { type: "string", minLength: 3, optional: true },
			"description": { type: "string", minLength: 3, optional: true },
			"website": { type: "string", minLength: 3, optional: true }
		}
	},
	"description": { type: "string", minLength: 3, optional: true },
	"requirements": { type: "array", items: { type: "string", minLength: 1 }, optional: true},
	"price": {
		type: "object",
		optional: true,
		properties: {
			"min": { type: "number", min: 1, optional: true },
			"max": { type: "number", min: 1, optional: true }
		}
	},
	"type": { type: "string", minLength: 1, optional: true }
}, [getOffer, function (params, callback) {
	if (!params.doc) return callback('Not found');
	if (params.doc._secret !== params.secret) return callback('Bad secret');
	
	delete params.secret;
	delete params.id;
	var doc = params.doc;
	delete params.doc;
	
	DB.save(helpers.merge(doc, params), callback);
}]);

io.http.on('delete', '/offers/:id', {
	"id": { type: "string", minLength: 14 },
	"secret": { type: "string", minLength: 6 }
},[getOffer, function (params, callback) {
	if (!params.doc) return callback('Not found');
	if (params.doc._secret !== params.secret) return callback('Bad secret');
	DB.delete(params.id, function (err, data) {
		if (err) return callback('Unable to delete from database');
		return callback(null, { ok: true });
	});
}]);