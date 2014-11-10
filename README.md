IFrameOrchestrator
==================

Orchestrates messages between and IFrame and it's parent page and also between IFrames on the same page.

It also does this With IFrames from different domains!

I know that this looks like a bit outdated as a functionality, after all, who uses IFrames anyway!?

Well, if you're asking yourself this question is because you're not a SharePoint developer.
In SharePoint, Provider Hosted Apps are rendered inside IFrames, and sometimes you'll end up with a mess of a dashboard page.

With this tool you'll be able to establish a communication pipeline between each IFrame and it's parent easing a lot of pain.

To take this a bit further, you'll also be able to pass messages (strings of JSON objects) between IFrames.

So the motivation behind this tool was for SharePoint complex apps but there's no dependency whatsoever to SharePoint.

## Compatibility
This tool relies heavilly on [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window.postMessage).

This means that it's supported by the majority of browsers, even older ones.

See here the browser support table: [CanIUse](http://caniuse.com/#search=postMessage)

## Typical usage
The trick is done by 2 javascript files, one on the global page (IFrameOrchestrator.js) and another one on each page that renders inside an IFrame (IFrameOrchestratorClient.js).

Typically:
- IFrameOrchestrator.js if referenced and initialized on the header of the global page.
- IFrameOrchestratorClient.js is referenced at the end of the body of the child page.

## Example
Global page (page containing the IFrame(s))
```html
<head>
	<title>IFrame Orchestrator Demo</title>

	<script type="text/javascript" src="IFrameOrchestrator.js"></script>
	<script type="text/javascript">
		iframeOrch = new iframeOrchestrator({
			logging: true,
			allowedOrigins: [
				'http://localhost',
				'http://run.plnkr.co'
			]
		});
	</script>
</head>
```
Page that will be displayed inside the IFrame
```html
<script type="text/javascript" src="IFrameOrchestratorClient.js"></script>
```
See complete example in the source code, [demo folder](https://github.com/InstanceOfAnObject/IFrameOrchestrator/tree/master/demo).

## Options
### logging
	default: false
	type: boolean
  
Setting the `logging` option to true will show a lot of information on the console that might be usefull for troubleshooting.

### allowedOrigins
	default: all
	type: array
	
Setting the `allowedOrigins` property with an array of domain with enforce a security check, allowing only trusted domains the pass. This expects the protocol, i.e.: ['http://www.mydomain.com', 'https://demo.myotherdomain.com']
