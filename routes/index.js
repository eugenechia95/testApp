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

	router.get('/tower/design/:designID', function(req, res){

		// if (req.url.endsWith('/')) {
		// 	res.redirect(req.url.slice(0,-1))
		// }
		if(req.params.designID != null)
		{
				// console.log("[API] /explorePage { username: " + req.user.username + ", project: "
				// + req.params.project + ", designID: " + req.params.designID + "}")
				req.params.name = "vc"
				req.params.project = "tower"

				dataHandler.getDesign(req.params.name, req.params.project,req.params.designID,
				function (err, design)
				{
					var result = {"username": req.params.name,
												"project": req.params.project,
												"design": design, "namelist" : {},
											"maxDoc": '', "xml2": ''};
								//xml2 = parentXML

					//TODO: HANDLER IF DESIGN ID IS NOT FOUND
					var projectname = 'vc_tower'
					dataHandler.getDesignNameList(projectname,
					function (err, countList)
					{
						//if (err) return done(err);
						result.maxDoc = countList.length//count.toString();

						//find the index of this design
						var recordIndex = -1; //set as not found
						for(var i=0; i< countList.length ; i++)
						{
							if(countList[i]._id == req.params.designID) //FOUND
							{
								recordIndex = i;
								break;
							}
						}

						//console.log("cLength", countList.length, i)
						var afterIndex = (i+1)%countList.length;
						var beforeIndex = recordIndex-1;
						if (beforeIndex < 0)
							beforeIndex = countList.length - 1;
						//console.log("before index:", beforeIndex)

						result.nameList = {"before" : countList[beforeIndex], "after":countList[afterIndex]}
						//console.log(result.nameList)

						//check if this design has parent
						if(result.design.parent != "null")
						{
							//console.log(result.design[0].parent)
							//send the parent too, so user can observe the difference with the parent
							dataHandler.getDesign(req.params.name, req.params.project,result.design.parent,
							function (err, design2)
							{
								if(typeof design2 !== 'undefined')
								{
									console.log("hi")
									result.xml2 = design2.data.ghDoc
									//found list
									res.render('explore',{ data: result });
									return;
								}
								else {
									result.xml2 = null
									res.render('explore',{ data: result });
									return;
								}
							})
						}
						else {
							result.xml2 = null
							res.render('explore',{ data: result });
							return;
						}

					});
				});
		}
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
