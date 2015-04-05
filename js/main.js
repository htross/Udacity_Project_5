/**
 * Created by harrison on 3/14/2015.
 */

//API KEYS
var GOOGLEKEY = 'AIzaSyC6K0lfOXQbVuatvK1NAxpng5eaUBBcd6M';
var FACTUALKEY = '1B2bYXVEKjZ8BiRTLOMX1Y1wBkvtnjBLevtFqcLQ';
var locationArray = [];


//name, address, topCuisine, filters.distance, filters.cuisine

/*
 *  List Element class. Used to create objects in the listData ko.observablearray
 */
function ListElement(name, address, topCuisine, distance, allCuisine) {
    this.formattedLi = name + " - " + address + " - " + topCuisine;
    this.name = name;
    this.distance = distance;
    this.cuisine = allCuisine;
    this.leVisable = ko.observable(true);
}


function MarkerHelperElem(marker, filters) {
    this.marker = marker;
    this.filters = filters;
    this.displayed = true;
}

var AppViewModel = function() {
    this.map = ko.observable(null);
    this.mapFailed = ko.observable(false);
    this.locsFailed = ko.observable(false);
    this.markersHelper = [];
    this.mapVisable = ko.computed(function() {
        return this.map != null;
    }, this);
    this.listData = ko.observableArray();
    this.listVisable = ko.computed(function() {
        return this.listData().length > 0;
    }, this);
    this.resultConditions = {
        "search": '',
        "distanceFilter" : ''
    };
};

//Update the list and map when a user submits a filter/search
AppViewModel.prototype.userFilter = function() {
    var currentListElem;
    var currentMarkerElem;
    var search = this.resultConditions.search.toLowerCase();
    var distance = this.resultConditions.distanceFilter;
    var distanceVal = Number(distance);
    for (var entry in this.listData()) {

        //Same number of entries in both
        currentListElem = this.listData()[entry];
        currentMarkerElem = this.markersHelper[entry];

        //Categories both empty
        if (search === '' && distance === '') {
            //List element will show up
            currentListElem.leVisable(true);
            if (!currentMarkerElem.displayed) {
                currentMarkerElem.displayed = true;
                currentMarkerElem.marker.setMap(this.map());
            }
            //No search, only distance filter
        } else if (search === '') {
            if (currentListElem.distance > distanceVal) {
                currentListElem.leVisable(false);
                if (currentMarkerElem.displayed) {
                    currentMarkerElem.displayed = false;
                    currentMarkerElem.marker.setMap(null);
                }
            } else {
                currentListElem.leVisable(true);
                if (!currentMarkerElem.displayed) {
                    currentMarkerElem.displayed = true;
                    currentMarkerElem.marker.setMap(this.map());
                }
            }

            //No distance only search
        } else if (distance === '') {
            if ($.inArray(search, currentListElem.cuisine) < 0 &&
                currentListElem.name.toLowerCase() != search) {
                currentListElem.leVisable(false);
                if (currentMarkerElem.displayed) {
                    currentMarkerElem.displayed = false;
                    currentMarkerElem.marker.setMap(null);
                }
            } else {
                currentListElem.leVisable(true);
                if (!currentMarkerElem.displayed) {
                    currentMarkerElem.displayed = true;
                    currentMarkerElem.marker.setMap(this.map());
                }
            }

            //Both distance filter and search
        } else {
            if (($.inArray(search, currentListElem.cuisine) < 0 &&
                currentListElem.name.toLowerCase() != search) ||
                currentListElem.distance > distanceVal) {
                currentListElem.leVisable(false);
                if (currentMarkerElem.displayed) {
                    currentMarkerElem.displayed = false;
                    currentMarkerElem.marker.setMap(null);
                }
            } else {
                currentListElem.leVisable(true);
                if (!currentMarkerElem.displayed) {
                    currentMarkerElem.displayed = true;
                    currentMarkerElem.marker.setMap(this.map());
                }
            }

        }
    }
};



var viewModelHandle = new AppViewModel();
ko.applyBindings(viewModelHandle);



function  bindDataToMarker(map, marker, infowindow) {
    google.maps.event.addListener(marker, 'click', function() {
        infowindow.open(map, marker);
    });
}

/**
 * Geocodes address, initializes a new google map at that address, and calls the load
 * restaurant method if successful.
 *
 * Handels failed api calls gracefully
 * @param formattedAddress: address to use in the api call
 */
function loadData(formattedAddress) {
    var googleGeocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=%addr%&key=' + GOOGLEKEY;
    googleGeocodeUrl = googleGeocodeUrl.replace('%addr%', formattedAddress);
    var urlFactual = "http://api.v3.factual.com/t/restaurants-us?geo={%22$circle%22:{%22$center%22:[%lat%,%long%],"+
        "%22$meters%22:%205000}}&limit=50&KEY=" + FACTUALKEY;

    jQuery.getJSON(googleGeocodeUrl, function(data) {
        var lat = data.results[0].geometry.location.lat;
        var long = data.results[0].geometry.location.lng;
        viewModelHandle.map(initialize(lat, long));
        var homeMarker =new google.maps.Marker({
            position: new google.maps.LatLng(lat, long),
            map: viewModelHandle.map(),
            icon: 'images/homeIcon.gif'});
        urlFactual = urlFactual.replace('%lat%', lat).replace('%long%', long);
        loadRestaurantData(urlFactual);

    }).error(function(event) {
        viewModelHandle.locsFailed(true);
        viewModelHandle.mapFailed(true);
        event.preventDefault();
    });
}

/*
 * Loads restaurant data from factual
 */

function loadRestaurantData(urlFactual) {

    //Set array to empty in case user enters a different address
    viewModelHandle.listData([]);

    jQuery.getJSON(urlFactual,function(result) {
        var dataArray = result.response.data;

        for(var index in dataArray) {
            var locLatLong = new google.maps.LatLng(dataArray[index].latitude, dataArray[index].longitude);
            var marker = new google.maps.Marker({
                position: locLatLong,
                map: viewModelHandle.map(),
                title: dataArray[index].name
            });
            var address = dataArray[index].address + ", " + dataArray[index].locality;
            //Top in list of cuisine items

            var topCuisine = "Cuisine Unknown";

            if (dataArray[index].cuisine != null && dataArray[index].cuisine.length > 0) {
                topCuisine = dataArray[index].cuisine[0];
            }

            var infoWindowContent = '<div><h1>title</h1><h3>address</h3><h4>cuisine</h4></div>';
            var infowindow = new google.maps.InfoWindow({
                content: infoWindowContent.replace('title', marker.title).replace('address', address)
                    .replace('cuisine', topCuisine)
            });

            var filters = {};
            //3.28 feet per meter api data in meters
            filters.distance =  dataArray[index].$distance * 3.28;
            filters.name = marker.title;
            filters.cuisine = dataArray[index].cuisine;

            viewModelHandle.markersHelper.push(new MarkerHelperElem(marker, filters));
            viewModelHandle.listData.push(
                new ListElement(filters.name, address, topCuisine, filters.distance, lowerCaseArray(filters.cuisine)));
            bindDataToMarker(viewModelHandle.map(), marker, infowindow);
        }

    }).error(function(event) {
        viewModelHandle.locsFailed(true);
        event.preventDefault();
    });
}

//Used to lowercase all cuisines in the cuisines array to make string compares easier for filtering
function lowerCaseArray(array) {
    for (var str in array) {
        array[str] = array[str].toLowerCase();
    }
    return array;
}


function initialize(lat, long) {
    var mapOptions = {
        center: { lat: lat, lng: long},
        zoom: 18
    };
    return new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);
}



/*
 * A function which encapsulates a jQuery action listner for the address submit button
 */
function submitEntered() {
    $("#target").submit(function (event) {
        event.preventDefault();
        var $address = $('#address');
        var $city = $('#city');
        var $state = $('#state');
        var address = $address.val();
        var city = $city.val();
        var state = $state.val();
        $address.val('');
        $city.val('');
        $state.val('State');

        //Set empty in case user using multiple addresses
        $('#distance').val('');
        $('#search').val('');

        //Reset in case two addresses used
        viewModelHandle.markersHelper = [];

        address = stringFormatHelper(address);
        city = stringFormatHelper(city);
        state = stringFormatHelper(state);
        var formattedAddress = address + "+" + city + "+" + state;
        loadData(formattedAddress);
    });
}

/*
 * A function which encapsulates a jQuery action listner for the filter/search submit button
 */
function filterEntered() {
    $("#filter-search").submit(function (event) {
        event.preventDefault();
        var search = $('#search').val();
        var distance = $('#distance').val();

        viewModelHandle.resultConditions.search = search;
        viewModelHandle.resultConditions.distanceFilter = distance;
        viewModelHandle.userFilter();
    });
}

//A helper function for formatting the address data for the Google Maps API call
function stringFormatHelper(str) {
    var split = str.split(' ');
    var accumulator = '';
    for(var sub in split) {
        //not the first substring
        if(sub > 0) {
            accumulator += '+' + split[sub];
        } else {
            accumulator += split[sub];
        }
    }
    return accumulator;
}


submitEntered();
filterEntered();

