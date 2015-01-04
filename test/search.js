var should = require('should');
var teasier = new (require('teasier'))();


var languages = ['C#', "C", "C++", "Java", "Javascript", ".NET", "Python", "Go", "Ruby", "PHP", "Ruby on rails"];
var types = ["CDI", "CDD", "Part time job", "Internship", "Freelance"];
var langs = ["Chinese", "French", "Spanish", "English", "Finnish", "Portuguese", "Brazilian", "Dutch", "Italian", "Arabic"];
var cities = ["Toulouse", "Montpellier", "Rennes", "Nantes", "Paris", "Bordeaux", "Lavelanet", "Foix", "Strasbourg"];
var hobbies = ["Footbal", "Photography", "YouTube", "Rugby", "Natation", "Drumming", "Music", "Reading", "Golf"];

suite('Search suite', function () {
	/*
	suite('Populating database', function () {
		suite('Offers', function () {
			for (var i = 0; i < 1000; ++i) {
				test('Creating offer [' + i + ']', function (done) {
					var params = {
						"name": teasier.generate.paragraph(5),
						"email": teasier.generate.email(),
						"secret": "12345678",
						"phone": "0688888888",
						"company": {
							name: "Microsoft",
							address: teasier.generate.paragraph(3),
							city: teasier.generate.paragraph(3),
							country: "AMURICA (FUCK YEAH)",
							description: teasier.generate.paragraph(3),
							"website": teasier.generate.domain()
						},
						"description": teasier.generate.paragraph(20),
						"requirements": [
							teasier.helpers.getRandomItem(languages),
							teasier.helpers.getRandomItem(languages),
							teasier.helpers.getRandomItem(languages),
							teasier.helpers.getRandomItem(languages)
						],
						"price": {
							min: teasier.generate.integer(20, 200),
							max: teasier.generate.integer(200, 400)
						},
						type: teasier.helpers.getRandomItem(types)
					};
					request.post('/offers')
					.send(params)
					.expect(200, function (err, data) {
						should.exist(data.body);
						should.exist(data.body.id);
						should.exist(data.body.dateUpdate);
						should.exist(data.body.dateCreation);
						should.not.exist(data.body.secret);
						done();		
					});
				});
			}
		});

		suite('Resumes', function () {
			for (var i = 0; i < 1000; ++i) {
					test('Should create an resume [' + i + ']', function (done) {
						var params = {
							"name": teasier.generate.name(),
							"lastName": teasier.generate.lastName(),
							"birthDate": "" + new Date(),
							"email": teasier.generate.email(),
							"secret": "12345678",
							"phone": "0688888888",
							"language": [
								teasier.helpers.getRandomItem(langs),
								teasier.helpers.getRandomItem(langs)
							],
							"skills": [
								teasier.helpers.getRandomItem(languages),
								teasier.helpers.getRandomItem(languages)
							],
							"experiences": ["Pantera Commerce:1992:2014", "Salut toi:123:123"],
							"hobbies": [
								teasier.helpers.getRandomItem(hobbies),
								teasier.helpers.getRandomItem(hobbies)
							],
							"studies": ["Lycee de Mirepoix:2004:2011", "Epitech:2011:"],
							"diploms": ["Baccalaureat:2011", "Bachelor of Software Engineering:2014"],
							"cities": [
								teasier.helpers.getRandomItem(cities),
								teasier.helpers.getRandomItem(cities)
							],
							"about": teasier.generate.paragraph(30),
							"country": "France"
						};
						request.post('/resumes')
						.send(params)
						.expect(200, function (err, data) {
							should.exist(data.body);
							should.exist(data.body.id);
							should.exist(data.body.dateUpdate);
							should.exist(data.body.dateCreation);
							should.not.exist(data.body.secret);
							done();
						});
					});
			}
		});
	});
	suite('Wait for index', function () {
		test('Done', function (done) {
			setTimeout(function () {
				done();
			}, 4500);
		});
	});*/

	suite('Offers', function () {
		test('Should find some docs', function (done) {
			request.get('/offers?q=' + "java")
			.expect(200, function (err, data) {
				console.log(err, data.body);
				done();
			});
		});
	});

	suite('Resumes', function () {

	});
});