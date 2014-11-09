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

var iframeOrchCli = (function(opt){

	var options = opt || {};

	var _origin = (function(){
		var location = window.location,
				origin = location.protocol + '//' + location.host + (location.port ? ':' + location.port : '');

		return origin;
	})();

	/* This is where all the operations that request data to 
			the orchestrator wait for their replies.
		The key is a UUID that is used to get the request object
			when the reply arrives.	*/
	var pendingReplies = {};

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

	// generate a unique identifier
	var _uuid  = function(){
		var now = new Date() * 1,
				rnd = Math.random(),
				nowUnique = (now * rnd);

		return ('' + now + '-' + nowUnique).replace('.','-');
	};

	var _sendMessage = function(action){
		var message = {
			__ifo: true,
			__ts: new Date()*1,
			action: action
		};

		parent.postMessage(message, _origin);
	};

	var getProperty = function(key,callback){

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
		var action = {
			type: 'setProperty',
			data: {
				key: key,
				value: value
			}
		};

		_sendMessage(action);
	};


	var triggerEvent = function(name,data){ /* not implemented */ };
	var watchEvent = function(name,handler){ /* not implemented */ };

	// messages reply receiver
	var receiveMessage = function(event) {
	  var callback = pendingReplies[event.data.uuid];

	  callback(event.data.value);

	  delete pendingReplies[event.data.uuid];
	};

	// start listening for messages reply
	_addEventListener(window, "message", receiveMessage);

	return {
		get: getProperty,
		set: setProperty
		//trigger: triggerEvent,
		//watch: watchEvent
	};
})();