(function(angular) {
  'use strict';
	angular.module('myApp', ['ngSanitize'])
	.controller("MainController",MainController);

	function MainController (){
		var mainCtrl = this;

		mainCtrl.show = function(value){
			console.log(value);
		};
	}
})(window.angular);