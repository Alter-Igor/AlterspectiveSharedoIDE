var customLastEvents = [];
function showEvents()
{
    let handlers = $ui.events.handlers;
    for(let handler in handlers)
    {
        let eventName = handlers[handler].eventName;
        console.log(eventName);
        $ui.events.subscribe(eventName, (data) =>
        {
            console.log("%c " + eventName + " fired", ' color: blue');
            console.log(data);
            customLastEvents.push({"eventName":eventName,"data":data, "time":new Date(Date.now()) });
        }, this);

    }
}

function setDocumentTitles()
{
    let env = window.location.host.split(".")[0];
    let page = "front-end";
    
    if(window.location.pathname.includes("modeller")) { page = "Modeller"}
    if(window.location.pathname.includes("admin")) { page = "Admin"}
    if(window.location.pathname.includes("admin-documents")) { page = "Doc Admin"}
    
    let fullTitle = env + "-" + page;
    document.title = "SD-" +  fullTitle.toLowerCase();

}

setDocumentTitles();