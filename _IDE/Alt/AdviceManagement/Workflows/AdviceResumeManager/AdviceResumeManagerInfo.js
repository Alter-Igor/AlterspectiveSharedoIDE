namespace("Alt.AdviceManagement");

/**
 * AdviceResumeManagerInfo - Comprehensive information about the Advice Resume Manager workflow action
 */
Alt.AdviceManagement.AdviceResumeManagerInfo = {
    name: "Advice Resume Manager",
    category: "Advice Management",
    version: "1.0",
    defaultTimeout: 60,
    
    description: "A comprehensive workflow action that resumes previously paused advice by either restoring saved advice state or creating new default advice. Intelligently handles different restoration scenarios based on available saved state.",
    
    purpose: "Provides advanced advice lifecycle management by restoring previously paused advice from saved state or creating appropriate default advice when no saved state exists. Essential for completing advice pause/resume cycles with full state preservation.",
    
    useCases: [
        "Restore all previously paused advice when a work item becomes active again",
        "Resume advice after periods of inactivity or review completion",
        "Handle complex business rule scenarios that require coordinated advice restoration",
        "Create default advice when no previous state exists but advice is needed",
        "Manage different restoration strategies based on business requirements"
    ],
    
    configuration: {
        parameters: [
            {
                name: "abstractAdviceTypeSystemName",
                type: "String",
                required: true,
                default: "AbstractAdvice", 
                description: "System name of the abstract advice type for discovering previously paused advice items."
            },
            {
                name: "defaultAdviceTypeSystemName",
                type: "String",
                required: true,
                default: "StandardAdvice",
                description: "System name of the advice type to create when no saved state exists for restoration."
            },
            {
                name: "activePhase",
                type: "String", 
                required: false,
                default: "Active",
                description: "Phase name for active advice items. Used when creating or restoring advice."
            },
            {
                name: "pausedPhase",
                type: "String",
                required: false,
                default: "Removed", 
                description: "Phase name where paused advice items are stored. Used for cleanup after restoration."
            },
            {
                name: "newAdviceDueDate",
                type: "DateTime",
                required: false,
                default: "null",
                description: "Specific due date for resumed advice. If null, uses saved dates or calculates default offset."
            },
            {
                name: "enableLogging",
                type: "Boolean",
                required: false,
                default: "true",
                description: "Enable comprehensive logging for debugging and monitoring the resume process."
            },
            {
                name: "timeout",
                type: "Number",
                required: false,
                default: "60000",
                description: "Maximum execution time in milliseconds. Longer timeouts accommodate complex restoration scenarios."
            }
        ]
    },
    
    variables: {
        inputs: [
            {
                name: "workItemId",
                type: "/Identifier/Work Item Identifier",
                required: true,
                description: "The ID of the work item whose advice should be resumed"
            },
            {
                name: "newAdviceDueDate",
                type: "/DateTime",
                required: false,
                description: "Optional specific due date for resumed advice (overrides configuration)"
            }
        ],
        outputs: [
            {
                name: "success",
                type: "/Boolean",
                description: "Whether the resume operation completed successfully"
            },
            {
                name: "message",
                type: "/String",
                description: "Detailed message about the operation result"
            },
            {
                name: "resumeApproach", 
                type: "/String",
                description: "The approach used: 'restore' (from saved state) or 'create' (new default advice)"
            },
            {
                name: "restoredAdviceCount",
                type: "/Number",
                description: "Number of advice items restored from saved state"
            },
            {
                name: "createdAdviceCount", 
                type: "/Number",
                description: "Number of new advice items created"
            },
            {
                name: "totalAdviceCount",
                type: "/Number",
                description: "Total number of advice items after resume operation"
            },
            {
                name: "hadSavedState",
                type: "/Boolean",
                description: "Whether saved advice state was found and used"
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
            name: "restored",
            condition: "Advice restored from saved state",
            description: "Taken when saved advice state was found and successfully restored"
        },
        {
            name: "created",
            condition: "New default advice created", 
            description: "Taken when no saved state existed and new default advice was created"
        },
        {
            name: "success",
            condition: "Operation completed successfully",
            description: "General success branch when operation completes without errors"
        },
        {
            name: "error",
            condition: "Operation failed",
            description: "Taken when errors occurred during state restoration or advice creation"
        }
    ],
    
    examples: [
        {
            title: "Standard Advice Resume",
            scenario: "Resume advice using default configuration, restoring from saved state if available",
            configuration: {
                abstractAdviceTypeSystemName: "AbstractAdvice",
                defaultAdviceTypeSystemName: "StandardAdvice",
                activePhase: "Active",
                pausedPhase: "Removed",
                newAdviceDueDate: null,
                enableLogging: true
            },
            expected: "Takes 'restored' branch if saved state exists, 'created' branch if creating new advice"
        },
        {
            title: "Custom Due Date Resume",
            scenario: "Resume advice with a specific due date regardless of saved state", 
            configuration: {
                abstractAdviceTypeSystemName: "AbstractAdvice",
                defaultAdviceTypeSystemName: "StandardAdvice", 
                activePhase: "Active",
                newAdviceDueDate: "2024-12-31T00:00:00Z",
                enableLogging: true,
                timeout: 120000
            },
            expected: "Uses specified due date for all resumed or created advice items"
        },
        {
            title: "Custom Advice Type Resume",
            scenario: "Resume with custom advice types for specific business scenarios",
            configuration: {
                abstractAdviceTypeSystemName: "CustomAdviceBase",
                defaultAdviceTypeSystemName: "CustomStandardAdvice",
                activePhase: "InProgress", 
                pausedPhase: "Suspended",
                enableLogging: true,
                timeout: 90000
            },
            expected: "Restores custom advice types or creates custom default advice type"
        }
    ],
    
    debugging: [
        {
            category: "State Discovery",
            title: "Saved State Inspection",
            description: "Check work item attributes for saved advice state data",
            code: "// Saved state attributes to inspect:\n// alt_ongoing_advice_saved_state - JSON with saved advice items\n// alt_ongoing_advice_saved_count - Number of saved items\n// alt_ongoing_advice_paused_types - Types that were paused"
        },
        {
            category: "Logging",
            title: "Enable Debug Logging",
            description: "Add URL parameters to see detailed execution logs including restoration logic",
            code: "?debug-advice=true&debug-workflow=true&ui-log-level=debug&verbose-logging=true"
        },
        {
            category: "Restoration Logic",
            title: "Decision Tree Inspection", 
            description: "The action follows this decision tree: Saved State Found → Restore Items → Clear State | No Saved State → Create Default → Continue"
        },
        {
            category: "Date Handling",
            title: "Due Date Resolution",
            description: "Due date priority: 1) Configuration newAdviceDueDate, 2) Saved original dates, 3) Default offset from current date"
        },
        {
            category: "Performance", 
            title: "Execution Timing",
            description: "Monitor execution duration, especially for complex restorations with many advice items"
        }
    ],
    
    troubleshooting: [
        {
            problem: "Always creates new advice instead of restoring",
            symptoms: [
                "Takes 'created' branch even when advice was previously paused",
                "restoredAdviceCount always 0 in output",
                "hadSavedState output shows false"
            ],
            causes: [
                "Saved state attributes were not properly saved during pause",
                "Saved state attributes were cleared or corrupted",
                "Work item attributes API issues during state retrieval",
                "JSON deserialization problems with saved state data"
            ],
            solutions: [
                "Verify that pause operation properly saved advice state",
                "Check work item attributes for saved state information manually", 
                "Review attribute API responses for saved state retrieval",
                "Test JSON parsing of saved state data",
                "Ensure adequate permissions to read work item attributes"
            ]
        },
        {
            problem: "Restoration fails but default advice creation succeeds",
            symptoms: [
                "Takes 'created' branch after attempting restoration",
                "Error messages about restoration in logs",
                "hadSavedState shows true but restoredAdviceCount is 0"
            ],
            causes: [
                "Saved advice data is corrupted or invalid",
                "Advice types from saved state no longer exist",
                "Permission issues creating specific advice types",
                "Business rules preventing advice creation for saved types"
            ],
            solutions: [
                "Examine saved state JSON structure for corruption",
                "Verify that saved advice types still exist in the system",
                "Check permissions for creating each saved advice type",
                "Review business rules that might block advice creation",
                "Test creating advice items manually with saved data"
            ]
        },
        {
            problem: "Timeout errors during complex restoration",
            symptoms: [
                "Operation fails with timeout message",
                "Partial restoration with some advice created, others not",
                "Takes 'error' branch after configured timeout period"
            ],
            causes: [
                "Too many advice items to restore within timeout",
                "Slow API responses for advice creation operations",
                "Network connectivity issues during restoration",
                "Complex advice data requiring extended processing time"
            ],
            solutions: [
                "Increase timeout configuration for complex restorations",
                "Check network connectivity and API performance", 
                "Review system performance during restoration operations",
                "Consider simplifying saved state data to reduce processing time",
                "Monitor database performance for advice creation queries"
            ]
        },
        {
            problem: "Created advice has incorrect dates or properties",
            symptoms: [
                "Advice created successfully but with wrong due dates",
                "Missing custom attributes from original advice",
                "Advice created with default properties instead of saved ones"
            ],
            causes: [
                "Date handling configuration incorrect",
                "Custom attributes not properly preserved in saved state",
                "Default advice type missing expected properties",
                "Date format conversion issues"
            ],
            solutions: [
                "Verify date handling configuration and preferences",
                "Check that custom attributes are saved and restored properly",
                "Review default advice type definition and properties",
                "Test date format handling with various date inputs",
                "Ensure attribute mapping preserves all necessary data"
            ]
        }
    ]
};