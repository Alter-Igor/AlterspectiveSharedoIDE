namespace("Alt.AdviceManagement");

/**
 * AdviceStatusCheckerInfo - Comprehensive information about the Advice Status Checker workflow action
 */
Alt.AdviceManagement.AdviceStatusCheckerInfo = {
    name: "Advice Status Checker",
    category: "Advice Management",
    version: "1.0",
    defaultTimeout: 30,
    
    description: "A lightweight workflow action that checks the current advice status of a work item and provides the status information to downstream workflow steps. Designed for read-only status checking without modification.",
    
    purpose: "Provides fast, efficient advice status checking for workflow decision-making. Enables workflows to branch based on current advice state without the complexity of status modification actions.",
    
    useCases: [
        "Check advice status before performing workflow operations",
        "Branch workflows based on whether advice is active, paused, or absent",
        "Validate advice state as part of business rule validation",
        "Collect advice status information for reporting or logging",
        "Perform status checks in batch processing scenarios"
    ],
    
    configuration: {
        parameters: [
            {
                name: "workItemIdVariable",
                type: "Variable Reference", 
                required: true,
                default: "None",
                description: "Workflow variable containing the work item ID to check advice status for"
            },
            {
                name: "outputStatusVariable",
                type: "Variable Reference",
                required: false,
                default: "None", 
                description: "Workflow variable to store the detected advice status (active/paused/none)"
            },
            {
                name: "outputLastActionDateVariable",
                type: "Variable Reference",
                required: false,
                default: "None",
                description: "Workflow variable to store the date of the last advice action"
            },
            {
                name: "outputPausedReasonVariable", 
                type: "Variable Reference",
                required: false,
                default: "None",
                description: "Workflow variable to store the reason if advice is paused"
            },
            {
                name: "enableCaching",
                type: "Boolean",
                required: false,
                default: "true",
                description: "Enable response caching to improve performance for repeated checks"
            },
            {
                name: "enableLogging",
                type: "Boolean", 
                required: false,
                default: "true",
                description: "Enable detailed logging for debugging and monitoring"
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
                description: "The ID of the work item to check advice status for"
            }
        ],
        outputs: [
            {
                name: "adviceStatus",
                type: "/String", 
                description: "Current advice status: 'active', 'paused', or 'none'"
            },
            {
                name: "hasAdvice",
                type: "/Boolean",
                description: "Whether the work item has any advice (active or paused)"
            },
            {
                name: "lastActionDate",
                type: "/DateTime",
                description: "Date when the last advice action occurred"
            },
            {
                name: "pausedReason",
                type: "/String",
                description: "Reason text if advice is currently paused"
            },
            {
                name: "pausedDate",
                type: "/DateTime", 
                description: "Date when advice was paused (if currently paused)"
            },
            {
                name: "pausedBy",
                type: "/String",
                description: "User who paused the advice (if currently paused)"
            },
            {
                name: "success",
                type: "/Boolean",
                description: "Whether the status check completed successfully"
            },
            {
                name: "errorMessage",
                type: "/String",
                description: "Error message if the status check failed"
            }
        ]
    },
    
    branches: [
        {
            name: "active",
            condition: "Advice is currently active",
            description: "Taken when work item has active advice"
        },
        {
            name: "paused",
            condition: "Advice is currently paused", 
            description: "Taken when work item has paused advice"
        },
        {
            name: "none",
            condition: "No advice exists",
            description: "Taken when work item has no advice (active or paused)"
        },
        {
            name: "success",
            condition: "Status check completed successfully",
            description: "General success branch for successful status retrieval"
        },
        {
            name: "error",
            condition: "Status check failed",
            description: "Taken when errors occurred during status checking"
        }
    ],
    
    examples: [
        {
            title: "Simple Status Check", 
            scenario: "Check advice status and branch accordingly without storing output",
            configuration: {
                workItemIdVariable: "WorkItemId",
                enableCaching: true,
                enableLogging: true,
                timeout: 30000
            },
            expected: "Takes appropriate branch (active/paused/none) based on current advice status"
        },
        {
            title: "Status Check with Output Variables",
            scenario: "Check status and store detailed information in workflow variables for later use",
            configuration: {
                workItemIdVariable: "WorkItemId", 
                outputStatusVariable: "CurrentAdviceStatus",
                outputLastActionDateVariable: "LastAdviceActionDate",
                outputPausedReasonVariable: "AdvicePausedReason",
                enableCaching: true,
                enableLogging: true
            },
            expected: "Populates output variables with detailed advice information"
        },
        {
            title: "High-Performance Batch Check",
            scenario: "Fast status checking for batch operations with caching disabled",
            configuration: {
                workItemIdVariable: "WorkItemId",
                outputStatusVariable: "AdviceStatus",
                enableCaching: false,
                enableLogging: false,
                timeout: 10000
            },
            expected: "Performs fresh status check without caching, optimized for batch processing"
        },
        {
            title: "Detailed Status Investigation",
            scenario: "Comprehensive status check with full logging and extended timeout for investigation",
            configuration: {
                workItemIdVariable: "WorkItemId",
                outputStatusVariable: "Status", 
                outputLastActionDateVariable: "LastAction",
                outputPausedReasonVariable: "PauseReason",
                enableCaching: false,
                enableLogging: true,
                timeout: 60000
            },
            expected: "Provides complete advice status information with detailed logging"
        }
    ],
    
    debugging: [
        {
            category: "Logging",
            title: "Enable Debug Logging",
            description: "Add URL parameters to see detailed status checking logs",
            code: "?debug-advice=true&debug-workflow=true&ui-log-level=debug"
        },
        {
            category: "API Inspection", 
            title: "Check API Response",
            description: "Monitor network tab for advice status API calls and responses",
            code: "// Expected API call:\n// GET /api/v1/public/workItem/{id}/attributes\n\n// Expected response attributes:\n// AdviceStatus: \"active\"|\"paused\"|\"none\"\n// AdvicePausedDate: \"2023-01-01T00:00:00Z\"\n// AdvicePausedReason: \"Reason text\""
        },
        {
            category: "Variables",
            title: "Verify Variable Mappings",
            description: "Ensure input and output variables are correctly mapped to workflow variables"
        },
        {
            category: "Caching",
            title: "Cache Behavior",
            description: "Enable/disable caching to test fresh vs cached responses",
            code: "// Cache TTL: 5 minutes for advice status\n// Clear cache by disabling caching in configuration"
        },
        {
            category: "Performance",
            title: "Execution Timing",
            description: "Monitor execution duration - should typically complete in under 1 second"
        }
    ],
    
    troubleshooting: [
        {
            problem: "Always takes 'error' branch",
            symptoms: [
                "Workflow consistently fails on this step",
                "Error messages about work item access", 
                "Timeout errors in logs"
            ],
            causes: [
                "Invalid work item ID variable mapping",
                "Work item doesn't exist or is inaccessible",
                "Insufficient permissions to read work item",
                "Network connectivity issues",
                "API service unavailable"
            ],
            solutions: [
                "Verify work item ID variable contains valid identifier",
                "Check that work item exists and is accessible",
                "Ensure user has read permissions on work item",
                "Test network connectivity and API availability",
                "Check ShareDo service status and logs"
            ]
        },
        {
            problem: "Always takes 'none' branch for items with advice",
            symptoms: [
                "Known work items with advice show as having no advice",
                "Output variables show 'none' status",
                "hasAdvice output is consistently false"
            ],
            causes: [
                "Advice status attributes not properly set",
                "Different advice management system in use", 
                "Attribute names don't match expected values",
                "Advice items exist but status not recorded properly"
            ],
            solutions: [
                "Check work item attributes manually for advice status",
                "Verify advice management system configuration",
                "Review attribute names used for advice status tracking",
                "Test with work items known to have properly recorded advice",
                "Check advice management workflow processes"
            ]
        },
        {
            problem: "Inconsistent results or caching issues",
            symptoms: [
                "Status results vary between checks",
                "Recent advice changes not reflected",
                "Stale data returned even after advice modifications"
            ],
            causes: [
                "Caching enabled but changes made outside cache TTL",
                "Multiple workflow instances causing race conditions",
                "API response caching at server level",
                "Browser caching interfering with requests"
            ],
            solutions: [
                "Disable caching temporarily to test fresh responses",
                "Ensure proper cache invalidation after advice changes",
                "Check for concurrent workflow executions",
                "Review server-side caching configurations", 
                "Test with browser cache disabled"
            ]
        },
        {
            problem: "Performance issues or slow responses",
            symptoms: [
                "Status checks take longer than expected",
                "Timeout errors in high-load scenarios",
                "Workflow becomes sluggish on this step"
            ],
            causes: [
                "API performance issues",
                "Database query optimization needed",
                "Network latency problems",
                "High concurrent usage"
            ],
            solutions: [
                "Enable caching to reduce API calls",
                "Increase timeout for high-latency environments",
                "Monitor API performance and response times",
                "Check database performance for attribute queries",
                "Consider batching status checks if applicable"
            ]
        }
    ]
};