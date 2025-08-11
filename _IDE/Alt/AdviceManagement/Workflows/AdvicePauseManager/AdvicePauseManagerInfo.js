namespace("Alt.AdviceManagement");

/**
 * AdvicePauseManagerInfo - Comprehensive information about the Advice Pause Manager workflow action
 */
Alt.AdviceManagement.AdvicePauseManagerInfo = {
    name: "Advice Pause Manager",
    category: "Advice Management",
    version: "1.0", 
    defaultTimeout: 60,
    
    description: "A comprehensive workflow action that finds all active advice items for a work item and pauses them by moving to a removed/paused phase. Optionally saves the current advice state for later restoration.",
    
    purpose: "Provides advanced advice lifecycle management by discovering all advice items that inherit from a configurable abstract advice type, preserving their state, and moving them to a paused phase. Essential for complex advice workflows where multiple advice types need coordinated pausing.",
    
    useCases: [
        "Pause all ongoing advice when a work item enters a specific phase (e.g., 'On Hold')",
        "Temporarily suspend advice during periods of inactivity or review",
        "Implement complex business rules that require coordinated advice management",
        "Prepare for advice state restoration by preserving complete advice information",
        "Handle situations where multiple advice types need simultaneous management"
    ],
    
    configuration: {
        parameters: [
            {
                name: "abstractAdviceTypeSystemName",
                type: "String",
                required: true,
                default: "AbstractAdvice",
                description: "System name of the abstract advice type that all advice inherits from. Used to discover all relevant advice items."
            },
            {
                name: "pausedPhase", 
                type: "String",
                required: false,
                default: "Removed",
                description: "Phase name to move advice items to when pausing. Typically 'Removed' or 'Paused'."
            },
            {
                name: "pauseReason",
                type: "String",
                required: false, 
                default: "Advice paused by workflow",
                description: "Reason text recorded when pausing advice items. Used for audit trails and user communication."
            },
            {
                name: "saveAdviceState",
                type: "Boolean",
                required: false,
                default: "true", 
                description: "Whether to save the complete advice state for later restoration. Includes titles, descriptions, due dates, and custom attributes."
            },
            {
                name: "enableLogging",
                type: "Boolean",
                required: false,
                default: "true",
                description: "Enable comprehensive logging for debugging and monitoring the pause process."
            },
            {
                name: "timeout",
                type: "Number",
                required: false,
                default: "60000",
                description: "Maximum execution time in milliseconds. Longer timeouts accommodate work items with many advice items."
            }
        ]
    },
    
    variables: {
        inputs: [
            {
                name: "workItemId",
                type: "/Identifier/Work Item Identifier", 
                required: true,
                description: "The ID of the work item whose advice should be paused"
            }
        ],
        outputs: [
            {
                name: "success",
                type: "/Boolean",
                description: "Whether the pause operation completed successfully"
            },
            {
                name: "message",
                type: "/String",
                description: "Detailed message about the operation result"
            },
            {
                name: "foundAdviceCount",
                type: "/Number", 
                description: "Total number of active advice items discovered"
            },
            {
                name: "pausedAdviceCount",
                type: "/Number",
                description: "Number of advice items successfully paused"
            },
            {
                name: "savedState",
                type: "/Boolean",
                description: "Whether advice state was successfully saved for restoration"
            },
            {
                name: "errors",
                type: "/String",
                description: "Any error messages encountered during the process"
            },
            {
                name: "duration",
                type: "/Number",
                description: "Total execution time in milliseconds"
            }
        ]
    },
    
    branches: [
        {
            name: "success",
            condition: "All advice items paused successfully",
            description: "Taken when one or more advice items were successfully paused"
        },
        {
            name: "noAdvice",
            condition: "No active advice found",
            description: "Taken when no active advice items were found to pause"
        },
        {
            name: "error", 
            condition: "Operation failed",
            description: "Taken when errors occurred during discovery, state saving, or pausing"
        }
    ],
    
    examples: [
        {
            title: "Standard Advice Pause",
            scenario: "Pause all advice for a work item using default configuration",
            configuration: {
                abstractAdviceTypeSystemName: "AbstractAdvice",
                pausedPhase: "Removed",
                pauseReason: "Work item placed on hold",
                saveAdviceState: true,
                enableLogging: true
            },
            expected: "Takes 'success' branch with all active advice moved to Removed phase and state saved"
        },
        {
            title: "Custom Advice Type Pause",
            scenario: "Pause advice for a specific advice type hierarchy",
            configuration: {
                abstractAdviceTypeSystemName: "CustomAdviceBase", 
                pausedPhase: "Suspended",
                pauseReason: "Custom business rule triggered",
                saveAdviceState: true,
                enableLogging: true,
                timeout: 120000
            },
            expected: "Discovers and pauses only advice items inheriting from CustomAdviceBase"
        },
        {
            title: "Quick Pause Without State",
            scenario: "Fast pause operation without saving state for restoration",
            configuration: {
                abstractAdviceTypeSystemName: "AbstractAdvice",
                pausedPhase: "Removed", 
                pauseReason: "Temporary suspension",
                saveAdviceState: false,
                enableLogging: false,
                timeout: 30000
            },
            expected: "Pauses advice quickly without state preservation, suitable for permanent removal"
        }
    ],
    
    debugging: [
        {
            category: "Discovery",
            title: "Advice Discovery Query",
            description: "The action uses findByQuery to discover advice items. Check the query structure and results.",
            code: "// Query format:\n// parentId={workItemId} AND workType.inheritsFrom={abstractAdviceType} AND phase={activePhase}"
        },
        {
            category: "Logging",
            title: "Enable Debug Logging", 
            description: "Add URL parameters to see detailed execution logs",
            code: "?debug-advice=true&debug-workflow=true&ui-log-level=debug"
        },
        {
            category: "State Management",
            title: "Advice State Inspection",
            description: "Check work item attributes for saved advice state information",
            code: "// Saved state attributes:\n// alt_ongoing_advice_saved_state - JSON serialized advice data\n// alt_ongoing_advice_saved_count - Number of saved items\n// alt_ongoing_advice_paused_types - Comma-separated advice types"
        },
        {
            category: "Performance",
            title: "Execution Timing",
            description: "Monitor execution duration, especially for work items with many advice items"
        }
    ],
    
    troubleshooting: [
        {
            problem: "No advice items found to pause",
            symptoms: [
                "Takes 'noAdvice' branch consistently",
                "foundAdviceCount is 0 in output",
                "Operation completes quickly with no changes"
            ],
            causes: [
                "No advice items exist for the work item",
                "Advice items don't inherit from the specified abstract type", 
                "All advice items are already in paused/removed phase",
                "Incorrect abstractAdviceTypeSystemName configuration"
            ],
            solutions: [
                "Verify that advice items exist for the work item",
                "Check that advice types inherit from the configured abstract type",
                "Confirm advice items are in 'Active' phase before pausing",
                "Review and correct the abstractAdviceTypeSystemName setting",
                "Test with a work item known to have active advice"
            ]
        },
        {
            problem: "Timeout errors during pause operation",
            symptoms: [
                "Operation fails with timeout message",
                "Partial completion with some advice paused, others not",
                "Takes 'error' branch after configured timeout period"
            ],
            causes: [
                "Too many advice items to process within timeout",
                "Slow API responses for advice operations",
                "Network connectivity issues",
                "Database performance problems"
            ],
            solutions: [
                "Increase timeout configuration for complex work items",
                "Check network connectivity and API performance",
                "Review system performance during high load",
                "Consider breaking large operations into smaller batches",
                "Monitor database performance for advice-related queries"
            ]
        },
        {
            problem: "State saving fails but advice is paused",
            symptoms: [
                "Advice successfully moved to paused phase",
                "savedState output shows false",
                "Error messages about state saving in logs"
            ],
            causes: [
                "Insufficient permissions to update work item attributes",
                "Attribute size limits exceeded for large advice states",
                "Work item attribute API issues",
                "JSON serialization problems with advice data"
            ],
            solutions: [
                "Verify user has write permissions on work item attributes",
                "Check if advice state data exceeds attribute size limits",
                "Review attribute API responses for errors", 
                "Test JSON serialization of advice data manually",
                "Consider reducing saved state information if size is an issue"
            ]
        },
        {
            problem: "Some advice items fail to pause",
            symptoms: [
                "pausedAdviceCount is less than foundAdviceCount",
                "Partial success with some advice still active",
                "Error messages for specific advice items"
            ],
            causes: [
                "Individual advice items in non-pausable states",
                "Permission issues for specific advice types",
                "Business rules preventing phase transitions",
                "Advice items locked by other processes"
            ],
            solutions: [
                "Review business rules for advice phase transitions",
                "Check permissions for each advice type individually", 
                "Verify advice items are not locked by other users/processes",
                "Examine individual error messages for specific causes",
                "Test phase transitions manually for failing advice items"
            ]
        }
    ]
};