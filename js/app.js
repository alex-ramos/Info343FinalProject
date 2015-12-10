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
ChatApp.controller('LoginCtrl', ['$scope', '$firebaseAuth', '$firebaseArray', function($scope, $firebaseAuth, $firebaseArray) {
    var ref = new Firebase('https://knock-knock343.firebaseio.com/');
    var usersRef = new Firebase('https://knock-knock343.firebaseio.com/users/');
    var usernamesRef = new Firebase('https://knock-knock343.firebaseio.com/usernames/');
    $scope.authObj = $firebaseAuth(ref);
    $scope.users = $firebaseArray(usersRef);
    $scope.usernames = $firebaseArray(usernamesRef);
    var options = {
       enableHighAccuracy: true,
       timeout: Infinity,
       maximumAge: 0
    };

    function success(pos) {
        var crd = pos.coords;
        $scope.lat = Number.parseFloat(crd.latitude);
        $scope.lon = Number.parseFloat(crd.longitude);
    };

    function error(err) {
      console.warn('ERROR(' + err.code + '): ' + err.message);
    };
          
    $scope.login = function(isValid) {
    	var email = "";
	   $scope.session = null;
	   usersRef.orderByChild("username").equalTo($scope.main.username).on("child_added", function(snapshot) {
            	email = $scope.users.$getRecord(snapshot.key()).email;
    	});

    	$scope.authObj.$authWithPassword({
      		email: email,
      		password: $scope.main.password
    	}).then(function(authData) {
            	$scope.session = authData;
    		
    	}).catch(function(error) {
      		console.error("Authentication failed:", error);
	   });   
    };

    $scope.signup = function(isValid) {
        if(navigator.geolocation) {
             $scope.login.loc = navigator.geolocation.getCurrentPosition(success, error, options);
        } else {

        }

    	$scope.authObj.$createUser({
    		  email: $scope.main.email,
    		  password: $scope.main.password
    	}).then(function(userData) {
    		  console.log("User " + userData.uid + " created successfully!");

    		    return $scope.authObj.$authWithPassword({
    			        email: $scope.main.email,
    				password: $scope.main.password
    		    });
    	}).then(function(authData) {
        		$scope.users.$add({
    			lat: $scope.lat,
    			long: $scope.lon,
    			email: $scope.main.email,
    			username: $scope.main.username
    		    }).then(function(r){
        			usersRef.orderByChild("username").equalTo($scope.main.username).on("child_added", function(snapshot) {
    				console.log($scope.users.$getRecord(snapshot.key()).username);
    				$scope.login();
    			}); 
    	   	 });
    	}).catch(function(error) {
    		  console.error("Error: ", error);
    	});
    }

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

ChatApp.controller('MessageCtrl', ['$scope', '$firebaseArray', '$firebaseObject', function($scope, $firebaseArray, $firebaseObject) {
    var ref = new Firebase("https://knock-knock343.firebaseio.com");
    var usersRef = new Firebase('https://knock-knock343.firebaseio.com/users/'); 
    $scope.session = ref.getAuth();
    var getUser = function(){
	   var user = null;
        usersRef.orderByChild("email").equalTo($scope.session.password.email).on("child_added", function(snapshot) {
                user = $scope.users.$getRecord(snapshot.key());
        });
        console.log(user);
	return user;
    };
    $scope.user = getUser();
    var getNearbyUsers = function (){
    	var nearbyUsers = [];
	usersRef.once("value", function(snapshot) {
		snapshot.forEach(function(childSnapshot){
			var thisUser = childSnapshot.val();
			if($scope.calcDistance(thisUser.lat, thisUser.long) < 999999999999999){
				nearbyUsers.push(thisUser);
			}
		});	
	});
	return nearbyUsers;
    };

    console.log($scope.user);
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
    $scope.calcDistance = function(lat2, lon2){
        var R = 6371000; // metres
        var lat1 = $scope.user.lat;
        var lon1 = $scope.user.long;
        var phi1 = lat1 * Math.PI / 180;
        var phi2 = lat2 * Math.PI / 180;
        var dp = (lat2-lat1) * Math.PI / 180;
        var dl = (lon2-lon1) * Math.PI / 180;
        var a = Math.sin(dp/2) * Math.sin(dp/2) +
                Math.cos(phi1) * Math.cos(phi2) *
                Math.sin(dl/2) * Math.sin(dl/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        var d = R * c;
        //Fix after firebase is set up
        return d;
    }

    var options2 = {
      enableHighAccuracy: true,
      timeout: Infinity,
      maximumAge: 0
    };

    function success2(pos) {
        var crd = pos.coords;
        //Fix after firebase is set up
        var key = 0;
        console.log('Your current position is:');
        console.log('Latitude : ' + crd.latitude);
        console.log('Longitude: ' + crd.longitude);
        console.log('More or less ' + crd.accuracy + ' meters.');
        $scope.lat = crd.latitude;
        $scope.lon = crd.longitude;
        $scope.acc = crd.accuracy;
        usersRef.orderByChild("email").equalTo($scope.session.password.email).on("child_added", function(snapshot) {
           key = (snapshot.key());
        });       
        var userRef = usersRef.child(key);
        userRef.update({lat: $scope.lat, long:$scope.lon})
        console.log(userRef);
        console.log('Scope Latitude : ' + $scope.lat);
        console.log('Scope Longitude: ' + $scope.lon);
    };

    function error2(err) {
         console.warn('ERROR(' + err.code + '): ' + err.message);
    };

    $scope.trackLocation = function(){
        if(navigator.geolocation) {
           $scope.loc = navigator.geolocation.getCurrentPosition(success2, error2, options2);
        } else {
            console.log("Geolocation is not supported by this browser.");
        }
    }

    $scope.nearbyUsers = getNearbyUsers();
    console.log($scope.nearbyUsers);

}]);
