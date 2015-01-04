var should = require('should');
var teasier = new (require('teasier'))();


suite('Search suite', function () {
	suite('Populating database', function () {
		suite('Offers', function () {
			for (var i = 0; i < 1000; ++i) {
				test('Creating offer [' + i + ']', function (done) {
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
			}
		});

		suite('Resumes', function () {
			// for i ->> test
		});
	});

	suite('Wait for index', function () {
		test('Done', function (done) {
			setTimeout(function () {
				done();
			}, 4500);
		});
	});

	suite('Offers', function () {

	});

	suite('Resumes', function () {

	});
});