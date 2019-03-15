var async = require('async');
var mc = require('mongodb').MongoClient;
var dbName = 'mongodb://localhost:27017/project2'

var ObjectId = require('mongodb').ObjectID;
exports.mc = mc;

exports.getProject = function(username, projectName, access, index, cb) {
  process.nextTick(function() {

    //adding username for realname in database
    projectName = username + '_' + projectName;
    index = parseInt(index)

    mc.connect(dbName, function (err, db) {
      if (err)
        return cb(err, "error connecting to DB to get project: " + dbName);

      var collection = db.collection(projectName);

      var maxDesignsInAPage = 5;
      collection.createIndex( { created_on:-1 }, function (error, outcome)  {

      //collection.find().sort({$natural:-1}).skip((index)*maxDesignsInAPage).limit(maxDesignsInAPage).toArray(function (err, result) {
      collection.find().sort({created_on:-1}).skip((index)*maxDesignsInAPage).limit(maxDesignsInAPage).toArray(function (err, result) {

        if (err)
          return cb(err, "error finding project in DB");

        console.log("project: "+ projectName +" found ")//, result.length)//: " + result);
        return cb(null, result);

      })
    });
  });
});
}

//get all data inside project without ghdoc and mesh in array format
  exports.getDesignGraph = function(username, projectName, cb) {
    process.nextTick(function() {

      projectName = username + '_' + projectName;

      mc.connect(dbName, function (err, db) {
        if (err)
          return cb(err, "error connecting to DB to get design tree: " + dbName);

        var collection = db.collection(projectName);

        collection
          .find({}).project({"data.ghDoc": 0, "data.mesh":0}).toArray(function (err, result) {

          if (err) return cb(null, null);

          return cb(null, result);//
        })
      });
    });
  }

  //return current number of document in the collection
  exports.getCollectionDocCount = function(collectionName, cb) {
    process.nextTick(function() {

      mc.connect(dbName, function (err, db) {
        if (err)
          return cb(err, "error in getting collection document count");

        var collection = db.collection(collectionName);

        collection.count({}, function (error, count) {

          return cb(null, count);
        });

      })
    })
  }
