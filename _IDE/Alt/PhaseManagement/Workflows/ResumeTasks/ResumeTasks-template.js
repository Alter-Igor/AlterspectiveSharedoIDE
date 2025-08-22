"use strict";

// ResumeTasks Workflow Action Template
// Resumes paused tasks by restoring their original phase or moving to a specified phase

log.Information("====================================");
log.Information("Starting ResumeTasks Workflow Action");
log.Information("====================================");
log.Information("Timestamp: " + new Date().toISOString());

// Get configuration
let workItemId;
let baseWorkType;
let sourcePhaseFeature;
let sourcePhaseSystemName;
let restoreFromSaved;
let defaultPhase;
let newDueDateVariable;
let adjustDueDateBy;
let clearPauseMetadata;
let suppressEvents;
let suppressGuards;
let resumeReasonVariable;
let resumedByVariable;
let successVariable;
let resumedCountVariable;
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

// $ifNotNull.Configuration.sourcePhaseFeature
sourcePhaseFeature = "$model.Configuration.sourcePhaseFeature";
// $else
sourcePhaseFeature = "Paused";
// $endif

// $ifNotNull.Configuration.sourcePhaseSystemName
sourcePhaseSystemName = "$model.Configuration.sourcePhaseSystemName";
// $else
sourcePhaseSystemName = null;
// $endif

// $ifNotNull.Configuration.restoreFromSaved
restoreFromSaved = $model.Configuration.restoreFromSaved;
// $else
restoreFromSaved = true;
// $endif

// $ifNotNull.Configuration.defaultPhase
defaultPhase = "$model.Configuration.defaultPhase";
// $else
defaultPhase = "InProgress";
// $endif

// $ifNotNull.Configuration.newDueDateVariable
newDueDateVariable = ctx["$model.Configuration.newDueDateVariable"];
// $else
newDueDateVariable = null;
// $endif

// $ifNotNull.Configuration.adjustDueDateBy
adjustDueDateBy = $model.Configuration.adjustDueDateBy;
// $else
adjustDueDateBy = null;
// $endif

// $ifNotNull.Configuration.clearPauseMetadata
clearPauseMetadata = $model.Configuration.clearPauseMetadata;
// $else
clearPauseMetadata = true;
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

// $ifNotNull.Configuration.resumeReasonVariable
resumeReasonVariable = ctx["$model.Configuration.resumeReasonVariable"];
// $else
resumeReasonVariable = null;
// $endif

// $ifNotNull.Configuration.resumedByVariable
resumedByVariable = ctx["$model.Configuration.resumedByVariable"];
// $else
resumedByVariable = "workflow";
// $endif

// Validate required inputs
if (!workItemId) {
    log.Error("ResumeTasks: Work item ID is required");
    // $ifNotNull.Configuration.errorMessageVariable
    ctx["$model.Configuration.errorMessageVariable"] = "Work item ID is required";
    // $endif
    
    // $ifNotNull.Connections.error
    trigger.SubProcess("$model.Connections.error.step").Now();
    // $else
    throw new Error("Work item ID is required for ResumeTasks");
    // $endif
    return; // Exit after branching
}

log.Information("Configuration loaded:");
log.Information("  Work Item ID: " + workItemId);
log.Information("  Base Work Type: " + baseWorkType);
log.Information("  Source Phase Feature: " + (sourcePhaseFeature || "Not specified"));
log.Information("  Source Phase System Name: " + (sourcePhaseSystemName || "Not specified"));
log.Information("  Restore From Saved: " + restoreFromSaved);
log.Information("  Default Phase: " + defaultPhase);
log.Information("  Clear Pause Metadata: " + clearPauseMetadata);

// Step 1: Find paused tasks
log.Information("");
log.Information("Step 1: Finding paused tasks...");

// First, we need to determine which phase(s) to search for
let searchPhases = [];
let phaseTypeMap = {};

if (sourcePhaseSystemName) {
    // Use specific phase system name
    searchPhases.push(sourcePhaseSystemName);
} else if (sourcePhaseFeature) {
    // Need to find all phases with the feature across different work types
    // This is a limitation - we'll search for tasks first and filter by phase feature
    log.Information("Will filter by phase feature: " + sourcePhaseFeature);
}

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
        { "path": "attributes" },
        { "path": "parent.id" }  // To verify parent relationship
    ]
};

// If we have a specific phase, add it to the search
if (sourcePhaseSystemName) {
    findRequest.search.phaseSystemName = sourcePhaseSystemName;
    log.Information("Filtering for specific phase: " + sourcePhaseSystemName);
}

log.Information("Searching for tasks with request: " + JSON.stringify(findRequest, null, 2));
let httpResultFind = sharedo.http.post("/api/v1/public/workItem/findByQuery", findRequest);

if (!httpResultFind.success) {
    log.Error("Failed to find tasks");
    log.Error("  HTTP Status: " + (httpResultFind.status || "Unknown"));
    log.Error("  Response Body: " + JSON.stringify(httpResultFind.body || httpResultFind, null, 2));
    
    // $ifNotNull.Configuration.errorMessageVariable
    ctx["$model.Configuration.errorMessageVariable"] = "Failed to find tasks: " + (httpResultFind.status || "Unknown error");
    // $endif
    
    // $ifNotNull.Connections.error
    trigger.SubProcess("$model.Connections.error.step").Now();
    // $else
    throw new Error("Failed to find tasks");
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
log.Information("Found " + tasks.length + " task(s) of type " + baseWorkType);

// Step 2: Filter for paused tasks
log.Information("");
log.Information("Step 2: Filtering for paused tasks...");

let pausedTasks = [];
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
    let attributes = taskData["attributes"] || taskData.attributes || {};
    
    // Verify this is actually a child of our work item
    if (parentId && parentId !== workItemId) {
        log.Information("  Skipping task " + taskId + " - not a direct child (parent: " + parentId + ")");
        continue;
    }
    
    // If using phase feature, check if current phase has the feature
    if (sourcePhaseFeature && !sourcePhaseSystemName) {
        // Check cache first
        let cacheKey = typeSystemName + ":" + sourcePhaseFeature;
        let pausedPhase = phaseCache[cacheKey];
        
        if (!pausedPhase) {
            // Get phase with feature for this type
            let httpResultFeature = sharedo.http.get("/api/featureframework/flags/" + sourcePhaseFeature + "/" + typeSystemName + "/enabledPhases");
            
            if (httpResultFeature.success && httpResultFeature.body && httpResultFeature.body.length > 0) {
                pausedPhase = httpResultFeature.body[0];
                phaseCache[cacheKey] = pausedPhase;
            }
        }
        
        // Skip if not in paused phase
        if (pausedPhase && currentPhase !== pausedPhase) {
            continue;
        }
    }
    
    // Check if task has pause metadata (indicates it was previously paused)
    let originalPhase = attributes["phase_pause_original"];
    let pauseDate = attributes["phase_pause_date"];
    
    pausedTasks.push({
        id: taskId,
        title: title,
        type: typeSystemName,
        currentPhase: currentPhase,
        originalPhase: originalPhase,
        pauseDate: pauseDate,
        dueDate: taskData["dueDate"] || taskData.dueDate,
        attributes: attributes
    });
}

log.Information("Found " + pausedTasks.length + " paused task(s)");

if (pausedTasks.length === 0) {
    log.Information("No paused tasks found to resume");
    
    // $ifNotNull.Configuration.resumedCountVariable
    ctx["$model.Configuration.resumedCountVariable"] = 0;
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

// Step 3: Process each paused task
log.Information("");
log.Information("Step 3: Resuming paused tasks...");

let resumedCount = 0;
let errorCount = 0;
let errors = [];

for (let i = 0; i < pausedTasks.length; i++) {
    let task = pausedTasks[i];
    
    log.Information("");
    log.Information("Processing task " + (i + 1) + " of " + pausedTasks.length + ":");
    log.Information("  Task ID: " + task.id);
    log.Information("  Title: " + task.title);
    log.Information("  Type: " + task.type);
    log.Information("  Current Phase: " + task.currentPhase);
    log.Information("  Original Phase: " + (task.originalPhase || "Not saved"));
    
    try {
        // Step 3a: Determine target phase
        let targetPhase = null;
        
        if (restoreFromSaved && task.originalPhase) {
            targetPhase = task.originalPhase;
            log.Information("  Restoring to saved phase: " + targetPhase);
        } else if (defaultPhase) {
            targetPhase = defaultPhase;
            log.Information("  Using default phase: " + targetPhase);
        } else {
            log.Warning("  No target phase available - skipping");
            continue;
        }
        
        // Step 3b: Calculate new due date if needed
        let newDueDate = null;
        
        if (newDueDateVariable) {
            newDueDate = newDueDateVariable;
            log.Information("  Setting new due date: " + newDueDate);
        } else if (adjustDueDateBy && adjustDueDateBy !== 0) {
            // Adjust due date by specified number of days
            let currentDueDate = task.dueDate ? new Date(task.dueDate) : new Date();
            currentDueDate.setDate(currentDueDate.getDate() + adjustDueDateBy);
            newDueDate = currentDueDate.toISOString();
            log.Information("  Adjusting due date by " + adjustDueDateBy + " days: " + newDueDate);
        }
        
        // Step 3c: Update due date if needed
        if (newDueDate) {
            log.Information("  Updating due date...");
            
            let updateModel = {
                "dueDate": newDueDate
            };
            
            let httpResultUpdate = sharedo.http.put("/api/v1/public/workItem/" + task.id, updateModel);
            
            if (!httpResultUpdate.success) {
                log.Warning("    Failed to update due date");
                log.Warning("      Status: " + (httpResultUpdate.status || "Unknown"));
                log.Warning("      Response: " + JSON.stringify(httpResultUpdate.body || httpResultUpdate.error || "No details"));
            } else {
                log.Information("    Due date updated successfully to: " + newDueDate);
            }
        }
        
        // Step 3d: Jump to target phase
        log.Information("  Moving to target phase...");
        
        let jumpModel = {
            "toPhaseSystemName": targetPhase,
            "description": resumeReasonVariable || "Resumed by workflow",
            "suppressEvents": suppressEvents,
            "suppressGuards": suppressGuards
        };
        
        let httpResultJump = sharedo.http.post("/api/sharedo/" + task.id + "/phase/jumpTo", jumpModel);
        
        if (!httpResultJump.success) {
            let errorMsg = httpResultJump.status || "Unknown error";
            log.Error("    Failed to resume task");
            log.Error("      Status: " + errorMsg);
            log.Error("      Response: " + JSON.stringify(httpResultJump.body || httpResultJump.error || "No details"));
            errorCount++;
            errors.push("Task " + task.id + " (" + task.title + "): " + errorMsg);
            
            if (httpResultJump.status === "Forbidden") {
                log.Error("      Permission denied - verify Event Engine has 'core.admin.jumptophase' permission");
            }
            continue;
        } else {
            log.Information("    Successfully moved to phase: " + targetPhase);
        }
        
        // Step 3e: Clear or update metadata if configured
        if (clearPauseMetadata) {
            log.Information("  Clearing pause metadata...");
            
            let metadataUpdate = {
                "phase_pause_original": null,
                "phase_pause_date": null,
                "phase_pause_by": null,
                "phase_pause_reason": null,
                "phase_resume_date": new Date().toISOString(),
                "phase_resume_by": resumedByVariable || "workflow"
            };
            
            if (resumeReasonVariable) {
                metadataUpdate["phase_resume_reason"] = resumeReasonVariable;
            }
            
            // Use replace to clear old values and set new ones
            // Use PUT to update attributes (replace method might not exist)
            let httpResultAttr = sharedo.http.put("/api/v1/public/workItem/" + task.id + "/attributes", metadataUpdate);
            
            if (!httpResultAttr.success) {
                log.Warning("    Failed to clear metadata");
                log.Warning("      Status: " + (httpResultAttr.status || "Unknown"));
                log.Warning("      Response: " + JSON.stringify(httpResultAttr.body || httpResultAttr.error || "No details"));
            } else {
                log.Information("    Metadata cleared successfully");
                log.Information("      Updated attributes: " + JSON.stringify(metadataUpdate));
            }
        }
        
        resumedCount++;
        log.Information("  Task resumed successfully");
        
    } catch (e) {
        log.Error("  Error processing task " + task.id + ": " + e.message);
        errorCount++;
        errors.push("Task " + task.id + ": " + e.message);
    }
}

// Step 4: Report results
log.Information("");
log.Information("====================================");
log.Information("ResumeTasks Results:");
log.Information("  Total Tasks Found: " + tasks.length);
log.Information("  Paused Tasks Found: " + pausedTasks.length);
log.Information("  Successfully Resumed: " + resumedCount);
log.Information("  Errors: " + errorCount);

if (errors.length > 0) {
    log.Information("  Error Details:");
    for (let i = 0; i < errors.length; i++) {
        log.Information("    - " + errors[i]);
    }
}

log.Information("====================================");
log.Information("ResumeTasks completed at " + new Date().toISOString());

// Set output variables
// $ifNotNull.Configuration.resumedCountVariable
ctx["$model.Configuration.resumedCountVariable"] = resumedCount;
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
if (errorCount === 0 && resumedCount > 0) {
    log.Information("All tasks resumed successfully - branching to [success]");
    // $ifNotNull.Connections.success
    trigger.SubProcess("$model.Connections.success.step").Now();
    // $endif
} else if (errorCount > 0 && resumedCount > 0) {
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