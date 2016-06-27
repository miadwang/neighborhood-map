'use strict'

function initMap() {
  var miaLoc = {lat: 40.758847, lng: -73.985131};
  var polygon = null;

  var styles = [
    {
      "elementType": "geometry",
      "stylers": [
        {"hue": "#ff4400"},
        {"saturation": -68},
        {"lightness": -4},
        {"gamma": 0.72}
      ]
    },

    {"featureType":"road","elementType":"labels.icon"},{"featureType":"landscape.man_made","elementType":"geometry","stylers":[{"hue":"#0077ff"},{"gamma":3.1}]},{"featureType":"water","stylers":[{"hue":"#00ccff"},{"gamma":0.44},{"saturation":-33}]},{"featureType":"poi.park","stylers":[{"hue":"#44ff00"},{"saturation":-23}]},{"featureType":"water","elementType":"labels.text.fill","stylers":[{"hue":"#007fff"},{"gamma":0.77},{"saturation":65},{"lightness":99}]},{"featureType":"water","elementType":"labels.text.stroke","stylers":[{"gamma":0.11},{"weight":5.6},{"saturation":99},{"hue":"#0091ff"},{"lightness":-86}]},{"featureType":"transit.line","elementType":"geometry","stylers":[{"lightness":-48},{"hue":"#ff5e00"},{"gamma":1.2},{"saturation":-23}]},{"featureType":"transit","elementType":"labels.text.stroke","stylers":[{"saturation":-64},{"hue":"#ff9100"},{"lightness":16},{"gamma":0.47},{"weight":2.7}]}
  ];

  var styledMap = new google.maps.StyledMapType(styles,
    {name: 'Styled Map'});


  var map = new google.maps.Map($('#map')[0], {
    center: miaLoc,
    zoom: 16,
    // mapTypeControl: false,
    mapTypeControlOptions: {
      mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
    }
  });

  map.mapTypes.set('map_style', styledMap);
  map.setMapTypeId('map_style')

  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.POLYGON,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_LEFT,
      drawingModes: [google.maps.drawing.OverlayType.POLYGON]
    }
  });

  drawingManager.addListener('overlaycomplete', function(event) {
    if (polygon) {
      polygon.setMap(null);
      marker.setMap(null);
    }

    drawingManager.setDrawingMode(null);

    polygon = event.overlay;
    polygon.setEditable(true);

    searchWithinPolygon();

    polygon.getPath().addListener('set_at'. searchWithinPolygon);
    polygon.getPath().addListener('insert_at'. searchWithinPolygon);

    var path = polygon.getPath();
    calArea(path);
  });

  function calArea(path) {
    var area = google.maps.geometry.spherical.computeArea(path);
    window.alert(area + 'Square Meters');
  }

  function searchWithinPolygon() {
    if (google.maps.geometry.poly.containsLocation(marker.position, polygon)) {
      marker.setMap(map);
    } else {
      marker.setMap(null);
    }
  }

  function toggleDrawing(drawingManager) {
    if (drawingManager.map) {
      drawingManager.setMap(null);
      if (polygon) {
        polygon.setMap(null);
      }
    } else {
      drawingManager.setMap(map);
    }
  }

  var bounds = new google.maps.LatLngBounds();

  function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
      'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor + '|40|_|%E2%80%A2',
      new google.maps.Size(21, 34),
      new google.maps.Point(0, 0),
      new google.maps.Point(10, 34),
      new google.maps.Size(21, 34)
    );
    return markerImage;
  };

  var defaultIcon = makeMarkerIcon('0091ff');
  var highlightedIcon = makeMarkerIcon('FFFF24');

  var marker = new google.maps.Marker({
    position: miaLoc,
    title: 'Mia',
    icon: defaultIcon,
    animation: google.maps.Animation.DROP,
    id: 'home'
  });

  marker.addListener('mouseover', function() {
    this.setIcon(highlightedIcon);
  });

  marker.addListener('mouseout', function() {
    this.setIcon(defaultIcon);
  });

  marker.addListener('click', function() {
    if (infoWindow.marker != marker) {
      infoWindow.marker = marker;
      infoWindow.setContent('');
      // infoWindow.setContent('<h2>' + marker.title + '</h2><p>' + marker.getPosition().lat() + ', ' + marker.getPosition().lng() + '</p>');
      infoWindow.addListener('closeclick', function() {
        infoWindow.Marker = null;
      });

      var streetViewService = new google.maps.StreetViewService();
      var radius = 50;

      function getStreetView(data, status) {
        if (status == google.maps.StreetViewStatus.OK) {
          var nearStreetViewLocation = data.location.latLng;
                  console.log(data.location);
          var heading = google.maps.geometry.spherical.computeHeading(nearStreetViewLocation, marker.position); //Use the geometry library to calculate

          infoWindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');

          var panoramaOptions = {
            position: nearStreetViewLocation,
            pov: {
              heading: heading,
              pitch: 30
            }
          };

          var panorama = new google.maps.StreetViewPanorama($('#pano')[0], panoramaOptions);

        } else {
          infoWindow.setContent('<div>' + marker.title + '</div><div>No Street View Found</div>');
        }
      };

      streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView); //Get a nearest pano data&status and pass it to getStreetView function

      infoWindow.open(map, marker);
    }
  });

  var infoWindow = new google.maps.InfoWindow({
    content: "This is Mia's Home"
  });

  $('#show-marker').click(function() {
    marker.setMap(map);
    bounds.extend(marker.position);
    // map.fitBounds(bounds);
  })

  $('#hide-marker').click(function() {
    marker.setMap(null);
  })

  $("#toggle-drawing").click(function() {
    toggleDrawing(drawingManager);
  })
}
