// Advice Status Checker - ShareDo Workflow Template
// Checks work item advice status and branches based on result

let connections = $model.Connections;

// Get work item ID from the configured variable
// $ifNotNull.Configuration.workItemIdVariable
let workItemId = ctx["$model.Configuration.workItemIdVariable"];
if (!workItemId) {
    // $ifNotNull.Configuration.errorMessageVariable
    ctx["$model.Configuration.errorMessageVariable"] = "No work item ID provided";
    // $endif
    
    // $ifNotNull.Connections.error
    trigger.SubProcess("$model.Connections.error.step").Now();
    // $endif
} else {
    try {
        // Make direct API call using ShareDo's HTTP client
        let attributesUrl = "/api/v1/public/workItem/" + workItemId + "/attributes";
        let httpResult = sharedo.http.get(attributesUrl);
        
        if (!httpResult.success) {
            // API call failed
            // $ifNotNull.Configuration.errorMessageVariable
            ctx["$model.Configuration.errorMessageVariable"] = "Failed to retrieve work item attributes - API returned '" + httpResult.status + "'";
            // $endif
            
            // $ifNotNull.Connections.error
            trigger.SubProcess("$model.Connections.error.step").Now();
            // $endif
        } else {
            // API call succeeded - process attributes
            let attributes = httpResult.body || {};
            
            // Get the enabled status with legacy handling
            let enabled = attributes["alt_ongoing_advice_enabled"];
            
            // Handle legacy work-types: if enabled is null/undefined, default to true
            if (enabled === null || enabled === undefined) {
                enabled = true;
            } else if (typeof enabled === 'string') {
                enabled = enabled.toLowerCase() === 'true';
            } else {
                enabled = Boolean(enabled);
            }
            
            // Prepare advice data structure
            let adviceData = {
                isEnabled: enabled,
                status: enabled ? 'active' : 'paused',
                pausedDate: attributes["alt_ongoing_advice_paused_date"] || null,
                pausedBy: attributes["alt_ongoing_advice_paused_by"] || null,
                pauseReason: attributes["alt_ongoing_advice_pause_reason"] || null,
                resumedDate: attributes["alt_ongoing_advice_resumed_date"] || null,
                resumedBy: attributes["alt_ongoing_advice_resumed_by"] || null,
                resumeReason: attributes["alt_ongoing_advice_resume_reason"] || null,
                nextAdviceDate: attributes["alt_ongoing_advice_next_date"] || null
            };
            
            // Set output variables from advice data
            // $ifNotNull.Configuration.statusVariable
            ctx["$model.Configuration.statusVariable"] = adviceData.status;
            // $endif
            
            // $ifNotNull.Configuration.isEnabledVariable
            ctx["$model.Configuration.isEnabledVariable"] = adviceData.isEnabled;
            // $endif
            
            // $ifNotNull.Configuration.pausedDateVariable
            ctx["$model.Configuration.pausedDateVariable"] = adviceData.pausedDate;
            // $endif
            
            // $ifNotNull.Configuration.pausedByVariable
            ctx["$model.Configuration.pausedByVariable"] = adviceData.pausedBy;
            // $endif
            
            // $ifNotNull.Configuration.pauseReasonVariable
            ctx["$model.Configuration.pauseReasonVariable"] = adviceData.pauseReason;
            // $endif
            
            // $ifNotNull.Configuration.resumedDateVariable
            ctx["$model.Configuration.resumedDateVariable"] = adviceData.resumedDate;
            // $endif
            
            // $ifNotNull.Configuration.resumedByVariable
            ctx["$model.Configuration.resumedByVariable"] = adviceData.resumedBy;
            // $endif
            
            // $ifNotNull.Configuration.resumeReasonVariable
            ctx["$model.Configuration.resumeReasonVariable"] = adviceData.resumeReason;
            // $endif
            
            // $ifNotNull.Configuration.nextAdviceDateVariable
            ctx["$model.Configuration.nextAdviceDateVariable"] = adviceData.nextAdviceDate;
            // $endif
            
            // Branch based on advice status
            if (adviceData.isEnabled) {
                // $ifNotNull.Connections.adviceRunning
                trigger.SubProcess("$model.Connections.adviceRunning.step").Now();
                // $endif
            } else {
                // $ifNotNull.Connections.advicePaused
                trigger.SubProcess("$model.Connections.advicePaused.step").Now();
                // $endif
            }
        }
        
    } catch (ex) {
        // Handle any exceptions
        // $ifNotNull.Configuration.errorMessageVariable
        ctx["$model.Configuration.errorMessageVariable"] = "Error checking advice status: " + ex.message;
        // $endif
        
        // $ifNotNull.Connections.error
        trigger.SubProcess("$model.Connections.error.step").Now();
        // $endif
    }
}
// $endif