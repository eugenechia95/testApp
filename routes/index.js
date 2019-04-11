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

		var result = {"username": "vc", "project": "tower" }

		res.render('projectGraph',{ data: result });

		return;
	});

	router.get('/project', function(req, res) {

		var result = {"username": "vc", "project": "tower", "access": 'Public' }

		res.render('project',{ data: result });
		return;

	});

	router.get('/tree', function(req, res) {

		var result = {"username": "vc", "project": "tower"}

		res.render('projectTree',{ data: result });
		return;

	});

	//return projectTree
	router.get('/getDesignTree', function(req, res) {
		if (req.url.endsWith('/')) {
			res.redirect(req.url.slice(0,-1))
		}

		//id is the project id
		dataHandler.getDesignTree(req.query.username, req.query.id,
		function (err, result)
		{
			if (err)
			{
				console.log(result)
				console.log(err)

				res.status(500).send(result);
			}
			else {
				//found list
				//console.log(result)
				res.json(result);
			}
		});
	});


	//return projectGraph
	router.get('/getDesignGraph', function(req, res) {
		if (req.url.endsWith('/')) {
			res.redirect(req.url.slice(0,-1))
		}

		//id is the project id
		dataHandler.getDesignGraph(req.query.username, req.query.id,
		function (err, result)
		{
			if (err)
			{
				console.log(result)
				console.log(err)

				res.status(500).send(result);
			}
			else {
				//found list
				//console.log(result)
				res.json(result);
			}
		});
	});

	//return project by id
	router.get('/getProject', function(req, res) {
		if (req.url.endsWith('/')) {
			res.redirect(req.url.slice(0,-1))
		}

		//query id is the project name
		if(req.query.id != null)
		{
			dataHandler.getCollectionDocCount(req.query.username+'_'+req.query.id, function (err, count){

			//dataHandler.getDesignNameList(req.query.username+'_'+req.query.id, function (err, nameList){

				dataHandler.getProject(req.query.username, req.query.id, req.query.access, req.query.index,
				function (err, result)
				{
					if (err)
					{
						console.log(result)
						console.log(err)

						res.status(500).send(result);
					}
					else {
						var result2 = { data: result, count: count} //nameList.length
						//found list
						res.json(result2);
						return;
					}

				});
			});
		}
	});

return router;
}
