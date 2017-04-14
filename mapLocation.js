/*主地图map
	helmetsLayer 人员对象层
	wifiLayer	探测器对象层
	alarmLayer	告警对象层
	hisLayer	历史轨迹
	center	地图中心点
 */
var map, view, helmetsLayer,helmetSrc,hisSrc,hisLineSrc,detectorLayer, drawOverlay, alarmLayer,hisLayer,center;
var cicrle7,cicrle8,cicrle9,c10;
var sysurl="";
var container, content, closer, overlay;
var zoomdefault = 18;	//默认放大比例
var zoommax=28;
var zoommin=0;
var pxsize = 595;		//1像素代表 1CM
var pysize = 435;
var scale = 1;		//放大比例，默认1情况下，比例尺是像素大小
var origin = [0, 0];	//设置原点
var psafe1=[0, 0];	 	//安全区左下
var psafe2=[pxsize, pysize];	//安全区右上
var pabort1=[40, 40]; 	//告警区左下
var pabort2=[441, 241];	//告警区右上
var alarmimg02=sysurl + 'images/label/halmet_02.gif';
var alarmimg12=sysurl + 'images/label/halmet_12.gif';
var readcard_p0=[0,0];		//读卡器14437位置
var readcard_p1=[0,pysize];	//读卡器14438位置
var readcard_p2=[pxsize,0];	//读卡器14439位置
var precision = 10;			//容差精度，设计逻辑为，新精度值若超出旧精度允许的容差，则显示，否则不更新状态。
var debugMode = true;		//是否调试模式，如果是，则持续更新状态，不是，则按容差来处理。
//实时轨迹显示
var maxHis=500;		//最大轨迹显示个数
var isShowHis=true;	//是否显示轨迹
var isShowHisLine=true;	//是否显示轨迹线
var curLocCnt=0;		//轨迹计数器
var geoLineHis=null;//轨迹线对象
var geoLineHisArr = Array();//轨迹线数组
var isupdateLine = false;

// 在任意△ABC中，角A、B、C所对的边长分别为a、b、c，三角形外接圆的半径为R，直径为D
var a = 685.5-12.4;		//基站斜边长度，0点相对第3点
var b = 782-12.4;		//基站斜边长度，1点相对第2点
var c = 1072.5-12.4;	//基站斜边长度，0点相对第2点

// var a = 21;		//基站斜边长度，0点相对第3点
// var b = 21;		//基站斜边长度，1点相对第2点
// var c = 29.7;	//基站斜边长度，0点相对第2点

function calcAngleAll(){
	var angleA=getAngle(a,b,c,'A');
	var angleB=getAngle(a,b,c,'B');
	var angleC=getAngle(a,b,c,'C');
	console.log("calcAngleAll, angleA=" + angleA + " angleB=" + angleB + ",angleC=" + angleC
		+ " 角度和：" + (angleA+angleB+angleC));
	var point3 = getThirdPoint(a,b,c);
}

/**
 * [getThirdPoint 根据三边求斜边ab端点相对于a边的值]
 * @param  {[float]} a [a边长]
 * @param  {[float]} b [b边长]
 * @param  {[float]} c [c连长]
 * @return {[float]}   [相对于00点的xy值]
 */
function getThirdPoint(a,b,c){
	var x,y,radina;
	try{
		radina = getRadinaByAngle(getAngle(a,b,c,'B'));
		x = a * Math.cos(radina);	//角度邻边=斜边*cos角度
		y = a * Math.sin(radina);	//角度对边=斜边*sin角度
		// y1 = Math.sqrt(a*a-x*x);
		console.log("getThirdPoint, radina=" + radina + ",x= " + x + ",y=" + y);
	}catch(e){console.log("getThirdPoint " + e.name + ":" + e.message);}
	return [x,y];
}

/**
 * [getAngle 根据三边获得指定类型的角度]
 * @param  {[type]} a    [a边长]
 * @param  {[type]} b    [b边长]
 * @param  {[type]} c    [c边长]
 * @param  {[type]} type [求角度类型：A,B,C,分别求ABC角的角度]
 * @return {[type]}      [角度值，单位：度]
 */
function getAngle(a,b,c,type){
	var angle;
	try{
		var a1,b1,c1,cos;
		switch(type){
			case 'A':
			cos = (b*b+c*c-a*a) / (2*b*c);	
			break;
			case 'B':
			cos = (c*c+a*a-b*b) / (2*a*c);
			break;
			case 'C':
			cos = (a*a+b*b-c*c) / (2*a*b);
			break;
		}
		// 弧度
	    var radina = Math.acos(cos);
	    // 角度
	    angle =  180 / (Math.PI / radina);
	    // console.log("输入值：a="+a+",b="+b+",c="+c +",求得cos："+cos+",radina:"+radina+",angle"+angle);
	}catch(e){
		console.log("求角度错误：" + e.name + " " + e.message);
	}
	return angle;
}

/**
 * [getRadinaByAngle 根据角度求弧度]
 * @param  {[type]} angle [角度值]
 * @return {[type]}       [弧度值]
 */
function getRadinaByAngle(angle){
	return angle* ((2*Math.PI)/360);//弧度=角度*此参数，Math.sin(x)，x必需是弧度;
}

//---------------------------------------------------------
//---样式定义开始------------------------------------------
//---------------------------------------------------------
// 图层样式缓存
var styles = [new ol.style.Style({
		image: new ol.style.Icon({
			src: sysurl + 'images/label/wifi.png',
			anchor: [0.5, 1],
			scale: 0.3
		})
	}), new ol.style.Style({
		image: new ol.style.Circle({
			radius: 5,
			fill: new ol.style.Fill({
				color: 'rgba(255, 0, 255, 0.3)'
			})
			// ,stroke: new ol.style.Stroke({ color: 'red', width: 3 })
		})
	}),
	new ol.style.Style({//历史线样式
		fill: new ol.style.Fill({
			color: 'rgba(255, 0, 255, 0.1)'
		}),
		stroke: new ol.style.Stroke({
			lineDash: [6, 1, 3, 4, 5, 6],
			// lineDash: [6],
			color: 'rgba(255, 0, 255, 0.2)',
			width: 4
		})
	})
];

//安全帽显示样式
var createHalmetStyle = function(feature) {
	var helmetflag=feature.get('helmetflag');
	var alarm_status = feature.get('alarm_status');
	var loc = getRectCoordinates(feature.get('loc'));
	var imgsrc = sysurl+'images/label/halmet_'+helmetflag+alarm_status+'.png';
	//TODO：单独处理告警状态
	if(alarm_status==2){
		imgsrc = sysurl+'images/label/halmet_'+helmetflag+alarm_status+'.gif';
	}
	var fillcolor='black';
	var strokecolor;
	if (alarm_status == 1) {
		strokecolor='yellow';
	} else if (alarm_status == 2) {
		strokecolor='red';
	} else if (alarm_status == 3) {
		strokecolor='gray';
	}else{
		strokecolor='green';
	}
	return new ol.style.Style({
		image : new ol.style.Icon({
			src : imgsrc,
			anchor : [ 0.5, 65 ],
			scale : 0.5,
			opacity : 0.75,
			anchorOrigin : 'top-right',
			anchorXUnits : 'fraction',
			anchorYUnits : 'pixels',
			offsetOrigin : 'top-right'
		}),
		text : new ol.style.Text({
			textAlign : 'center',
			textBaseline : 'middle',
			font : 'normal 10px 微软雅黑,Calibri,sans-serif',
			text : feature.get('name')+'\r\n' + loc, // 文本内容
			fill : new ol.style.Fill({
				color : fillcolor
			}),
			stroke : new ol.style.Stroke({
				color : strokecolor,
				width : 1
			})
		})
	})
};

// 定义图标选中后的图标样式
var selectStyle = new ol.style.Style({
	image : new ol.style.Circle({
		radius : 10,
		fill : new ol.style.Fill({
			color : 'orange'
		})
	})
});

// 禁止区域样式
var styleAreaAbort = function() {
	var stroke = new ol.style.Stroke({
		color : '#ff0000',
		width : 3
	});
	var fill = new ol.style.Fill({
		color : 'rgba(255,0,0,0.1)'
	});
	var image = new ol.style.Circle({
		fill : fill,
		stroke : stroke,
		radius : 8
	});

	return new ol.style.Style({
		image : image,
		fill : fill,
		stroke : stroke
	});
};

var styleCicle = function(feature) {
	var stroke = new ol.style.Stroke({
		color : '#0026FF',
		width : 1
	});
	var fill = new ol.style.Fill({
		color : 'rgba(14,146,240,0.17)'
	});
	var image = new ol.style.Circle({
		fill : fill,
		stroke : stroke,
		radius : 8
	});

	return new ol.style.Style({
		image : image,
		fill : fill,
		stroke : stroke,
		text : new ol.style.Text({
			textAlign : 'center',
			textBaseline : 'middle',
			font : 'normal 10px 微软雅黑,Calibri,sans-serif',
			text : feature.get('name'),
			fill : new ol.style.Fill({
				color : "blue"
			}),
			stroke : new ol.style.Stroke({
				color : "red",
				width : 1
			})
		})
	});
};

// 安全区域样式
var styleAreaNormal = function() {
	var stroke = new ol.style.Stroke({
		color : '#0f9ce2',
		width : 3
	});
	var fill = new ol.style.Fill({
		color : 'rgba(0,255,0,0.0)'
	});
	var image = new ol.style.Circle({
		fill : fill,
		stroke : stroke,
		radius : 8
	});

	return new ol.style.Style({
		image : image,
		fill : null,
		stroke : stroke
	});
};
//---------------------------------------------------------
//---样式定义结束------------------------------------------
//---------------------------------------------------------


/* 接口调用函数Start */
/**
 * [加载厂区地图底图并创建一个地图]
 * @param  {[type]} jobtype [作业面地图类型：image,wms,wfs,tile]
 * @param  {[type]} addr    [作业面地图服务地址]
 * @param  {[type]} pxsize  [初始位置设置地图位置X]
 * @param  {[type]} pysize  [初始位置设置地图位置Y]
 * @param  {[type]} scale   [比例尺]
 * @return {[type]}         [无]
 */
function createMap(jobtype, addr, pxsize, pysize, scale) {
	//center = ol.proj.transform([ 0, 0 ], 'EPSG:4326', 'EPSG:3857');// 转换为3857
	center=[pxsize * scale / 2, pysize * scale/2];//此处把center设为图纸的实际中心点
	
	var extent = [ center[0] - pxsize * scale / 2,	//extentLeft
				   center[1] - pysize * scale / 2,	//extentbottom,左下
				   center[0] + pxsize * scale / 2,	//extentRight
				   center[1] + pysize * scale / 2 ];//extentTop，右上
    console.log('当前地图原点：' + origin);
    console.log('当前地图中心点：' + center);
    console.log('当前地图边界(左下右上)：' + extent);
	// 实例化鼠标位置控件（MousePosition）
	var mousePositionControl = new ol.control.MousePosition({
		coordinateFormat : ol.coordinate.createStringXY(0), // 坐标格式：小数点
		//projection : 'EPSG:4326',
		className : 'custom-mouse-position', // 坐标信息显示样式，默认是'ol-mouse-position'
		target : document.getElementById('mouse-position'), // 显示鼠标位置信息的目标容器
		undefinedHTML : '&nbsp;'// 未定义坐标的标记
	});

	// 实例化比例尺控件（ScaleLine）
	var scaleLineControl = new ol.control.ScaleLine({
		units : "metric" // 设置比例尺单位，degrees、imperial、us、nautical、metric（度量单位）
	});

	view = new ol.View({
		center : center,
		zoom : zoomdefault,// 17
		minZoom : 0,// 16
		maxZoom : 28
	// 20
	});

	// 创建地图
	map = new ol.Map({
		view : view,
		target : 'map',
		logo : "",// images/logo.png
		// 加载控件到地图容器中
		controls : ol.control.defaults({// 地图中默认控件
		// attributionOptions: /** @type {ol.control.Attribution} */({
		// collapsible: true //地图数据源信息控件是否可展开,默认为true
		// })
		}).extend([ scaleLineControl, mousePositionControl ])
	});

	// 加载静态地图层
	// if (jobtype == 'image') {
	// 	map.addLayer(new ol.layer.Image({
	// 		title : "作业面",
	// 		source : new ol.source.ImageStatic({
	// 			url : addr,
	// 			imageExtent : extent
	// 		// 映射到地图的范围
	// 		})
	// 	}));
	// }
}

// 初始化标绘信息
function execLocation() {
	try{
		cicrle7 = createCircle(7,cicrle7);
		cicrle8 = createCircle(8,cicrle8);
		cicrle9 = createCircle(9,cicrle9);
	}catch(e){
		console.log(e.name+e.message);
	}
}

function createCircle(no,obj){
	try{
		var curpoint;
		var v_len;
		switch(no){
			case 7:
			curpoint=readcard_p0;
			// v_len =_$("txtFirst").value;
			v_len =a*100;
			break;
			case 8:
			curpoint=readcard_p1;
			// v_len =_$("txtSecond").value;
			v_len =b*100;
			break;
			case 9:
			curpoint=readcard_p2;
			// v_len =_$("txtThird").value;
			// curpoint=[595,0];
			v_len =c*100;
			break;
		}

		if (v_len!=null && v_len!=undefined) {
			console.log("current[" + no + "] length:" + v_len);
			if(obj==null){
				obj = new ol.Feature({
		        	geometry: new ol.geom.Circle(curpoint,v_len),
		        	name:v_len
		        });
			    // var sector = new P.PlotFactory.createPlot(P.PlotTypes.CIRCLE, [curpoint,[0,100]]);
			    // obj = new ol.Feature({
			    //     geometry: sector
			    // });
			    obj.setStyle(styleCicle(obj));
				drawOverlay.getSource().addFeature(obj);
			}else{
				obj.setGeometry(new ol.geom.Circle(curpoint,v_len));
				obj.set("name",v_len);
				obj.setStyle(styleCicle(obj));
			}
		}
		return obj;
	}catch(e){
		console.log(e.name+e.message);
	}
}

// 添加一个标签
// type: helmet安全帽, detector 探测器
// status: 状态0 正常，状态1 告警状态
function addDevice(vid, type, vname, x, y, status) {
	// 创建一个活动图标需要的Feature，并设置位置
	var p = getMercatorCoordinates([x,y]);
	var p1 = ol.proj.transform(p, 'EPSG:3857', 'EPSG:4326');
	console.log('current readcard[ '+vname+' ]:'+x+','+y+'\t p0:'+ p +'\tP1:'+p1);
	var activity = new ol.Feature({
		geometry : new ol.geom.Point(p),
		id : vid,
		name : vname
	});
	return activity;
}

/* 接口调用函数END */

/* 系统功能函数Start */
function initmap(jobid) {
	// 地图设置中心，设置到成都，在本地离线地图 offlineMapTiles刚好有一张zoom为4的成都瓦片
	// 计算地图映射到地图上的范围，图片像素为 550*344，保持比例的情况下，把分辨率放大一些
	/*
	 * 处理逻辑： 1、初始化地图： 根据作业面ID,作业面地图类型,作业面地图服务地址,初始位置设置地图位置。 2.
	 * 初始化加载电子围栏：根据作业面ID，加载对应的电子围栏 3、根据作业面ID，初始化探测器位置：固定后不再移动？ 4、初始加载标签位置
	 * 5、定时刷新加载标签位置数据
	 */
	// 1. 根据作业面ID查询对应的地图信息，返回后进行地图绘制。
	// var addr = sysurl + '/images/BJ200S-R1-11.png';
	var addr = sysurl + '/images/office.png';

	// pxsize = 1304;
	// pysize = 1345;
	// pxsize = 441;//1像素代表 1CM，放大100倍后1像素代表1M
	// pysize = 351;
	// scale = 1000;// 此时放大100倍，设置比例尺功能,当图纸为 1:100时，放大到1时，实际应放大100倍，即 0.01
	// 的图上比例设定。

	console.log("开始创建地图");
	console.log("map addr：" + addr);
	createMap('image', addr, pxsize, pysize, scale);


	initPlot();// 加载标绘图层，先加载的图层在下面。

	// 添加活动Feature到layer上，并把layer添加到地图中
	// 创建安全帽图层
	helmetSrc = new ol.source.Vector();
	helmetsLayer = new ol.layer.Vector({
		source :helmetSrc 
	});

	detectorLayer = new ol.layer.Vector({
		source : new ol.source.Vector(),
		style : styles[0]
	});
	
	hisSrc= new ol.source.Vector();
	hisLayer= new ol.layer.Vector({
		source : hisSrc,style:styles[1]
	});
	hisLineSrc = new ol.source.Vector();

	map.addLayer(detectorLayer);
	map.addLayer(hisLayer);//添加轨迹显示
	map.addLayer(new ol.layer.Vector({
		source : hisLineSrc,style:styles[2]
	}));

	map.addLayer(helmetsLayer);
	loadDetector();// 加载探测器信息

	/*
	 * 加入弹出对话框overlayer开始
	 */
	container = document.getElementById('popup');
	content = document.getElementById('popup-content');
	closer = document.getElementById('popup-closer');

	/**
	 * Create an overlay to anchor the popup to the map.
	 */
	overlay = new ol.Overlay(/** @type {olx.OverlayOptions} */
	({
		element : container,
		autoPan : true,
		positioning : 'bottom-center',
		stopEvent : false,
		autoPanAnimation : {
			duration : 250
		}
	}));
	map.addOverlay(overlay); // 添加到地图中

	/**
	 * Add a click handler to hide the popup.
	 * 
	 * @return {boolean} Don't follow the href.
	 */
	closer.onclick = function() {
		// console.log('POP关闭');
		overlay.setPosition(undefined);
		closer.blur();
		return false;
	};

	/** 为map添加鼠标移动事件监听，当指向标注时改变鼠标光标状态 */
	map.on('pointermove', function(e) {
		var pixel = map.getEventPixel(e.originalEvent);
		var hit = map.hasFeatureAtPixel(pixel, function(layer) {
			return layer != drawOverlay;
		});// 过滤标绘区域层
		map.getTargetElement().style.cursor = hit ? 'pointer' : '';
	});

	/**
	 * Add a click handler to the map to render the popup.
	 */
	map.on('singleclick', function(e) {
		var coordinate = e.coordinate;
		//var c1 = ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');// 转换为wgs84坐标
		console.log('You clicked at ' + getRectCoordinates(coordinate));//+'LonLat:'+c1

		// 判断当前单击处是否有要素，捕获到要素时弹出popup
		var allFeaturesAtPixel = [];
		var feature = map.forEachFeatureAtPixel(e.pixel, function(feature,
				layer) {
			allFeaturesAtPixel.push(feature);
			return feature;
		}, function(layer) {
			return layer != drawOverlay;
		});// 选项为不是标绘图层时返回feature;
		// function(layer){return layer == helmetsLayer;});//只返回安全帽层

		var pixel = map.getEventPixel(e.originalEvent);
		if (feature) {
			//var loc = feature.getGeometry();
			// console.log('loc:' + loc.getCoordinates());
			if (feature.get('id') != undefined) {
				var fid = feature.get('id');
				// var hdms = ol.coordinate.toStringHDMS(c1);
				content.innerHTML = ''; // 清空popup的内容容器
				addFeatrueInfo(feature);
				/*
				 * content.innerHTML = '<p>id:' + feature.get('id') + ' name:' +
				 * feature.get('name') + '</p><p>pixel at:' + pixel;
				 */
				overlay.setPosition(coordinate); // 设置popup的位置
			}
		} else if (overlay.getPosition() != undefined) {
			closer.onclick();
		}
	});

	/* 加入弹出对话框overlayer结束 */

	// 添加一个用于选择Feature的交互方式
	// 初始化"选择"的时候，过滤掉区域线图层，使其不能再被选中。
	map.addInteraction(new ol.interaction.Select({
		layers : [ helmetsLayer, detectorLayer ],
		style : selectStyle
	}));
}

// 加载标签位置并显示
function loadDetector() {
	detectorLayer.getSource().addFeature(
			addDevice(1, 'detector', '主站14337', readcard_p0[0], readcard_p0[1], 0));
	detectorLayer.getSource().addFeature(
			addDevice(2, 'detector', '副站14338', readcard_p1[0], readcard_p1[1], 0));
	detectorLayer.getSource().addFeature(
			addDevice(3, 'detector', '副站14339', readcard_p2[0], readcard_p2[1], 0));
	
	//显示距离基站2 14339的距离
	console.log("14337距离14338：" + getLengthByTwoPoints(readcard_p0,readcard_p1)+" CM");
	console.log("14339距离14338：" + getLengthByTwoPoints(readcard_p1,readcard_p2)+" CM");
}

//显示p1到p2的距离
function getLengthByTwoPoints(p1,p2){
	//alert("getLengthByTwoPoints");
	var z=0;
	//(y2-y1)^2+(x2-x1)^2=Z^2
	try{
		z = Math.abs(Math.sqrt(Math.pow((p2[1]-p1[1]),2)+Math.pow((p2[0]-p1[0]),2)));
	}catch(e){
		console.log("getLengthByTwoPoints error:"+e.name+","+e.message);
	}
	return z;
}

// 回到原始视图
function returnInitMap() {
	var pan = ol.animation.pan({
		// duration: 2000,
		// easing: elastic, //松开的参数值
		source : /** @type {ol.Coordinate} */
		(view.getCenter())
	});
	map.beforeRender(pan); // 地图渲染前设置动画效果(pan)
	view.setCenter(center); // 定位
	// view.zoomat(zoomdefault);
}

/**
 * 定时刷新安全帽标签位置
 * 
 * @param {array}
 *            arr
 */
function refreshhelmets(arr) {
	if (arr == undefined) {
		console.log('refreshhelmets获取数据未定义！');
		return;
	}
	
	for (var i = 0; i < arr.length - 1; i++) {
		var obj = arr[i];
		
		if(obj.alarm_status==2){
			//删除普通图层的图标
			deleteHalmet(obj);
			//添加或修改告警信息
			addAlarmInfo(obj);
		}else{
			//删除告警层的图标
			deleteAlarmInfo(obj);
			addhelmet(obj);
		}
		
		if(isShowHis){
			addHis(obj);//实时轨迹显示
		}
		if(isShowHisLine){
			addHisLine(obj); //显示轨迹线
		}
	}
}

//检查是否更新
function checkIsUpdate(obj){
	// console.log("执行容差检查");
	var res = true;
	var isaddflag = false;
	try{
		if(!debugMode){
			var vmaker = map.getOverlayById("m_"+obj.cardno);
			console.log("maker:"+vmaker);
			var p;
			if(!(vmaker == null || vmaker == undefined)){
				p = getRectCoordinates(vmaker.getPosition());//转换为平面坐标
			}else{
				// console.log("检查正常图层");
				var geo1 = helmetSrc.getFeatureById(obj.cardno);
				// console.log("geo1："+geo1);
				if(geo1 != null){
					p = getRectCoordinates(geo1.get('loc'));
				}else{
					return res;
				}
			}
			//console.log("新坐标："+ obj.x+","+obj.y +"\r\n旧坐标：" + p);
			if(Math.abs(p[0]-obj.x)<=precision && Math.abs(p[1]-obj.y)<=precision)
			{
				res=false;
			}
		}
	}catch(e){
		console.log(e.name+":"+e.message);
	}
	//console.log('地标更新标志：'+res);
	return res;
}

// 添加一个安全帽标签对象
//
function gethelmet(obj) {
	//var point = ol.proj.transform([ obj.x * 1, obj.y * 1 ], 'EPSG:4326','EPSG:3857');
	var point = getMercatorCoordinates([obj.x*1,obj.y*1]);//平面坐标时，不用转换，只看是不否需要在比例尺里面取值。
	
	//console.log('当前helmet位置' + getRectCoordinates(point));
	var activity = new ol.Feature({
		geometry : new ol.geom.Point(point),
		loc:point,
		id : obj.cardno,
		type : 'helmet',
		IDNO : obj.IDNO,
		name : obj.PERSONNAME,
		timein : obj.timein,
		timeread : obj.timeread,
		helmetflag : obj.helmetflag,
		flag_work : obj.flag_work,
		alarm_status : obj.alarm_status
	});
	activity.setId(obj.cardno);
	activity.setStyle(createHalmetStyle(activity));
	return activity;
}

/**
* 添加一个新的图文标注（overlay标注）
* @param {ol.Coordinate} coordinate 坐标点
*/
function addAlarmInfo(obj) {
	try{
		var markerid= "m_"+obj.cardno;
		var textid="t_"+obj.cardno;
		var imgid="i_"+obj.cardno;
		var marker,text;
		//var point = ol.proj.transform([ obj.x * 1, obj.y * 1 ], 'EPSG:4326','EPSG:3857');
		var point = getMercatorCoordinates([obj.x*1,obj.y*1]);//平面坐标时，不用转换，只看是不否需要在比例尺里面取值。
		//console.log("addAlarmInfo Point:" + point);

		//获得两个对象
		marker=map.getOverlayById(markerid);
		text=map.getOverlayById(textid);

		//console.log("addAlarmInfo marker:" + marker + "/t" + text);

		if(marker==null || marker==undefined){
			//新增div元素
		    var elementDiv = document.createElement('div');
		    //elementDiv.className = "marker";
		    elementDiv.title = obj.PERSONNAME;
		    elementDiv.id=markerid;
		    
		    var img = document.createElement('img'); 
		    img.width=30;
		    img.id=imgid;

		    if(obj.helmetflag==1){
		    	img.src=alarmimg12;
		    }else{
		    	img.src=alarmimg02;
		    }
		    elementDiv.appendChild(img);
		    var overlay = document.getElementById('alarm_makers'); // 获取id为label的元素
		    overlay.appendChild(elementDiv); //为ID为label的div层添加div子节点
		    
		    //新增a元素
		    var elementA = document.createElement("a");
		    elementA.className = "markertext";
		    elementA.id=textid;
		    //elementA.href = "#";
		    setInnerText(elementA, elementDiv.title + getRectCoordinates(point));
		    elementDiv.appendChild(elementA);

		    //实例化图文标注（图形+文本），添加到地图容器中
		    marker = new ol.Overlay({
		    	id:elementDiv.id,
		        position: point,
		        positioning: 'center-center',
		        element: elementDiv,
		        stopEvent: false
		    });
		    map.addOverlay(marker);
		    text = new ol.Overlay({
		    	id:elementA.id,
		        position: point,
		        element: elementA
		    });
		    map.addOverlay(text);
		}else{
			//变更帽子佩戴状态
			var img = _$(imgid);
			var txtmarker = _$(textid);
			//console.log("修改位置text:" + txtmarker);
			setInnerText(txtmarker, obj.PERSONNAME + getRectCoordinates(point));
			if(obj.helmetflag==1){
		    	img.src=alarmimg12;
		    }else{
		    	img.src=alarmimg02;
		    }
			marker.setPosition(point);
			text.setPosition(point);
		}
    }catch(e){
    	console.log("addAlarmInfo error："+e.name + ":" + e.message);
	}
}

//删除告警图标
function deleteAlarmInfo(obj){
	try{
		var markerid= "m_"+obj.cardno;
		var textid="t_"+obj.cardno;
		// var point = getMercatorCoordinates([obj.x*1,obj.y*1]);//平面坐标时，不用转换，只看是不否需要在比例尺里面取值。
		
		var marker=map.getOverlayById(markerid);
		var text=map.getOverlayById(textid);
		if(marker!=null){
			map.removeOverlay(marker);	
		}
		if(text!=null){
			map.removeOverlay(text);
		}
	}catch(e){
		console.log("deleteAlarmInfo error："+e.name + ":" + e.message);	
	}
}

//添加安全帽
function addhelmet(obj){
	try{
		//检查图层中是否包含该标签，如果有，则只更新位置和状态，否则新建一个。
		//console.log("add helmet by id:" + obj.cardno);
		var h = helmetSrc.getFeatureById(obj.cardno);
		// console.log("old helmet:" + h);
		if(h == null){
			h = gethelmet(obj);
			//console.log("create helmet:" + h.getId());
			helmetSrc.addFeature(h);
			//console.log("create helmet finished");
		}else{
			var p = getMercatorCoordinates([obj.x*1,obj.y*1]);
			//console.log("updating helmet by..." + p);
			h.setGeometry(new ol.geom.Point(p));
			h.set('loc',p);
			h.set('timein',obj.timein);
			h.set('helmetflag',obj.helmetflag);
			h.set('flag_work',obj.flag_work);
			h.set('alarm_status',obj.alarm_status);
			h.setStyle(createHalmetStyle(h));
			//console.log("updating helmet finished..." + p);
		}
	}catch(e){console.log(e.name+e.message);}
}

//删除安全帽
function deleteHalmet(obj){
	try{
		var h = helmetSrc.getFeatureById(obj.cardno);
		if(h!=null){
			helmetSrc.removeFeature(h);	
		}
	}catch(e){console.log(e.name+e.message);}
}

//显示实时轨迹
function addHis(obj){
	try{
		var point = new ol.geom.Point(getMercatorCoordinates([obj.x*1,obj.y*1]));//平面坐标时，不用转换，只看是不否需要在比例尺里面取值。
		if(curLocCnt >= maxHis){
			curLocCnt=0;//当前ID值>=最大值时，curLocCnt归0
		}
		var activity = hisSrc.getFeatureById(curLocCnt);
		if(activity==null){
			activity = new ol.Feature({geometry : point});
			activity.setId(curLocCnt);
			hisSrc.addFeature(activity);
		}else{
			activity.setGeometry(point);//变更位置
		}
		curLocCnt++;
	}catch(e){console.log(e.name + e.message);}
}

//添加轨迹历史
function addHisLine(obj){
	try{
		var point = getMercatorCoordinates([obj.x*1,obj.y*1]);//平面坐标时，不用转换，只看是不否需要在比例尺里面取值。
		if(curLocCnt>=maxHis){
			isupdateLine=true;
		}
		if(isupdateLine){
			geoLineHisArr.shift();
			// console.log('删除第一个点');
		}
		geoLineHisArr.push(point);
		
		if (geoLineHis == null) {
			if (geoLineHisArr[1] != undefined) {
				geoLineHis = new ol.geom.LineString(geoLineHisArr);
				hisLineSrc.addFeature(new ol.Feature({
							geometry: geoLineHis
							// ,style: styles[2]
				}));
			}
		} else {
			geoLineHis.setCoordinates(geoLineHisArr);
		}
	}catch(e){console.log(e.name + e.message);}
}

/**
 * 动态创建popup的具体内容
 * 
 * @param {string}
 *            title
 */
function addFeatrueInfo(info) {
	// console.log(info.get('name'));
	var a1 = document.createElement("table");

	var a2 = document.createElement("tbody");

	var a3 = document.createElement("tr");

	var a4 = document.createElement("td");
	a4.innerText = info.get('name');
	// 开始appendchild()追加各个元素
	a3.appendChild(a4);
	a2.appendChild(a3);
	a1.appendChild(a2);
	content.appendChild(a1); // 为content添加img子节点
}

/**
 * 动态设置元素文本内容（兼容）
 */
function setInnerText(element, text) {
	if (typeof element.textContent == "string") {
		element.textContent = text;
	} else {
		element.innerText = text;
	}
}

// 初始化标绘信息
function initPlot() {
	// 绘制好的标绘符号，添加到FeatureOverlay显示。
	drawOverlay = new ol.layer.Vector({
		source : new ol.source.Vector()
	});
	map.addLayer(drawOverlay);

/*	var abortFeature = new ol.Feature({
		//var pabort1=[40, 40];左下  var pabort2=[441, 241];//右上
        geometry: new ol.geom.Polygon([[pabort1, [pabort1[0], pabort2[1]],pabort2,[pabort2[0],pabort1[1]]]]),
        name: 'Polygon Feature'
    });
    abortFeature.setStyle(styleAreaAbort);
	drawOverlay.getSource().addFeature(abortFeature);
*/
	var safeFeature = new ol.Feature({
        geometry: new ol.geom.Polygon([[psafe1, [psafe1[0], psafe2[1]],psafe2,[psafe2[0],psafe1[1]]]]),
        name: 'Polygon Feature'
    });
    safeFeature.setStyle(styleAreaNormal);
	drawOverlay.getSource().addFeature(safeFeature);
}

/* 坐标转换 */
// 平面坐标转墨卡托投影
function getMercatorCoordinates(point) {return [ origin[0] + point[0] * scale, origin[1] + point[1] * scale];}

//墨卡托投影转平面坐标
function getRectCoordinates(point){return [(point[0]/scale).toFixed(0),(point[1]/scale).toFixed(0)];}
/* 坐标转换结束 */

// 切换图层功能

/* 系统功能函数End */

// 显示测量工具
function _$(objid) {
	return document.getElementById(objid);
}

function showMeasureTool() {
	dispHideObj("measureTool");
}

// 显示测量工具
function showlayersControl() {
	dispHideObj("layersControl");
}

function hidelayersControl() {
	dispHideObj("layersControl");
}

function dispHideObj(objid) {
	var obj = _$(objid);
	// alert(obj.style.display);
	if (obj.style.display == "none" || obj.style.display == "") {
		obj.style.display = "inline";
	} else {
		obj.style.display = "none";
	}
}

// 测量工具结束