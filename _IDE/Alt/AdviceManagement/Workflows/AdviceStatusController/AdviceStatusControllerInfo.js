namespace("Alt.AdviceManagement");

/**
 * AdviceStatusControllerInfo - Comprehensive information about the Advice Status Controller workflow action
 */
Alt.AdviceManagement.AdviceStatusControllerInfo = {
    name: "Advice Status Controller",
    category: "Advice Management", 
    version: "1.0",
    defaultTimeout: 30,
    
    description: "A conditional workflow action that checks the current advice status of a work item and performs different actions based on configurable conditions. Can pause, resume, toggle, or simply check advice status.",
    
    purpose: "Provides intelligent advice lifecycle management within workflows by allowing conditional logic based on current advice state. Enables automated advice management decisions based on business rules.",
    
    useCases: [
        "Automatically pause advice when a work item reaches a specific phase",
        "Resume advice when certain conditions are met in the workflow",
        "Toggle advice status based on user actions or external triggers", 
        "Check advice status and branch workflow logic accordingly",
        "Implement complex advice lifecycle rules with multiple conditions"
    ],
    
    configuration: {
        parameters: [
            {
                name: "defaultAction",
                type: "String",
                required: true,
                default: "checkOnly", 
                description: "Action to take when no conditions match. Options: checkOnly, pause, resume, toggle, doNothing"
            },
            {
                name: "conditions",
                type: "Array",
                required: false,
                default: "[]",
                description: "Array of when/then condition rules. Each condition has 'when' (status to match) and 'then' (action to take)"
            },
            {
                name: "pauseReason",
                type: "String", 
                required: false,
                default: "Workflow automated pause",
                description: "Reason text to record when pausing advice"
            },
            {
                name: "requireConfirmation",
                type: "Boolean",
                required: false,
                default: "false",
                description: "Whether to require user confirmation before taking action"
            },
            {
                name: "enableLogging",
                type: "Boolean",
                required: false,
                default: "true", 
                description: "Enable detailed logging for debugging and monitoring"
            },
            {
                name: "retryOnFailure",
                type: "Boolean",
                required: false,
                default: "true",
                description: "Automatically retry failed operations with exponential backoff"
            },
            {
                name: "maxRetries",
                type: "Number",
                required: false,
                default: "3",
                description: "Maximum number of retry attempts for failed operations"
            },
            {
                name: "timeout",
                type: "Number",
                required: false,
                default: "30000",
                description: "Maximum execution time in milliseconds before timeout"
            }
        ]
    },
    
    variables: {
        inputs: [
            {
                name: "workItemId", 
                type: "/Identifier/Work Item Identifier",
                required: true,
                description: "The ID of the work item to check/modify advice status for"
            },
            {
                name: "pauseReason",
                type: "/String", 
                required: false,
                description: "Custom reason for pausing advice (overrides configuration)"
            }
        ],
        outputs: [
            {
                name: "success",
                type: "/Boolean",
                description: "Whether the operation completed successfully"
            },
            {
                name: "actionTaken", 
                type: "/String",
                description: "The action that was performed (checkOnly, pause, resume, toggle, doNothing)"
            },
            {
                name: "previousStatus",
                type: "/String", 
                description: "The advice status before the action was taken"
            },
            {
                name: "currentStatus",
                type: "/String",
                description: "The advice status after the action was taken"
            },
            {
                name: "errorMessage",
                type: "/String",
                description: "Error message if the operation failed"
            },
            {
                name: "pausedDate",
                type: "/DateTime",
                description: "Date when advice was paused (if pause action was taken)"
            },
            {
                name: "resumedDate", 
                type: "/DateTime",
                description: "Date when advice was resumed (if resume action was taken)"
            },
            {
                name: "lastActionDate",
                type: "/DateTime", 
                description: "Date when the last action was performed"
            }
        ]
    },
    
    branches: [
        {
            name: "success",
            condition: "Operation completed successfully",
            description: "Taken when the advice status check/modification completes without errors"
        },
        {
            name: "paused", 
            condition: "Advice was paused",
            description: "Taken when advice was successfully paused by this action"
        },
        {
            name: "resumed",
            condition: "Advice was resumed", 
            description: "Taken when advice was successfully resumed by this action"
        },
        {
            name: "noAction",
            condition: "No action was taken",
            description: "Taken when only a status check was performed or conditions resulted in no action"
        },
        {
            name: "error",
            condition: "Operation failed",
            description: "Taken when an error occurred during execution"
        }
    ],
    
    examples: [
        {
            title: "Simple Status Check",
            scenario: "Check the current advice status without taking any action",
            configuration: {
                defaultAction: "checkOnly",
                conditions: [],
                enableLogging: true
            },
            expected: "Takes 'success' or 'noAction' branch with current status in output variables"
        },
        {
            title: "Conditional Pause",
            scenario: "Pause advice only if it's currently active, otherwise do nothing",
            configuration: {
                defaultAction: "doNothing",
                conditions: [
                    { when: "active", then: "pause" }
                ],
                pauseReason: "Workflow condition met",
                enableLogging: true
            },
            expected: "Takes 'paused' branch if advice was active, 'noAction' branch otherwise"
        },
        {
            title: "Auto Resume", 
            scenario: "Automatically resume advice if it's currently paused",
            configuration: {
                defaultAction: "doNothing",
                conditions: [
                    { when: "paused", then: "resume" }
                ],
                enableLogging: true,
                retryOnFailure: true
            },
            expected: "Takes 'resumed' branch if advice was paused, 'noAction' branch otherwise"
        },
        {
            title: "Toggle with Multiple Conditions",
            scenario: "Complex logic with multiple conditions and fallback action",
            configuration: {
                defaultAction: "checkOnly",
                conditions: [
                    { when: "active", then: "pause" },
                    { when: "paused", then: "resume" },
                    { when: "none", then: "doNothing" }
                ],
                requireConfirmation: true,
                enableLogging: true,
                maxRetries: 5
            },
            expected: "Takes appropriate branch based on current advice status"
        }
    ],
    
    debugging: [
        {
            category: "Logging",
            title: "Enable Debug Logging",
            description: "Add URL parameters to enable detailed logging for this workflow action",
            code: "?debug-advice=true&debug-workflow=true&ui-log-level=debug"
        },
        {
            category: "Configuration",
            title: "Validate Conditions",
            description: "Ensure all conditions have both 'when' and 'then' values set correctly"
        },
        {
            category: "Variables",
            title: "Check Variable Mappings", 
            description: "Verify that input variables (especially workItemId) are mapped to valid workflow variables"
        },
        {
            category: "Network",
            title: "API Response Inspection",
            description: "Check browser network tab for API calls to /api/v1/public/workItem/{id}/attributes",
            code: "// Expected response structure:\n{\n  \"AdviceStatus\": \"active|paused|none\",\n  \"AdvicePausedDate\": \"2023-01-01T00:00:00Z\",\n  \"AdvicePausedReason\": \"Reason text\"\n}"
        },
        {
            category: "Error Handling",
            title: "Retry Mechanism",
            description: "The action includes automatic retry with exponential backoff. Check logs for retry attempts."
        }
    ],
    
    troubleshooting: [
        {
            problem: "Action always takes 'error' branch",
            symptoms: [
                "Workflow consistently fails on this step",
                "Error messages in workflow logs",
                "Action appears to timeout"
            ],
            causes: [
                "Invalid work item ID variable mapping",
                "Network connectivity issues",
                "Insufficient permissions to access work item",
                "Work item does not exist",
                "API service unavailable"
            ],
            solutions: [
                "Verify work item ID variable contains a valid identifier",
                "Check network connectivity and API availability", 
                "Ensure user has read/write permissions on the work item",
                "Validate that the work item exists in the system",
                "Check ShareDo service status and logs"
            ]
        },
        {
            problem: "Conditions not working as expected",
            symptoms: [
                "Default action always taken instead of condition actions",
                "Wrong actions executed for advice status",
                "Unexpected branch paths in workflow"
            ],
            causes: [
                "Incorrectly configured condition rules",
                "Status values don't match expected format",
                "Conditions evaluated in unexpected order",
                "Missing or invalid 'when' or 'then' values"
            ],
            solutions: [
                "Review condition configuration for typos or incorrect values",
                "Verify advice status values (should be 'active', 'paused', or 'none')",
                "Test conditions individually with known advice states",
                "Check that all conditions have both 'when' and 'then' properly set"
            ]
        },
        {
            problem: "Action completes but no status change occurs",
            symptoms: [
                "Success branch taken but advice status unchanged",
                "No error messages but expected behavior missing",
                "Output variables show success but no actual change"
            ],
            causes: [
                "Insufficient permissions to modify work item",
                "Work item in a state that prevents advice changes",
                "API call succeeded but backend processing failed",
                "Advice management system configuration issues"
            ],
            solutions: [
                "Verify user has write permissions on work item",
                "Check work item phase and any business rules preventing changes",
                "Review backend logs for advice management operations",
                "Test advice changes manually through the UI",
                "Contact system administrator if permissions appear correct"
            ]
        },
        {
            problem: "Performance issues or timeouts",
            symptoms: [
                "Action takes longer than expected to complete",
                "Frequent timeout errors",
                "Workflow becomes unresponsive on this step"
            ],
            causes: [
                "Large number of retry attempts",
                "Network latency or slow API responses",
                "Database performance issues",
                "Insufficient timeout configuration"
            ],
            solutions: [
                "Reduce maxRetries configuration if appropriate",
                "Increase timeout value for complex operations",
                "Check network performance and API response times",
                "Review system performance during high load periods",
                "Consider splitting complex operations into smaller steps"
            ]
        }
    ]
};