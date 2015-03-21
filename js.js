/**
 * Created by harrison on 3/14/2015.
 */

var KEY = 'AIzaSyC6K0lfOXQbVuatvK1NAxpng5eaUBBcd6M';
var locationArray = [];

function ListElement(data1) {
    //TODO add real data hear
    this.data1 = data1;
}

ListElement.prototype.showElem = function() {
    //TODO: add logic to see if we should set elem visible
}


var AppViewModel = function() {
    this.map = ko.observable(null);

    this.mapFailed = ko.observable(false);
    this.locsFailed = ko.observable(false);
    //this.mapAllMakersAndInfoBoxes = ko.observableArray();

    this.mapVisable = ko.computed(function() {
        return this.map != null;
    }, this);

    this.listData = ko.observableArray();

    this.listVisable = ko.computed(function() {
        return (this.listData.length > 0)
    }, this);
};

AppViewModel.prototpye.startApiCalls = function(event) {
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
}

var viewModelHandle = new myViewModel();
ko.applyBindings(viewModelHandle);



function  bindDataToMarker(map, marker, infowindow) {
    google.maps.event.addListener(marker, 'click', function() {
        infowindow.open(map, marker);
    });
}

function loadData(formattedAddress) {
    var googleGeocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=%addr%&key=' + KEY;
    googleGeocodeUrl = googleGeocodeUrl.replace('%addr%', formattedAddress);
    var urlFactual = "http://api.v3.factual.com/t/restaurants-us?geo={%22$circle%22:{%22$center%22:[%lat%,%long%],"+
                "%22$meters%22:%205000}}&limit=50&KEY=1B2bYXVEKjZ8BiRTLOMX1Y1wBkvtnjBLevtFqcLQ";

    jQuery.getJSON(googleGeocodeUrl, function(data) {
        console.log("Geocode");
        console.log(googleGeocodeUrl);
        console.log(data);
        var lat = data.results[0].geometry.location.lat;
        var long = data.results[0].geometry.location.lng;
        var map = initialize(lat, long);

        urlFactual = urlFactual.replace('%lat%', lat).replace('%long%', long);

        console.log(urlFactual);

        jQuery.getJSON(urlFactual,function(result) {

            console.log(result);
            console.log(result.response.data);

            var dataArray = result.response.data;

            console.log(dataArray);

            var li = '<li>%data%</li>';

            for(var index in dataArray) {
                var locLatLong = new google.maps.LatLng(dataArray[index].latitude, dataArray[index].longitude);
                console.log(locLatLong);
                var marker = new google.maps.Marker({
                    position: locLatLong,
                    map: map,
                    title: dataArray[index].name});



                var infowindow = new google.maps.InfoWindow({
                    content: marker.title
                });

                locationArray.push({marker: marker, window: infowindow});

                $('#locList').append(li.replace('%data%', marker.title));

                bindDataToMarker(map, marker, infowindow);

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
