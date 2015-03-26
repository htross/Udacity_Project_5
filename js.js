/**
 * Created by harrison on 3/14/2015.
 */

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
    this.cuisines = allCuisine;
    this.leVisable = ko.observable(true); //USE FUNC TO SET THIS WHEN STUFF CHANGES
}

ListElement.prototype.changeVisability = function() {
    if(this.name.length > 5) {
        this.leVisable(false);
    }
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
    console.log(this.listData());
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
}



var viewModelHandle = new AppViewModel();
ko.applyBindings(viewModelHandle);



function  bindDataToMarker(map, marker, infowindow) {
    google.maps.event.addListener(marker, 'click', function() {
        infowindow.open(map, marker);
    });
}

function loadData(formattedAddress) {
    var googleGeocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=%addr%&key=' + GOOGLEKEY;
    googleGeocodeUrl = googleGeocodeUrl.replace('%addr%', formattedAddress);
    var urlFactual = "http://api.v3.factual.com/t/restaurants-us?geo={%22$circle%22:{%22$center%22:[%lat%,%long%],"+
                "%22$meters%22:%205000}}&limit=50&KEY=" + FACTUALKEY;

    jQuery.getJSON(googleGeocodeUrl, function(data) {
        console.log("Geocode");
        console.log(googleGeocodeUrl);
        console.log(data);
        var lat = data.results[0].geometry.location.lat;
        var long = data.results[0].geometry.location.lng;
        viewModelHandle.map(initialize(lat, long));

        var homeMarker =new google.maps.Marker({
            position: new google.maps.LatLng(lat, long),
            map: viewModelHandle.map(),
            icon: 'homeIcon.gif'});

        urlFactual = urlFactual.replace('%lat%', lat).replace('%long%', long);

        console.log(urlFactual);

        loadRestaurantData(urlFactual);

    }).error(function(event) {
        viewModelHandle.locsFailed(true);
        viewModelHandle.mapFailed(true);
        alert( "Load map failed" );
        event.preventDefault();
    });
}

function loadRestaurantData(urlFactual) {
    jQuery.getJSON(urlFactual,function(result) {

        console.log(result);
        console.log(result.response.data);

        var dataArray = result.response.data;

        console.log(dataArray);

        for(var index in dataArray) {
            var locLatLong = new google.maps.LatLng(dataArray[index].latitude, dataArray[index].longitude);
            console.log(locLatLong);
            var marker = new google.maps.Marker({
                position: locLatLong,
                map: viewModelHandle.map(),
                title: dataArray[index].name
            });
            var address = dataArray[index].address + ", " + dataArray[index].locality;
            //Top in list of cuisine items
            if (dataArray[index].cuisine.length > 0) {
                var topCuisine = dataArray[index].cuisine[0];
            } else {
                topCuisine = "Cuisine Unknown";
            }


            var infowindow = new google.maps.InfoWindow({
                content: marker.title + '\n' + address + '\n' + topCuisine
            });

            var filters = {};
            //3.28 feet per meter api data in meters
            filters.distance =  dataArray[index].$distance * 3.28;
            filters.name = marker.title;
            filters.cuisine = dataArray[index].cuisine;

            viewModelHandle.markersHelper.push(new MarkerHelperElem(marker, filters));

            viewModelHandle.listData.push(
                new ListElement(filters.name, address, topCuisine, filters.distance, filters.cuisine));

            bindDataToMarker(viewModelHandle.map(), marker, infowindow);

        }

    }).error(function(event) {
        viewModelHandle.locsFailed(true);
        alert( "Load locs failed" );
        event.preventDefault();
    });
}




function initialize(lat, long) {
    var mapOptions = {
        center: { lat: lat, lng: long},
        zoom: 18
    };
    return new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);
}


function submitEntered() {
    jQuery("#target").submit(function (event) {
        alert("Handler for .submit() called.");
        event.preventDefault();
        var $address = jQuery('#address');
        var $city = jQuery('#city');
        var $state = jQuery('#state');
        var address = $address.val();
        var city = $city.val();
        var state = $state.val();
        $address.val('');
        $city.val('');
        $state.val('State');

        address = stringFormatHelper(address);
        city = stringFormatHelper(city);
        state = stringFormatHelper(state);
        var formattedAddress = address + "+" + city + "+" + state;
        loadData(formattedAddress);
    });
}

function filterEntered() {
    jQuery("#filter-search").submit(function (event) {
        alert("Handler for .submit() called for filter.");
        event.preventDefault();
        var search = $('#search').val();
        var distance = $('#distance').val();

        viewModelHandle.resultConditions.search = search;
        viewModelHandle.resultConditions.distanceFilter = distance;
        viewModelHandle.userFilter();
    });
}


submitEntered();
filterEntered();


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
};
