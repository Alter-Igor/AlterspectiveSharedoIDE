/**
 * AdviceResumeManager Factory
 * 
 * Factory function for creating AdviceResumeManager workflow action nodes
 * in the visual workflow designer.
 */
(function() {
    'use strict';

    // Ensure namespace exists
    if (typeof Alt === 'undefined') Alt = {};
    if (typeof Alt.AdviceManagement === 'undefined') Alt.AdviceManagement = {};
    if (typeof Alt.AdviceManagement.Workflows === 'undefined') Alt.AdviceManagement.Workflows = {};

    /**
     * Factory function for creating AdviceResumeManager workflow nodes
     * @param {Object} workflowModel - The overall workflow model
     * @returns {Object} - The node model for AdviceResumeManager
     */
    Alt.AdviceManagement.Workflows.AdviceResumeManagerFactory = function(workflowModel) {
        return {
            // Node identification
            id: generateUniqueId('AdviceResumeManager'),
            systemName: 'AdviceResumeManager',
            type: 'AdviceResumeManager',
            name: 'Advice Resume Manager',
            
            // Visual properties
            icon: 'fa-play-circle',
            color: '#28a745',
            category: 'Advice Management',
            
            // Node description
            description: 'Restores paused advice from saved state or creates new default advice',
            
            // Input/Output configuration
            ui: {
                // Input variable selectors
                workItemIdVariable: {
                    label: 'Work Item ID Variable',
                    type: 'variableSelector',
                    required: true,
                    variableType: '/Identifier/Work Item Identifier',
                    value: ko.observable(null),
                    allowedTypes: ['/Identifier/Work Item Identifier']
                },
                
                newDueDateVariable: {
                    label: 'New Due Date Variable',
                    type: 'variableSelector',
                    required: false,
                    variableType: '/DateTime',
                    value: ko.observable(null),
                    allowedTypes: ['/DateTime']
                },
                
                resumeReasonVariable: {
                    label: 'Resume Reason Variable',
                    type: 'variableSelector',
                    required: false,
                    variableType: '/String',
                    value: ko.observable(null),
                    allowedTypes: ['/String']
                },
                
                // Output variable selectors
                successVariable: {
                    label: 'Success Variable',
                    type: 'variableSelector',
                    required: false,
                    variableType: '/Boolean',
                    value: ko.observable(null),
                    allowedTypes: ['/Boolean']
                },
                
                messageVariable: {
                    label: 'Message Variable',
                    type: 'variableSelector',
                    required: false,
                    variableType: '/String',
                    value: ko.observable(null),
                    allowedTypes: ['/String']
                },
                
                restoredCountVariable: {
                    label: 'Restored Count Variable',
                    type: 'variableSelector',
                    required: false,
                    variableType: '/Number',
                    value: ko.observable(null),
                    allowedTypes: ['/Number']
                },
                
                createdCountVariable: {
                    label: 'Created Count Variable',
                    type: 'variableSelector',
                    required: false,
                    variableType: '/Number',
                    value: ko.observable(null),
                    allowedTypes: ['/Number']
                },
                
                resumedDateVariable: {
                    label: 'Resumed Date Variable',
                    type: 'variableSelector',
                    required: false,
                    variableType: '/DateTime',
                    value: ko.observable(null),
                    allowedTypes: ['/DateTime']
                },
                
                errorCountVariable: {
                    label: 'Error Count Variable',
                    type: 'variableSelector',
                    required: false,
                    variableType: '/Number',
                    value: ko.observable(null),
                    allowedTypes: ['/Number']
                }
            },
            
            // Configuration options
            config: {
                // Resume strategy
                useWorkflowApproach: ko.observable(true),
                abstractAdviceTypeSystemName: ko.observable('AbstractAdvice'),
                defaultAdviceTypeSystemName: ko.observable('StandardAdvice'),
                
                // Date handling
                preserveOriginalDates: ko.observable(false),
                defaultAdviceOffsetDays: ko.observable(30),
                
                // Behavior options
                createDefaultIfNoSavedState: ko.observable(true),
                clearSavedStateAfterRestore: ko.observable(true),
                
                // Performance and reliability
                enableLogging: ko.observable(true),
                enableRetry: ko.observable(true),
                maxRetries: ko.observable(3),
                retryDelay: ko.observable(1000),
                timeout: ko.observable(60000)
            },
            
            // Validation rules
            validation: {
                workItemIdVariable: ko.computed(function() {
                    return this.ui.workItemIdVariable.value() ? null : 'Work Item ID variable is required';
                }, this)
            },
            
            // Branch definitions for visual workflow
            branches: [
                {
                    id: 'success',
                    name: 'Success',
                    description: 'Resume operation completed successfully',
                    color: '#28a745'
                },
                {
                    id: 'restored',
                    name: 'Restored from State',
                    description: 'Previous advice state was restored',
                    color: '#17a2b8'
                },
                {
                    id: 'created',
                    name: 'Created New',
                    description: 'New default advice was created',
                    color: '#20c997'
                },
                {
                    id: 'noAction',
                    name: 'No Action Required',
                    description: 'Advice is already active',
                    color: '#6c757d'
                },
                {
                    id: 'error',
                    name: 'Error',
                    description: 'Resume operation failed',
                    color: '#dc3545'
                }
            ],
            
            // Reference to workflow model for variable selection
            workflowModel: workflowModel
        };
    };
    
    /**
     * Generate a unique ID for workflow nodes
     * @param {string} prefix - Prefix for the ID
     * @returns {string} - Unique ID
     */
    function generateUniqueId(prefix) {
        return prefix + '_' + Math.random().toString(36).substr(2, 9);
    }

})();