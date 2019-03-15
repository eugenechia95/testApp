var express = require('express');
var router = express.Router({strict: false});

var async = require('async');

var dataHandler = require('../db/dataHandler');


//options are needed to serve static html
var options = {
	root: './app/html',
	headers: {
			'x-timestamp': Date.now(),
			'x-sent': true
	}
};

module.exports = function(){


  router.get('/', function(req, res) {

		var result = {"username": "vc", "project": "test" }

		res.render('projectGraph',{ data: result });

		return;
	});

	router.get('/project', function(req, res) {

		var result = {"username": "vc", "project": "test", "access": 'Private' }

		res.render('project',{ data: result });
		return;

	});


return router;
}
