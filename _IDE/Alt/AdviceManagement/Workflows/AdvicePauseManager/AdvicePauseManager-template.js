// Advice Pause Manager - ShareDo Workflow Template
// Pauses advice for a work item and saves state for later restoration
log.Information("====================================");
log.Information("Starting Advice Pause Manager");
log.Information("====================================");
let connections = $model.Connections;

// Get work item ID from the configured variable
// $ifNotNull.Configuration.workItemIdVariable
let workItemId = ctx["$model.Configuration.workItemIdVariable"];

// Get pause reason from the configured variable
let pauseReason;
// $ifNotNull.Configuration.pauseReasonVariable
pauseReason = ctx["$model.Configuration.pauseReasonVariable"];
// $else
pauseReason = "Advice paused by workflow";
// $endif

if (!workItemId) {
    // $ifNotNull.Configuration.errorMessageVariable
    ctx["$model.Configuration.errorMessageVariable"] = "No work item ID provided for pause operation";
    // $endif
    
    // $ifNotNull.Connections.error
    trigger.SubProcess("$model.Connections.error.step").Now();
    // $endif
} else {
    log.Information(`Work Item ID: ${workItemId}`);
    log.Information(`Pause Reason: ${pauseReason}`);

    try {
        // First, get current advice status
        let attributesUrl = "/api/v1/public/workItem/" + workItemId + "/attributes";
        log.Information(`Getting current advice status from: ${attributesUrl}`);
        let httpResult = sharedo.http.get(attributesUrl);

        if (!httpResult.success) {
            log.Information(`Failed to retrieve work item attributes: ${httpResult.status}`);
            // $ifNotNull.Configuration.errorMessageVariable
            ctx["$model.Configuration.errorMessageVariable"] = "Failed to retrieve work item attributes - API returned '" + httpResult.status + "'";
            // $endif
            
            // $ifNotNull.Connections.error
            trigger.SubProcess("$model.Connections.error.step").Now();
            // $endif

            //$ifNull.Connections.error
            log.Error(`Error retrieving attributes for work item ${workItemId}: ${httpResult.status}`);
            //$endif
        } else {
            log.Information(`Successfully retrieved attributes for work item ${workItemId}`);
            let attributes = httpResult.body || {};
            let currentEnabled = attributes["alt_ongoing_advice_enabled"];
            log.Information(`Current advice enabled status: ${currentEnabled} (type: ${typeof currentEnabled})`);
            
            // Check if already paused
            if (currentEnabled === false || currentEnabled === "false") {
                log.Information(`Advice is already paused for work item ${workItemId} - no action needed`);
                
                // $ifNotNull.Configuration.successVariable
                ctx["$model.Configuration.successVariable"] = true;
                // $endif
                
                // $ifNotNull.Configuration.messageVariable
                ctx["$model.Configuration.messageVariable"] = "Advice is already paused";
                // $endif
                
                // $ifNotNull.Configuration.alreadyPausedVariable
                ctx["$model.Configuration.alreadyPausedVariable"] = true;
                // $endif
                
                // $ifNotNull.Connections.alreadyPaused
                trigger.SubProcess("$model.Connections.alreadyPaused.step").Now();
                // $else
                // $ifNotNull.Connections.success
                trigger.SubProcess("$model.Connections.success.step").Now();
                // $endif
                // $endif
            } else {
                // Get current username
                let currentUser = "Workflow";
                try {
                    // $ifNotNull.Configuration.currentUserVariable
                    currentUser = ctx["$model.Configuration.currentUserVariable"] || "Workflow";
                    // $else
                    if (typeof sharedo !== 'undefined' && sharedo.context && sharedo.context.currentUser) {
                        currentUser = sharedo.context.currentUser();
                    }
                    // $endif
                } catch (ex) {
                    log.Information(`Could not get current user: ${ex.message}`);
                }
                
                log.Information(`Current user for pause operation: ${currentUser}`);
                let pausedDate = new Date().toISOString();
                log.Information(`Pause timestamp: ${pausedDate}`);
                
                // Save current advice state if configured
                // $ifNotNull.Configuration.saveAdviceState
                if ($model.Configuration.saveAdviceState) {
                    log.Information(`Saving current advice state before pausing`);
                    
                    // Store current advice items for restoration
                    let adviceItemsUrl = "/api/v1/public/workItem/" + workItemId + "/children?workTypeSystemName=AbstractAdvice";
                    let adviceResult = sharedo.http.get(adviceItemsUrl);
                    
                    if (adviceResult.success && adviceResult.body) {
                        let adviceItems = adviceResult.body;
                        log.Information(`Found ${adviceItems.length} total advice items for work item`);
                        let savedState = {
                            savedDate: pausedDate,
                            savedBy: currentUser,
                            adviceItems: []
                        };
                        
                        for (let advice of adviceItems) {
                            if (advice.phaseSystemName !== "Removed" && advice.phaseSystemName !== "Completed") {
                                savedState.adviceItems.push({
                                    id: advice.id,
                                    workTypeSystemName: advice.workTypeSystemName,
                                    phaseSystemName: advice.phaseSystemName,
                                    title: advice.title,
                                    dueDate: advice.dueDate,
                                    attributes: advice.attributes
                                });
                            }
                        }
                        
                        // Store saved state in work item attribute
                        let updateData = {
                            "alt_ongoing_advice_saved_state": JSON.stringify(savedState)
                        };
                        
                        let saveResult = sharedo.http.put(attributesUrl, updateData);
                        if (saveResult.success) {
                            log.Information(`Saved state for ${savedState.adviceItems.length} advice items`);
                        } else {
                            log.Information(`Warning: Could not save advice state: ${saveResult.status}`);
                        }
                    }
                }
                // $endif
                
                // Update work item attributes to pause advice
                let updateData = {
                    "alt_ongoing_advice_enabled": false,
                    "alt_ongoing_advice_paused_date": pausedDate,
                    "alt_ongoing_advice_paused_by": currentUser,
                    "alt_ongoing_advice_pause_reason": pauseReason
                };
                
                log.Information(`Updating work item attributes to pause advice`);
                log.Information(`  Update data: ${JSON.stringify(updateData)}`);
                let updateResult = sharedo.http.put(attributesUrl, updateData);
                
                if (!updateResult.success) {
                    log.Information(`Failed to update work item attributes: ${updateResult.status}`);
                    // $ifNotNull.Configuration.errorMessageVariable
                    ctx["$model.Configuration.errorMessageVariable"] = "Failed to update work item attributes - API returned '" + updateResult.status + "'";
                    // $endif
                    
                    // $ifNotNull.Connections.error
                    trigger.SubProcess("$model.Connections.error.step").Now();
                    // $endif
                } else {
                    log.Information(`Successfully paused advice for work item ${workItemId}`);
                    
                    // Now pause active advice items
                    let pausedCount = 0;
                    let errorCount = 0;
                    
                    // $ifNotNull.Configuration.pauseAllAdviceTypes
                    if ($model.Configuration.pauseAllAdviceTypes) {
                        log.Information(`Pausing all active advice items`);
                        
                        let adviceItemsUrl = "/api/v1/public/workItem/" + workItemId + "/children?workTypeSystemName=AbstractAdvice";
                        let adviceResult = sharedo.http.get(adviceItemsUrl);
                        
                        if (adviceResult.success && adviceResult.body) {
                            let adviceItems = adviceResult.body;
                            log.Information(`Found ${adviceItems.length} advice items to process for pausing`);
                            
                            for (let advice of adviceItems) {
                                let targetPhase;
                                // $ifNotNull.Configuration.pausedPhase
                                targetPhase = "$model.Configuration.pausedPhase";
                                // $else
                                targetPhase = "Removed";
                                // $endif
                                
                                if (advice.phaseSystemName !== targetPhase && advice.phaseSystemName !== "Completed") {
                                    log.Information(`  Processing advice ${advice.id}: current phase=${advice.phaseSystemName}, target phase=${targetPhase}`);
                                    // Move advice to paused phase
                                    let moveUrl = "/api/v1/public/workItem/" + advice.id + "/phase";
                                    let moveData = { phaseSystemName: targetPhase };
                                    
                                    let moveResult = sharedo.http.put(moveUrl, moveData);
                                    if (moveResult.success) {
                                        pausedCount++;
                                        log.Information(`  Paused advice item: ${advice.id}`);
                                    } else {
                                        errorCount++;
                                        log.Information(`  Failed to pause advice item ${advice.id}: ${moveResult.status}`);
                                    }
                                }
                            }
                        }
                    }
                    // $endif
                    
                    // Set output variables
                    // $ifNotNull.Configuration.successVariable
                    ctx["$model.Configuration.successVariable"] = true;
                    // $endif
                    
                    // $ifNotNull.Configuration.messageVariable
                    ctx["$model.Configuration.messageVariable"] = `Successfully paused advice (${pausedCount} items paused)`;
                    // $endif
                    
                    // $ifNotNull.Configuration.pausedCountVariable
                    ctx["$model.Configuration.pausedCountVariable"] = pausedCount;
                    // $endif
                    
                    // $ifNotNull.Configuration.errorCountVariable
                    ctx["$model.Configuration.errorCountVariable"] = errorCount;
                    // $endif
                    
                    // $ifNotNull.Configuration.pausedDateVariable
                    ctx["$model.Configuration.pausedDateVariable"] = pausedDate;
                    // $endif
                    
                    // $ifNotNull.Configuration.pausedByVariable
                    ctx["$model.Configuration.pausedByVariable"] = currentUser;
                    // $endif
                    
                    // Branch based on results
                    if (pausedCount > 0) {
                        log.Information(`Taking 'paused' branch - paused ${pausedCount} advice items`);
                        // $ifNotNull.Connections.paused
                        trigger.SubProcess("$model.Connections.paused.step").Now();
                        // $else
                        // $ifNotNull.Connections.success
                        trigger.SubProcess("$model.Connections.success.step").Now();
                        // $endif
                        // $endif
                    } else {
                        log.Information(`Taking 'success' branch - advice paused but no items to pause`);
                        // $ifNotNull.Connections.success
                        trigger.SubProcess("$model.Connections.success.step").Now();
                        // $endif
                    }
                }
            }
        }
        
    } catch (ex) {
        // Handle any exceptions
        // $ifNotNull.Configuration.errorMessageVariable
        log.Information(`Error pausing advice for work item ${workItemId}: ${ex.message}`);
        ctx["$model.Configuration.errorMessageVariable"] = "Error pausing advice: " + ex.message;
        // $endif
        
        // $ifNotNull.Connections.error
        trigger.SubProcess("$model.Connections.error.step").Now();
        // $endif

        // $ifNull.Connections.error
        log.Error(`Error pausing advice for work item ${workItemId}: ${ex.message}`);
        // $endif
    }
    log.Information("====================================");
    log.Information("Advice Pause Manager completed");
    log.Information("====================================");
}
// $endif