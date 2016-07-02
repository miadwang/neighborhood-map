'use strict';

require('normalize.css');
require('../styles.css');
var $ = require('jquery');
var ko = require('knockout');

//Global variables.
var map, bounds, infoWindow, googleService;
var places = [], markers = [];

//ViewModel class.
var ViewModel = function() {
  var self = this;

  //Define places to be shown in the list.
  this.places = ko.observableArray([]);

  //Search string from user input.
  this.searchString = ko.observable('');

  //This propery controls the appearance of the nav bar.
  this.barAppearance = ko.observable(false);

  //Handle map init error.
  this.mapInitFail = function() {
    window.alert('Sorry, we cannot init Google Map right now. Please try later.');
  };

  //Hide all markers.
  this.hideMarkers = function() {
    for (var i = 0, len = markers.length; i < len; i++) {
      markers[i].setVisible(false);
    }
  };

  //Search for matching places and update list and markers.
  this.search = function() {
    //Clear list and hide all markers.
    self.places([]);
    self.hideMarkers();

    //If there are places matching the search query, update list and marker.
    for (var i = 0, len = places.length; i < len; i++) {
      if (places[i].name.toLowerCase().indexOf(self.searchString().toLowerCase()) > -1) {
        self.places.push(places[i]);
        markers[i].setVisible(true);
      }
    }

    //If no places match, alert user.
    if (self.places().length === 0) {
      window.alert('Sorry, we cannot find any matching places. Please try again.');
      self.recovery();
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
      markers[i].setVisible(true);
    }

    map.fitBounds(bounds);
  };

  //li click listener to open info window.
  this.openInfoWindow = function(data) {
    for (var i = 0, len = markers.length; i < len; i++) {
      if (data.id === markers[i].id) {
        triggerMarkerClick (markers[i]);
      }
    }
  };

  //Close info window.
  this.closeInfoWindow = function() {
    infoWindow.marker = null;
    infoWindow.close();
  };

  //Show nav bar.
  this.showBar = function() {
    self.barAppearance(true);
  };

  //Hide nav bar.
  this.hideBar = function() {
    self.barAppearance(false);
  };
};

window.viewModel = new ViewModel();

//For live search
viewModel.searchString.subscribe(viewModel.search);

//Init map, search for nearby restaurants, show list and markers, init ko bindings.
window.init = function() {
  //Init map and bounds
  // var centerLatLng = new google.maps.LatLng(39.916558, 116.455651);
  var centerLatLng = new google.maps.LatLng(40.758895,-73.985131);

  map = new google.maps.Map($('#map')[0], {
    center: centerLatLng,
    zoom: 15,
    mapTypeControl: false
  });

  map.addListener('click', function() {
    viewModel.hideBar();
  });

  bounds = new google.maps.LatLngBounds();

  window.onresize = function() {
    map.fitBounds(bounds);
  };

  //Init infoWindow
  infoWindow = new google.maps.InfoWindow({
    content: '',
    maxWidth: 200
  });

  infoWindow.addListener('closeclick', function() {
    viewModel.closeInfoWindow(); //Close info window of the last marker
    viewModel.hideBar();
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
          visible: true,
          icon: markerIcon,
          title: result.name,
          position: result.geometry.location,
          id: result.place_id,
          animation: google.maps.Animation.DROP
        });

        marker.addListener('click', function() {
          map.setCenter(this.getPosition());
          this.setAnimation(google.maps.Animation.BOUNCE);
          setTimeout(function () {
            this.setAnimation(null);
          }.bind(this), 1400);

          viewModel.hideBar();

          if (infoWindow.marker != this) {
            showPlaceDetails(this);
          }
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

      //Init ko bindings.
      ko.applyBindings(viewModel);
    } else {
      window.alert('Sorry, we cannot get place data from Google Map right now. Please try later.');
    }
  });
};

//Trigger a marker click event when a list item is clicked to show animation and place details.
function triggerMarkerClick(marker) {
  google.maps.event.trigger(marker, 'click');
}

//Get and show details of a place.
function showPlaceDetails(marker) {
  infoWindow.marker = marker;

  var gInnerHTML = '', fInnerHTML = '', innerHTML = '';
  var gFailHTML = '<br>strong>Sorry, we cannot get info from Google Map right now.</strong>';
  var fFailHTML = '<br><br><strong>Sorry, we cannot get info form Foursquare right now.</strong>';

  //Add content to info window
  function showInfo() {
    innerHTML = '<div class="Info" onclick="viewModel.hideBar()" style="text-align:left;line-height:1.5">' + gInnerHTML + fInnerHTML + '</div>';

    if (infoWindow.marker === marker) {
      infoWindow.setContent(innerHTML);

      if (infoWindow.close) infoWindow.open(map, marker);
    } else return;
  }

  //Use Google Map service to search place details.
  googleService.getDetails({
    placeId: marker.id
  }, function(place, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      if (place.name) {
        gInnerHTML += '<strong>' + place.name + '</strong>';
      }
      if (place.formatted_address) {
        gInnerHTML += '<br>' + place.formatted_address;
      }
      if (place.formatted_phone_number) {
        gInnerHTML += '<br>' + place.formatted_phone_number;
      }
      if (place.opening_hours) {
        gInnerHTML += '<br><br><strong>Hours:</strong><br>' +
        place.opening_hours.weekday_text[0] + '<br>' +
        place.opening_hours.weekday_text[1] + '<br>' +
        place.opening_hours.weekday_text[2] + '<br>' +
        place.opening_hours.weekday_text[3] + '<br>' +
        place.opening_hours.weekday_text[4] + '<br>' +
        place.opening_hours.weekday_text[5] + '<br>' +
        place.opening_hours.weekday_text[6];
      }
      if (place.photos) {
        gInnerHTML += '<br><br><img src="' + place.photos[0].getUrl(
          {maxHeight: 100, maxWidth: 200}) + '">';
      }

      if (place.geometry.viewport) {
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }

      if (gInnerHTML === '') gInnerHTML = 'Sorry, no info from Google Map.';
    } else {
      gInnerHTML = gFailHTML;
    }
    showInfo();
  });

  //Use Foursquare API to search for place details
  var foursquareURL = 'https://api.foursquare.com/v2/venues/search?client_id=MBGFPAEKSQLE0ZTQ5AZCBLKZK4HHHDXE4PRFLOWQGCSI04GA&client_secret=2JTELLQFLOEQYH3V5PNKR2GDKUWEKEFP2HP2H4DXYFW0B55M&v=20160601&ll=' + marker.position.lat() + ',' + marker.position.lng() + '&query=' + marker.title + '&limit=1&categoryId=4d4b7105d754a06374d81259';

  //Search for place
  $.getJSON(foursquareURL, function(data) {
    if (data.response.venues[0]) {
      var id = data.response.venues[0].id;

      //Search for place details
      $.getJSON('https://api.foursquare.com/v2/venues/' + id + '?oauth_token=POC4ACUHUQK2TZC2MU01O5VMPCZ0B5JVN5UPGBMYCPDLE4HV&v=20160601', function(data) {
        fInnerHTML = '<br><br><strong>Info from Foursquare</strong>';

        if (data.response.venue.likes) {
          fInnerHTML += '<br>Likes: ' + data.response.venue.likes.count;
        }
        if (data.response.venue.rating) {
          fInnerHTML += '<br>Rating: ' + data.response.venue.rating;
        }
        if (data.response.venue.price) {
          fInnerHTML += '<br>Price: ' + data.response.venue.price.message;
        }

        if (data.response.venue.tips.groups) {
          var n = data.response.venue.tips.groups.length - 1;
        }
        if (data.response.venue.tips.groups[n].items[0]) {
          fInnerHTML += '<br>Tips:<br> - ' + data.response.venue.tips.groups[n].items[0].text;
        }
        if (data.response.venue.tips.groups[n].items[1]) {
          fInnerHTML += '<br> - ' + data.response.venue.tips.groups[n].items[1].text;
        }
        if (data.response.venue.tips.groups[n].items[2]) {
          fInnerHTML += '<br> - ' + data.response.venue.tips.groups[n].items[2].text;
        }

        if (fInnerHTML === '<br><br><strong>Info from Foursquare</strong>') fInnerHTML = 'Sorry, no info from Foursquare.';

      }).fail(function() {
        fInnerHTML = fFailHTML;

      }).always(function() {
        showInfo();
      });
    } else {
      fInnerHTML = fFailHTML;
      showInfo();
    }
  }).fail(function() {
    fInnerHTML = fFailHTML;
    showInfo();
  });
}
