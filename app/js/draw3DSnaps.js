var canvas;
var template;
var renderer;
var scenes = [];
//var scene;

THREE.SceneUtils = {

	createMultiMaterialObject: function ( geometry, materials ) {

		var group = new THREE.Group();

		for ( var i = 0, l = materials.length; i < l; i ++ ) {

			group.add( new THREE.Mesh( geometry, materials[ i ] ) );

		}

		return group;

	},

	detach: function ( child, parent, scene ) {

		child.applyMatrix( parent.matrixWorld );
		parent.remove( child );
		scene.add( child );

	},

	attach: function ( child, scene, parent ) {

		child.applyMatrix( new THREE.Matrix4().getInverse( parent.matrixWorld ) );

		scene.remove( child );
		parent.add( child );

	}

};

function formatDate(date) {
  var monthNames = [
    "Jan", "Feb", "Mar",
    "Apr", "May", "Jun", "Jul",
    "Aug", "Sep", "Oct",
    "Nov", "Dec"
  ];

  var day = date.getDate();
  var monthIndex = date.getMonth();
  var year = date.getFullYear();
  var hours = (date.getHours()<10?'0':'') + date.getHours();
  var minutes = (date.getMinutes()<10?'0':'') + date.getMinutes();

  return day + ' ' + monthNames[monthIndex] + ' ' + year + ' ' + hours + ':' + minutes;
}

function draw3DSnaps(contentName, data, line, isProject){
	var content = document.getElementById(contentName);
  var meshObj = data;
  template = document.getElementById('template').text;

	if(!isProject)
	{
	//check whether to show rating from the first object --
	//either on showVote or .voting??
	if(typeof(meshObj[0].showVote) != "undefined" && meshObj[0].showVote == "1")
		$("#RatingsRange").show();
	}

  for(var j = 0; j<meshObj.length;j++)
  {
    var scene = new THREE.Scene();
    var sceneID = 'mesh'+ (j+line);

    // make a list item
    var element = document.createElement( "div" );
    element.id = sceneID;
    element.className = "list-item";
    if(!isProject)
    {
      //element.innerHTML = template.replace( '$',meshObj[j]._id);
      element.innerHTML = template.replace( '$',
      '<a style="color: #696969" href="/user/' + username +'/' + project
      +'/design/' + meshObj[j]._id +
      '" >'+ meshObj[j]._id  +'</a>')

    }
    else {

        var urlModif = window.location.href.split('/');
        var projectStringURL = 'http://' + urlModif[2] + '/' + urlModif[3];

        //var projectName = meshObj[j].projectName.split('_');

        var tempName = meshObj[j].projectName.split('_');
        var ownerName = tempName[0];
        var projectName = tempName[1];
        for(var i=2; i<tempName.length; i++)
        {
          projectName += '_' + tempName[i]
        }

        element.innerHTML = template.replace( '$',
        '<a style="color: #696969" href="/user/' + ownerName +'/' +  projectName +'" >' + projectName +'</a>'
        // + '<a class="button" href=""> <i class="fa fa-pencil" aria-hidden="true"></i> </a>' //style="position:relative; left:340px"
         + '<span style="font-size: 0.7em;"><br>'+ projectStringURL + "/" + ownerName + "/" + projectName +'</span>' );

    }
    // Look up the element that represents the area
    // we want to render the scene
    scene.userData.element = element.querySelector( ".scene" );
    content.appendChild( element );

    var camera = new THREE.PerspectiveCamera(30, 1, 1, 1000 );


    if(meshObj[j].data != "")
    {
    // geometry
    var totalVertList = [];
    for(var a = 0; a<meshObj[j].data.mesh.length;a++)
    {
      var vertList = meshObj[j].data.mesh[a].vertStr.split(',');
      var faceList = meshObj[j].data.mesh[a].faceStr.split(',');
      var vertColorList = meshObj[j].data.mesh[a].vertClrStr.split("Color");
      vertColorList.shift();//remove first element

      //create THREE.js vertex&face from vertlist&facelist
      var geometry = new THREE.Geometry();
      for (var i=0; i<vertList.length;i += 3)
      //RHINO: SWAP Y AND Z
      geometry.vertices.push(new THREE.Vector3(vertList[i], vertList[i+2], vertList[i+1]));
      totalVertList.push.apply(totalVertList, geometry.vertices);

      for (var i=0; i<faceList.length;i += 3)
      geometry.faces.push(new THREE.Face3( faceList[i], faceList[i+1], faceList[i+2]));
      var faceIndices = [ 'a', 'b', 'c' ];
      var color, f, clr, p, vertexIndex, r,g,b;
      for ( var i = 0; i < geometry.faces.length; i ++ ) {
        f  = geometry.faces[ i ];
        for( var k = 0; k < 3; k++ ) {
          vertexIndex = f[ faceIndices[ k ] ];
          //vertexIndex = f[ k ];
          p = geometry.vertices[ vertexIndex ];
          if(vertColorList[vertexIndex] != null)
          {
            clr = vertColorList[vertexIndex].split(','); //NOTE: to much steps to get the color!! how to save from the GH better?
            r = parseFloat(clr[1].split('=')[1])/255;
            g = parseFloat(clr[2].split('=')[1])/255;
            b = parseFloat(clr[3].split('=')[1])/255;
          }
          else
          {
            //set default rgb
            r= 221.0/255;
            g= 221.0/255;
            b= 221.0/255;
          }
          color = new THREE.Color( r,g,b );
          f.vertexColors[ k ] = color;
        }
      }

      var materials = [
        new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors, shininess: 0 } ),
        new THREE.MeshBasicMaterial( { color: 0x000000, flatShading: true, wireframe: true, opacity:0.05, transparent: true } )
      ];
      group1 = THREE.SceneUtils.createMultiMaterialObject( geometry, materials );
      // group1.rotation.z = 270;
      scene.add( group1 );

    }

    var bbox = new THREE.Box3().setFromPoints (totalVertList);
    var bboxCenter = bbox.getCenter(new THREE.Vector3());
    var bboxSize = bbox.getSize(new THREE.Vector3());

    camera.position.z = bboxSize.x+bboxSize.length();
    camera.position.x = bboxSize.y+bboxSize.length();
    camera.position.y = bboxSize.z+bboxSize.length();
    scene.userData.camera = camera;

    var controls = new THREE.OrbitControls( scene.userData.camera, scene.userData.element );
    controls.maxDistance = bboxSize.length()+10; //set max distance according to object size
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.target.set( bboxCenter.x, bboxCenter.y, bboxCenter.z );

    scene.userData.controls = controls;
    controls.update();
    }

    scene.add( new THREE.HemisphereLight( 0xaaaaaa, 0x444444 ) );

    var light = new THREE.DirectionalLight( 0xffffff, 0.5 );
    light.position.set( 1, 1, 1 );
    scene.add( light );

    scenes.push( scene );

    if(meshObj[j].data != "")
    {
      var buttonID = 'b' + meshObj[j]._id.replace(/\s+/g, '');

      var topRightTxt ='<div id="descDownload">'

      var openTxt = `<div class="row">
      <div class="col-sm-6">`

     var rightText = '';
		if(isProject)
		{
  	    //adding linking to project page onclick
  			var tempName = meshObj[j].projectName.split('_');
        var ownerName = tempName[0];
        var projectName = tempName[1];
        for(var i=2; i<tempName.length; i++)
        {
          projectName += '_' + tempName[i]
        }

  	    topRightTxt += '&nbsp; &nbsp;<a class="button" id="' + projectName
  			+ '" href="/user/' + ownerName +'/' +  projectName +
  			'" ><img src="/images/goTo_icon.png" style="width:20px;height:20px;border:0;"></a></div>'

  			$('#' + sceneID).append(topRightTxt);

        rightText += '<i class="fa fa-clock-o" aria-hidden="true"></i>&nbsp' + meshObj[j]._id;
		}
		else {

  		//design level
  		topRightTxt += '&nbsp; &nbsp; <a class="button" id="' + meshObj[j]._id
  		+ '" href="/user/' + username +'/' + project
  		+'/design/' + meshObj[j]._id +
  		'" ><img src="/images/goTo_icon.png" style="width:20px;height:20px;border:0;"></a></div>'

  		 $('#' + sceneID).append(topRightTxt);

        $(document).on("click", '#'+buttonID, {ghDocName:meshObj[j]._id
          , ghDocString:meshObj[j].data.ghDoc}, download);

        //$('#'+ buttonID).click({ghDocName:meshObj[j]._id, ghDocString:meshObj[j].data.ghDoc}, download) ;

							//getting collective rating
							//collective rating is tied to the design
							var collectiveRating;
							if (typeof(meshObj[j].rate) != "undefined" && meshObj[j].showVote == "1")
              {
								collectiveRating = meshObj[j].rate;

                rightText += '<span id="hey"><i class="fa fa-users" aria-hidden="true"></i>'+
                '&nbsp<i class="fa fa-star" aria-hidden="true" style="color:#DAA520;"></i>'
                + collectiveRating + '&nbsp</span>'
              }
							else {
								//collectiveRating = 0;
							}

              // if (typeof(meshObj[j].data.inputData) != "undefined")
              // {
              //   //only select the first key-value pair information
              //   inputDataInfo = meshObj[j].data.inputData[0].Key + ": " + meshObj[j].data.inputData[0].Value
              // }
              // else {
              //   inputDataInfo = "no key value pair input"
              // }

              //rightText += '<br>' + inputDataInfo ;
              rightText += '<br>' + meshObj[j].data.notes ;
			}

							// do some validation??
							//if(meshObj[j].created_by != null)
							var createdByInfo, createdOnInfo, inputDataInfo;
							if (typeof(meshObj[j].created_by) != "undefined")
								createdByInfo = meshObj[j].created_by;
							else {
								createdByInfo = "undefined user"
							}

							if (typeof(meshObj[j].created_on) != "undefined")
								createdOnInfo = formatDate(new Date(meshObj[j].created_on));//formatDate();
							else {
								createdOnInfo = "undefined date"
							}

						var leftTxt = '<i class="fa fa-user-circle" aria-hidden="true"></i>&nbsp' //<img src="/images/user_icon.png" style="width:20px;height:20px;border:0;">
													+ createdByInfo + '<br>' + createdOnInfo;


						var openRightTxt =   '</div><div class="col-sm-6">'
						var closeTxt = '</div></div>'

						var combinedTxt = openTxt + leftTxt + openRightTxt + rightText + closeTxt;
						$('#' + sceneID).append(combinedTxt);

							if(typeof(meshObj[j].voting) != "undefined" && meshObj[j].voting == "1")
							{
							//getting individual rating
							getIndividualRating(meshObj[j]._id,j).then(function(data) {
								var data = JSON.parse(data)

								infoTxt = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp<i class="fa fa-star" aria-hidden="true" style="color:#DAA520;"></i>' + data.rate;
								$('#mesh' + data.index).find("#hey").append(infoTxt);
							});
						}
	  }
    else {
      //empty snap, ask user to create in grasshopper
      var element = document.createElement( "div" );
      element.id = "emptySnapHolder" + (j+line);
      element.className = "emptySnapHolder";
      element.innerHTML = '<i class="fa fa-smile-o fa-5x" aria-hidden="true"></i>'
      $('#' + sceneID).append( element );
    }
}
}

function drawAll(contentList,dataList,isProject){


        canvas = document.getElementById( "c");
        template = document.getElementById( "template" ).text;

				init();
				animate();

				function init() {



for(i= 0; i< contentList.length; i++)
{
  var line;

  if(i == 0)
    line = 0;
  else {
    line = contentList[i-1].length
  }

	if(dataList[i].length != 0) //don't draw empty data
	{
		draw3DSnaps(contentList[i],dataList[i],line, isProject);
	}
}
					renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
					renderer.setClearColor( 0xffffff, 1 );
					renderer.setPixelRatio( window.devicePixelRatio );



				}

				function updateSize() {

					var width = canvas.clientWidth;
					var height = canvas.clientHeight;

					if ( canvas.width !== width || canvas.height != height ) {

						renderer.setSize( width, height, false );

					}

				}

				function animate() {
          render();
          requestAnimationFrame( animate );


				}

				function render() {

					updateSize();

					renderer.setClearColor( 0xffffff );
					renderer.setScissorTest( false);
					renderer.clear();

					renderer.setClearColor( 0xe0e0e0 );
          renderer.setScissorTest( true );

					scenes.forEach( function( scene ) {

						// so something moves
						// for(var i=0; i<scene.children.length;i++)
						// 	scene.children[i].rotation.y = Date.now() * 0.001;

						// get the element that is a place holder for where we want to
            // draw the scene
            // if (scene.userData.camera == undefined) {
            //   console.log("www");
            // }
            var element = scene.userData.element;

						// get its position relative to the page's viewport
						var rect = element.getBoundingClientRect();

						// check if it's offscreen. If so skip it
						if ( rect.bottom < 0 || rect.top  > renderer.domElement.clientHeight ||
							rect.right  < 0 || rect.left > renderer.domElement.clientWidth ) {

								return;  // it's off screen

							}

							// set the viewport
							var width  = rect.right - rect.left;
							var height = rect.bottom - rect.top;
							var left   = rect.left;
							var top = rect.top;

							renderer.setViewport( left, top, width, height );
							renderer.setScissor( left, top, width, height );

              var camera = scene.userData.camera;

              //camera.position.set(bboxSize.x,bboxSize.y,bboxSize.z)
							//camera.lookAt(mesh.position)
							//camera.aspect = width / height; // not changing in this example
							//camera.updateProjectionMatrix();

              //scene.userData.controls.update();
              if (camera != null) {
                renderer.render( scene, camera );
              }

						} );

					}
				}
