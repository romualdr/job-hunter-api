var DB = database.Resumes;

function getResume(req, res, next) {
	DB.get(req.param('id'), function (err, res) {
		if (!err)
			req.params.doc = res;
		next();
	});
};

io.http.on('get', '/resumes', function (params, callback) {
	return DB.search(params, callback);
});

io.http.on('post', '/resumes', {
	"name": { type: "string", minLength: 3 },
	"lastName": { type: "string", minLength: 3 },
	"birthDate": { type: "string" },
	"email": { type: "string", pattern: ['email'] },
	"secret": { type: "string", minLength: 6 },
	"phone": { type: "string", minLength: 3, optional: true },
	"language": { type: "array", items: { type: "string" }, optional: true },
	"skills": { type: "array", items: { type: "string" }, optional: true },
	"experiences": { type: "array", items: { type: "string" }, optional: true },
	"hobbies": { type: "array", items: { type: "string" }, optional: true },
	"studies": { type: "array", items: { type: "string" }, optional: true },
	"diploms": { type: "array", items: { type: "string" }, optional: true },
	"cities": { type: "array", items: { type: "string" }, optional: true },
	"about": { type: "string", optional: true },
	"country": { type: "string", optional: true }
}, function (params, callback) {
	params.email = params.email.toLowerCase();
	params._secret = params.secret;
	delete params.secret;
	DB.save(params, callback);
});

io.http.on('get', '/resumes/:id', {
	"id": { type: "string", minLength: 14 } 
},[getResume, function (params, callback) {
	if (!params.doc) return callback('Not found');
	return callback(null, params.doc);
}]);

io.http.on('put', '/resumes/:id', {
	"name": { type: "string", minLength: 3, optional: true },
	"lastName": { type: "string", minLength: 3, optional: true },
	"birthDate": { type: "string", optional: true },
	"phone": { type: "string", minLength: 3, optional: true },
	"language": { type: "array", items: { type: "string" }, optional: true },
	"skills": { type: "array", items: { type: "string" }, optional: true },
	"experiences": { type: "array", items: { type: "string" }, optional: true },
	"hobbies": { type: "array", items: { type: "string" }, optional: true },
	"studies": { type: "array", items: { type: "string" }, optional: true },
	"diploms": { type: "array", items: { type: "string" }, optional: true },
	"cities": { type: "array", items: { type: "string" }, optional: true },
	"about": { type: "string", optional: true },
	"country": { type: "string", optional: true }
}, [getResume, function (params, callback) {
	if (!params.doc) return callback('Not found');
	if (params.doc._secret !== params.secret) return callback('Bad secret');
	
	delete params.secret;
	delete params.id;
	var doc = params.doc;
	delete params.doc;
	
	DB.save(helpers.merge(doc, params), callback);
}]);

io.http.on('delete', '/resumes/:id', {
	"id": { type: "string", minLength: 14 },
	"secret": { type: "string", minLength: 6 }
},[getResume, function (params, callback) {
	if (!params.doc) return callback('Not found');
	if (params.doc._secret !== params.secret) return callback('Bad secret');
	DB.delete(params.id, function (err, data) {
		if (err) return callback('Unable to delete from database');
		return callback(null, { ok: true });
	});
}]);