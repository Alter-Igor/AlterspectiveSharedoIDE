// TODO: Use SSVE to build your code generation model
// TODO: Below will create a basic work item - add your custom config etc to the payload etc.

// Setup API skeleton
let createRequest =
{
    parentSharedoId: null,
    workItem:
    {
        sharedoTypeSystemName: null,
        title: null,
        titleIsUserProvided: false,
        reference: null,
        referenceIsUserProvided: false,
        description: null
    },
    participants: []
};

// Set API request from configurations
let sharedoType = "$model.Configuration.sharedoTypeSystemName";
if (sharedoType)
{
    createRequest.workItem.sharedoTypeSystemName = sharedoType;
}

let reference = "$model.Configuration.reference";
if (reference)
{
    createRequest.workItem.reference = sharedo.buildString(reference);
    createRequest.workItem.referenceIsUserProvided = true;
}

let title = "$model.Configuration.title";
if (title)
{
    createRequest.workItem.title = sharedo.buildString(title);
    createRequest.workItem.titleIsUserProvided = true;
}

let description = "$model.Configuration.description";
if (description)
{
    createRequest.workItem.description = sharedo.buildString(description);
}

let parentWorkItemVariable = "$model.Configuration.parentWorkItemIdVariable";
if (parentWorkItemVariable)
{
    createRequest.parentSharedoId = ctx[parentWorkItemVariable];
}

// Set the participants to load...
// $if.Model.Configuration.has-assignments
// $each.Model.Configuration.assignments
{
    let odsVar = "$current.odsIdVariableName";
    let role = "$current.roleSystemName";

    if (odsVar && role)
    {
        var odsId = ctx[odsVar];
        if (odsId)
        {
            createRequest.participants.push(
                {
                    "roleSystemName": role,
                    "odsId": odsId
                });
        }
    }
}
// $endeach
// $endif

// Debug the payload
log.Information("Create work item params:" + JSON.stringify(createRequest, null, 4));

// Validate the request can continue
if (!createRequest.workItem.sharedoTypeSystemName)
{
    log.Error("Cannot create work item as no sharedoTypeSystemName specified");
    throw "Failed to validate work item - stopping process";
}

let response = sharedo.http.post("/api/v1/public/workItem/", createRequest);

try
{
    log.Information("Response was: " + JSON.stringify(response.body, null, 4));
}
catch(e)
{
    // Body wasn't an object
    log.Information("Response was: " + response.body);
}

if (!response.success)
{
    log.Error("Could not create work item");
    log.Error("Status was: " + response.status);

    if (response.status === "Forbidden")
    {
        log.Warning("The response status was forbidden (403) - this indicates that the " +
            "execution engine client (ee-app) does not have permission to create " +
            "work items of type " +
            createRequest.workItem.sharedoTypeSystemName +
            ". " +
            "Use the administration tools to grant the create permission to the ee-app client.");
    }

    throw "Failed to create work item - stopping process";
}

var newId = null;
if (response.body && response.body.workItem && response.body.workItem.id)
{
    newId = response.body.workItem.id;
}

if (!newId)
{
    log.Warning("Didn't get a workItem.id back from the request even though it was successful - can't populate output variable nor setup phase triggers");
}
else
{
    log.Information("Successfully created work item: " + newId);

    // $ifNotNull.Configuration.outputVariable
    ctx["$model.Configuration.outputVariable"] = newId;
    // $endif;

    // $if.Model.Configuration.has-phaseOutlets
    let connections = $model.Connections;;
    log.Information("CREATING PHASE TRIGGERS");
    log.Information("-----------------------");
    // $each.Model.Configuration.phaseOutlets
    if (connections["$current.systemName"])
    {
        log.Information("On $current.systemName start " + connections["$current.systemName"].step);
        trigger.CreateForSharedo(newId)
            .Execute(connections["$current.systemName"].step)
            .OnPhase("$current.systemName");
    }
    // $endeach
    // $endif;
}