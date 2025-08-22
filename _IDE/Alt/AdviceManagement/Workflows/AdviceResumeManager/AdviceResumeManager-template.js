// Advice Resume Manager - ShareDo Workflow Template
// Resumes paused advice for a work item and restores saved state
log.Information("====================================");
log.Information("Starting Advice Resume Manager");
log.Information("====================================");
let connections = $model.Connections;

// Get work item ID from the configured variable
// $ifNotNull.Configuration.workItemIdVariable
let workItemId = ctx["$model.Configuration.workItemIdVariable"];

// Get resume reason from the configured variable
let resumeReason;
// $ifNotNull.Configuration.resumeReasonVariable
resumeReason = ctx["$model.Configuration.resumeReasonVariable"];
// $else
resumeReason = "Advice resumed by workflow";
// $endif

// Get new due date if provided
// $ifNotNull.Configuration.newDueDateVariable
let newDueDate = ctx["$model.Configuration.newDueDateVariable"];
// $endif

if (!workItemId) {
    // $ifNotNull.Configuration.errorMessageVariable
    ctx["$model.Configuration.errorMessageVariable"] = "No work item ID provided for resume operation";
    // $endif
    
    // $ifNotNull.Connections.error
    trigger.SubProcess("$model.Connections.error.step").Now();
    // $endif
} else {
    log.Information(`Work Item ID: ${workItemId}`);
    log.Information(`Resume Reason: ${resumeReason}`);

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
            
            // Check if already active
            if (currentEnabled === true || currentEnabled === "true") {
                log.Information(`Advice is already active for work item ${workItemId} - no action needed`);
                
                // $ifNotNull.Configuration.successVariable
                ctx["$model.Configuration.successVariable"] = true;
                // $endif
                
                // $ifNotNull.Configuration.messageVariable
                ctx["$model.Configuration.messageVariable"] = "Advice is already active";
                // $endif
                
                // $ifNotNull.Configuration.alreadyActiveVariable
                ctx["$model.Configuration.alreadyActiveVariable"] = true;
                // $endif
                
                // $ifNotNull.Connections.alreadyActive
                trigger.SubProcess("$model.Connections.alreadyActive.step").Now();
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
                
                log.Information(`Current user for resume operation: ${currentUser}`);
                let resumedDate = new Date().toISOString();
                log.Information(`Resume timestamp: ${resumedDate}`);
                let restoredCount = 0;
                let createdCount = 0;
                let errorCount = 0;
                
                // Check for saved state to restore
                let savedStateStr = attributes["alt_ongoing_advice_saved_state"];
                log.Information(`Checking for saved state: ${savedStateStr ? 'Found' : 'Not found'}`);
                
                if (savedStateStr) {
                    log.Information(`Found saved advice state, attempting to restore`);
                    log.Information(`  Saved state length: ${savedStateStr.length} characters`);
                    
                    try {
                        let savedState = JSON.parse(savedStateStr);
                        log.Information(`Restoring ${savedState.adviceItems.length} saved advice items`);
                        
                        for (let savedAdvice of savedState.adviceItems) {
                            // Create new advice item based on saved state
                            log.Information(`  Restoring advice: ${savedAdvice.title} (${savedAdvice.workTypeSystemName})`);
                            let createUrl = "/api/v1/public/workItem/" + workItemId + "/children";
                            let createData = {
                                workTypeSystemName: savedAdvice.workTypeSystemName,
                                title: savedAdvice.title,
                                phaseSystemName: savedAdvice.phaseSystemName
                            };
                            
                            // If new due date provided, use it; otherwise use original
                            if (newDueDate) {
                                createData.dueDate = newDueDate;
                            } else if (savedAdvice.dueDate) {
                                createData.dueDate = savedAdvice.dueDate;
                            }
                            
                            // Restore any saved attributes
                            if (savedAdvice.attributes) {
                                createData.attributes = savedAdvice.attributes;
                            }
                            
                            let createResult = sharedo.http.post(createUrl, createData);
                            if (createResult.success) {
                                restoredCount++;
                                log.Information(`  Restored advice item: ${savedAdvice.title}`);
                            } else {
                                errorCount++;
                                log.Information(`  Failed to restore advice item ${savedAdvice.title}: ${createResult.status}`);
                            }
                        }
                        
                        // Clear saved state after restoration
                        // $ifNotNull.Configuration.clearSavedStateAfterRestore
                        if ($model.Configuration.clearSavedStateAfterRestore) {
                            let clearData = {
                                "alt_ongoing_advice_saved_state": null
                            };
                            sharedo.http.put(attributesUrl, clearData);
                            log.Information(`Cleared saved state after restoration`);
                        }
                        // $endif
                        
                    } catch (parseEx) {
                        log.Information(`Failed to parse saved state: ${parseEx.message}`);
                    }
                } else {
                    log.Information(`No saved state found`);
                    
                    // Create default advice if configured
                    // $ifNotNull.Configuration.createDefaultIfNoSavedState
                    if ($model.Configuration.createDefaultIfNoSavedState) {
                        log.Information(`Creating default advice item`);
                        
                        let createUrl = "/api/v1/public/workItem/" + workItemId + "/children";
                        
                        let adviceType;
                        // $ifNotNull.Configuration.defaultAdviceTypeSystemName
                        adviceType = "$model.Configuration.defaultAdviceTypeSystemName";
                        // $else
                        adviceType = "StandardAdvice";
                        // $endif
                        
                        // Calculate due date
                        let dueDate = newDueDate;
                        if (!dueDate) {
                            let defaultDate = new Date();
                            // $ifNotNull.Configuration.defaultAdviceOffsetDays
                            defaultDate.setDate(defaultDate.getDate() + $model.Configuration.defaultAdviceOffsetDays);
                            // $else
                            defaultDate.setDate(defaultDate.getDate() + 30);
                            // $endif
                            dueDate = defaultDate.toISOString();
                        }
                        
                        let createData = {
                            workTypeSystemName: adviceType,
                            title: "Ongoing Advice Review",
                            phaseSystemName: "New",
                            dueDate: dueDate
                        };
                        
                        let createResult = sharedo.http.post(createUrl, createData);
                        if (createResult.success) {
                            createdCount++;
                            log.Information(`  Created default advice item`);
                        } else {
                            errorCount++;
                            log.Information(`  Failed to create default advice: ${createResult.status}`);
                        }
                    }
                    // $endif
                }
                
                // Update work item attributes to resume advice
                let updateData = {
                    "alt_ongoing_advice_enabled": true,
                    "alt_ongoing_advice_resumed_date": resumedDate,
                    "alt_ongoing_advice_resumed_by": currentUser,
                    "alt_ongoing_advice_resume_reason": resumeReason,
                    // Clear pause-related fields
                    "alt_ongoing_advice_paused_date": null,
                    "alt_ongoing_advice_paused_by": null,
                    "alt_ongoing_advice_pause_reason": null
                };
                
                // Update next advice date if provided
                if (newDueDate) {
                    updateData["alt_ongoing_advice_next_date"] = newDueDate;
                    log.Information(`  Setting new due date: ${newDueDate}`);
                }
                
                log.Information(`Updating work item attributes to resume advice`);
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
                    log.Information(`Successfully resumed advice for work item ${workItemId}`);
                    log.Information(`  Summary: Restored=${restoredCount}, Created=${createdCount}, Errors=${errorCount}`);
                    
                    // Set output variables
                    // $ifNotNull.Configuration.successVariable
                    ctx["$model.Configuration.successVariable"] = true;
                    // $endif
                    
                    // $ifNotNull.Configuration.messageVariable
                    let message = `Successfully resumed advice`;
                    if (restoredCount > 0) {
                        message += ` (${restoredCount} items restored)`;
                    }
                    if (createdCount > 0) {
                        message += ` (${createdCount} items created)`;
                    }
                    ctx["$model.Configuration.messageVariable"] = message;
                    // $endif
                    
                    // $ifNotNull.Configuration.restoredCountVariable
                    ctx["$model.Configuration.restoredCountVariable"] = restoredCount;
                    // $endif
                    
                    // $ifNotNull.Configuration.createdCountVariable
                    ctx["$model.Configuration.createdCountVariable"] = createdCount;
                    // $endif
                    
                    // $ifNotNull.Configuration.errorCountVariable
                    ctx["$model.Configuration.errorCountVariable"] = errorCount;
                    // $endif
                    
                    // $ifNotNull.Configuration.resumedDateVariable
                    ctx["$model.Configuration.resumedDateVariable"] = resumedDate;
                    // $endif
                    
                    // $ifNotNull.Configuration.resumedByVariable
                    ctx["$model.Configuration.resumedByVariable"] = currentUser;
                    // $endif
                    
                    // Branch based on results
                    if (restoredCount > 0) {
                        log.Information(`Taking 'restored' branch - restored ${restoredCount} advice items`);
                        // $ifNotNull.Connections.restored
                        trigger.SubProcess("$model.Connections.restored.step").Now();
                        // $else
                        // $ifNotNull.Connections.success
                        trigger.SubProcess("$model.Connections.success.step").Now();
                        // $endif
                        // $endif
                    } else if (createdCount > 0) {
                        log.Information(`Taking 'created' branch - created ${createdCount} advice items`);
                        // $ifNotNull.Connections.created
                        trigger.SubProcess("$model.Connections.created.step").Now();
                        // $else
                        // $ifNotNull.Connections.success
                        trigger.SubProcess("$model.Connections.success.step").Now();
                        // $endif
                        // $endif
                    } else {
                        log.Information(`Taking 'success' branch - advice resumed but no items restored/created`);
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
        log.Information(`Error resuming advice for work item ${workItemId}: ${ex.message}`);
        ctx["$model.Configuration.errorMessageVariable"] = "Error resuming advice: " + ex.message;
        // $endif
        
        // $ifNotNull.Connections.error
        trigger.SubProcess("$model.Connections.error.step").Now();
        // $endif

        // $ifNull.Connections.error
        log.Error(`Error resuming advice for work item ${workItemId}: ${ex.message}`);
        // $endif
    }
    log.Information("====================================");
    log.Information("Advice Resume Manager completed");
    log.Information("====================================");
}
// $endif