/**
 * Workflow Designer Integration Bridge
 * Connects AdviceStatusController to ShareDo Visual Workflow Designer
 */
(function() {
    'use strict';
    
    // Register with workflow designer when ready
    if (window.ShareDo && window.ShareDo.WorkflowDesigner) {
        registerAction();
    } else {
        // Wait for designer to load
        document.addEventListener('ShareDoWorkflowDesignerReady', registerAction);
    }
    
    function registerAction() {
        var designer = window.ShareDo.WorkflowDesigner;
        
        // Register the action
        designer.registerAction({
            id: 'Alt.AdviceManagement.AdviceStatusController',
            manifest: '/_ideFiles/Alt/AdviceManagement/AdviceStatusController/workflow-manifest.json',
            
            // Factory method to create action instance
            createInstance: function(config) {
                return new Alt.AdviceManagement.AdviceStatusController(
                    config.context,
                    config.configuration,
                    config.callback
                );
            },
            
            // Render method for canvas
            render: function(element, config) {
                var $el = $(element);
                $el.empty();
                
                // Create visual representation
                var html = [
                    '<div class="workflow-action-node advice-status-controller-node">',
                    '  <div class="node-header">',
                    '    <i class="fa fa-code-fork"></i>',
                    '    <span>Advice Status</span>',
                    '  </div>',
                    '  <div class="node-body">',
                    '    <div class="node-status">Check & Control</div>',
                    '  </div>',
                    '  <div class="node-ports">',
                    '    <div class="port port-in" data-port="input"></div>',
                    '    <div class="port port-out" data-port="success"></div>',
                    '    <div class="port port-out" data-port="paused"></div>',
                    '    <div class="port port-out" data-port="resumed"></div>',
                    '    <div class="port port-out port-error" data-port="error"></div>',
                    '  </div>',
                    '</div>'
                ].join('');
                
                $el.html(html);
                
                // Add drag-drop handlers
                $el.find('.workflow-action-node').draggable({
                    handle: '.node-header',
                    containment: 'parent',
                    stop: function(event, ui) {
                        // Save position
                        if (config.onPositionChange) {
                            config.onPositionChange(ui.position);
                        }
                    }
                });
                
                // Add click handler for configuration
                $el.on('dblclick', function() {
                    openConfiguration(config);
                });
                
                // Add context menu
                $el.on('contextmenu', function(e) {
                    e.preventDefault();
                    showContextMenu(e, config);
                });
            },
            
            // Validate configuration
            validate: function(config) {
                var errors = [];
                
                if (!config.configuration) {
                    errors.push('Configuration is required');
                }
                
                if (config.configuration && (!config.configuration.conditions || config.configuration.conditions.length === 0)) {
                    errors.push('At least one condition must be defined');
                }
                
                return {
                    valid: errors.length === 0,
                    errors: errors
                };
            },
            
            // Get default configuration
            getDefaultConfiguration: function() {
                return {
                    defaultAction: 'checkOnly',
                    conditions: [
                        { when: 'active', then: 'doNothing' },
                        { when: 'paused', then: 'doNothing' }
                    ],
                    pauseReason: 'Workflow automated pause',
                    requireConfirmation: false,
                    enableLogging: true,
                    retryOnFailure: true,
                    maxRetries: 3,
                    retryDelay: 1000,
                    timeout: 30000
                };
            },
            
            // Export configuration
            exportConfiguration: function(config) {
                return JSON.stringify(config.configuration, null, 2);
            },
            
            // Import configuration
            importConfiguration: function(jsonString) {
                try {
                    return JSON.parse(jsonString);
                } catch (e) {
                    console.error('Invalid configuration JSON', e);
                    return null;
                }
            }
        });
        
        // Add to palette
        designer.palette.addAction({
            id: 'Alt.AdviceManagement.AdviceStatusController',
            category: 'Advice Management',
            name: 'Advice Status Controller',
            description: 'Check and control advice status',
            icon: 'fa-code-fork',
            color: '#17a2b8',
            badge: 'NEW',
            onDragStart: function(event) {
                event.dataTransfer.setData('action-id', 'Alt.AdviceManagement.AdviceStatusController');
                event.dataTransfer.effectAllowed = 'copy';
            }
        });
        
        // Handle drop on canvas
        designer.canvas.onDrop(function(event) {
            var actionId = event.dataTransfer.getData('action-id');
            if (actionId === 'Alt.AdviceManagement.AdviceStatusController') {
                var position = designer.canvas.getDropPosition(event);
                designer.canvas.addAction({
                    id: actionId,
                    position: position,
                    configuration: designer.getAction(actionId).getDefaultConfiguration()
                });
            }
        });
    }
    
    // Open configuration dialog
    function openConfiguration(config) {
        if (window.ShareDo && window.ShareDo.UI) {
            ShareDo.UI.openPanel({
                panelId: 'Alt.AdviceManagement.AdviceStatusControllerDesigner',
                title: 'Configure Advice Status Controller',
                width: 700,
                height: 600,
                modal: true,
                data: {
                    configuration: config.configuration
                },
                onSave: function(newConfig) {
                    if (config.onConfigurationChange) {
                        config.onConfigurationChange(newConfig);
                    }
                }
            });
        }
    }
    
    // Show context menu
    function showContextMenu(event, config) {
        var menu = [
            {
                label: 'Configure',
                icon: 'fa-cog',
                action: function() {
                    openConfiguration(config);
                }
            },
            {
                label: 'Duplicate',
                icon: 'fa-copy',
                action: function() {
                    if (config.onDuplicate) {
                        config.onDuplicate();
                    }
                }
            },
            {
                label: 'Delete',
                icon: 'fa-trash',
                action: function() {
                    if (confirm('Delete this action?')) {
                        if (config.onDelete) {
                            config.onDelete();
                        }
                    }
                }
            },
            { divider: true },
            {
                label: 'Help',
                icon: 'fa-question-circle',
                action: function() {
                    window.open('/help/advice-status-controller', '_blank');
                }
            }
        ];
        
        if (window.ShareDo && window.ShareDo.UI) {
            ShareDo.UI.showContextMenu(event, menu);
        }
    }
    
    // Add CSS for workflow node
    var style = document.createElement('style');
    style.textContent = `
        .workflow-action-node.advice-status-controller-node {
            background: #fff;
            border: 2px solid #17a2b8;
            border-radius: 8px;
            width: 200px;
            min-height: 80px;
            position: relative;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            cursor: move;
        }
        
        .advice-status-controller-node .node-header {
            background: #17a2b8;
            color: white;
            padding: 8px;
            border-radius: 6px 6px 0 0;
            font-size: 12px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .advice-status-controller-node .node-body {
            padding: 10px;
            text-align: center;
        }
        
        .advice-status-controller-node .node-status {
            font-size: 11px;
            color: #666;
        }
        
        .advice-status-controller-node .port {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            position: absolute;
            background: #fff;
            border: 2px solid #17a2b8;
        }
        
        .advice-status-controller-node .port-in {
            top: 35px;
            left: -6px;
        }
        
        .advice-status-controller-node .port-out {
            right: -6px;
        }
        
        .advice-status-controller-node .port-out[data-port="success"] {
            top: 20px;
            border-color: #28a745;
        }
        
        .advice-status-controller-node .port-out[data-port="paused"] {
            top: 40px;
            border-color: #ffc107;
        }
        
        .advice-status-controller-node .port-out[data-port="resumed"] {
            top: 60px;
            border-color: #17a2b8;
        }
        
        .advice-status-controller-node .port-error {
            bottom: 10px;
            border-color: #dc3545;
        }
        
        .advice-status-controller-node:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .advice-status-controller-node.selected {
            border-color: #0056b3;
            box-shadow: 0 0 0 3px rgba(0,123,255,0.25);
        }
    `;
    document.head.appendChild(style);
    
})();