var should = require('should');

/*
	{
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
}
*/

var JSONBase = {"start":0,"limit":25,"total":0,"count":0,"hits":[]};
var toDelete = null;

function checkOffers() {
	test('Should get offers', function (done) {
		request.get('/offers')
		.expect(200, JSON.stringify(JSONBase))
		.end(done);
	});
}

function editOffer(id, doc) {
	for (var i in JSONBase.hits) {
		if (JSONBase.hits[i].id === id) {
			JSONBase.hits[i] = doc;
			return;
		}
	}
}

function deleteOffer(id) {
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

function addOffer(offer) {
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

function getOffer(id) {
	for (var i in JSONBase.hits) {
		if (JSONBase.hits[i].id === id) {
			return JSONBase.hits[i];
		}
	}
}

suite('Offers', function () {
	checkOffers();

	test('Should not create an offer with bad params', function (done) {
		request.post('/offers')
		.send({
			"name": "Romuald",
			"email": "dafunix@gmail.com"
		})
		.expect(500)
		.end(done);
	});

	checkOffers();

	test('Should create an offer', function (done) {
		var params = {
			"name": "Romuald",
			"email": "dafunix@gmail.com",
			"secret": "12345678",
			"phone": "0688888888",
			"company": {
				name: "Microsoft",
				address: "2 Silicon Street",
				city: "Los Angeles, CA",
				country: "AMURICA (FUCK YEAH)",
				description: "Little company",
				"website": "www.microsoft.com"
			},
			"description": "You should be able to, use a photocopier, use your hand, use a coffee maker",
			"requirements": [],
			"price": {
				min: 20,
				max: 40
			},
			type: "Internship"
		};
		request.post('/offers')
		.send(params)
		.expect(200, function (err, data) {
			should.exist(data.body);
			should.exist(data.body.id);
			should.exist(data.body.dateUpdate);
			should.exist(data.body.dateCreation);
			addOffer(data.body);
			should.not.exist(data.body.secret);
			done();		
		});
	});
	waitForIndex();
	checkOffers();

	test('Should not create an offer with secret too short', function (done) {
		var params = {
			"name": "Romuald",
			"email": "dafunix@gmail.com",
			"secret": "1234",
			"phone": "0688888888",
			"company": {
				name: "Microsoft",
				address: "2 Silicon Street",
				city: "Los Angeles, CA",
				country: "AMURICA (FUCK YEAH)",
				description: "Little company",
				"website": "www.microsoft.com"
			},
			"description": "You should be able to, use a photocopier, use your hand, use a coffee maker",
			"requirements": [],
			"price": {
				min: 20,
				max: 40
			},
			type: "Internship"
		};
		request.post('/offers')
		.send(params)
		.expect(500, function (err, data) {
			should.exist(data.body);
			done();		
		});
	});

	waitForIndex(1000);
	checkOffers();

	test('Should create an offer to delete ...', function (done) {
		var params = {
			"name": "Romuald",
			"email": "dafunix@gmail.com",
			"secret": "12345678",
			"phone": "0688888888",
			"company": {
				name: "Microsoft",
				address: "2 Silicon Street",
				city: "Los Angeles, CA",
				country: "AMURICA (FUCK YEAH)",
				description: "Little company",
				"website": "www.microsoft.com"
			},
			"description": "You should be able to, use a photocopier, use your hand, use a coffee maker",
			"requirements": [],
			"price": {
				min: 20,
				max: 40
			},
			type: "Internship"
		};
		request.post('/offers')
		.send(params)
		.expect(200, function (err, data) {
			should.exist(data.body);
			should.exist(data.body.id);
			should.exist(data.body.dateUpdate);
			should.exist(data.body.dateCreation);
			addOffer(data.body);
			should.not.exist(data.body.secret);
			toDelete = data.body.id;
			done();		
		});
	});

	test('Should not edit an offer without secret', function (done) {
		request.put('/offers/' + toDelete)
		.send({
			name: "Je me suis changé"
		})
		.expect(500)
		.end(done);
	});

	test('Should edit an offer', function (done) {
		request.put('/offers/' + toDelete)
		.send({
			name: "Je me suis changé",
			"secret": "12345678"

		})
		.expect(200, function (err, data) {
			should.not.exist(err);
			should.not.exist(data.body.message);
			should.exist(data.body);
			should.exist(data.body.id);
			should.exist(data.body.dateUpdate);
			should.exist(data.body.dateCreation);
			editOffer(data.body.id, data.body);
			should.not.exist(data.body.secret);
			data.body.id.should.eql(toDelete);
			editOffer(data.body.id, data.body);
			done();
		});
	});

	waitForIndex(1000);
	checkOffers();
	test('Should get an offer', function (done) {
		request.get('/offers/' + toDelete)
		.expect(200, getOffer(toDelete))
		.end(done);
	});

	test('Should delete an offer', function (done) {
		request.delete('/offers/' + toDelete)
		.send({
			secret: "12345678"
		})
		.expect(200, function () {
			deleteOffer(toDelete);
			return done();
		});
	});

	waitForIndex(2000);
	checkOffers();
});