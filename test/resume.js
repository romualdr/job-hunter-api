var should = require('should');

/*
{
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
}
*/

var JSONBase = {"start":0,"limit":25,"total":0,"count":0,"hits":[]};
var toDelete = null;

function checkResumes() {
	test('Should get resumes', function (done) {
		request.get('/resumes')
		.expect(200, JSON.stringify(JSONBase))
		.end(done);
	});
}

function editResume(id, doc) {
	for (var i in JSONBase.hits) {
		if (JSONBase.hits[i].id === id) {
			JSONBase.hits[i] = doc;
			return;
		}
	}
}

function deleteResume(id) {
	id = id || toDelete;
	for (var i in JSONBase.hits) {
		if (JSONBase.hits[i].id === id) {
			JSONBase.hits.splice(i, 1);
			--JSONBase.count;
			--JSONBase.total;
			toDelete = null;
			return;
		}
	}
}

function addResume(offer) {
	JSONBase.hits.push(offer);
	++JSONBase.total;
	++JSONBase.count;
}

function waitForIndex(timeout) {
	timeout = timeout || 3000;
	test('Waiting for indexing ...', function (done) {
		setTimeout(function () {
			done();
		}, timeout);
	});
}

function getResume(id) {
	for (var i in JSONBase.hits) {
		if (JSONBase.hits[i].id === id) {
			return JSONBase.hits[i];
		}
	}
}

suite('Resumes', function () {
	checkResumes();

	test('Should not create a resume with bad params', function (done) {
		request.post('/resumes')
		.send({
			"name": "Romuald",
			"email": "dafunix@gmail.com"
		})
		.expect(500)
		.end(done);
	});

	checkResumes();

	test('Should create an resume', function (done) {
		var params = {
			"name": "Romuald",
			"lastName": "Ribas",
			"birthDate": "" + new Date(),
			"email": "dafunix@gmail.com",
			"secret": "12345678",
			"phone": "0688888888",
			"language": ["French", "English"],
			"skills": ["C#", "Javascript"],
			"experiences": ["Pantera Commerce:1992:2014", "Salut toi:123:123"],
			"hobbies": ["Football", "Music", "Drumming", "Programming"],
			"studies": ["Lycee de Mirepoix:2004:2011", "Epitech:2011:"],
			"diploms": ["Baccalaureat:2011", "Bachelor of Software Engineering:2014"],
			"cities": ["Toulouse", "Lyon", "Montpellier"],
			"about": "Tiny about things about me, i like hitchiking and skying",
			"country": "France"
		};
		request.post('/resumes')
		.send(params)
		.expect(200, function (err, data) {
			should.exist(data.body);
			should.exist(data.body.id);
			should.exist(data.body.dateUpdate);
			should.exist(data.body.dateCreation);
			addResume(data.body);
			should.not.exist(data.body.secret);
			done();		
		});
	});
	waitForIndex();
	checkResumes();

	test('Should not create a resume with secret too short', function (done) {
		var params = {
			"name": "Romuald",
			"lastName": "Ribas",
			"birthDate": "" + new Date(),
			"email": "dafunix@gmail.com",
			"secret": "1234",
			"phone": "0688888888",
			"language": ["French", "English"],
			"skills": ["C#", "Javascript"],
			"experiences": ["Pantera Commerce:1992:2014", "Salut toi:123:123"],
			"hobbies": ["Football", "Music", "Drumming", "Programming"],
			"studies": ["Lycee de Mirepoix:2004:2011", "Epitech:2011:"],
			"diploms": ["Baccalaureat:2011", "Bachelor of Software Engineering:2014"],
			"cities": ["Toulouse", "Lyon", "Montpellier"],
			"about": "Tiny about things about me, i like hitchiking and skying",
			"country": "France"
		};
		request.post('/resumes')
		.send(params)
		.expect(500, function (err, data) {
			should.exist(data.body);
			done();		
		});
	});

	waitForIndex(1000);
	checkResumes();

	test('Should create a resume to delete ...', function (done) {
		var params = {
			"name": "Romuald",
			"lastName": "Ribas",
			"birthDate": "" + new Date(),
			"email": "dafunix@gmail.com",
			"secret": "12345678",
			"phone": "0688888888",
			"language": ["French", "English"],
			"skills": ["C#", "Javascript"],
			"experiences": ["Pantera Commerce:1992:2014", "Salut toi:123:123"],
			"hobbies": ["Football", "Music", "Drumming", "Programming"],
			"studies": ["Lycee de Mirepoix:2004:2011", "Epitech:2011:"],
			"diploms": ["Baccalaureat:2011", "Bachelor of Software Engineering:2014"],
			"cities": ["Toulouse", "Lyon", "Montpellier"],
			"about": "Tiny about things about me, i like hitchiking and skying",
			"country": "France"
		};
		request.post('/resumes')
		.send(params)
		.expect(200, function (err, data) {
			should.exist(data.body);
			should.exist(data.body.id);
			should.exist(data.body.dateUpdate);
			should.exist(data.body.dateCreation);
			addResume(data.body);
			should.not.exist(data.body.secret);
			toDelete = data.body.id;
			done();		
		});
	});

	test('Should not edit a resume without secret', function (done) {
		request.put('/resumes/' + toDelete)
		.send({
			name: "Romuald"
		})
		.expect(500)
		.end(done);
	});

	test('Should edit a resume', function (done) {
		request.put('/resumes/' + toDelete)
		.send({
			name: "Pierre",
			"secret": "12345678"

		})
		.expect(200, function (err, data) {
			should.not.exist(err);
			should.not.exist(data.body.message);
			should.exist(data.body);
			should.exist(data.body.id);
			should.exist(data.body.dateUpdate);
			should.exist(data.body.dateCreation);
			editResume(data.body.id, data.body);
			should.not.exist(data.body.secret);
			data.body.id.should.eql(toDelete);
			editResume(data.body.id, data.body);
			done();
		});
	});

	waitForIndex(1000);
	checkResumes();
	test('Should get a resume', function (done) {
		request.get('/resumes/' + toDelete)
		.expect(200, getResume(toDelete))
		.end(done);
	});

	test('Should delete a resume', function (done) {
		request.delete('/resumes/' + toDelete)
		.send({
			secret: "12345678"
		})
		.expect(200, function () {
			deleteResume(toDelete);
			return done();
		});
	});

	waitForIndex(2000);
	checkResumes();
});