// === Configuration ===

DATA_HREF = "data.json";
BOTTOM_CANVAS_DEFAULT = 'statistics';

STARTUP_LAT = -25.274;
STARTUP_LON = 133.775;
STARTUP_ZOOM = 4;

// === Functions ===

function getData(success, error){
	$.ajax({
		url: DATA_HREF,
		dataType:'json',
		method: 'GET',
		success: success,
		error: error
	});
}

// === Bottom Info Bar ===

function ldBottomCanvas(){
	$("#bottom_canvas>nav>ul>li.active").removeClass("active");
	$("#" + BOTTOM_CANVAS_DEFAULT + "Btn").addClass("active");
	BOTTOM_CANVAS_PAGE = BOTTOM_CANVAS_DEFAULT;
}

function buildBottomCanvas(page){
	if(page == "statistics"){
		$("#bottom_container").html("Statistics info...");
	}
	if(page == "flightinfo"){
		getData(function(data){
			buildFlightTable(data);
		}, function() {
			var data = [];
			buildFlightTable(data);
		});
	}
}

function buildFlightTable(data){
	$("#bottom_container").html(
		"<table class='table table-hover' id='flight_table'>" +
		"<tr>" + 
		"<td><strong>Callsign</strong></td>" + 
		"<td><strong>Squawk</strong></td>" + 
		"<td><strong>Altitude</strong></td>" + 
		"<td><strong>Speed</strong></td>" + 
		"<td><strong>Messages</strong></td>" + 
		"<td><strong>Last Seen</strong></td>" + 
		"</tr>"
	);
	if(data.length === 0){
		$("#flight_table").append("<tr><td colspan='6'>There are no flights being tracked.</td></tr></table>");
		return;
	}
	for(var i=0; i < data.length; i++){
		visible = (data[i].lat != 0 || data[i].lon != 0);
		if(visible){
			$("#flight_table").append(
				"<tr>" +
				"<td>" + data[i].flight + "</td>" +
				"<td>" + data[i].squawk + "</td>" +
				"<td>" + data[i].altitude + "</td>" +
				"<td>" + data[i].speed + "</td>" +
				"<td>" + data[i].messages + "</td>" +
				"<td>" + data[i].seen + "</td>" +
				"</tr>"
			);
		}
	}
	$("#bottom_container").append("</table>");
}

$(function(){
	$("#statisticsBtn").click(function(){
		$("#bottom_canvas>nav>ul>li.active").removeClass("active");
		$("#statisticsBtn").addClass("active");
		BOTTOM_CANVAS_PAGE = "statistics";
		buildBottomCanvas(BOTTOM_CANVAS_PAGE);
	});
	$("#flightinfoBtn").click(function(){
		$("#bottom_canvas>nav>ul>li.active").removeClass("active");
		$("#flightinfoBtn").addClass("active");
		BOTTOM_CANVAS_PAGE = "flightinfo";
		buildBottomCanvas(BOTTOM_CANVAS_PAGE);
	});
});

// === Build Plane Plotting ===

planes = {};

function getPlanes(){
	getData(function(data){
		PlotPlanes(data);
	});
}

function PlotPlanes(data){
	var found = {};
	for(var i = 0; i < data.length; i++){
		plane = data[i];
		found[plane.hex] = true;
		plane.visible = (plane.lat != 0 || plane.lon != 0);
		plane.flight = $.trim(plane.flight);

		if(planes[plane.hex]){
			var oldPlane = planes[plane.hex];
			oldPlane.altitude = plane.altitude;
			oldPlane.speed = plane.speed;
			oldPlane.lat = plane.lat;
			oldPlane.lon = plane.lon;
			oldPlane.visible = plane.visible;
			oldPlane.track = plane.track;
			oldPlane.flight = plane.flight;
			plane = oldPlane;
		}else{
			plane.marker = null;
			planes[plane.hex] = plane;
		}

		if(plane.visible){
			if(plane.marker){
				var planeLatLon = {lat: plane.lat, lng: plane.lon};
				plane.marker.setPosition(planeLatLon);
				plane.marker.setIcon(
					{
						strokeWeight: (1),
						path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
						scale: 5,
						fillColor: 'rgb(255,255,255)',
						fillOpacity: 0.9,
						rotation: plane.track
					}
				);
			}else{
				var planeLatLon = {lat: plane.lat, lng: plane.lon};
				var marker = new google.maps.Marker({
					map: map,
					position: planeLatLon,
					label: plane.flight,
					icon: {
						strokeWeight: (1),
						path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
						scale: 5,
						fillColor: 'rgb(255,255,255)',
						fillOpacity: 0.9,
						rotation: plane.track
					}
				});
				plane.marker = marker;
				plane.marker.plane = plane;
				planes[plane.hex] = plane;
			}
		}
	}
	for (var key in planes) {
		if (!found[key]) {
			var oldPlane = planes[key];
			if (oldPlane.marker) {
				planes[key].marker.setMap(null);
			}
			delete planes[key];
		}
	}
}
// === Generate Map ===

map = null;

function flightInfoBtn(controlDiv, map) {
	var controlUI = document.createElement('div');
	controlUI.style.width = '25px';
	controlUI.style.height = '25px';
	controlUI.style.margin = '10px';
	controlUI.style.textAlign = 'center';
	controlUI.style.cursor = 'pointer';
	controlDiv.appendChild(controlUI);

	var controlText = document.createElement('div');
	controlText.style.color = '#fff';
	controlText.style.fontSize = '25px';
	controlText.innerHTML = '<i class="sidebar-chevron fa fa-bars"></i>';
	controlUI.appendChild(controlText);

	controlUI.addEventListener('click', function() {
		$("#bottom_canvas").slideToggle("slow");
	});
}

$(document).ready(function() {
	var DarkMapStyle = new google.maps.StyledMapType([
		{
			featureType: 'landscape',
			elementType: 'all',
			stylers: [
				{hue: '#1e85ae'},
				{saturation: '-100'},
				{lightness: '-80'}
			]
		},
		{
			featureType: 'water',
			elementType: 'all',
			stylers: [
				{hue: '#000000'},
				{saturation: '-100'},
				{lightness: '-60'}
			]
		},
		{
			featureType: 'water',
			elementType: 'labels',
			stylers: [
				{visibility: 'off'}
			]
		},
		{
			featureType: 'road',
			elementType: 'all',
			stylers: [
				{visibility: 'off'}
			]
		},
		{
			featureType: 'administrative',
			elementType: 'all',
			stylers: [
				{visibility: 'off'}
			]
		},
		{
			featureType: 'poi',
			elementType: 'all',
			stylers: [
				{visibility: 'off'}
			]
		},
		{
			featureType: 'transit',
			elementType: 'all',
			stylers: [
				{visibility: 'off'}
			]
		},
		{
			featureType: 'transit.station.airport',
			elementType: 'all',
			stylers: [
				{visibility: 'on'},
				{hue: '#203c4a'},
				{saturation: '-100'},
				{lightness: '-30'}
			]
		},
		{
			featureType: 'administrative.country',
			elementType: 'geometry.stroke',
			stylers: [
				{visibility: 'on'},
				{hue: '#0091ff'},
				{saturation: '-100'},
				{lightness: '30'},
				{weight: '1'}
			]
		},
		{
			featureType: 'administrative.locality',
			elementType: 'labels',
			stylers: [
				{visibility: 'on'},
				{invert_lightness: 'true'},
				{weight: '3'}
			]
		}
	],
	{
		name: 'Radar (Dark)'
	});
	var BlueMapStyle = new google.maps.StyledMapType([
		{
			featureType: 'landscape',
			elementType: 'all',
			stylers: [
				{hue: '#1e85ae'},
				{saturation: '-20'},
				{lightness: '-40'}
			]
		},
		{
			featureType: 'water',
			elementType: 'all',
			stylers: [
				{hue: '#203c4a'},
				{saturation: '-70'},
				{lightness: '-60'}
			]
		},
		{
			featureType: 'water',
			elementType: 'labels',
			stylers: [
				{visibility: 'off'}
			]
		},
		{
			featureType: 'road',
			elementType: 'all',
			stylers: [
				{visibility: 'off'}
			]
		},
		{
			featureType: 'administrative',
			elementType: 'all',
			stylers: [
				{visibility: 'off'}
			]
		},
		{
			featureType: 'poi',
			elementType: 'all',
			stylers: [
				{visibility: 'off'}
			]
		},
		{
			featureType: 'transit',
			elementType: 'all',
			stylers: [
				{visibility: 'off'}
			]
		},
		{
			featureType: 'transit.station.airport',
			elementType: 'all',
			stylers: [
				{visibility: 'on'},
				{hue: '#203c4a'},
				{saturation: '-10'},
				{lightness: '0'}
			]
		},
		{
			featureType: 'administrative.country',
			elementType: 'geometry.stroke',
			stylers: [
				{visibility: 'on'},
				{hue: '#0091ff'},
				{saturation: '35'},
				{lightness: '60'},
				{weight: '1'}
			]
		},
		{
			featureType: 'administrative.locality',
			elementType: 'labels',
			stylers: [
				{visibility: 'on'},
				{invert_lightness: 'true'},
				{weight: '3'}
			]
		}
	],
	{
		name: 'Radar (Blue)'
	});
	var ATCMapStyle = new google.maps.StyledMapType([
{
			featureType: "water",
			elementType: "geometry",
			stylers: [{
				color: "#000000"
			}, {
				lightness: 17
			}]
		}, {
			featureType: "landscape",
			elementType: "geometry",
			stylers: [{
				color: "#000000"
			}, {
				lightness: 20
			}]
		}, {
			featureType: "road.highway",
			elementType: "geometry.fill",
			stylers: [{
				color: "#000000"
			}, {
				lightness: 17
			}]
		}, {
			featureType: "road.highway",
			elementType: "geometry.stroke",
			stylers: [{
				color: "#000000"
			}, {
				lightness: 29
			}, {
				weight: 0.2
			}]
		}, {
			featureType: "road.arterial",
			elementType: "geometry",
			stylers: [{
				color: "#000000"
			}, {
				lightness: 18
			}]
		}, {
			featureType: "road.local",
			elementType: "geometry",
			stylers: [{
				color: "#000000"
			}, {
				lightness: 16
			}]
		}, {
			featureType: "poi",
			elementType: "geometry",
			stylers: [{
				color: "#000000"
			}, {
				lightness: 21
			}]
		}, {
			elementType: "labels.text.stroke",
			stylers: [{
				visibility: "on"
			}, {
				color: "#000000"
			}, {
				lightness: 16
			}]
		}, {
			elementType: "labels.text.fill",
			stylers: [{
				saturation: 36
			}, {
				color: "#000000"
			}, {
				lightness: 40
			}]
		}, {
			elementType: "labels.icon",
			stylers: [{
				visibility: "off"
			}]
		}, {
			featureType: "transit",
			elementType: "geometry",
			stylers: [{
				color: "#000000"
			}, {
				lightness: 19
			}]
		}, {
			featureType: 'transit.station.airport',
			elementType: 'all',
			stylers: [
				{visibility: 'on'},
				{hue: '#203c4a'},
				{saturation: '-100'},
				{lightness: '-30'}
			]
		}, {
			featureType: "administrative",
			elementType: "geometry.fill",
			stylers: [{
				color: "#000000"
			}, {
				lightness: 20
			}]
		}, {
			featureType: "administrative",
			elementType: "geometry.stroke",
			stylers: [{
				color: "#000000"
			}, {
				lightness: 17
			}, {
				weight: 1.2
			}]
		}
	],
	{
		name: 'Greyscale'
	});
	
	var DarkMapStyleID = 'darkmap';
	var BlueMapStyleID = 'bluemap';
	var ATCMapStyleID = 'atcmap';

	var mapOptions = {
		center: new google.maps.LatLng(STARTUP_LAT, STARTUP_LON),
		zoom: STARTUP_ZOOM,
		disableDefaultUI: true,
		mapTypeControl: true,
		mapTypeControlOptions: {
			style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
			position: google.maps.ControlPosition.TOP_LEFT,
			mapTypeIds: [DarkMapStyleID, BlueMapStyleID, ATCMapStyleID]
		}
	};
	map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

	map.mapTypes.set(DarkMapStyleID, DarkMapStyle);
	map.mapTypes.set(BlueMapStyleID, BlueMapStyle);
	map.mapTypes.set(ATCMapStyleID, ATCMapStyle);
	map.setMapTypeId(DarkMapStyleID);

	var flightInfoDiv = document.createElement('div');
	var flightinfobtn = new flightInfoBtn(flightInfoDiv, map);

	flightInfoDiv.index = 1;
	map.controls[google.maps.ControlPosition.TOP_RIGHT].push(flightInfoDiv);

// === Build page and interval reload ===

//Disable caching of data.json
	$.ajaxSetup({ cache: false });
// Load the bottom information
	ldBottomCanvas();
	setInterval(function(){
		buildBottomCanvas(BOTTOM_CANVAS_PAGE);
		getPlanes();
	}, 1000);
});