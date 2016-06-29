'use strict';

var ViewModel = function() {
  var self = this;

  //Define places to be shown in the list.
  this.places = ko.observableArray([]);

  //Hide all markers.
  this.hideMarkers = function() {
    for (var i = 0, len = markers.length; i < len; i++) {
      markers[i].setMap(null);
    }
  };

  //Search for matching places and update list and markers.
  this.search = function() {
    //Clear list and hide all markers.
    self.places([]);
    self.hideMarkers();

    var filter = $('#place-filter').val();

    //If there are places matching the search query, update list and marker.
    for (var i = 0, len = places.length; i < len; i++) {
      if (places[i].name.indexOf(filter) > -1) {
        self.places.push(places[i]);
        markers[i].setMap(map);
      }
    }

    //If no places match, alert user.
    if (self.places().length === 0) {
      window.alert('No result!');
    }
  };

  //li click listener to open info window.
  this.openInfoWindow = function(id) {
    for (var i = 0, len = markers.length; i < len; i++) {
      if (id === markers[i].id) {
        getPlaceDetails(markers[i]);
      }
    }
  };

  //Show menu
  this.showMenu = function() {
    $('.bar').css('transform', 'translateX(0)');
    $('.menu').css('display', 'none');
  };

  //Close menu
  this.closeMenu = function() {
    $('.bar').css('transform', 'translateX(-260px)');
    $('.menu').css('display', 'inline-block');
  };
};

var viewModel = new ViewModel();
ko.applyBindings(viewModel);

//Global variables.
var map, infoWindow, places = [], markers = [];

//Init map and list
function initMap() {
  var centerLatLng = new google.maps.LatLng(39.916558, 116.455651);

  map = new google.maps.Map($('#map')[0], {
    center: centerLatLng,
    zoom: 16,
    mapTypeControl: false
  });

  //Search nearby restaurants, save the data, call initMarkers function to init all markers.
  var nearbySearchRequest = {
    location: centerLatLng,
    radius: '500',
    types: ['restaurant']
  };

  var service = new google.maps.places.PlacesService(map);
  service.nearbySearch(nearbySearchRequest, function(results, status, pagination) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      for (var i = 0, len = results.length; i < len; i++) {
        var place = {};
        var result = results[i];

        place.latLng = result.geometry.location;
        place.id = result.place_id;
        place.name = result.name;
        place.icon = result.icon;

        places.push(place);

        viewModel.places.push(place);
      }

      initMarkers();
    } else {
      window.alert(results.status);
    }
  });

  //Init infoWindow
  infoWindow = new google.maps.InfoWindow({
    content: ''
  });
}

//Init all markers and push to markers array.
function initMarkers() {
  var bounds = new google.maps.LatLngBounds();

  for (var i = 0, len = places.length; i < len; i++) {
    var place = places[i];

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
      position: place.latLng,
      id: place.id,
      animation: google.maps.Animation.DROP
    });

    marker.addListener('click', function() {
      if (infoWindow.marker != this) {
        getPlaceDetails(this);
      }
    });

    markers.push(marker);
    bounds.extend(marker.position);
  }

  map.fitBounds(bounds);
}

//Get and show details of a place.
function getPlaceDetails(marker) {
  var service = new google.maps.places.PlacesService(map);
  service.getDetails({
    placeId: marker.id
  }, function(place, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
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

      infoWindow.marker = marker;
      infoWindow.setContent(innerHTML);
      infoWindow.open(map, marker);

      infoWindow.addListener('closeclick', function() {
        infoWindow.marker = null;
      });
    } else {
      window.alert('Cannot get info');
    }
  });
}
