var async = require('async');
var mc = require('mongodb').MongoClient;
var dbName = 'mongodb://localhost:27017/project2'

var ObjectId = require('mongodb').ObjectID;
exports.mc = mc;

//note: each project is a collection in the database
exports.getDesign = function(username, projectName, designID, cb) {

  process.nextTick(function() {

    projectName = username + '_' + projectName;

    mc.connect(dbName, function (err, db) {
      if (err)
        return cb(err, "error connecting to get design project: " + dbName);

      var collection = db.collection(projectName);

      collection.findOne({ _id: designID}, function (err, result) {

        if (err)
          return cb(err, "error finding design: " + designID);

        if(result)
          console.log("design found: " + designID);
        else
          console.log("design not found: " + designID)

        return cb(null, result);

      })
    });
  });

}

//return the list of all designs in this project
exports.getDesignNameList = function(collectionName, cb) {
  process.nextTick(function() {

    mc.connect(dbName, function (err, db) {
      if (err) return cb(null, null);

      var collection = db.collection(collectionName);

      collection.find({}).project({_id:1}).toArray(function (err, result) {

        //if not found, just return 0 - no design but collection exist (not possible unless database is compromised)
        if(result.length == 0)
          return cb(null, 0);
        else {
          return cb(null, result);
        }
      })
    })
  })
}

exports.getDesignTree = function(username, projectName, cb) {
  process.nextTick(function() {

    projectName = username + '_' + projectName;

    mc.connect(dbName, function (err, db) {
      if (err)
        return cb(err, "error connecting to DB to get design tree: " + dbName);

      var collection = db.collection(projectName);

      function list_to_tree(list) {
          var map = {}, node, roots = [], i;
          for (i = 0; i < list.length; i += 1) {
              map[list[i]._id] = i;//; // initialize the map
              list[i].children = []; // initialize the children
          }
          for (i = 0; i < list.length; i += 1) {
              node = list[i];

              if (node.parent !== "null") {
                  //check if there is multi parents
                  if (node.parent.indexOf(',') == -1 && typeof map[node.parent] !== 'undefined')
                    list[map[node.parent]].children.push(node);
                  //multi parents disabled for now
                  // else {
                  //   totalParent = node.parent.split(',')
                  //   for(j=0;j<totalParent.length;j++)
                  //   {
                  //     list[map[totalParent[j]]].children.push(node);
                  //   }
                  // }
              } else {
                  roots.push(node);
              }
          }
          return roots;
      }

      collection
        .find({}).project({"data.ghDoc": 0, "data.mesh":0}).toArray(function (err, result) {

        if (err) return cb(null, null);

        return cb(null, list_to_tree(result));//
      })
    });
  });
}

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
