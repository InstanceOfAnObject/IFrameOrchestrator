/* 
	IFrame Orchestrator Client
	--------------------------

	{
		__ifo: true,
		__ts: new Date()*1,
		action: {
			type: 'setProperty',
			data: {
				key: key,
				value: value
			}
		}
	}

	__ifo: is a signature property to identify this message as comming from IFrameOrchestrator
				 Other javascripts might also be sending postMessages and we don't want conflicts.

	This File is meant to be placed in the page that will be rendered inside the IFrame.
*/

(function(){
	'use strict';

	/* This is where all the operations that request data to 
			the orchestrator wait for their replies.
		The key is a UUID that is used to get the request object
			when the reply arrives.	
		Events are identified only by their name */
	var pendingReplies = {},
			subscribedEvents = {};

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

	// generate a unique identifier
	var _uuid  = function(){
		var now = new Date() * 1,
				rnd = Math.random(),
				nowUnique = (now * rnd);

		return (now + '.' + nowUnique);
	};

	var _sendMessage = function(action){
		var message = {
			__ifo: true,
			__ts: new Date()*1,
			action: action
		};

		parent.postMessage(message, '*');
	};

	var isValidKey = function(key){
		return key !== undefined && key !== null && typeof key === 'string';
	};
	var isValidCallback = function(callback){
		return callback !== undefined && callback !== null && typeof callback === 'function';
	};

	var getProperty = function(key,callback){

		if(!isValidKey(key)){
			throw new Error('IFrameOrchestratorClient [getProperty] Invalid property name');
		}
		if(!isValidCallback(callback)){
			throw new Error('IFrameOrchestratorClient [getProperty] [' + key + '] Invalid callback');
		}

		var uuid = _uuid(),
				action = {
					type: 'getProperty',
					uuid: uuid,
					data: {
						key: key
					}
				};

		// store callback for reply action
		pendingReplies[uuid] = callback;

		// send message
		_sendMessage(action);
	};
	var setProperty = function(key,value){
		if(!isValidKey(key)){
			throw new Error('IFrameOrchestratorClient [setProperty] Invalid property name');
		}

		var action = {
			type: 'setProperty',
			data: {
				key: key,
				value: value
			}
		};

		_sendMessage(action);
	};


	var triggerEvent = function(name,data){
		if(!isValidKey(name)){
			throw new Error('IFrameOrchestratorClient [triggerEvent] Invalid event name');
		}

		var action = {
			type: 'triggerEvent',
			event: {
				name: name,
				data: data
			}
		};

		_sendMessage(action);
	};
	var subscribeEvent = function(name,handler){
		if(!isValidKey(name)){
			throw new Error('IFrameOrchestratorClient [subscribeEvent] Invalid event name');
		}

		var action = {
			type: 'subscribeEvent',
			event: {
				name: name
			}
		};

		subscribedEvents[name] = handler;

		_sendMessage(action);
	};
	var unsubscribeEvent = function(name){
		if(!isValidKey(name)){
			throw new Error('IFrameOrchestratorClient [subscribeEvent] Invalid event name');
		}

		if(subscribedEvents[name] !== undefined){
			var action = {
				type: 'unsubscribeEvent',
				event: {
					name: name
				}
			};

			delete subscribedEvents[name];

			_sendMessage(action);
		}
	};

	var inboundActions = {
		getPropertyReply: function(event){
		  var callback = pendingReplies[event.data.uuid];

		  if(callback){
		  	callback(event.data.value);
		  }

		  delete pendingReplies[event.data.uuid];
		},
		eventBroadcast: function(event){
			var name = event.data.name,
					data = event.data.data,
					handler = subscribedEvents[name];
			
			if(handler !== undefined && typeof handler === 'function'){
				handler(data);
			}
		}
	};

	// messages reply receiver
	var receiveMessage = function(event) {
		var action = event.data.type;

		inboundActions[action](event);
	};


	var _createNativePublicFunction = function(){

		return {
			getProperty: getProperty,
			setProperty: setProperty,
			triggerEvent: triggerEvent,
			subscribeEvent: subscribeEvent,
			unsubscribeEvent: unsubscribeEvent
		};
	};



	// start listening for messages reply
	_addEventListener(window, "message", receiveMessage);

	if (typeof define === 'function' && define.amd) {
		define(function (){ return _createNativePublicFunction(); });
	} else {
		window.iframeOrchestratorClient = _createNativePublicFunction();
	}

})();