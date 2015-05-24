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
		properties: {},			// global properties store
		subscriptions: {}		// events subscriptions
	};

	var _log = function(input){
		if(settings.logging && window.console){
			console.log(input);
		}
	};

	// centralized JSON parser
	var parseJSON = function(value){
		try {
			return JSON.parse(value);
		} catch (e) {
			return null;
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
	                };
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
		}

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

	var isValidKey = function(key){
		return key !== undefined && key !== null && typeof key === 'string';
	};

	var _localActions = {
		setProperty: function(key,value){
			if(isValidKey){
				_log('setting the property: ' + key + ' = ' + value);
				dataStore.properties[key] = value;
			} else {
				throw new Error('IFrameOrchestrator [setProperty] Invalid property name');
			}
		},		
		getProperty: function(key){
			if(isValidKey){
				var value = dataStore.properties[key];
				_log('getting the property: ' + key + ' = ' + value);
				return value;
			} else {
				throw new Error('IFrameOrchestrator [getProperty] Invalid property name');
			}
		},
		triggerEvent: function(name,data){
			var subscriptions = dataStore.subscriptions[name];
			if(subscriptions && subscriptions.length > 0){
				for (var i = subscriptions.length - 1; i >= 0; i--) {
					
					if(subscriptions[i].source === 'host'){
						subscriptions[i].handler(data);
					} else {
						var result = {
							type: 'eventBroadcast',
							name: name,
							data: data
						};
	
						subscriptions[i].source.postMessage(JSON.stringify(result), subscriptions[i].origin);
					}
				}
			}
		},
		subscribeEvent: function(name,handler){
			_log('IFrameOrchestrator subscribing to event: ' + name);
			
			if(!isValidKey(name)){
				throw new Error('IFrameOrchestrator [subscribeEvent] Invalid event name');
			}
			
			/* create a special subscription that will be identified as internal 
				this is important because this subscription cannot be propagated, it should only be handled internally
			*/

			var subscription = {
				source: 'host',
				handler: handler
			};

			dataStore.subscriptions[name] = dataStore.subscriptions[name] || [];
			dataStore.subscriptions[name].push(subscription);
			
		}
	};

	// all the possible objects that can be called from the client IFrame
	var _messageActions = {
		setProperty: function(event){
			var _data = parseJSON(event.data);
			if(_data === undefined || _data === null){
				return;
			}
			
			_localActions.setProperty(_data.action.data.key, _data.action.data.value);
		},
		getProperty: function(event){
			var _data = parseJSON(event.data);
			if(_data === undefined || _data === null){
				return;
			}
			
			var value = _localActions.getProperty(_data.action.data.key);

			var result = {
				type: 'getPropertyReply',
				uuid: _data.action.uuid,
				value: value
			};

			_log('replying to: ' + _data.action.uuid);
			event.source.postMessage(JSON.stringify(result), event.origin);
		},
		subscribeEvent: function(event){
			var _data = parseJSON(event.data);
			if(_data === undefined || _data === null){
				return;
			}
			
			_log('subscribing request to event: ' + _data.action.event.name);

			var name = _data.action.event.name;

			var subscription = {
				source: event.source,
				origin: event.origin
			};

			dataStore.subscriptions[name] = dataStore.subscriptions[name] || [];
			dataStore.subscriptions[name].push(subscription);
		},
		unsubscribeEvent: function(event){
			var _data = parseJSON(event.data);
			if(_data === undefined || _data === null){
				return;
			}
			
			_log('unsubscribing request to event: ' + _data.action.event.name);

			var name = _data.action.event.name;

			if(dataStore.subscriptions[name] !== undefined){
				for (var i = dataStore.subscriptions[name].length - 1; i >= 0; i--) {
					if(dataStore.subscriptions[name][i].source === event.source){
						dataStore.subscriptions[name].splice(i, 1);
					}
				}
			}
		},
		triggerEvent: function(event){
			var _data = parseJSON(event.data);
			if(_data === undefined || _data === null){
				return;
			}
			
			_log('trigger request of event: ' + _data.action.event.name);

			var name = _data.action.event.name,
				data = _data.action.event.data,
				iframe = _data.iframe,
				subscriptions = dataStore.subscriptions[name];

			if(subscriptions && subscriptions.length > 0){
				for (var i = subscriptions.length - 1; i >= 0; i--) {
					
					if(subscriptions[i].source === 'host'){
						// local event handler
						subscriptions[i].handler(data, { iframe: iframe });	// execute handler
					} else {
						var result = {
							type: 'eventBroadcast',
							name: name,
							data: data
						};
	
						subscriptions[i].source.postMessage(JSON.stringify(result), subscriptions[i].origin);	
					}
				}
			}
		}
	};

	// messages receiver
	var receiveMessage = function(event) {
	  var _data = null;
	  
	  if(!event){
	  	return;
	  } else if (event.data && typeof event.data === 'string'){
		_data = parseJSON(event.data);
		if(_data === undefined || _data === null){
			return;
		}
	  }
	  
	  if (!_isAllowedOrigin(event.origin) || !_isExpectedMessage(_data)){
	    return;
	  }

	  _log('got your message');
	  
	  // call the appropriate action type method
	  _messageActions[_data.action.type](event);
	};




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
				setProperty: _localActions.setProperty,
				triggerEvent: _localActions.triggerEvent,
				subscribeEvent: _localActions.subscribeEvent
			};
		};
	};



	// start listening for messages
	_addEventListener(window, "message", receiveMessage);

	if (typeof define === 'function' && define.amd) {
		define(function (){ return _createNativePublicFunction(); });
	} else {
		window.iframeOrchestrator = _createNativePublicFunction();
	}

})();