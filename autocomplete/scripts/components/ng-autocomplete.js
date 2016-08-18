(function(angular) {
  	'use strict';
	var keys = {
	    ESC: 27,
	    TAB: 9,
	    RETURN: 13,
	    LEFT: 37,
	    UP: 38,
	    RIGHT: 39,
	    DOWN: 40,
	    BACKSPACE: 8,
	    DELETE: 46
	};

	angular
	.module('myApp')
	.component("autocomplete", {
		templateUrl: 'templates/autocomplete.html',
		controller: AutocompleteController,
		controllerAs : "autocompleteCtrl",
		bindings: {
			title: '@',
			onSelect: '&'
  		}
	})
	.filter('formatResult', ['$sce', function ($sce) {
	 	function escapeRegExChars(value) {
         	return value.replace(/[\-\[\]\/\{\}\(\)\*\+\&\$\!\'\?\.\\\^\$\|]/g, "\\$&");
   	}
		return function (item,str,find) {
			if(find === undefined || find.length == 0){
				return str;
			}
			var pattern = '(' + escapeRegExChars(find) + ')';
			return $sce.trustAsHtml(str.replace(
					new RegExp(pattern + "(?!([^<]+)?>)", "gi"), "<strong>$1<\/strong>")
				);
		};
	}])

	AutocompleteController.$inject = ['$http','$scope','$document','$element']

	function AutocompleteController ($http,$scope,$document,$element){
		var autocompleteCtrl = this;
		var limit = 10;
		autocompleteCtrl.lookup = [];
		autocompleteCtrl.tempLookup = [];
		autocompleteCtrl.id = autocompleteCtrl.title.toLocaleLowerCase();		
		autocompleteCtrl.showSuggestions = false;
		autocompleteCtrl.inputElement = $element.children()[0];
		autocompleteCtrl.suggestionElement = $element.children().children()[1];
		autocompleteCtrl.input = "";
		autocompleteCtrl.selectedOption = "";
		autocompleteCtrl.optionIndex = -1;
		autocompleteCtrl.currentLimit = limit;
		autocompleteCtrl.offset = 5;

		autocompleteCtrl.onFocus = function(){
			if(!autocompleteCtrl.showSuggestions){
				autocompleteCtrl.optionIndex = -1;
				autocompleteCtrl.currentLimit = limit;
				autocompleteCtrl.showSuggestions = true;
			}
		};

		autocompleteCtrl.select = function(option){
			autocompleteCtrl.showSuggestions = false;
			if(option === autocompleteCtrl.selectedOption){
				return;
			}
			if(option){
				autocompleteCtrl.selectedOption = option;
				autocompleteCtrl.input = option.name;				
			}else{
				autocompleteCtrl.selectedOption = "";
				autocompleteCtrl.input = "";
			}
			autocompleteCtrl.onSelect({value : autocompleteCtrl.selectedOption});
		}

		autocompleteCtrl.selectByEnter = function(){
			if(autocompleteCtrl.optionIndex > -1){
				var option = autocompleteCtrl.tempLookup[autocompleteCtrl.optionIndex];
				autocompleteCtrl.select(option);
			}else{
				autocompleteCtrl.hideSuggestions();
			}
		}

		autocompleteCtrl.hideSuggestions = function(){
			var selectedOption = null;
			if(autocompleteCtrl.lookup.length > 0){
				selectedOption = autocompleteCtrl.lookup.filter(function(option){
					return (option.name.toLocaleLowerCase() === autocompleteCtrl.input.toLocaleLowerCase())
				})[0];						
			}
			autocompleteCtrl.select(selectedOption);		
		}

		autocompleteCtrl.onKeyDown = function(evt){
			var key = (evt.keyCode ? evt.keyCode : evt.which);
			switch (key) {				
			 	case keys.TAB:
				case keys.RETURN:
					autocompleteCtrl.selectByEnter();
					break;
			 	case keys.UP:
					if(autocompleteCtrl.optionIndex > -1){
						evt.preventDefault();
					}	
					break;
			 	case keys.DOWN:
				 	if(autocompleteCtrl.optionIndex > -1){
						evt.preventDefault();
					}
					break;
			 	default:
				 	autocompleteCtrl.showSuggestions = true;
					break;
			}
		};

		autocompleteCtrl.onKeyUp = function(evt){
			var key = (evt.keyCode ? evt.keyCode : evt.which);
			switch (key) {
				case keys.ESC:
					autocompleteCtrl.input = "";
					autocompleteCtrl.onFocus();
		     	break;
				case keys.RIGHT:
					return;
				case keys.UP:
					autocompleteCtrl.moveUp();				
					break;
				case keys.DOWN:
					autocompleteCtrl.moveDown();
					break;
				default:
					return;
			}
		};

		autocompleteCtrl.moveUp = function () {
			if(autocompleteCtrl.optionIndex > 0){
     			autocompleteCtrl.optionIndex--;
 			  	$(autocompleteCtrl.suggestionElement).scrollTop(0);//set to top
    			$(autocompleteCtrl.suggestionElement).scrollTop(
    				$(autocompleteCtrl.suggestionElement).find('.focus').offset().top
    				-
    				$(autocompleteCtrl.suggestionElement).height()
				);
     		}
		};

     	autocompleteCtrl.moveDown = function () {
     		if(autocompleteCtrl.optionIndex < autocompleteCtrl.tempLookup.length - 1){
     			autocompleteCtrl.optionIndex++;
 			  	$(autocompleteCtrl.suggestionElement).scrollTop(0);//set to top
 			  	if($(autocompleteCtrl.suggestionElement).find('.focus').offset()){
	    			$(autocompleteCtrl.suggestionElement).scrollTop(
	    				$(autocompleteCtrl.suggestionElement).find('.focus').offset().top
	    				-
	    				$(autocompleteCtrl.suggestionElement).height()
					);
				}
     		}else{
     			autocompleteCtrl.loadMore();
     		}
		};

		autocompleteCtrl.loadMore = function () {
			if(autocompleteCtrl.tempLookup.length < autocompleteCtrl.navigateLookup.length ){
     			autocompleteCtrl.currentLimit += autocompleteCtrl.offset;
     		}
		};

		$(autocompleteCtrl.suggestionElement).on('scroll', function() {
            var scrollableHeight = $(autocompleteCtrl.suggestionElement).prop('scrollHeight');
            var hiddenContentHeight = scrollableHeight - $(autocompleteCtrl.suggestionElement).height();

            if (hiddenContentHeight - $(autocompleteCtrl.suggestionElement).scrollTop() <= 100) {
                // Scroll is almost at the bottom. Loading more rows
                $scope.$apply(autocompleteCtrl.loadMore());
            }                  
        });

		$document.on('click', function (e) {
            var target = e.target.parentElement;
            var parentFound = false;

            while (angular.isDefined(target) && target !== null && !parentFound) {
                if (target.className.split(" ").indexOf('autocomplete-container') > -1 && !parentFound) {
                	if(target === autocompleteCtrl.inputElement){
                    	parentFound = true;
                	}
                }
                target = target.parentElement;
            }
            if (!parentFound) {
                $scope.$apply(function () {
                    autocompleteCtrl.showSuggestions = false;
                });
            }
        });

		activate();

	    function activate() {
	        return getLookup().then(function() {
	        });
	    }

	    function getLookup() {
	        return $http.get('data/test-data.json')
	           .then(function(response) {
	                autocompleteCtrl.lookup = response.data;
	                return autocompleteCtrl.lookup;
	            },function(err){
	            	console.log(err);
	            });
	    }
	}
})(window.angular);