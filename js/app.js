'use strict';
// create angular app

var thisChatID = 0;
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
ChatApp.controller('LoginCtrl', ['$scope', '$firebaseAuth', '$firebaseArray', '$state',  function($scope, $firebaseAuth, $firebaseArray, $state) {
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
	console.log("success!");
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
		$state.go('users');
    		
    	}).catch(function(error) {
      		console.error("Authentication failed:", error);
	   });   
    };

    $scope.signup = function(isValid) {
	   $scope.lat = 0;
	   $scope.lon = 0;
    	$scope.authObj.$createUser({
    		  email: $scope.main.email,
    		  password: $scope.main.password
    	}).then(function(userData) {
        	  if(navigator.geolocation) {
            		 $scope.login.loc = navigator.geolocation.getCurrentPosition(success, error, options);
        	  } else {}

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
    				$scope.login();
    			}); 
    	   	 });
    	}).catch(function(error) {
    		  console.error("Error: ", error);
    	});

        $scope.login(true);
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

ChatApp.controller('MessageCtrl', ['$scope', '$firebaseArray', '$firebaseObject', '$state', function($scope, $firebaseArray, $firebaseObject, $state) {
    var lat;
    var lon; 
    var ref = new Firebase("https://knock-knock343.firebaseio.com");
    var usersRef = new Firebase('https://knock-knock343.firebaseio.com/users/'); 
    var chatsRef = new Firebase('https://knock-knock343.firebaseio.com/chats/'); 
    
    $scope.session = ref.getAuth();
    var getUser = function(){
	    var user = null;
        usersRef.orderByChild("email").equalTo($scope.session.password.email).on("child_added", function(snapshot) {
                user = $scope.users.$getRecord(snapshot.key());
        });
	    return user;
    };


    $scope.user = getUser();
    $scope.lat = $scope.user.lat;
    $scope.lon = $scope.user.long;

    $scope.getNearbyUsers = function (){
        var users = [];
        var distances = [];
        var user = null;	
        $scope.trackLocation();
	
		usersRef.once("value", function(snapshot) {
			snapshot.forEach(function(childSnapshot){
				var user = childSnapshot.val();

				if($scope.calcDistance(user.lat, user.long) < 100 && user.username != $scope.user.username){
					users.push(user);
				}
			});	
        	});


        for(var i = 0; i < users.length; i++){
            var distance = $scope.calcDistance(Number.parseFloat(users[i].lat), Number.parseFloat(users[i].long));
            if(distance > 0 && distance < 100){
                distances.push(users[i]);
            }
        }

        $scope.nearbyUserDistances = distances;
	$scope.nearbyUsers = users;
    };




    Number.prototype.toRad = function() {
        return this * Math.PI / 180;
    }
	
  //Takes in 2 sets of lats and longs and returns their distance in meters
    $scope.calcDistance = function(lat2, lon2){
        var R = 6371000; // metres
        var lat1 = Number.parseFloat($scope.lat);
        var lon1 = Number.parseFloat($scope.lon);
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
        return d;

    }

    var options2 = {
      enableHighAccuracy: true,
      timeout: Infinity,
      maximumAge: 0
    };

    function success2(pos) {
        var crd = pos.coords;
        var key = 0;
        $scope.lat = crd.latitude;
        $scope.lon = crd.longitude;
        lat = Number.parseFloat(crd.latitude);
        lon = Number.parseFloat(crd.longitude);
        //console.log(lat + ' ' + lon);
        usersRef.orderByChild("email").equalTo($scope.session.password.email).on("child_added", function(snapshot) {
           key = (snapshot.key());
        });       
        var userRef = usersRef.child(key);
        userRef.update({lat: $scope.lat, long:$scope.lon})
    };

    function error2(err) {
         alert('ERROR(' + err.code + '): ' + err.message);
    };

    $scope.trackLocation = function(){
        if(navigator.geolocation) {
           $scope.loc = navigator.geolocation.getCurrentPosition(success2, error2, options2);
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    }
    $scope.getNearbyUsers();
    $scope.messages = null;
    $scope.startChat = function(user){
	var chatsRef = new Firebase('https://knock-knock343.firebaseio.com/chats/');  	
	var userChatsRef = new Firebase('https://knock-knock343.firebaseio.com/users/' + $scope.user.$id + '/chats/');
	$scope.chats = $firebaseArray(chatsRef);
	$scope.userChats = $firebaseArray(userChatsRef);
	var chatExists = false;
	userChatsRef.orderByChild("user").equalTo(user).on("child_added", function(snapshot) {
		chatExists = true;
		thisChatID = snapshot.val().chatid;
		$scope.apply();	
	});
	if(!chatExists){
		$scope.chats.$add({
			participants : $scope.user.username + ',' + user
		}).then( function(r){
		$scope.userChats.$add({
			user: user,
			chatid: r.key()
		});
        	usersRef.orderByChild("username").equalTo(user).on("child_added", function(snapshot) {
			var otherUserChatsRef = new Firebase('https://knock-knock343.firebaseio.com/users/' + snapshot.key() + '/chats/');
			var otherUserChats = $firebaseArray(otherUserChatsRef);
			otherUserChats.$add({
				user: $scope.user.username,
				chatid: r.key()
			});
		});
		$scope.thisChat.id = r.key();
		$scope.$apply();
		});

	}
	
	$state.go('chatpage');
	$scope.$apply();	
    };
    var refreshMessages = function(){
	   var messagesRef = new Firebase('https://knock-knock343.firebaseio.com/chats/' + thisChatID + '/messages/');		
	   $scope.messages = $firebaseArray(messagesRef);
    };
    refreshMessages();
    
    $scope.addMessage = function(){
	    var messagesRef = new Firebase('https://knock-knock343.firebaseio.com/chats/' + thisChatID + '/messages/');		
	    $scope.messages = $firebaseArray(messagesRef);
        $scope.messages.$add({
		author: $scope.user.username, 
    		text: $scope.newMessage
    	});
        document.getElementById("chatForm").reset();    

    };	
}]);