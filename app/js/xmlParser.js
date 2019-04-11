//var objAttrList = ['Attributes','Slider','PersistentData','PanelProperties','ParameterData']

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function parseXML(stringXML)
{
  var ghData = [];
  var pairConnectionList = [];
  var sourceIDList = [];

  //console.log(stringXML)
  var parser = new DOMParser();
  var xmlDoc = parser.parseFromString(stringXML,"text/xml");
  var result = $(xmlDoc).find("chunk[name='DefinitionObjects']").find("chunk[name='Container']").toArray();

  var prevDetected = false;
  var detectedCount = 0;
  for(var k=0; k<result.length;k++)
  {
    var temp;
    var rowItem = {};

    var i = k;
    rowItem.name = $(xmlDoc).find("chunk[name='DefinitionObjects']").find("chunk[name='Container'] > items > item[name='Name']")[i].innerHTML;
    rowItem.guid = $(xmlDoc).find("chunk[name='DefinitionObjects']").find("chunk[name='Container'] > items > item[name='InstanceGuid']")[i].innerHTML;

    if(rowItem.name == "Group")
    {
      //prevDetected = true;
      detectedCount += 1;
      //group model -- do something
      ghData.push(rowItem);
    }

else{ //not Group type

    //Q: IS THE LINK REPEATED TWICE HERE?
    // FROM GHSHOT TO MESH, WHY IS IT REVERSED?

    //FIND LINK CONNECTION FROM main container
    var total
    total = $($(xmlDoc).find("chunk[name='Container']")[i]).find("items > item[name='Source']").toArray().length;
    if(typeof(source) != "undefined")
    {
      for(var j=0; j< total;j++)
      {
        var source = $($(xmlDoc).find("chunk[name='Container']")[i]).find("items > item[name='Source']")[j];
        var pair = {};

        sourceIDList.push(source.innerHTML);
        pair.outIdx = i; //saving index
        pair.inIdx = -1; //haven't set
        pairConnectionList.push(pair);
      }
    }

    //FIND LINK CONNECTION FROM PARAM_INPUT
    total = $($(xmlDoc).find("chunk[name='Container']")[i]).find("chunk[name='param_input'] > items > item[name='Source']").toArray().length;
    for(var j=0; j< total;j++)
    {
      var source = $($(xmlDoc).find("chunk[name='Container']")[i]).find("chunk[name='param_input'] > items > item[name='Source']")[j];
      var pair = {};

      sourceIDList.push(source.innerHTML);
      pair.outIdx = i; //saving index
      pair.inIdx = -1; //haven't set
      pairConnectionList.push(pair);
    }

    //FIND LINK CONNECTION FROM EvalUnits
    total = $($(xmlDoc).find("chunk[name='Container']")[i]).find("chunk[name='EvalUnits']").find("item[name='Source']").toArray().length;

    for(var j=0; j< total;j++)
    {
      var source = $($(xmlDoc).find("chunk[name='Container']")[i]).find("chunk[name='EvalUnits']").find("item[name='Source']")[j];
      var pair = {};
      sourceIDList.push(source.innerHTML);
      pair.outIdx = i; //saving index
      pair.inIdx = -1; //haven't set
      pairConnectionList.push(pair);
    }

    //list down param outputs
    total = $($(xmlDoc).find("chunk[name='Container']")[i]).find("chunk[name='param_output'] > items > item[name='InstanceGuid']").toArray().length;
    rowItem.paramOutput = [];
    for(var j=0; j< total;j++)
    {
      rowItem.paramOutput.push($($(xmlDoc).find("chunk[name='Container']")[i]).find("chunk[name='param_output'] > items > item[name='InstanceGuid']")[j].innerHTML);
    }

    //if(prevDetected)
    {
      i = i-detectedCount;
      //prevDetected = false; //reset
    }
        temp = $(xmlDoc).find("chunk[name='Container'] > chunks > chunk[name='Attributes'] > items > item[name='Bounds']")[i];
        rowItem.x = $(temp).find("X").text();;
        rowItem.y = $(temp).find("Y").text();

        var containerXML = $(xmlDoc).find("chunk[name='DefinitionObjects']").find("chunk[name='Container']")[i]
        var containerItems = $($(containerXML).find("items")[0]).children()
        var containerLength = containerItems.length

        rowItem["Container"] = {}

        for(var x=0; x<containerLength; x += 1)
        {
          var key = $(containerItems[x]).attr("name")
          var value = $(containerItems[x]).text()

          rowItem["Container"][key] = value
        }
        //console.log(rowItem["Container"])

        //START RECORDING ACTUAL ATTRIBUTES, PERSISTENT DATA, SLIDER, ETC HERE
        //Record all children the container has
        var containerChildNum = $($(containerXML).find("chunks")[0]).attr("count")
        //console.log("count", containerChildNum)

        rowItem["Contents"] = {}
        //for(var d=0; d<objAttrList.length;d++)
        for(var d=0; d<containerChildNum;d++)
        {
          //var attName = objAttrList[d]
          var attName = $($(containerXML).find("chunk")[d]).attr("name")
          //console.log("attName", attName)
          rowItem["Contents"][attName] = {}
          //temp = $(xmlDoc).find("chunk[name='Container'] > chunks > chunk[name='"+ attName +"']")[i];
          temp = $(containerXML).find("chunks > chunk[name='"+ attName +"']")
          var totalChild = $(temp).children().children().length //or $(temp).find("items").attr('count')

          for(var x=0; x<totalChild; x += 1)
          {
            var key = $($(temp).children().children()[x]).attr("name")
            var value = $($(temp).children().children()[x]).text()

            rowItem["Contents"][attName][key] = value
          }
          //console.log(rowItem)
        }
        ghData.push(rowItem);
        //console.log($(temp).find("items").attr('count'))

        // rowItem.x = 100;
        // rowItem.y = 90;
        // rowItem.aha ="aha"
        //rowItem.weird = $(temp)
        //ghData.push(rowItem);
    }

  }

  //looping to find the input connection
  for(var i=0; i< sourceIDList.length; i++)
  {

    for(var j=0; j<ghData.length;j++)
    {
      //check if there is any matching id, if not, loop through paramOutput
      if(ghData[j].guid == sourceIDList[i])
      {
        pairConnectionList[i].inIdx = j;

        break;
      }
      else
      {
        if(typeof(ghData[j].paramOutput) != "undefined")
        {
        for(var k=0; k<ghData[j].paramOutput.length;k++)
        {

          if(ghData[j].paramOutput[k] == sourceIDList[i]) //found
          {
            pairConnectionList[i].inIdx = j;
            break;
          }
        }
        }

      }
    }
  }

  return { ghData : ghData, pairConnectionList : pairConnectionList };
}

function checkBefAft(a,b)
{
  var diff = {}
  if( JSON.stringify(a) !== JSON.stringify(b))
  {
    //some attributes added / deleted
    obj1Keys = Object.keys(a)
    obj2Keys = Object.keys(b)

    key2notIn1 = {}
    key1notIn2 = {}
    if(obj1Keys.length != obj2Keys.length)
    {
      key2notIn1 = obj2Keys.filter( function( el ) {
        return obj1Keys.indexOf( el ) < 0;
      });

      key1notIn2 = obj1Keys.filter( function( el ) {
        return obj2Keys.indexOf( el ) < 0;
      });

    }

    if(!isEmpty(key1notIn2))
    {
      key1notIn2.forEach(function(key) {
        diff[key] = {}
        diff[key].bef = a[key]
        diff[key].aft = ""
      })
    }

    if(!isEmpty(key2notIn1))
    {
      key2notIn1.forEach(function(key) {
        diff[key] = {}
        diff[key].bef = ""
        diff[key].aft = b[key]
      })
    }

    //check every key
    for (var key in a)
    {
        if(a[key] !== b[key])
        {
          diff[key] = {}
          diff[key].bef = a[key]
          diff[key].aft = b[key]
        }
    }

  }
  return diff
}


function checkSameGUID(d)
{
  var diffList = []
  for (var i=0; i<d.sameIDList.length;i++)
  {
      //console.log("length",d.sameIDList.length)

      var obj1, obj2
      var changedAttrValueList = {}

      //looping in ghData
      for(var j=0; j<d.ghData.length;j++)
      {
        if (d.ghData[j].guid == d.sameIDList[i])
        {
            obj1 = d.ghData[j]
            break;
        }
      }

      //looping in ghData2
      for(var k=0; k<d.ghData2.length;k++)
      {
        if (d.ghData2[k].guid == d.sameIDList[i])
        {
            obj2 = d.ghData2[k]
            break;
        }
      }
      // console.log("1", obj1)
      // console.log("2", obj2)

      //comparing obj1 and obj2 now
      if( JSON.stringify(obj1) !== JSON.stringify(obj2) )
      {
        var diffObj = { guid: d.sameIDList[i]}
        //CHECK container
        var container1 =  obj1["Container"]
        var container2 =  obj2["Container"]
        if(container2 != null)
        {
        // console.log("1", container1)
        // console.log("2", container2)
        var result = checkBefAft(container1,container2)

        if(!isEmpty(result))
          diffObj["Container"] = result

          var arr1 = Object.keys(obj1["Contents"])
          var arr2 = Object.keys(obj2["Contents"])

          var objAttrList = [...new Set([...arr1, ...arr2])];

        //not totally the same, check the attributes now
        for(var l=0; l < objAttrList.length; l++)
        {
          var a = obj1["Contents"][objAttrList[l]]
          var b = obj2["Contents"][objAttrList[l]]

          if(a != null && b != null)
          {
          var result2 = checkBefAft(a,b)

          if(!isEmpty(result2))
            diffObj[objAttrList[l]] = result2
          }
        }


        diffList.push(diffObj)
      }
    }
}
//console.log(diffList)

  return diffList
}

function findDifference(xml1, xml2)
{
  var curGraph = parseXML(xml1);
  var parentGraph = parseXML(xml2);

  var sameIDList = []
  //do not use unified version for now
  // var diffGraph = []
  // var diffConnectionList = []

  //FOR GHDATA
  //calculate differences, add tag in ghData
  //collect all guid from currentgraph
  curGraph.guid = (curGraph.ghData).map(function(a) {return a.guid;});
  parentGraph.guid = (parentGraph.ghData).map(function(a) {return a.guid;});

  //now, get all the new Graph
  for(var i = 0; i < curGraph.guid.length; i++)
  {
    //cant be found in parent = new
    if(parentGraph.guid.indexOf(curGraph.guid[i]) >= 0)
    {
      curGraph.ghData[i]["status"] = 'same';
      //add into sameIDList
      sameIDList.push(curGraph.guid[i])
    }
    else {
      curGraph.ghData[i]["status"] = 'new';
    }
  }

  //now, get all the deleted Graph
  for(var i = 0; i < parentGraph.guid.length; i++)
  {
    //cant be found in current = deleted
    if(curGraph.guid.indexOf(parentGraph.guid[i]) >= 0)
      parentGraph.ghData[i]["status"]  = 'same';
    else {
      parentGraph.ghData[i]["status"]  = 'deleted';
    }
  }

  //only get all the deleted graph from parents to be appended in the current Graph
  // var filteredParent = parentGraph.ghData.filter(function(x) { return x.status == 'deleted'; });
  // diffGraph = curGraph.ghData.concat(filteredParent);

  //FOR PAIRCONNECTIONLIST
  var collectedNewIndex = []
  var collectedDeletedIndex = []
  var collectedNewGUID = []
  var collectedDeletedGUID = []
  for(var i=0; i< curGraph.ghData.length; i++)
  {
    if(curGraph.ghData[i].status == 'new')
    {
      collectedNewIndex.push(i);
      collectedNewGUID.push(curGraph.ghData[i].guid);
    }
  }

  for(var i=0; i< parentGraph.ghData.length; i++)
  {
    if(parentGraph.ghData[i].status == 'deleted')
    {
      collectedDeletedIndex.push(i);
      collectedDeletedGUID.push(parentGraph.ghData[i].guid);
    }
  }

  //check if pair connection input and output index is affected -- tag if affected
  for(var i=0; i<curGraph.pairConnectionList.length; i++)
  {
    //found, tag - check in input and output index
    if(collectedNewIndex.indexOf(curGraph.pairConnectionList[i].inIdx) >= 0 ||
    collectedNewIndex.indexOf(curGraph.pairConnectionList[i].outIdx) >= 0)
      curGraph.pairConnectionList[i].status = 'new'
  }

  for(var i=0; i<parentGraph.pairConnectionList.length; i++)
  {
    //found, tag - check in input and output index
    if(collectedDeletedIndex.indexOf(parentGraph.pairConnectionList[i].inIdx) >= 0 ||
    collectedDeletedIndex.indexOf(parentGraph.pairConnectionList[i].outIdx) >= 0)
      parentGraph.pairConnectionList[i].status = 'deleted'
  }

  //do not use unified version for now
  //return { ghData : diffGraph, pairConnectionList : diffConnectionList };
  return { ghData : curGraph.ghData, pairConnectionList : curGraph.pairConnectionList,
  ghData2 : parentGraph.ghData, pairConnectionList2 : parentGraph.pairConnectionList,
  sameIDList : sameIDList};
}

var margin = {top: 20, left: 20, bottom: 20, right: 20};
var width, height;
var ratio, offset;
var gWidth, gHeight;
var g2, g3;

function getCurrentDiv()
{
  width = $("#ghGraphPanel").width() - margin.left - margin.right,
  height = $("#ghGraphPanel").height() - margin.top - margin.bottom;

  offset = getOffset(document.getElementById("ghGraphPanel"));

  /*if(offset.left>offset.top)
    offset = offset.left;
  else
    offset = offset.top;*/

    var wRatio = width/gWidth, hRatio = height/gHeight;

    if(wRatio < hRatio)
      ratio = wRatio //use the smaller ratio it wont get cutOff
    else
      ratio = hRatio
}

function redraw3()
{
//  getCurrentDiv();
  g3.attr("transform", "scale(" + ratio +")translate("+ offset.left+","+ offset.top +")")
}
function redraw2()
{
  getCurrentDiv();
  //now, rescale
  g2.attr("transform", "scale(" + ratio +")translate("+ offset.left+","+ offset.top +")")
}

function getOffset(element)
{
    var bound = element.getBoundingClientRect();
    var html = document.documentElement;

    return {
        top: bound.top + window.pageYOffset - html.clientTop,
        left: bound.left + window.pageXOffset - html.clientLeft
    };
}

function drawGHGraph(data)
{
  var ghData = data.ghData;
  var pairConnectionList = data.pairConnectionList;

  // var maxH = parseInt(ghData[0].y), minH = parseInt(ghData[0].y)
  // , minW = parseInt(ghData[0].x), maxW = parseInt(ghData[0].x);
  var maxH, minH, minW, maxW;

  //setting up to first !isNan value found
  for(var i=0; i<ghData.length;i++)
  {
    if(!isNaN(ghData[i].x))
    {
      maxH = parseInt(ghData[i].y)
      minH = parseInt(ghData[i].y)
      minW = parseInt(ghData[i].x)
      maxW = parseInt(ghData[i].x)
      break
    }
  }
  var curX, curY;

  for(var i=0; i<ghData.length;i++)
  {
    if(!isNaN(ghData[i].x))
    {
    curX = parseInt(ghData[i].x);
    curY = parseInt(ghData[i].y);

    if(curX > maxW)
    maxW = curX;
    else if (curX < minW){
      minW = curX;
    }

    if(curY > maxH)
    maxH = curY;
    else if (curY < minH){
      minH = curY;
    }
    }
  }

  width = $("#ghGraphPanel").width();
  height = $("#ghGraphPanel").height();

    var svg2 = d3.select('#ghGraphPanel')
    .append("svg")
    .attr("id","main")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", "translate(" + 0 + "," + 0 + ")");

    //group
    g2 = svg2.append("g")
      .attr("id","ghSVG2")

  //adding color to the line
  var stringLine = `<defs>
        <linearGradient id="grad1">
            <stop offset="0%" stop-color="gray"/>
            <stop offset="100%" stop-color="gray" stop-opacity="0.1" />
        </linearGradient>
    </defs>`;

  var startX, startY, endX, endY, c1x, c1y, c2x, c2y;
  var distanceX, distanceY;
  var countNan = 0;

  for(var i=0; i< pairConnectionList.length; i++)
  {
    if(pairConnectionList[i].inIdx != -1) //skip -1
    {

      startX = parseInt(ghData[pairConnectionList[i].outIdx].x);
      startY = parseInt(ghData[pairConnectionList[i].outIdx].y);

      //check, for some component - the x and y is isNaN
      if(isNaN(startX))
      {
        countNan += 1;
        continue;
      }

      endX = parseInt(ghData[pairConnectionList[i].inIdx].x);
      endY = parseInt(ghData[pairConnectionList[i].inIdx].y);

      distanceX = Math.abs((endX-startX)/2);
      distanceY = Math.abs((endY-startY)/2);

      c1x = startX-distanceX;
      c1y = startY;//+distanceY;

      c2x = endX+distanceX;
      c2y = endY;//-distanceY;

      //stringLine += "<path d=\"M"+startX+","+startY + " C" + c1x + "," + c1y + " " + c2x + "," + c2y + " " + endX + "," + endY + "\" stroke-width=\"2\" stroke-opacity=\".3\" stroke=\"gray\" fill=\"none\"></path>";
      stringLine += "<path d=\"M"+startX+","+startY + " C" + c1x + "," + c1y + " " + c2x + "," + c2y + " " + endX + "," + endY + "\" stroke-width=\"2\" stroke-opacity=\".3\" stroke=\"url(#grad1)\" fill=\"none\"></path>";
    }
  }
  //console.log("pair connection formed: ", pairConnectionList.length, " invalid: ", countNan );

  $("#ghSVG2").append(stringLine);
  $("#ghSVG2").html($("#ghSVG2").html());

// console.log(ghData);

  //not an intuitive way to do d3.. but..
  for(var i=0; i<ghData.length;i++)
  {
    //console.log (ghData[i].name, ghData[i].x);
    //somehow, the ghshot component doesnt have x n y, and aldo
    if(isNaN(parseInt(ghData[i].x)) || isNaN(parseInt(ghData[i].y)))
    {
        continue;
    }

    //console.log(ghData[i])
    var text = g2.append("text")
    .attr("x", parseInt(ghData[i].x))
    .attr("y", parseInt(ghData[i].y))
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .style("font", "300 20px Helvetica Neue")
    .text(ghData[i].name);

// console.log(text)
    var bbox = text.node().getBBox();

    var rect = g2.append("rect")
    .attr("x", bbox.x-4)
    .attr("y", bbox.y-2)
    .attr("width", bbox.width+8)
    .attr("height", bbox.height+4)
    .attr("rx", 5)
    .attr("ry", 5)
    .style("fill", "#ccc")
    .style("fill-opacity", ".5")
    .style("stroke", "#666")
    .style("stroke-width", "1.5px");


  }

  gWidth = $('#ghSVG2').get(0).getBBox().width;
  gHeight = $('#ghSVG2').get(0).getBBox().height;

   redraw2()

   //for resizing
   window.addEventListener("resize", redraw2);


}

function getTextWidth(text, font) {
    // re-use canvas object for better performance
    var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    var context = canvas.getContext("2d");
    context.font = font;
    var metrics = context.measureText(text);
    return metrics.width;
}



function drawGHGraphDiff(data)
{
  var ghData = data.ghData;
  var pairConnectionList = data.pairConnectionList;
  var ghData2 = data.ghData2;
  var pairConnectionList2 = data.pairConnectionList2;

  var maxH, minH, minW, maxW;

  //setting up to first !isNan value found
  for(var i=0; i<ghData.length;i++)
  {
    if(!isNaN(ghData[i].x))
    {
      maxH = parseInt(ghData[i].y)
      minH = parseInt(ghData[i].y)
      minW = parseInt(ghData[i].x)
      maxW = parseInt(ghData[i].x)
      break
    }
  }
  var curX, curY;

  for(var i=0; i<ghData.length;i++)
  {
    if(!isNaN(ghData[i].x))
    {
    curX = parseInt(ghData[i].x);
    curY = parseInt(ghData[i].y);

    if(curX > maxW)
    maxW = curX;
    else if (curX < minW){
      minW = curX;
    }

    if(curY > maxH)
    maxH = curY;
    else if (curY < minH){
      minH = curY;
    }
    }
  }

var svg3 = d3.select('#main')

          //group
        g3 = svg3.append("g")
            .attr("id","ghSVG3")

  //adding color to the line
  var stringLine = `<defs>
        <linearGradient id="grad1">
            <stop offset="0%" stop-color="gray"/>
            <stop offset="100%" stop-color="gray" stop-opacity="0.1" />
        </linearGradient>
    </defs>
    <defs>
          <linearGradient id="grad2">
              <stop offset="0%" stop-color="green"/>
              <stop offset="100%" stop-color="green" stop-opacity="0.1" />
          </linearGradient>
      </defs>
      <defs>
            <linearGradient id="grad3">
                <stop offset="0%" stop-color="red"/>
                <stop offset="100%" stop-color="red" stop-opacity="0.1" />
            </linearGradient>
        </defs>`;

  var startX, startY, endX, endY, c1x, c1y, c2x, c2y;
  var distanceX, distanceY;
  var countNan = 0;

  //FOR ALL NEW GRAPH
  for(var i=0; i< pairConnectionList.length; i++)
  {
    // if(pairConnectionList[i].status == 'new' )
    // {
    // console.log("found",pairConnectionList[i].inIdx)
    // }

    if(pairConnectionList[i].status == 'new' && pairConnectionList[i].inIdx != -1) //skip -1
    {

      startX = parseInt(ghData[pairConnectionList[i].outIdx].x); //need to add width buffer?
      startY = parseInt(ghData[pairConnectionList[i].outIdx].y);

      //check, for some component - the x and y is isNaN
      if(isNaN(startX))
      {
        countNan += 1;
        continue;
      }

      endX = parseInt(ghData[pairConnectionList[i].inIdx].x); //need to add width buffer?
      endY = parseInt(ghData[pairConnectionList[i].inIdx].y);

      distanceX = Math.abs((endX-startX)/2);
      distanceY = Math.abs((endY-startY)/2);

      c1x = startX-distanceX;
      c1y = startY;//+distanceY;

      c2x = endX+distanceX;
      c2y = endY;//-distanceY;

      var strokeType = 'url(#grad2)';

      stringLine += "<path d=\"M"+startX+","+startY + " C" + c1x + "," + c1y + " " + c2x + "," + c2y + " " + endX + "," + endY + "\" stroke-width=\"2\" stroke-opacity=\".3\" stroke=\"" + strokeType +"\" fill=\"none\"></path>";

    }
  }
  //APPEND DELETED LINES NOW
  for(var i=0; i< pairConnectionList2.length; i++)
  {
    //only gets the deleted lines
    if(pairConnectionList2[i].status == 'deleted' && pairConnectionList2[i].inIdx != -1) //skip -1
    {

      startX = parseInt(ghData2[pairConnectionList2[i].outIdx].x); //need to add width buffer?
      startY = parseInt(ghData2[pairConnectionList2[i].outIdx].y);

      //check, for some component - the x and y is isNaN
      if(isNaN(startX))
      {
        countNan += 1;
        continue;
      }

      endX = parseInt(ghData2[pairConnectionList2[i].inIdx].x); //need to add width buffer?
      endY = parseInt(ghData2[pairConnectionList2[i].inIdx].y);

      distanceX = Math.abs((endX-startX)/2);
      distanceY = Math.abs((endY-startY)/2);

      c1x = startX-distanceX;
      c1y = startY;//+distanceY;

      c2x = endX+distanceX;
      c2y = endY;//-distanceY;

      var strokeType = 'url(#grad3)'

      stringLine += "<path d=\"M"+startX+","+startY + " C" + c1x + "," + c1y + " " + c2x + "," + c2y + " " + endX + "," + endY + "\" stroke-width=\"2\" stroke-opacity=\".3\" stroke=\"" + strokeType +"\" fill=\"none\"></path>";
    }
  }

  $("#ghSVG3").append(stringLine);
  $("#ghSVG3").html($("#ghSVG3").html());

  //NOW DRAW THE BOXES FOR CHANGED COMPONENTS
  var diffList = checkSameGUID(data)
  for(var i=0; i<diffList.length;i++)
  {
    var foundIdx
    for(var j=0; j<ghData.length;j++)
    {
      //check if there is any matching id, if not, loop through paramOutput
      if(ghData[j].guid == diffList[i].guid)
      {
        foundIdx = j;
        break;
      }
    }


    var textWidth = getTextWidth(ghData[foundIdx].name, "300 20px Helvetica Neue")

    var rect = g3.append("rect")
    .attr("x", parseInt(ghData[foundIdx].x)-textWidth/2-4)
    .attr("y", parseInt(ghData[foundIdx].y)-14)
    .attr("width", textWidth+8)
    .attr("height", 27) //hacking
    .attr("rx", 5)
    .attr("ry", 5)
    .style("fill", "yellow")
    .style("fill-opacity", ".5");
  }


  //NOW DRAW THE BOXES FOR NEW
  //not an intuitive way to do d3.. but..
  for(var i=0; i<ghData.length;i++)
  {
    //console.log (ghData[i].name, ghData[i].x);
    //somehow, the ghshot component doesnt have x n y, and aldo
    if(ghData[i].status != 'new' || isNaN(parseInt(ghData[i].x)) || isNaN(parseInt(ghData[i].y)))
    {
        continue;
    }

    var text = g3.append("text")
    .attr("x", parseInt(ghData[i].x))
    .attr("y", parseInt(ghData[i].y))
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .style("font", "300 20px Helvetica Neue")
    .text(ghData[i].name);

    //var bbox = text.node().getBBox();
    //var textWidth = text.node().getComputedTextLength()
    //below method is expensive - may be use just in case bbox not found??
    var textWidth = getTextWidth(ghData[i].name, "300 20px Helvetica Neue")

    var rect = g3.append("rect")
    //.attr("x", bbox.x-4)
    .attr("x", parseInt(ghData[i].x)-textWidth/2-4)
    // .attr("y", bbox.y-2)
    .attr("y", parseInt(ghData[i].y)-14)
    // .attr("width", bbox.width+8)
    .attr("width", textWidth+8)
    //.attr("height", bbox.height+4)
    .attr("height", 27) //hacking
    .attr("rx", 5)
    .attr("ry", 5)
    .style("fill", 'green')
    .style("fill-opacity", ".5")
    .style("stroke", "#666")
    .style("stroke-width", "1.5px");
  }

  //FOR THE DELETED components
  for(var i=0; i<ghData2.length;i++)
  {
    //console.log (ghData[i].name, ghData[i].x);
    //somehow, the ghshot component doesnt have x n y, and aldo
    if(ghData2[i].status != 'deleted' || isNaN(parseInt(ghData2[i].x)) || isNaN(parseInt(ghData2[i].y)))
    {
        continue;
    }

    var text = g3.append("text")
    .attr("x", parseInt(ghData2[i].x))
    .attr("y", parseInt(ghData2[i].y))
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .style("font", "300 20px Helvetica Neue")
    .text(ghData2[i].name);

    //var bbox = text.node().getBBox();
    //var textWidth = text.node().getComputedTextLength()
    //below method is expensive - may be use just in case bbox not found??
    var textWidth = getTextWidth(ghData2[i].name, "300 20px Helvetica Neue")

    var rect = g3.append("rect")
    //.attr("x", bbox.x-4)
    .attr("x", parseInt(ghData2[i].x)-textWidth/2-4)
    // .attr("y", bbox.y-2)
    .attr("y", parseInt(ghData2[i].y)-14)
    // .attr("width", bbox.width+8)
    .attr("width", textWidth+8)
    //.attr("height", bbox.height+4)
    .attr("height", 27) //hacking
    .attr("rx", 5)
    .attr("ry", 5)
    .style("fill", "red")
    .style("fill-opacity", ".5")
    .style("stroke", "#666")
    .style("stroke-width", "1.5px");
  }

  redraw3()
  //for resizing
  window.addEventListener("resize", redraw3);
}
