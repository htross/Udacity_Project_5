/**
 * Created by harrison on 3/14/2015.
 */

var GOOGLEKEY = 'AIzaSyC6K0lfOXQbVuatvK1NAxpng5eaUBBcd6M';
var FACTUALKEY = '1B2bYXVEKjZ8BiRTLOMX1Y1wBkvtnjBLevtFqcLQ';
var locationArray = [];


//name, address, topCuisine, filters.distance, filters.cuisine
function ListElement(name, address, topCuisine, distance, allCuisine) {
    this.formattedLi = name + " - " + address + " - " + topCuisine;
    this.name = name;
    this.distance = distance;
    this.cuisines = allCuisine;
}

ListElement.prototype.isVisable = function() {
    //TODO: add logic to see if we should set elem visible
    return true;
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
};

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

             /*
            var marker = new google.maps.Marker({
                position: myLatlng,
                map: map,
                title:"Hello World!"
            });
            */
        });
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

jQuery("#target").submit(function( event ) {
    alert( "Handler for .submit() called." );
    event.preventDefault();
    var $address = jQuery('#address');
    var $city = jQuery('#city');
    var $state =  jQuery('#state');
    var address = $address.val();
    var city = $city.val();
    var state = $state.val();
    $address.val('');
    $city.val('');
    $state.val('State');

    address = stringFormatHelper(address);
    city = stringFormatHelper(city);
    state = stringFormatHelper(state);
    var formattedAddress = address +"+" + city + "+" + state;
    loadData(formattedAddress);
});


stringFormatHelper = function(str) {
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
