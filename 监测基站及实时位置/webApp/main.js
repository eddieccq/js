var ratioCoordinateToPx = 100;

var anchorColor = "#00A308";
var tagColor = "#FF1C0A";
var storedtagCloor = "#0000C6";
var doorCloor = "#080808";
var rangeReportColor = "rgba(135, 206, 250, .2)";
var scene;
var listTagPositions;
var storedTagPositions=new Array();

var isRunning = false;

function load()
{
    requestScene();
    setInterval(function(){
    	if(isRunning)
   		{
    		requestTagPositions();
   		}
    }, 350);
}

function getPxFromCoordinate(coordinate)
{
    return coordinate * ratioCoordinateToPx;
}

function requestScene()
{
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            scene = JSON.parse(xhttp.responseText);
            createScene();
            renderScene();
        }
    }
    xhttp.open("GET", "/scene", false);//SYNC!!!!!
    xhttp.send();
}

function requestTagPositions()
{
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (xhttp.readyState == 4 && xhttp.status == 200) {

       		listTagPositions = JSON.parse(xhttp.responseText);

        	renderScene();
        }
    }
    xhttp.open("GET", "/tag?a=listAllPositions", true);
    xhttp.send();
}

function createScene()
{
    //create the canvas
    var width = getPxFromCoordinate(scene.endX);
    var height = getPxFromCoordinate(scene.endY);
    var html = "<canvas id='canvas' width='" + width + "' height='" + height + "' style='border: 1px black solid;'></canvas>";

    document.getElementById("canvasContainer").innerHTML = html;
}

function getAnchorById(id)
{
	var result = null;
	
	for(var i=0;i<scene.listAnchors.length;i++)
	{
		if(scene.listAnchors[i].id == id)
		{
			result = scene.listAnchors[i];
			break;
		}
	}
	
	return result;
}

function renderScene()
{
    var ctx = document.getElementById("canvas").getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);//limpiar lo anterior
//	ctx.clearRect(0, 0, 40,40);
//    drawDoor(
//		ctx,
//		getPxFromCoordinate(5),
//		getPxFromCoordinate(1),
//		getPxFromCoordinate(2),
//		doorCloor
//		);		
    for (var i = 0; i < scene.listAnchors.length ; i++)
    {
        renderAnchor(ctx, scene.listAnchors[i]);
    }
    
	renderStoredTag(ctx);
    if(listTagPositions != null)
   	{
    	document.getElementById("divInfo").innerHTML = "";
		document.getElementById("sidebar").innerHTML = "";
    	for (var i = 0; i < listTagPositions.length ; i++)
        {
    		
    		
    		if(listTagPositions[i].listRangeReports != null)// this means that the trilateration was performed, so we can place the tag in the map
			{
    			renderRangeReport(ctx,listTagPositions[i]);
			}
    		if(listTagPositions[i].coordinates != null)// this means that the trilateration was performed, so we can place the tag in the map
			{
    			renderTag(ctx, listTagPositions[i]);
				//judgeTag(listTagPositions[i]);
				storedTag(listTagPositions[i]);
				if(listTagPositions[i].listRangeReports.length>=3)
					document.getElementById("sidebar").innerHTML +="<b>超宽带定位中</b>";
				else
					document.getElementById("sidebar").innerHTML +="<b>惯导定位中</b>";
			}  		
            renderInfo(listTagPositions[i]);
        }
   	}
 //   document.getElementById("sidebar").innerHTML ="惯导定位中";
}

function storedTag(tag)
{
	var hasTag = false;
	if(storedTagPositions.length !=0)
	{
		for(var j = 0;j < storedTagPositions.length ;j++)
		{
			if(storedTagPositions[j].coordinates.x == tag.coordinates.x && storedTagPositions[j].coordinates.y == tag.coordinates.y)
			{
				hasTag = true;
				break;
			}
		}
		//if(Math.abs(tag.coordinates.x-storedTagPositions[storedTagPositions.length-1].coordinates.x)>2||Math.abs(tag.coordinates.y-storedTagPositions[storedTagPositions.length-1].coordinates.y)>2)
		//	hasTag = true;
	}	
	if(!hasTag)
		storedTagPositions.push(tag);
}

function renderAnchor(ctx, anchor)
{
    var anchorRadius = 0.08;
		drawCircle(
			ctx,
			getPxFromCoordinate(anchor.coordinates.x),
			getPxFromCoordinate(anchor.coordinates.y), 
			getPxFromCoordinate(anchorRadius),
			anchorColor
		);		
}
function judgeTag(tag)
{
	var ctxWarning = document.getElementById("showWarning").getContext("2d");
	if(tag.coordinates.x>=5)
		renderWarning(ctxWarning,"#EE0000");
	else
		renderWarning(ctxWarning,"#32CD32");
}
function renderTag(ctx, tag)
{
    var tagRadius = 0.04;
    drawCircle(
        ctx,
        getPxFromCoordinate(tag.coordinates.x),
        getPxFromCoordinate(tag.coordinates.y), 
        getPxFromCoordinate(tagRadius),
        tagColor
    );
}

function renderTemp(temp)
{
	var ctxTemp = document.getElementById("showTemperature").getContext("2d");
	ctxTemp.clearRect(0, 0, 200,40);
	ctxTemp.font = "bold 30px Arial";
	ctxTemp.textAlign = "left";
	if(temp>=30)
		ctxTemp.strokeStyle = "#EE0000";
	else
		ctxTemp.strokeStyle = "#32CD32";
	ctxTemp.strokeText(temp + "℃",0,35);
}

function renderWarning(ctx, warningColor)
{
		drawCircle(
			ctx,
			20,
			20, 
			20,
			warningColor
		);
}

function renderStoredTag(ctx)
{
	if(storedTagPositions.length != 0)
	{
		for (var i = 0; i < storedTagPositions.length ; i++)
			drawCircle(
				ctx,
				getPxFromCoordinate(storedTagPositions[i].coordinates.x),
				getPxFromCoordinate(storedTagPositions[i].coordinates.y), 
				getPxFromCoordinate(0.04),
				storedtagCloor
			);	
	}
}

function renderRangeReport(ctx, tagPosition)
{
	for(var i=0;i<tagPosition.listRangeReports.length;i++)
	{
		var rangeReport = tagPosition.listRangeReports[i];
		var rangeRadius = rangeReport.distance * ratioCoordinateToPx;
		var temperatureTag = rangeReport.temperature;
	    var anchor = getAnchorById(rangeReport.anchorId);
	    drawCircle(
	        ctx,
	        getPxFromCoordinate(anchor.coordinates.x),
	        getPxFromCoordinate(anchor.coordinates.y), 
	        rangeRadius,
	        rangeReportColor
	    );
		
	}
    renderTemp(temperatureTag);
}

function drawCircle(ctx, x, y, r, fillColor)
{
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
}

function drawDoor(ctx, x, y, z, fillColor)
{
	//var width = getPxFromCoordinate(scene.endX);
    var height = getPxFromCoordinate(scene.endY);
	ctx.fillStyle = fillColor;
	ctx.beginPath();
	ctx.rect(x, 0, 20, y);
	ctx.rect(x, y+z, 20, height-y-z);
	ctx.closePath();
    ctx.fill();
}

function drawRectangle(ctx, x, y, width, height, fillColor)
{
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.closePath();
    ctx.fill();
}

function renderInfo(tagPosition)
{
	var html = "<b>标签ID: "+tagPosition.tag.id+"</b></br>";
	for(var i=0;i<tagPosition.listRangeReports.length;i++)
	{
		html+="距离读卡器(ID:"+tagPosition.listRangeReports[i].anchorId+")距离:  "
			+tagPosition.listRangeReports[i].distance+" m<br>";
	}
	if(tagPosition.coordinates == null)
	{
		html+="没有足够的数据完成定位...<br>";
	}
	else
	{
		html+="当前定位坐标x:"+tagPosition.coordinates.x+"<br>";
		html+="当前定位坐标y:"+tagPosition.coordinates.y+"<br>";
	}
	html +="<br>";
	document.getElementById("divInfo").innerHTML += html;
}

function btnRunning_click()
{
	isRunning = !isRunning;
	if(isRunning)
	{
		document.getElementById("btnRunning").value = "结束";
	}
	else
	{
		document.getElementById("btnRunning").value = "开始";
	}
}

function btnClear_click()
{
	storedTagPositions.length=0;
}

function btnReset_click()
{
	storedTagPositions.length=0;
	isRunning = false;
	document.getElementById("btnRunning").value = "开始";
	var ctx = document.getElementById("canvas").getContext("2d");
	var ctxTemp = document.getElementById("showTemperature").getContext("2d");
    document.getElementById("divInfo").innerHTML = "";
	document.getElementById("sidebar").innerHTML = "";
    ctx.clearRect(0, 0, canvas.width, canvas.height);//limpiar lo anterior
    ctxTemp.clearRect(0, 0, 200,40);
    for (var i = 0; i < scene.listAnchors.length ; i++)
    {
        renderAnchor(ctx, scene.listAnchors[i]);
    }
	xhttp.open("GET", "/clear", false);//SYNC!!!!!
    xhttp.send();
}