/* 
	IFrame Orchestrator
	-------------------

	This File is meant to be placed in the parent page that will contain all the IFrames

	Functionality:
		set trusted origins (* accepts everything)

		Variables
			get/set variable values
			configure initial variables (taken from url, cookie or field)
			set variable from child iframe
		
		Events
			register iframe listeners (frames can expect events from other iframes)

	Options (optional):
		allowedOrigins
				Array that contains all the accepted domains.
				['http://www.mydomain.com', 'https://demo.mydomain.com']
*/

;(function iframeOrchestrator(){
	'use strict';

	var settings = {};
	var defaultOptions = {
		allowedOrigins: '*',
		logging: false
	};

	// Used to store all data
	var dataStore = {
		properties: {}
	};

	var _log = function(input){
		if(settings.logging && window.console){
			console.log(input);
		}
	};

	// cross browser addEventListener (https://gist.github.com/eduardocereto/955642)
	var _addEventListener = function(obj, evt, fnc) {
	    // W3C model
	    if (obj.addEventListener) {
	        obj.addEventListener(evt, fnc, false);
	        return true;
	    } 
	    // Microsoft model
	    else if (obj.attachEvent) {
	        return obj.attachEvent('on' + evt, fnc);
	    }
	    // Browser don't support W3C or MSFT model, go on with traditional
	    else {
	        evt = 'on'+evt;
	        if(typeof obj[evt] === 'function'){
	            // Object already has a function on traditional
	            // Let's wrap it with our own function inside another function
	            fnc = (function(f1,f2){
	                return function(){
	                    f1.apply(this,arguments);
	                    f2.apply(this,arguments);
	                }
	            })(obj[evt], fnc);
	        }
	        obj[evt] = fnc;
	        return true;
	    }
	    return false;
	};

	// validate if the origin is allowed
	var _isAllowedOrigin = function(origin){
		if(settings.allowedOrigins === '*'){
			return true;
		}

		origin = origin.toLowerCase();

		for (var i = settings.allowedOrigins.length - 1; i >= 0; i--) {
			if(origin === settings.allowedOrigins[i].toLowerCase()){
				return true;
			}
		};

		_log('Origin rejected: ' + origin);
		return false;
	};

	// validates if the message conforms to the expected format
	var _isExpectedMessage = function(message){
		if(message !== undefined &&
				message !== null &&
				typeof message === 'object' &&
				message.__ifo === true &&		// verify __ifo property (flag)
				!isNaN(message.__ts)){			// verify __ts property (timestamp)
			return true;
		}

		return false;
	};

	var _sendMessage = function(event){
		var message = {
			__ifo: true,
			__ts: new Date()*1,
			action: action
		};

		parent.postMessage(message, _origin);
	};

	var isValidKey = function(key){
		return key !== undefined && key !== null && typeof key === 'string';
	};

	var _localActions = {
		setProperty: function(key,value){
			if(isValidKey){
				_log('setting the property: ' + key);
				dataStore.properties[key] = value;
			} else {
				throw new Error('IFrameOrchestrator [setProperty] Invalid property name');
			}
		},		
		getProperty: function(key){
			if(isValidKey){
				_log('getting the property: ' + key);
				return dataStore.properties[key]
			} else {
				throw new Error('IFrameOrchestrator [getProperty] Invalid property name');
			}
		}
	};

	// all the possible objects that can be called from the client IFrame
	var _messageActions = {
		setProperty: function(event){
			_localActions.setProperty(event.data.action.data.key, event.data.action.data.value);
		},
		getProperty: function(event){
			var value = _localActions.getProperty(event.data.action.data.key);

			var result = {
				uuid: event.data.action.uuid,
				value: value
			};

			_log('replying to: ' + event.data.action.uuid);
			event.source.postMessage(result, event.origin);
		}
	};

	// messages receiver
	var receiveMessage = function(event) {
	  if (!_isAllowedOrigin(event.origin) || !_isExpectedMessage(event.data)){
	    return;
	  }

	  _log('got your message');
	  
	  // call the appropriate action type method
	  _messageActions[event.data.action.type](event);
	}




	var _createNativePublicFunction = function(){

		function processOptions(options){
			options = options || {};

			if ('object' !== typeof options){
				throw new TypeError('Options is not an object.');
			}

			for (var option in defaultOptions) {
				if (defaultOptions.hasOwnProperty(option)){
					settings[option] = options.hasOwnProperty(option) ? options[option] : defaultOptions[option];
				}
			}
		}

		return function(options){
			processOptions(options);

			return {
				getProperty: _localActions.getProperty,
				setProperty: _localActions.setProperty
			}
		};
	}



	// start listening for messages
	_addEventListener(window, "message", receiveMessage);

	if (typeof define === 'function' && define.amd) {
		define(function (){ return _createNativePublicFunction(); });
	} else {
		window.iframeOrchestrator = _createNativePublicFunction();
	}

})();