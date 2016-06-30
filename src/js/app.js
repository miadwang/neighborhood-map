'use strict';

var ViewModel = function() {
  var self = this;

  //Define places to be shown in the list.
  this.places = ko.observableArray([]);

  //Search string from user input.
  this.searchString = ko.observable('');

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

    //If there are places matching the search query, update list and marker.
    for (var i = 0, len = places.length; i < len; i++) {
      if (places[i].name.indexOf(self.searchString()) > -1) {
        self.places.push(places[i]);
        markers[i].setMap(map);
      }
    }

    //If no places match, alert user.
    if (self.places().length === 0) {
      window.alert('No result!');
    } else {
      map.fitBounds(bounds);
      self.closeInfoWindow();
    }
  };

  //Show all places.
  this.recovery = function() {
    this.closeInfoWindow();
    self.places([]);

    for (var i = 0, len = places.length; i < len; i++) {
      self.places.push(places[i]);
      markers[i].setMap(map);
    }

    map.fitBounds(bounds);
  };

  //li click listener to open info window.
  this.openInfoWindow = function(data) {
    for (var i = 0, len = markers.length; i < len; i++) {
      if (data.id === markers[i].id) {
        showPlaceDetails(markers[i]);
      }
    }
  };

  //Close info window.
  this.closeInfoWindow = function() {
    infoWindow.marker = null;
    infoWindow.close();
  };

  //Show left bar.
  this.showBar = function() {
    $('.bar').addClass('show');
  };

  //Hide left bar.
  this.hideBar = function() {
    $('.bar').removeClass('show');
  };
};

var viewModel = new ViewModel();
ko.applyBindings(viewModel);

//Global variables.
var map, bounds, infoWindow, googleService;
var places = [], markers = [];

//Init map, search for nearby restaurants, show list and markers.
function init() {
  //Init map and bounds
  var centerLatLng = new google.maps.LatLng(39.916558, 116.455651);
  // var centerLatLng = new google.maps.LatLng(40.758895,-73.985131);

  map = new google.maps.Map($('#map')[0], {
    center: centerLatLng,
    zoom: 15,
    mapTypeControl: false
  });

  map.addListener('click', function() {
    viewModel.hideBar();
  });

  bounds = new google.maps.LatLngBounds();

  //Init infoWindow
  infoWindow = new google.maps.InfoWindow({
    content: '',
    maxWidth: 200
  });

  //Init Google Map search service
  googleService = new google.maps.places.PlacesService(map);

  //Search for nearby restaurants, save the data in places array, show markers and list
  var nearbySearchRequest = {
    location: centerLatLng,
    radius: '500',
    types: ['restaurant']
  };

  googleService.nearbySearch(nearbySearchRequest, function(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      for (var i = 0, len = results.length; i < len; i++) {
        var result = results[i];

        //Init a marker on the map
        var markerIcon = {
          url: result.icon,
          size: new google.maps.Size(35, 35),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(15, 34),
          scaledSize: new google.maps.Size(25, 25)
        };

        var marker = new google.maps.Marker({
          map: map,
          icon: markerIcon,
          title: result.name,
          position: result.geometry.location,
          id: result.place_id,
          animation: google.maps.Animation.DROP
        });

        marker.addListener('click', function() {
          viewModel.hideBar();

          if (infoWindow.marker != this) {
            showPlaceDetails(this);
          }
        });

        marker.addListener('mouseover', function() {
          this.setAnimation(google.maps.Animation.BOUNCE);
        });

        marker.addListener('mouseout', function() {
          this.setAnimation(null);
        });

        markers.push(marker);

        bounds.extend(marker.position);

        //Init a place in the list
        var place = {};

        place.name = result.name;
        place.id = result.place_id;

        places.push(place);
        viewModel.places.push(place);
      }
      map.fitBounds(bounds);
    } else {
      window.alert(results.status);
    }
  });
}

//Get and show details of a place.
function showPlaceDetails(marker) {
  var ginnerHTML = '', finnerHTML = '', innerHTML = '';

  //Use Google Map service to search place details.
  googleService.getDetails({
    placeId: marker.id
  }, function(place, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      ginnerHTML = '<div class="Info" onclick="viewModel.hideBar()" style="text-align:left;line-height:1.5">';

      if (place.name) {
        ginnerHTML += '<strong>' + place.name + '</strong>';
      }
      if (place.formatted_address) {
        ginnerHTML += '<br>' + place.formatted_address;
      }
      if (place.formatted_phone_number) {
        ginnerHTML += '<br>' + place.formatted_phone_number;
      }
      if (place.opening_hours) {
        ginnerHTML += '<br><br><strong>Hours:</strong><br>' +
        place.opening_hours.weekday_text[0] + '<br>' +
        place.opening_hours.weekday_text[1] + '<br>' +
        place.opening_hours.weekday_text[2] + '<br>' +
        place.opening_hours.weekday_text[3] + '<br>' +
        place.opening_hours.weekday_text[4] + '<br>' +
        place.opening_hours.weekday_text[5] + '<br>' +
        place.opening_hours.weekday_text[6];
      }
      if (place.photos) {
        ginnerHTML += '<br><br><img src="' + place.photos[0].getUrl(
          {maxHeight: 100, maxWidth: 200}) + '">';
      }
      ginnerHTML += '<div>' + place.geometry.location.lat() + ', ' + place.geometry.location.lng() + '</div>';

      ginnerHTML += '</div>';
      innerHTML = ginnerHTML + finnerHTML;

      infoWindow.setContent(innerHTML);
    } else {
      window.alert('Cannot get Google info');
    }
  });

  //Use Foursqure API to search for place details
  var foursqureURL = 'https://api.foursquare.com/v2/venues/search?client_id=MBGFPAEKSQLE0ZTQ5AZCBLKZK4HHHDXE4PRFLOWQGCSI04GA&client_secret=2JTELLQFLOEQYH3V5PNKR2GDKUWEKEFP2HP2H4DXYFW0B55M&v=20160601&ll=' + marker.position.lat() + ',' + marker.position.lng() + '&query=' + marker.title + '&limit=1&categoryId=4d4b7105d754a06374d81259';

  //Search for place
  $.getJSON(foursqureURL, function(data) {
    var id = data.response.venues[0].id;

    //Search for place details
    $.getJSON('https://api.foursquare.com/v2/venues/' + id + '?oauth_token=POC4ACUHUQK2TZC2MU01O5VMPCZ0B5JVN5UPGBMYCPDLE4HV&v=20160601', function(data) {
      finnerHTML = '<br><div class="Info" onclick="viewModel.hideBar()" style="text-align:left;line-height:1.5"><strong>Likes and tips from Foursqure</strong>';

      if (data.response.venue.likes) {
        finnerHTML += '<br>Likes: ' + data.response.venue.likes.count;
      }
      if (data.response.venue.rating) {
        finnerHTML += '<br>Rating: ' + data.response.venue.rating;
      }
      if (data.response.venue.price) {
        finnerHTML += '<br>Price: ' + data.response.venue.price.message;
      }

      if (data.response.venue.tips.groups) {
        var n = data.response.venue.tips.groups.length - 1;
      }
      if (data.response.venue.tips.groups[n].items[0]) {
        finnerHTML += '<br>Tips:<br> - ' + data.response.venue.tips.groups[n].items[0].text;
      }
      if (data.response.venue.tips.groups[n].items[1]) {
        finnerHTML += '<br> - ' + data.response.venue.tips.groups[n].items[1].text;
      }
      if (data.response.venue.tips.groups[n].items[2]) {
        finnerHTML += '<br> - ' + data.response.venue.tips.groups[n].items[2].text;
      }

      finnerHTML += '</div>';
      innerHTML = ginnerHTML + finnerHTML;

      infoWindow.setContent(innerHTML);
    });
  });

  infoWindow.marker = marker;
  infoWindow.open(map, marker);

  infoWindow.addListener('closeclick', function() {
    infoWindow.marker = null;
    viewModel.hideBar();
  });
}
