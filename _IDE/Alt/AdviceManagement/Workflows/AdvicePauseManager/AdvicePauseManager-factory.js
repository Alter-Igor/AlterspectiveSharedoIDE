/**
 * AdvicePauseManager Factory
 * 
 * Factory function for creating AdvicePauseManager workflow action nodes
 * in the visual workflow designer.
 */
(function() {
    'use strict';

    // Ensure namespace exists
    if (typeof Alt === 'undefined') Alt = {};
    if (typeof Alt.AdviceManagement === 'undefined') Alt.AdviceManagement = {};
    if (typeof Alt.AdviceManagement.Workflows === 'undefined') Alt.AdviceManagement.Workflows = {};

    /**
     * Factory function for creating AdvicePauseManager workflow nodes
     * @param {Object} workflowModel - The overall workflow model
     * @returns {Object} - The node model for AdvicePauseManager
     */
    Alt.AdviceManagement.Workflows.AdvicePauseManagerFactory = function(workflowModel) {
        return {
            // Node identification
            id: generateUniqueId('AdvicePauseManager'),
            systemName: 'AdvicePauseManager',
            type: 'AdvicePauseManager',
            name: 'Advice Pause Manager',
            
            // Visual properties
            icon: 'fa-pause-circle',
            color: '#ffc107',
            category: 'Advice Management',
            
            // Node description
            description: 'Finds active advice items, saves their state, and moves them to paused phase',
            
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
                
                pauseReasonVariable: {
                    label: 'Pause Reason Variable',
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
                
                foundAdviceCountVariable: {
                    label: 'Found Advice Count Variable',
                    type: 'variableSelector',
                    required: false,
                    variableType: '/Number',
                    value: ko.observable(null),
                    allowedTypes: ['/Number']
                },
                
                pausedAdviceCountVariable: {
                    label: 'Paused Advice Count Variable',
                    type: 'variableSelector',
                    required: false,
                    variableType: '/Number',
                    value: ko.observable(null),
                    allowedTypes: ['/Number']
                },
                
                savedStateVariable: {
                    label: 'Saved State Variable',
                    type: 'variableSelector',
                    required: false,
                    variableType: '/Boolean',
                    value: ko.observable(null),
                    allowedTypes: ['/Boolean']
                },
                
                pausedDateVariable: {
                    label: 'Paused Date Variable',
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
                // Pause strategy
                useWorkflowApproach: ko.observable(true),
                abstractAdviceTypeSystemName: ko.observable('AbstractAdvice'),
                pausedPhase: ko.observable('Removed'),
                
                // State management
                saveAdviceState: ko.observable(true),
                overwriteExistingSavedState: ko.observable(true),
                
                // Behavior options
                pauseAllAdviceTypes: ko.observable(true),
                includeInactiveAdvice: ko.observable(false),
                
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
                }, this),
                
                abstractAdviceTypeSystemName: ko.computed(function() {
                    var systemName = this.config.abstractAdviceTypeSystemName();
                    return systemName && systemName.trim() ? null : 'Abstract advice type system name is required';
                }, this)
            },
            
            // Branch definitions for visual workflow
            branches: [
                {
                    id: 'success',
                    name: 'Success',
                    description: 'Pause operation completed successfully',
                    color: '#28a745'
                },
                {
                    id: 'paused',
                    name: 'Advice Paused',
                    description: 'Advice items were found and paused',
                    color: '#ffc107'
                },
                {
                    id: 'noAdvice',
                    name: 'No Advice Found',
                    description: 'No active advice was found to pause',
                    color: '#6c757d'
                },
                {
                    id: 'alreadyPaused',
                    name: 'Already Paused',
                    description: 'Advice is already in paused state',
                    color: '#17a2b8'
                },
                {
                    id: 'error',
                    name: 'Error',
                    description: 'Pause operation failed',
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