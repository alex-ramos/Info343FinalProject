'use strict';
// create angular app


var thisChatID = 0; //ID of chat the user is currently viewing. This global had to be used due to problems with variables being updating appropriatley when defined in the controller for whatever reason
var ChatApp = angular.module('ChatApp', ['ngMessages', 'firebase', 'ui.router']);


ChatApp.config(function($stateProvider, $urlRouterProvider){

    $urlRouterProvider.otherwise("home");

    $stateProvider.state('home', {
        url: '/home',
        templateUrl: 'partials/titlepage.html',
	controller: 'LoginCtrl'	
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
    var ref = new Firebase('https://knock-knock343.firebaseio.com/'); //reference to database
    var usersRef = new Firebase('https://knock-knock343.firebaseio.com/users/'); //reference to users in database
    $scope.authObj = $firebaseAuth(ref); //used for authrization of user accounts
    $scope.users = $firebaseArray(usersRef); //all of the users in the database
    $scope.user = null; //current user that is signed in. Null if nobody is signed in.
    $scope.error = ''; //error message to be displayed when sign in issues occur
    var options = {
       enableHighAccuracy: true,
       timeout: Infinity,
       maximumAge: 0
    };

    //When location is found
    function success(pos) {
        var crd = pos.coords;
        $scope.lat = Number.parseFloat(crd.latitude);
        $scope.lon = Number.parseFloat(crd.longitude);
    };

    //If location is not found
    function error(err) {
      console.warn('ERROR(' + err.code + '): ' + err.message);
    };
          
    //When user logs in
    $scope.login = function(isValid) {
    	var email = "";
	$scope.session = null;
	//queries the user that has the username that the user entered. Then queries the email associated with that user for authorization purposes
	usersRef.orderByChild("username").equalTo($scope.main.username).on("child_added", function(snapshot) {
        email = $scope.users.$getRecord(snapshot.key()).email;
    	});

    	$scope.authObj.$authWithPassword({
      		email: email,
      		password: $scope.main.password
    	}).then(function(authData) {
		console.log(authData);
		if(authData != null){
			//user was logged in successfully
            		$scope.session = authData;
			$state.go('users');
		}
    	}).catch(function(error) {
      		console.error("Authentication failed:", error);
		$scope.error = error.code;  
	});   
    };
    //signus up a new user
    $scope.signup = function(isValid) {
	$scope.lat = 0;
	$scope.lon = 0;
        //creates a new user for authorization database
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
			//now adding the user to the user database
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
    //logs the user out
    $scope.logout = function(){
    	$state.user = null;
	$state.go('home');
    }
       
     
    //gets the authorization of the current session
    $scope.session = ref.getAuth();
    
    //gets the current user that is signed in
    var getUser = function(){
	    var user = null;
        usersRef.orderByChild("email").equalTo($scope.session.password.email).on("child_added", function(snapshot) {
                user = $scope.users.$getRecord(snapshot.key());
    console.log($scope.user);
    if(user == null){	
	console.log('got here');
	$scope.logout();
    }

        });
	    return user;
    };

    $scope.user = getUser();
    $scope.lat = $scope.user.lat;
    $scope.lon = $scope.user.long;

    //Finds users within 100m of the user and adds them to the scope
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

    //To use in calc Distance function
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
        return d;

    }

    //Options object for location
    var options2 = {
      enableHighAccuracy: true,
      timeout: Infinity,
      maximumAge: 0
    };

    //When location is found
    function success2(pos) {
        var crd = pos.coords;
        var key = 0;
        $scope.lat = crd.latitude;
        $scope.lon = crd.longitude;
        lat = Number.parseFloat(crd.latitude);
        lon = Number.parseFloat(crd.longitude);
        usersRef.orderByChild("email").equalTo($scope.session.password.email).on("child_added", function(snapshot) {
           key = (snapshot.key());
        });       
        var userRef = usersRef.child(key);
        userRef.update({lat: $scope.lat, long:$scope.lon})
    };

    //If locatin cannot be found
    function error2(err) {
         alert('ERROR(' + err.code + '): ' + err.message);
    };

    //Finds the user and takes their location
    $scope.trackLocation = function(){
        if(navigator.geolocation) {
           $scope.loc = navigator.geolocation.getCurrentPosition(success2, error2, options2);
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    }


    $scope.getNearbyUsers(); //called so these users can be displayed rihgt away
    $scope.messages = null;
    //starts chat with the user specified by "user".
    $scope.startChat = function(user){
	var chatsRef = new Firebase('https://knock-knock343.firebaseio.com/chats/');  	
	var userChatsRef = new Firebase('https://knock-knock343.firebaseio.com/users/' + $scope.user.$id + '/chats/');
	$scope.chats = $firebaseArray(chatsRef); //all of the chats in the database
	$scope.userChats = $firebaseArray(userChatsRef); //the chats that are associated with the current user
	var chatExists = false;
	//queries the chat that is with the specified user. If the caht exists, the ID for that chat will be stored.
	userChatsRef.orderByChild("user").equalTo(user).on("child_added", function(snapshot) {
		chatExists = true;
		thisChatID = snapshot.val().chatid;
	});
	//Otherwise, a new chat will be created. That is, a chat in the chats database, whose id will be stored in the chats section of both users (see database for structure)
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
		thisChatID = r.key();
		});

	}
	//takes us to the chat page
	refreshMessages();
	$state.go('chatpage');
    };
    
    //refreshes the messages displayed on the chat. Because firebase is instantanious, this is really only needed to be called once at the beginnin to set up the binding of $scope.messges
    var refreshMessages = function(){
	   var messagesRef = new Firebase('https://knock-knock343.firebaseio.com/chats/' + thisChatID + '/messages/');		
	   $scope.messages = $firebaseArray(messagesRef);
    };
    refreshMessages();
    
    //adds a messsage to the chat
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
