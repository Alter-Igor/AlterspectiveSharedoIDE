Additional infomration the element configuration stack model blade.

/**
 * Blade constructor - remember the name of this JS type must match the ID of the blade in it's .panel.json manifest
 * @param {} element            // The HTML DOM Element to which this blade model is bound 
 * @param {} configuration      // The configuration passed in from the open blade command
 * @param {} stackModel         // The base blade stack model (contains unique id etc)
 * @returns {} 
 */



 To help understand where we get I have JSON.stringify and JSON.parse from, we can look at the following code:

element data: 
- of type: div#dui-stack-1.ui-stack.root
- stringify of object: '{"jQuery35108987151126102081":{"fxqueue":["inprogress"],"fxqueueHooks":{"empty":{}}}}'

configuration data:
- of type: object: object - this is the configuration object passed in from the open blade command the configurator can set.
- stringify of object: {} or '{"key":"value"}' if the configurator has set some values.

stackModel data:
- of type: object: object - this is the base stack model that contains the unique id and other properties.
- stringify of object: 
stackModel
:
Object
element
: 
div#dui-stack-1.ui-stack.root
events
: 
undefined
id
: 
"dui-stack-1"
innerWidth
: 
600
instrumentationSession
: 
UI.Instrumentation.Operation {id: '20250807123446854068913193', opType: 'UX_SESSION', root: UI.I…n.Operation, depth: 0, tag: 'BLADE', …}
isInNewWindow
: 
false
isMaximised
: 
ƒ c()
outerWidth
: 
601
systemName
: 
"Alt.AdviceManagement.AdvicePauseResumeBlade"
viewModel
: 
null
_isStackModel
: 
true

