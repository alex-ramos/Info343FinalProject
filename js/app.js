'use strict';
// create angular app
var ChatApp = angular.module('ChatApp', ['ngMessages', 'firebase', 'ui.router']);


ChatApp.config(function($stateProvider, $urlRouterProvider){

    $urlRouterProvider.otherwise("home");


    $stateProvider.state('home', {
        url: '/home',
        templateUrl: 'partials/titlepage.html' 
    })

    .state('signIn', {
        url: '/signIn',
        templateUrl: 'partials/signin.html',
        controller: 'LoginCtrl'
 
    })

    .state('signup', {
            url: '/signUp',
            templateUrl: 'partials/signup.html' ,
            controller: 'LoginCtrl'

    })

    .state('chatpage', {
            url: '/chat',
            templateUrl: 'partials/Chatpage.html',
            controller: 'MessageCtrl'
 
    })


    .state('users', {
            url: '/users',
            templateUrl: 'partials/userlist.html',
            controller: 'MessageCtrl'
 
    })
});


// create angular controller
ChatApp.controller('LoginCtrl', ['$scope', '$firebaseAuth', function($scope, $firebaseAuth) {
    var ref = new Firebase('https://knock-knock343.firebaseio.com/');
    $scope.authObj = $firebaseAuth(ref);

    var options = {
      enableHighAccuracy: true,
      timeout: Infinity,
      maximumAge: 0
    };

    function success(pos) {
      var crd = pos.coords;
        //Fix after firebase is set up
      console.log('Your current position is:');
      console.log('Latitude : ' + crd.latitude);
      console.log('Longitude: ' + crd.longitude);
      console.log('More or less ' + crd.accuracy + ' meters.');
    };

    function error(err) {
      console.warn('ERROR(' + err.code + '): ' + err.message);
    };

    $scope.trackLocation = function(){
         if(navigator.geolocation) {
           $scope.loc = navigator.geolocation.getCurrentPosition(success, error, options);
        } else {
            console.log("Geolocation is not supported by this browser.");
        }
 };


    // function to submit the form after all validation has occurred            
    $scope.submitForm = function(isValid) {
    	// check to make sure the form is completely valid
	$scope.authObj.$authWithPassword({
  		email: "jhall38@uw.edu",
  		password: $scope.main.password
	}).then(function(authData) {
        	console.log("Logged in as:", authData.uid);
	}).catch(function(error) {
  		console.error("Authentication failed:", error);
	});   
    };

    //Checks both password fields and if they match each other
    //Returns true if match, false if different
    $scope.confirmPassword = function(){
    	var pwd1 = $scope.main.password;
    	var pwd2 = $scope.main.cPassw;

    	if(pwd1 === pwd2){
    		return true;
    	}
    	else{
    		return false;
    	}
    }
    //Function to set the validation for the password fields
    $scope.checkFormPassSU = function(){
    	var valid = $scope.confirmPassword();
    	$scope.chatForm.password.$setValidity("password", valid);
    	$scope.chatForm.cPassw.$setValidity("cPassw", valid);
    };

    $scope.checkFormPassSI = function(){
        //checks Firebase to make sure password matches one stored 
        var valid = true;
        $scope.chatForm.password.$setValidity("password", valid);
    };

}]);
ChatApp.controller('MessageCtrl', ['$scope', '$firebaseArray', function($scope, $firebaseArray) {
    var ref = new Firebase("https://knock-knock343.firebaseio.com");
    $scope.messages = $firebaseArray(ref);
    $scope.addMessage = function(){
	$scope.messages.$add({
		text: $scope.newMessage
	});
    };	
    Number.prototype.toRad = function() {
        return this * Math.PI / 180;
    }
	
	/* Write an accessible (on scope) chirp() function to save a tweet */
    $scope.message = function() {
        $scope.chirps.$add({
            text: $scope.newMessage,
            userId: -1,
            likes: 0,
        })
        .then(function(){
            $scope.newChirp = '';
        })
    }

    //Takes in 2 sets of lats and longs and returns their distance in meters
    $scope.calcDistance = function(lat1, lon1, lat2, lon2){
        var R = 6371000; // metres
        var phi1 = lat1.toRad();
        var phi2 = lat2.toRad();
        var dp = (lat2-lat1).toRad();
        var dl = (lon2-lon1).toRad();

        var a = Math.sin(dp/2) * Math.sin(dp/2) +
                Math.cos(phi1) * Math.cos(phi2) *
                Math.sin(dl/2) * Math.sin(dl/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        var d = R * c;
        //Fix after firebase is set up
        console.log(d);
    }

}]);


