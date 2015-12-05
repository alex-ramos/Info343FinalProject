//
'use strict';
// create angular app
var ChatApp = angular.module('ChatApp', ['ngMessages', 'firebase']);

// create angular controller
ChatApp.controller('LoginCtrl', ['$scope', '$firebaseArray', '$firebaseSimpleLogin',  function($scope, $firebaseArray, $firebaseSimpleLogin) {
    var ref = new Firebase("");
    $scope.data = $firebaseArray(ref);
    
    var options = {
      enableHighAccuracy: true,
      timeout: Infinity,
      maximumAge: 0
    };

    function success(pos) {
      var crd = pos.coords;

      console.log('Your current position is:');
      console.log('Latitude : ' + crd.latitude);
      console.log('Longitude: ' + crd.longitude);
      console.log('More or less ' + crd.accuracy + ' meters.');
    };

    function error(err) {
      console.warn('ERROR(' + err.code + '): ' + err.message);
    };


    // function to submit the form after all validation has occurred            
    $scope.submitForm = function(isValid) {
    	// check to make sure the form is completely valid
        if(navigator.geolocation) {
           $scope.loc = navigator.geolocation.getCurrentPosition(success, error, options);
           console.log($scope.loc);
        } else {
            console.log("Geolocation is not supported by this browser.");
        }

	var mainRef = new Firebase(url);
	var auth = $firebaseSimpleLogin(mainRef);
	auth.$login('password', {
	

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
    $scope.checkFormPass = function(){
    	var valid = $scope.confirmPassword();
    	$scope.chatForm.password.$setValidity("password", valid);
    	$scope.chatForm.cPassw.$setValidity("cPassw", valid);
    };
    //resets all fields
    $scope.reset = function(){
    	$('input').val = 0;
    };



    $scope.signIn = function(){
        var newUrl = "signin.html";
        document.location.href = newUrl;

    };



    $scope.newUser = function(){
        var newUrl = "signup.html";
        document.location.href = newUrl;
    };
}]);
