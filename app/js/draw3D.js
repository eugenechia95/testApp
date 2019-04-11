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

function draw3D(design, canvasName)
{
  var container;
var camera, controls, scene, renderer;
var lighting, ambient, keyLight, fillLight, backLight;

var geomList = [];
var wireframeList = [];

var widthRatio = 1;

var windowHalfX = window.innerWidth / 2 * widthRatio;
var windowHalfY = window.innerHeight / 2;

init();
animate();

function init() {

  container = document.createElement('div');
  container.id = canvasName;
  container.style.width = widthRatio;
  document.body.appendChild(container);

  /* Scene */

  scene = new THREE.Scene();
  lighting = false;
  wireframe = false;

  ambient = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambient);

  keyLight = new THREE.DirectionalLight(new THREE.Color('hsl(30, 100%, 75%)'), 1.0);
  keyLight.position.set(-100, 0, 100);

  fillLight = new THREE.DirectionalLight(new THREE.Color('hsl(240, 100%, 75%)'), 0.75);
  fillLight.position.set(100, 0, 100);

  backLight = new THREE.DirectionalLight(0xffffff, 1.0);
  backLight.position.set(100, 0, -100).normalize();

  //wireframeMaterial = new THREE.LineBasicMaterial( { color:   0x0000ff, linewidth: 1 } );
  wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0x999999, flatShading:true, wireframe: true});

  var meshObj = design;
  //console.log(design[0])

  var totalVertList = [];
  for(var a = 0; a<meshObj.data.mesh.length;a++)
  {

		//check if it is mesh or line
		//- but actually no need to check everytime : move this line to the top later
    if(typeof (meshObj.data.mesh[a].lineStr) == "undefined" || meshObj.data.mesh[a].lineStr == "") //mesh type
    {
			var vertList = meshObj.data.mesh[a].vertStr.split(',');

			//create THREE.js vertex from vertlist
			var geometry = new THREE.Geometry();
			for (var i=0; i<vertList.length;i += 3)
				geometry.vertices.push(new THREE.Vector3(parseFloat(vertList[i]),parseFloat(vertList[i+2]), parseFloat(vertList[i+1])));
			//append vertices to total vert list for bounding box calculation
			totalVertList.push.apply(totalVertList, geometry.vertices);

      var faceList = meshObj.data.mesh[a].faceStr.split(',');
      var vertColorList = meshObj.data.mesh[a].vertClrStr.split("Color");
      vertColorList.shift();//remove first element

			//create THREE.js face from facelist
      for (var i=0; i<faceList.length;i += 3)
      geometry.faces.push(new THREE.Face3( faceList[i], faceList[i+1], faceList[i+2]));
      var faceIndices = [ 'a', 'b', 'c' ];
      var color, f, clr, p, vertexIndex, r,g,b;

      for ( var i = 0; i < geometry.faces.length; i ++ )
      {
        f  = geometry.faces[ i ];
        for( var j = 0; j < 3; j++ ) {
          vertexIndex = f[ faceIndices[ j ] ];
          //vertexIndex = f[ j ];
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
          f.vertexColors[ j ] = color;
        }
      }

			var materials = [
				//new THREE.MeshPhongMaterial( { color: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors, shininess: 0 } )
				//new THREE.MeshBasicMaterial( { color: 0x000000, shading: THREE.FlatShading, wireframe: true, vertexColors: THREE.VertexColors} ) //transparent: true
				new THREE.MeshLambertMaterial( { color: 0xffffff, flatShading:true, vertexColors: THREE.VertexColors } )
			];
			group1 = THREE.SceneUtils.createMultiMaterialObject( geometry, materials );
			//group1.position.x = 0;//270;
			//group1.position.y = 0;
			//group1.rotation.z = 0;
			group1.position.x = 0;//270;
			group1.position.y = 0;
			group1.rotation.z = 270;

			//populate list but dont need to add to scene
			geomList.push(geometry);

			scene.add( group1 );
    }
		else{

			var geometry = new THREE.Geometry();

			var vertList = meshObj.data.mesh[a].lineStr.split('/');

			for (var i=0; i<vertList.length;i += 1)
			{
				var p = vertList[i].split(',')
				geometry.vertices.push(new THREE.Vector3(parseFloat(p[0]),parseFloat(p[1]), parseFloat(p[2])));
			}

			//append vertices to total vert list for bounding box calculation
			totalVertList.push.apply(totalVertList, geometry.vertices);

			var material = new THREE.LineBasicMaterial({
				color: 0x000000 //black
			});

			var line = new THREE.Line( geometry, material );
			geomList.push(line);

			line.position.x = 0;//270;
			line.position.y = 0;
			line.rotation.z = 270;

			scene.add( line );
		}

  }

  //FINDING OBJECT SIZE SO THAT CAMERA POSITION CAN CHANGE ACCORDINGLY
  var bbox = new THREE.Box3().setFromPoints (totalVertList);
	console.log(bbox)
  var objWidth = Math.abs(bbox.max.x - bbox.min.x);
  var objHeight = Math.abs(bbox.max.y - bbox.min.y);
  var objectSize = Math.max( objWidth, objHeight );
  var bboxCenter = bbox.getCenter(new THREE.Vector3());
  var bboxSize = bbox.getSize(new THREE.Vector3());
//  console.log("center ", bboxCenter);
  /* Renderer */

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth*widthRatio, window.innerHeight);
  renderer.setClearColor( 0xffffff );
  container.appendChild(renderer.domElement);

  /* Camera */

  var fov = 45;
  // Calculate the camera distance
  var distance = Math.abs( objectSize / Math.sin( fov / 2 ) );

  camera = new THREE.PerspectiveCamera(fov, window.innerWidth*widthRatio / window.innerHeight, 1, 1000);
  //camera.position.z = 3;//distance;
  camera.position.z = bboxSize.x+bboxSize.length()/2;
  camera.position.x = bboxSize.y+bboxSize.length()/2;
  camera.position.y = bboxSize.z+bboxSize.length()/2;
  //scene.userData.camera = camera;

  /* Controls */

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  //controls.maxDistance = bboxSize.length()+10; //set max distance according to object size
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.enableZoom = true;
  controls.target.set( bboxCenter.x, bboxCenter.y, bboxCenter.z );

  for(i=0;i<geomList.length;i++)
    wireframeList.push(new THREE.LineSegments( geomList[i], wireframeMaterial ));
  /* Events */

  window.addEventListener('resize', onWindowResize, true);
  window.addEventListener('keydown', onKeyboardEvent, true);

}

function onWindowResize() {

  windowHalfX = window.innerWidth*widthRatio/ 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = window.innerWidth*widthRatio / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth*widthRatio, window.innerHeight);

}

function onKeyboardEvent(e) {

if(!$("#text").is(":focus")){
  if (e.code === 'KeyL') { //key L

    lighting = !lighting;

    if (lighting) {

      ambient.intensity = 0.25;
      scene.add(keyLight);
      scene.add(fillLight);
      scene.add(backLight);

    } else {

      ambient.intensity = 1.0;
      scene.remove(keyLight);
      scene.remove(fillLight);
      scene.remove(backLight);

    }

  }
  else if(e.code === 'KeyW') //keyW
  {
      wireframe = !wireframe;

      if (wireframe) {
        //console.log("wireframe")
        //add material to all geomList (loop)
        for(i=0; i<geomList.length;i++)
        {
          wireframeList[i].rotation.z =270; //just need to rotate..
          scene.add(wireframeList[i]);
        }


      } else {

        for(i=0; i<geomList.length;i++)
        {
          scene.remove(wireframeList[i]);
        }

      }

  }
}
}

function animate() {

  requestAnimationFrame(animate);

  controls.update();

  render();

}

function render() {

  renderer.render(scene, camera);

}

}
