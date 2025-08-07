
// TODO: Use SSVE to build your code generation model
// TODO: You are provided with model.Configuration and model.Connections
// EXAMPLE:
/*
let connections = $model.Connections;;

// $ifNotNull.Configuration.parentWorkItemId
let parentId = ctx["$model.Configuration.parentWorkItemId"];
if (parentId)
{
    let model =
    {
        entityType: "matter",
        fields: ["workitem.reference"],
        allowParallelExecution: true,
        responseType: "flat",
        entityId: parentId
    };

    let httpResult = sharedo.http.post("/api/executionengine/graph/sharedo/query", model);
    if (!httpResult.success)
        throw "Failed to load data from graph API - API returned '" + httpResult.status + "'";

    let result = httpResult.body;

    // $ifNotNull.Configuration.outputVariable
    ctx["$model.Configuration.outputVariable"] = result.data["workitem.reference"];
    // $endif
}
// $endif

// $ifNotNull.Connections.nextStep
trigger.SubProcess("$model.Connections.nextStep.step").Now();
// $endif
*/