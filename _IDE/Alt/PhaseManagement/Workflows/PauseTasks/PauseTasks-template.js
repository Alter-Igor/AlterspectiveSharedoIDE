"use strict";

// PauseTasks Workflow Action Template
// Pauses child tasks by moving them to a paused phase feature or system name

log.Information("====================================");
log.Information("Starting PauseTasks Workflow Action");
log.Information("====================================");
log.Information("Timestamp: " + new Date().toISOString());

// Get configuration
let workItemId;
let baseWorkType;
let targetPhaseFeature;
let targetPhaseSystemName;
let saveOriginalState;
let excludePhases;
let suppressEvents;
let suppressGuards;
let pauseReasonVariable;
let pausedByVariable;
let successVariable;
let pausedCountVariable;
let errorMessageVariable;

// $ifNotNull.Configuration.workItemIdVariable
workItemId = ctx["$model.Configuration.workItemIdVariable"];
// $else
workItemId = null;
// $endif

// $ifNotNull.Configuration.baseWorkType
baseWorkType = "$model.Configuration.baseWorkType";
// $else
baseWorkType = "AbstractAdvice";
// $endif

// $ifNotNull.Configuration.targetPhaseFeature
targetPhaseFeature = "$model.Configuration.targetPhaseFeature";
// $else
targetPhaseFeature = "Paused";
// $endif

// $ifNotNull.Configuration.targetPhaseSystemName
targetPhaseSystemName = "$model.Configuration.targetPhaseSystemName";
// $else
targetPhaseSystemName = null;
// $endif

// $ifNotNull.Configuration.saveOriginalState
saveOriginalState = $model.Configuration.saveOriginalState;
// $else
saveOriginalState = true;
// $endif

// $ifNotNull.Configuration.excludePhases
excludePhases = $model.Configuration.excludePhases;
// $else
excludePhases = ["Completed", "Cancelled", "Removed"];
// $endif

// $ifNotNull.Configuration.suppressEvents
suppressEvents = $model.Configuration.suppressEvents;
// $else
suppressEvents = false;
// $endif

// $ifNotNull.Configuration.suppressGuards
suppressGuards = $model.Configuration.suppressGuards;
// $else
suppressGuards = false;
// $endif

// $ifNotNull.Configuration.pauseReasonVariable
pauseReasonVariable = ctx["$model.Configuration.pauseReasonVariable"];
// $else
pauseReasonVariable = null;
// $endif

// $ifNotNull.Configuration.pausedByVariable
pausedByVariable = ctx["$model.Configuration.pausedByVariable"];
// $else
pausedByVariable = "workflow";
// $endif

// Validate required inputs
if (!workItemId) {
    log.Error("PauseTasks: Work item ID is required");
    // $ifNotNull.Configuration.errorMessageVariable
    ctx["$model.Configuration.errorMessageVariable"] = "Work item ID is required";
    // $endif
    
    // $ifNotNull.Connections.error
    trigger.SubProcess("$model.Connections.error.step").Now();
    // $else
    throw new Error("Work item ID is required for PauseTasks");
    // $endif
    return; // Exit after branching
}

log.Information("Configuration loaded:");
log.Information("  Work Item ID: " + workItemId);
log.Information("  Base Work Type: " + baseWorkType);
log.Information("  Target Phase Feature: " + (targetPhaseFeature || "Not specified"));
log.Information("  Target Phase System Name: " + (targetPhaseSystemName || "Not specified"));
log.Information("  Save Original State: " + saveOriginalState);
log.Information("  Exclude Phases: " + JSON.stringify(excludePhases));

// Step 1: Find child tasks
log.Information("");
log.Information("Step 1: Finding child tasks...");

let findRequest = {
    "search": {
        "page": { "page": 1, "rowsPerPage": 100 },
        "sort": { "direction": "ascending", "orderBy": "title" },
        "workItemIds": [workItemId],  // Find children of this parent
        "workTypeSystemName": baseWorkType,
        "includeSubTypes": true
    },
    "enrich": [
        { "path": "id" },
        { "path": "title" },
        { "path": "phase.systemName" },
        { "path": "type.systemName" },
        { "path": "reference" },
        { "path": "dueDate" },
        { "path": "parent.id" }  // To verify parent relationship
    ]
};

log.Information("Searching for child tasks with request: " + JSON.stringify(findRequest, null, 2));
let httpResultFind = sharedo.http.post("/api/v1/public/workItem/findByQuery", findRequest);

if (!httpResultFind.success) {
    log.Error("Failed to find child tasks");
    log.Error("  HTTP Status: " + (httpResultFind.status || "Unknown"));
    log.Error("  Response Body: " + JSON.stringify(httpResultFind.body || httpResultFind, null, 2));
    
    // $ifNotNull.Configuration.errorMessageVariable
    ctx["$model.Configuration.errorMessageVariable"] = "Failed to find child tasks: " + (httpResultFind.status || "Unknown error");
    // $endif
    
    // $ifNotNull.Connections.error
    trigger.SubProcess("$model.Connections.error.step").Now();
    // $else
    throw new Error("Failed to find child tasks");
    // $endif
    return; // Exit after branching
}

// Safely extract results
let tasks = [];
if (httpResultFind.body) {
    if (httpResultFind.body.results) {
        tasks = httpResultFind.body.results;
    } else if (Array.isArray(httpResultFind.body)) {
        tasks = httpResultFind.body;
    }
}
log.Information("Response structure: " + (httpResultFind.body ? (httpResultFind.body.results ? "body.results" : "body array") : "no body"));
log.Information("Found " + tasks.length + " child task(s) of type " + baseWorkType);

if (tasks.length === 0) {
    log.Information("No tasks found to pause");
    
    // $ifNotNull.Configuration.pausedCountVariable
    ctx["$model.Configuration.pausedCountVariable"] = 0;
    // $endif
    
    // $ifNotNull.Configuration.successVariable
    ctx["$model.Configuration.successVariable"] = true;
    // $endif
    
    // $ifNotNull.Connections.noTasks
    trigger.SubProcess("$model.Connections.noTasks.step").Now();
    // $else
    // $ifNotNull.Connections.success
    trigger.SubProcess("$model.Connections.success.step").Now();
    // $endif
    // $endif
    return; // Exit after branching
}

// Step 2: Filter eligible tasks
log.Information("");
log.Information("Step 2: Filtering eligible tasks...");

let eligibleTasks = [];
let phaseCache = {};

for (let i = 0; i < tasks.length; i++) {
    let task = tasks[i];
    
    // Handle both possible response structures
    let taskData = task.data || task;
    let currentPhase = taskData["phase.systemName"] || (taskData.phase && taskData.phase.systemName);
    let taskId = taskData["id"] || taskData.id;
    let title = taskData["title"] || taskData.title;
    let typeSystemName = taskData["type.systemName"] || (taskData.type && taskData.type.systemName);
    let parentId = taskData["parent.id"] || (taskData.parent && taskData.parent.id);
    
    // Verify this is actually a child of our work item
    if (parentId && parentId !== workItemId) {
        log.Information("  Skipping task " + taskId + " - not a direct child (parent: " + parentId + ")");
        continue;
    }
    
    // Check if task is in excluded phase
    let isExcluded = false;
    for (let j = 0; j < excludePhases.length; j++) {
        if (currentPhase === excludePhases[j]) {
            isExcluded = true;
            break;
        }
    }
    
    if (isExcluded) {
        log.Information("  Skipping task " + taskId + " (" + title + ") - already in phase: " + currentPhase);
        continue;
    }
    
    // Determine target phase for this task type
    let targetPhase = targetPhaseSystemName;
    
    if (!targetPhase && targetPhaseFeature) {
        // Check cache first
        let cacheKey = typeSystemName + ":" + targetPhaseFeature;
        if (phaseCache[cacheKey]) {
            targetPhase = phaseCache[cacheKey];
        } else {
            // Get phase with feature for this type
            log.Information("  Getting phase with feature '" + targetPhaseFeature + "' for type: " + typeSystemName);
            let httpResultFeature = sharedo.http.get("/api/featureframework/flags/" + targetPhaseFeature + "/" + typeSystemName + "/enabledPhases");
            
            if (httpResultFeature.success && httpResultFeature.body && httpResultFeature.body.length > 0) {
                targetPhase = httpResultFeature.body[0];
                phaseCache[cacheKey] = targetPhase;
                log.Information("    Found phase: " + targetPhase);
            } else {
                log.Warning("    No phase with feature '" + targetPhaseFeature + "' found for type: " + typeSystemName);
                continue;
            }
        }
    }
    
    if (!targetPhase) {
        log.Warning("  No target phase determined for task " + taskId);
        continue;
    }
    
    // Check if already in target phase
    if (currentPhase === targetPhase) {
        log.Information("  Skipping task " + taskId + " - already in target phase: " + targetPhase);
        continue;
    }
    
    eligibleTasks.push({
        id: taskId,
        title: title,
        type: typeSystemName,
        currentPhase: currentPhase,
        targetPhase: targetPhase
    });
}

log.Information("Eligible tasks to pause: " + eligibleTasks.length);

if (eligibleTasks.length === 0) {
    log.Information("No eligible tasks to pause");
    
    // $ifNotNull.Configuration.pausedCountVariable
    ctx["$model.Configuration.pausedCountVariable"] = 0;
    // $endif
    
    // $ifNotNull.Configuration.successVariable
    ctx["$model.Configuration.successVariable"] = true;
    // $endif
    
    // $ifNotNull.Connections.noTasks
    trigger.SubProcess("$model.Connections.noTasks.step").Now();
    // $else
    // $ifNotNull.Connections.success
    trigger.SubProcess("$model.Connections.success.step").Now();
    // $endif
    // $endif
    return; // Exit after branching
}

// Step 3: Process each eligible task
log.Information("");
log.Information("Step 3: Pausing eligible tasks...");

let pausedCount = 0;
let errorCount = 0;
let errors = [];

for (let i = 0; i < eligibleTasks.length; i++) {
    let task = eligibleTasks[i];
    
    log.Information("");
    log.Information("Processing task " + (i + 1) + " of " + eligibleTasks.length + ":");
    log.Information("  Task ID: " + task.id);
    log.Information("  Title: " + task.title);
    log.Information("  Type: " + task.type);
    log.Information("  Current Phase: " + task.currentPhase);
    log.Information("  Target Phase: " + task.targetPhase);
    
    try {
        // Step 3a: Save original state if configured
        if (saveOriginalState) {
            log.Information("  Saving original state...");
            
            let attributes = {
                "phase_pause_original": task.currentPhase,
                "phase_pause_date": new Date().toISOString(),
                "phase_pause_by": pausedByVariable || "workflow"
            };
            
            if (pauseReasonVariable) {
                attributes["phase_pause_reason"] = pauseReasonVariable;
            }
            
            let httpResultAttr = sharedo.http.put("/api/v1/public/workItem/" + task.id + "/attributes", attributes);
            
            if (!httpResultAttr.success) {
                log.Warning("    Failed to save original state");
                log.Warning("      Status: " + (httpResultAttr.status || "Unknown"));
                log.Warning("      Response: " + JSON.stringify(httpResultAttr.body || httpResultAttr.error || "No details"));
            } else {
                log.Information("    Original state saved successfully");
                log.Information("      Saved attributes: " + JSON.stringify(attributes));
            }
        }
        
        // Step 3b: Jump to paused phase
        log.Information("  Moving to paused phase...");
        
        let jumpModel = {
            "toPhaseSystemName": task.targetPhase,
            "description": pauseReasonVariable || "Paused by workflow",
            "suppressEvents": suppressEvents,
            "suppressGuards": suppressGuards
        };
        
        let httpResultJump = sharedo.http.post("/api/sharedo/" + task.id + "/phase/jumpTo", jumpModel);
        
        if (!httpResultJump.success) {
            let errorMsg = httpResultJump.status || "Unknown error";
            log.Error("    Failed to pause task");
            log.Error("      Status: " + errorMsg);
            log.Error("      Response: " + JSON.stringify(httpResultJump.body || httpResultJump.error || "No details"));
            errorCount++;
            errors.push("Task " + task.id + " (" + task.title + "): " + errorMsg);
            
            if (httpResultJump.status === "Forbidden") {
                log.Error("      Permission denied - verify Event Engine has 'core.admin.jumptophase' permission");
            }
        } else {
            log.Information("    Successfully paused");
            pausedCount++;
        }
        
    } catch (e) {
        log.Error("  Error processing task " + task.id + ": " + e.message);
        errorCount++;
        errors.push("Task " + task.id + ": " + e.message);
    }
}

// Step 4: Report results
log.Information("");
log.Information("====================================");
log.Information("PauseTasks Results:");
log.Information("  Total Tasks Found: " + tasks.length);
log.Information("  Eligible Tasks: " + eligibleTasks.length);
log.Information("  Successfully Paused: " + pausedCount);
log.Information("  Errors: " + errorCount);

if (errors.length > 0) {
    log.Information("  Error Details:");
    for (let i = 0; i < errors.length; i++) {
        log.Information("    - " + errors[i]);
    }
}

log.Information("====================================");
log.Information("PauseTasks completed at " + new Date().toISOString());

// Set output variables
// $ifNotNull.Configuration.pausedCountVariable
ctx["$model.Configuration.pausedCountVariable"] = pausedCount;
// $endif

// $ifNotNull.Configuration.successVariable
ctx["$model.Configuration.successVariable"] = (errorCount === 0);
// $endif

// $ifNotNull.Configuration.errorMessageVariable
if (errors.length > 0) {
    ctx["$model.Configuration.errorMessageVariable"] = errors.join("; ");
}
// $endif

// Branch based on results
if (errorCount === 0 && pausedCount > 0) {
    log.Information("All tasks paused successfully - branching to [success]");
    // $ifNotNull.Connections.success
    trigger.SubProcess("$model.Connections.success.step").Now();
    // $endif
} else if (errorCount > 0 && pausedCount > 0) {
    log.Information("Partial success - branching to [partial]");
    // $ifNotNull.Connections.partial
    trigger.SubProcess("$model.Connections.partial.step").Now();
    // $else
    // $ifNotNull.Connections.success
    trigger.SubProcess("$model.Connections.success.step").Now();
    // $endif
    // $endif
} else if (errorCount > 0) {
    log.Information("Errors occurred - branching to [error]");
    // $ifNotNull.Connections.error
    trigger.SubProcess("$model.Connections.error.step").Now();
    // $endif
} else {
    log.Information("No tasks processed - branching to [noTasks]");
    // $ifNotNull.Connections.noTasks
    trigger.SubProcess("$model.Connections.noTasks.step").Now();
    // $else
    // $ifNotNull.Connections.success
    trigger.SubProcess("$model.Connections.success.step").Now();
    // $endif
    // $endif
}