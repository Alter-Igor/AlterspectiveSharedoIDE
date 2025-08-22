// Advice Status Checker - ShareDo Workflow Template
// Checks work item advice status and branches based on result
  log.Information("====================================");
  log.Information("Starting Advice Status Checker v1.0");
  log.Information("====================================");
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
    log.Information(`Work Item ID: ${workItemId}`);

    try {
        // Make direct API call using ShareDo's HTTP client
        let attributesUrl = "/api/v1/public/workItem/" + workItemId + "/attributes";
        log.Information(`Calling API endpoint: ${attributesUrl}`);
        let httpResult = sharedo.http.get(attributesUrl);

        log.Information(`API call result: ${JSON.stringify(httpResult)}`);
        
        if (!httpResult.success) {
            log.Information(`API call failed: ${httpResult.status}`);
            // API call failed
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
            log.Information(`API call succeeded for work item ${workItemId}`);
            // API call succeeded - process attributes
            let attributes = httpResult.body || {};
            
            // Get the enabled status with legacy handling
            let enabled = attributes["alt_ongoing_advice_enabled"];
            
            log.Information(`  Raw enabled status: ${enabled}`);

            // Handle legacy work-types: if enabled is null/undefined, default to true
            if (enabled === null || enabled === undefined) {
                log.Information(`  Legacy handling: 'alt_ongoing_advice_enabled' is null/undefined, defaulting to true`);
                enabled = true;
            } else if (typeof enabled === 'string') {
                enabled = enabled.toLowerCase() === 'true';
            } else {
                enabled = Boolean(enabled);
            }

            log.Information(`  Processed enabled status: ${enabled}`);
            
            // Helper function to convert string to DateTime
            function convertToDateTime(value) {
                if (!value) return null;
                
                try {
                    // If it's already a Date object, return as-is
                    if (value instanceof Date) {
                        return value;
                    }
                    
                    // Try to parse as ISO string or standard date string
                    let date = new Date(value);
                    
                    // Check if the date is valid
                    if (!isNaN(date.getTime())) {
                        return date;
                    }
                    
                    // If parsing failed, log warning and return original value
                    log.Information(`  Warning: Could not convert '${value}' to DateTime, using original value`);
                    return value;
                } catch (ex) {
                    log.Information(`  Warning: DateTime conversion error for '${value}': ${ex.message}`);
                    return value;
                }
            }

            log.Information(`  setting up advice data structure`);
            // Prepare advice data structure with date conversion
            let adviceData = {
                isEnabled: enabled,
                status: enabled ? 'active' : 'paused',
                pausedDate: convertToDateTime(attributes["alt_ongoing_advice_paused_date"]),
                pausedBy: attributes["alt_ongoing_advice_paused_by"] || null,
                pauseReason: attributes["alt_ongoing_advice_pause_reason"] || null,
                resumedDate: convertToDateTime(attributes["alt_ongoing_advice_resumed_date"]),
                resumedBy: attributes["alt_ongoing_advice_resumed_by"] || null,
                resumeReason: attributes["alt_ongoing_advice_resume_reason"] || null,
                nextAdviceDate: convertToDateTime(attributes["alt_ongoing_advice_next_date"])
            };
            
            // Log field mappings for debugging
            log.Information(`AdviceStatusChecker - Field Mappings for Work Item ${workItemId}:`);
            log.Information(`  Raw Attributes: ${JSON.stringify(attributes)}`);
            log.Information(`  Processed Advice Data: ${JSON.stringify(adviceData)}`);

            // Set output variables from advice data and log each mapping
            // $ifNotNull.Configuration.statusVariable
            ctx["$model.Configuration.statusVariable"] = adviceData.status;
            log.Information(`  Mapped status '${adviceData.status}' to variable '${"$model.Configuration.statusVariable"}'`);
            // $endif
            
            // $ifNotNull.Configuration.isEnabledVariable
            ctx["$model.Configuration.isEnabledVariable"] = adviceData.isEnabled;
            log.Information(`  Mapped isEnabled '${adviceData.isEnabled}' to variable '${"$model.Configuration.isEnabledVariable"}'`);
            // $endif
            
            // $ifNotNull.Configuration.pausedDateVariable
            ctx["$model.Configuration.pausedDateVariable"] = adviceData.pausedDate;
            log.Information(`  Mapped pausedDate '${adviceData.pausedDate}' (type: ${adviceData.pausedDate ? typeof adviceData.pausedDate : 'null'}) to variable '${"$model.Configuration.pausedDateVariable"}'`);
            // $endif
            
            // $ifNotNull.Configuration.pausedByVariable
            ctx["$model.Configuration.pausedByVariable"] = adviceData.pausedBy;
            log.Information(`  Mapped pausedBy '${adviceData.pausedBy}' to variable '${"$model.Configuration.pausedByVariable"}'`);
            // $endif
            
            // $ifNotNull.Configuration.pauseReasonVariable
            ctx["$model.Configuration.pauseReasonVariable"] = adviceData.pauseReason;
            log.Information(`  Mapped pauseReason '${adviceData.pauseReason}' to variable '${"$model.Configuration.pauseReasonVariable"}'`);
            // $endif
            
            // $ifNotNull.Configuration.resumedDateVariable
            ctx["$model.Configuration.resumedDateVariable"] = adviceData.resumedDate;
            log.Information(`  Mapped resumedDate '${adviceData.resumedDate}' (type: ${adviceData.resumedDate ? typeof adviceData.resumedDate : 'null'}) to variable '${"$model.Configuration.resumedDateVariable"}'`);
            // $endif
            
            // $ifNotNull.Configuration.resumedByVariable
            ctx["$model.Configuration.resumedByVariable"] = adviceData.resumedBy;
            log.Information(`  Mapped resumedBy '${adviceData.resumedBy}' to variable '${"$model.Configuration.resumedByVariable"}'`);
            // $endif
            
            // $ifNotNull.Configuration.resumeReasonVariable
            ctx["$model.Configuration.resumeReasonVariable"] = adviceData.resumeReason;
            log.Information(`  Mapped resumeReason '${adviceData.resumeReason}' to variable '${"$model.Configuration.resumeReasonVariable"}'`);
            // $endif
            
            // $ifNotNull.Configuration.nextAdviceDateVariable
            ctx["$model.Configuration.nextAdviceDateVariable"] = adviceData.nextAdviceDate;
            log.Information(`  Mapped nextAdviceDate '${adviceData.nextAdviceDate}' (type: ${adviceData.nextAdviceDate ? typeof adviceData.nextAdviceDate : 'null'}) to variable '${"$model.Configuration.nextAdviceDateVariable"}'`);
            // $endif
            
            // Branch based on advice status
            if (adviceData.isEnabled) {
                log.Information(`  Taking 'adviceRunning' branch for work item ${workItemId}`);
                // $ifNotNull.Connections.adviceRunning
                trigger.SubProcess("$model.Connections.adviceRunning.step").Now();
                // $endif
            } else {
                log.Information(`  Taking 'advicePaused' branch for work item ${workItemId}`);
                // $ifNotNull.Connections.advicePaused
                trigger.SubProcess("$model.Connections.advicePaused.step").Now();
                // $endif
            }
        }
        
    } catch (ex) {
        // Handle any exceptions
        // $ifNotNull.Configuration.errorMessageVariable

        log.Information(`Error checking advice status for work item ${workItemId}: ${ex.message}`);

        ctx["$model.Configuration.errorMessageVariable"] = "Error checking advice status: " + ex.message;
        // $endif
        
        // $ifNotNull.Connections.error
        trigger.SubProcess("$model.Connections.error.step").Now();
        // $endif

        // $ifNull.Connections.error
        log.Error(`Error checking advice status for work item ${workItemId}: ${ex.message}`);
        // $endif
    }
    log.Information("====================================");
    log.Information("Advice Status Checker completed successfully");
    log.Information("====================================");
}
// $endif