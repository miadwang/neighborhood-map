'use strict'

var map, marker, polygon = null, placeMarkers = [];
var miaLoc = {lat: 40.758847, lng: -73.985131};

function initMap() {
  //Map
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

  var bounds = new google.maps.LatLngBounds();

  map = new google.maps.Map($('#map')[0], {
    center: miaLoc,
    zoom: 16,
    // mapTypeControl: false,
    mapTypeControlOptions: {
      mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
    }
  });
  map.mapTypes.set('map_style', styledMap);
  map.setMapTypeId('map_style')

  //Marker
  var defaultIcon = makeMarkerIcon('0091ff');
  var highlightedIcon = makeMarkerIcon('FFFF24');

  marker = new google.maps.Marker({
    position: miaLoc,
    title: 'Mia',
    icon: defaultIcon,
    animation: google.maps.Animation.DROP,
    id: 'home'
  });

  //Info Window
  var infoWindow = new google.maps.InfoWindow({
    content: "This is Mia's Home"
  });

  //Drawing
  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.POLYGON,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_LEFT,
      drawingModes: [google.maps.drawing.OverlayType.POLYGON]
    }
  });

  //Inputs
  var zoomAutocomplete = new google.maps.places.Autocomplete(
    $('#zoom-to-area-text')[0]
  );
  zoomAutocomplete.bindTo('bounds', map); //In fact there is an auto bounds set to your current location

  var timeAutocomplete = new google.maps.places.Autocomplete(
    $('#search-within-time-text')[0]
  );

  var searchBox = new google.maps.places.SearchBox(
    $('#places-search')[0]
  );

  //Map class listeners
  map.addListener('bounds_changed', function() {
    searchBox.setBounds(map.getBounds());
  });// Wait for initialization

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
    } else {
      infoWindow.open(map, marker);
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

  searchBox.addListener('places_changed', function() {
    searchBoxPlaces(this);
  });

  //Button listeners
  $('#show-marker').click(function() {
    marker.setMap(map);
    bounds.extend(marker.position);
    map.fitBounds(bounds);
  })

  $('#hide-marker').click(function() {
    marker.setMap(null);
  })

  $('#toggle-drawing').click(function() {
    toggleDrawing(drawingManager);
  });

  $('#zoom-to-area').click(function() {
    zoomToArea();
  });

  $('#search-within-time').click(function() {
    searchWithinTime();
  });

  $('#go-places').click(textSearchPlaces);

}

function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor + '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21, 34)
  );
  return markerImage;
}

function hideMarkers(markers) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
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

function searchWithinPolygon() {
  if (google.maps.geometry.poly.containsLocation(marker.position, polygon)) {
    marker.setMap(map);
  } else {
    marker.setMap(null);
  }
}

function calArea(path) {
  var area = google.maps.geometry.spherical.computeArea(path);
  window.alert(area + 'Square Meters');
}

function zoomToArea() {
  var geocoder = new google.maps.Geocoder();
  var address = $('#zoom-to-area-text').val();
  if (address === '') {
    window.alert('You must enter an area, or address.');
  } else {
    geocoder.geocode(
      { address: address,
        componentRestrictions: {locality: 'New York'}
      }, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          map.setCenter(results[0].geometry.location);
          map.setZoom(15);

          $('#firstComponent').html('The formatted address is: ' + results[0].formatted_address);
          $('#secondComponent').html('The location is: ' + results[0].geometry.location.lat() + ', ' + results[0].geometry.location.lng());
        } else {
          window.alert('We could not find that location - try entering a more specific place.');
        }
      }
    );
  }
}

function searchWithinTime() {
  var distanceMatrixService = new google.maps.DistanceMatrixService;
  var address = $('#search-within-time-text').val();

  if (address === '0') {
    window.alert('You must enter an address.')
  } else {
    marker.setMap(null);
    var origin = marker.position;
    var destination = address;
    var mode = $('#mode').val()

    distanceMatrixService.getDistanceMatrix({
      origins: [origin],
      destinations: [destination],
      travelMode: google.maps.TravelMode[mode],
      unitSystem: google.maps.UnitSystem.IMPERIAL
    }, function(response, status) {
      if (status != google.maps.DistanceMatrixStatus.OK) {
        window.alert('Error was:' + status);
      } else {
        displayMarkerWithinTime(response);
      }
    });

    // distanceMatrixService.getDistanceMatrix({
    //   origins: ['4800 El Camino Real, Los Altos, CA'],
    //   destinations: ['2465 Lathem Street, Mountain View, CA'],
    //   travelMode: google.maps.TravelMode['BICYCLING'],
    //   unitSystem: google.maps.UnitSystem.IMPERIAL
    // }, function(response, status) {
    //   if (status != google.maps.DistanceMatrixStatus.OK) {
    //     window.alert('Error was:' + status);
    //   } else {
    //     window.alert('Distance: ' + response.rows[0].elements[0].distance.text + '. Duration: ' + response.rows[0].elements[0].duration.text + '.')
    //   }
    // });
  }
}

function displayMarkerWithinTime(response) {
  var maxDuration = $('#max-duration').val();
  var origins = response.originAddresses;
  var destinations = response.destinationAddress;
  var atLeastOne = false;
  for (var i = 0; i < origins.length; i++) {
    var results = response.rows[i].elements;
    for (var j = 0; j < results.length; j++) {
      var element = results[i];

      if (element.status != google.maps.DistanceMatrixStatus.OK) {
        window.alert('Error was:' + element.status)
      } else {
        var distanceText = element.distance.text;
        var duration = element.duration.value / 60;
        var durationText = element.duration.text;

        if (duration <= maxDuration) {
          marker.setMap(map);
          atLeastOne = true;

          var infowindow = new google.maps.InfoWindow({
            content: durationText + ' away, ' + distanceText + '<div><button id="show-route" onclick="displayDirections(&quot;' + origins[i] + '&quot;)">View Route</button></div>'
          });
          infowindow.open(map, marker);

          marker.infoWindow = infowindow;
          google.maps.event.addListener(marker, 'click', function() {
            this.infoWindow.close();
          });

          // $('#show-route').click(function(origin) {
          //     return function() {
          //       displayDirections(origin);
          //     };
          // } (origins[i]));
        }
      }
    }
  }
}

function displayDirections(origin) {
  marker.setMap(null);
  var directionsService = new google.maps.DirectionsService;
  var destinationAddress = $('#search-within-time-text').val();
  var mode = $('#mode').val();

  directionsService.route({
    origin: origin,
    destination: destinationAddress,
    travelMode: google.maps.TravelMode[mode]
  }, function(response, status) {
    if (status != google.maps.DistanceMatrixStatus.OK) {
      window.alert('Error was:' + status);
    } else {
      var directionDisplay = new google.maps.DirectionsRenderer({
        map: map,
        directions: response,
        draggable: true,
        polylineOptions: {
          strokeColor: 'green'
        }
      });
    }
  })
}

function searchBoxPlaces(searchBox) {
  hideMarkers(placeMarkers);
  var places = searchBox.getPlaces();

  createMarkerForPlaces(places);

  if (places.length === 0) {
    window.alert('We did not find any places matching that search!');
  }
}

function textSearchPlaces() {
  var bounds = map.getBounds();
  hideMarkers(placeMarkers);

  var placeService = new google.maps.places.PlacesService(map);
  placeService.textSearch({
    query: $('#places-search').val(),
    bounds: bounds
  }, function(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      createMarkerForPlaces(results);
    }
  });
}

function createMarkerForPlaces(places) {
  var bounds = new google.maps.LatLngBounds();
  var placeInfoWindow = new google.maps.InfoWindow();

  for (var i = 0; i < places.length; i++) {
    var place = places[i];
    console.log(place);
    var icon = {
      url: place.icon,
      size: new google.maps.Size(35, 35),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(15, 34),
      scaledSize: new google.maps.Size(25, 25)
    };

    var marker = new google.maps.Marker({
      map: map,
      icon: icon,
      title: place.name,
      position: place.geometry.location,
      id: place.place_id
    });

    marker.addListener('click', function() {
      if (placeInfoWindow.marker == this) {
        console.log('This infowindow already is on this marker');
      } else {
        getPlaceDetails(this, placeInfoWindow);
      }
    });

    placeMarkers.push(marker);

    if (place.geometry.viewport) {
      //Only geocodes have viewport?????
      bounds.union(place.geometry.viewport);
    } else {bounds.extend(place.geometry.location)}
  }
  map.fitBounds(bounds);
} //Default 20 resutls

function getPlaceDetails(marker, infowindow) {
  var service = new google.maps.places.PlacesService(map);
  service.getDetails({
    placeId: marker.id
  }, function(place, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      infowindow.marker = marker;
      var innerHTML = '<div>';

      if (place.name) {
        innerHTML += '<strong>' + place.name + '</strong>';
      }
      if (place.formatted_address) {
        innerHTML += '<br>' + place.formatted_address;
      }
      if (place.formatted_phone_number) {
        innerHTML += '<br>' + place.formatted_phone_number;
      }
      if (place.opening_hours) {
        innerHTML += '<br><br><strong>Hours:</strong><br>' +
        place.opening_hours.weekday_text[0] + '<br>' +
        place.opening_hours.weekday_text[1] + '<br>' +
        place.opening_hours.weekday_text[2] + '<br>' +
        place.opening_hours.weekday_text[3] + '<br>' +
        place.opening_hours.weekday_text[4] + '<br>' +
        place.opening_hours.weekday_text[5] + '<br>' +
        place.opening_hours.weekday_text[6];
      }
      if (place.photos) {
        innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
          {maxHeight: 100, maxWidth: 200}) + '">';
      }
      innerHTML += '</div>';

      infowindow.setContent(innerHTML);
      infowindow.open(map, marker);

      infowindow.addListener('closeclick', function() {
        infowindow.marker = null;
      });
    }
  });
}
