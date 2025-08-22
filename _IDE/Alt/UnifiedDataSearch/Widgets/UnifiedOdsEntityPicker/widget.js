namespace("Alt.UnifiedDataSearch.Widgets");

/**
 * UnifiedOdsEntityPicker Widget
 * A widget that opens the unified search blade instead of the standard ODS search
 * Can be used as a drop-in replacement for OdsEntityPicker
 * 
 * @param {HTMLElement} element - The Html DOM element to which this widget will bind
 * @param {Object} configuration - The configuration passed in from the designer/config
 * @param {Object} baseModel - The base widget model (contains unique id etc)
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker = function(element, configuration, baseModel) {
    var self = this;
    
    // Default configuration
    var defaults = {
        // Widget configuration
        label: "Select Entity",
        placeholder: "Click to search and select...",
        required: false,
        allowMultiple: false,
        allowClear: true,
        
        // Entity type configuration
        entityTypes: ["person", "organisation"], // What types to search
        
        // Search blade configuration
        searchMode: "unified", // "unified", "odsOnly", "pmsOnly"
        useMockPms: true,
        useMockOds: true,
        pmsTimeout: 5000,
        
        // Participant configuration (when used in work item context)
        sharedoId: null,
        parentSharedoId: null,
        sharedoTypeSystemName: null,
        addNewParticipantsToSharedoId: null,
        forRoleSystemName: null,
        allowedParticipantRoles: [],
        
        // Display options
        showIcon: true,
        showEmail: true,
        showPhone: false,
        showSource: true,
        
        // Blade configuration
        bladeName: "Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch",
        bladeWidth: 750,
        
        // Mode: "select" or "addParticipant"
        mode: "select",
        
        // Host parameters (for aspect widgets)
        _host: {
            model: null,
            blade: null,
            enabled: false
        }
    };
    
    self.options = $.extend(true, {}, defaults, configuration);
    self.element = element;
    self.baseModel = baseModel;
    
    // Initialize observables
    self.selectedEntities = ko.observableArray([]);
    self.displayValue = ko.observable("");
    self.isSearching = ko.observable(false);
    self.hasValue = ko.observable(false);
    
    // Initialize selected entity/entities based on configuration
    if (self.options.allowMultiple) {
        self.selectedEntity = ko.computed({
            read: function() {
                return self.selectedEntities();
            },
            write: function(value) {
                if (Array.isArray(value)) {
                    self.selectedEntities(value);
                } else if (value) {
                    self.selectedEntities([value]);
                } else {
                    self.selectedEntities([]);
                }
            }
        });
    } else {
        self.selectedEntity = ko.computed({
            read: function() {
                var entities = self.selectedEntities();
                return entities.length > 0 ? entities[0] : null;
            },
            write: function(value) {
                if (value) {
                    self.selectedEntities([value]);
                } else {
                    self.selectedEntities([]);
                }
            }
        });
    }
    
    // Computed display value
    self.displayValue = ko.computed(function() {
        var entities = self.selectedEntities();
        
        if (entities.length === 0) {
            return self.options.placeholder;
        }
        
        if (entities.length === 1) {
            return self.getEntityDisplayName(entities[0]);
        }
        
        return entities.length + " entities selected";
    });
    
    // Computed for validation
    self.isValid = ko.computed(function() {
        if (!self.options.required) {
            return true;
        }
        return self.selectedEntities().length > 0;
    });
    
    // Subscribe to changes
    self.selectedEntities.subscribe(function(entities) {
        self.hasValue(entities && entities.length > 0);
        
        // Publish change event
        if (window.$ui && window.$ui.events && window.$ui.events.publish) {
            $ui.events.publish("Alt.UnifiedDataSearch.EntitySelected", {
                widgetId: self.baseModel ? self.baseModel.id : null,
                entities: entities,
                mode: self.options.mode
            });
        }
    });
    
    // If in host mode (aspect widget), bind to host model
    if (self.options._host && self.options._host.model) {
        self.bindToHostModel();
    }
};

/**
 * Bind to host model for aspect widgets
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.bindToHostModel = function() {
    var self = this;
    var hostModel = self.options._host.model;
    
    // Look for common field names in host model
    var fieldNames = ['odsId', 'participantId', 'entityId', 'selectedEntity', 'participant'];
    
    for (var i = 0; i < fieldNames.length; i++) {
        var fieldName = fieldNames[i];
        if (hostModel[fieldName]) {
            // Bind to host field
            if (ko.isObservable(hostModel[fieldName])) {
                // Two-way binding
                hostModel[fieldName].subscribe(function(value) {
                    if (value && typeof value === 'string') {
                        // Load entity by ID
                        self.loadEntityById(value);
                    } else if (value && typeof value === 'object') {
                        self.selectedEntity(value);
                    }
                });
                
                self.selectedEntity.subscribe(function(entity) {
                    if (entity) {
                        // Update host model with entity ID or full entity
                        if (typeof hostModel[fieldName]() === 'string') {
                            hostModel[fieldName](entity.odsId || entity.id);
                        } else {
                            hostModel[fieldName](entity);
                        }
                    } else {
                        hostModel[fieldName](null);
                    }
                });
            }
            break;
        }
    }
};

/**
 * Open the search blade
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.openSearchBlade = function() {
    var self = this;
    
    if (self.isSearching()) {
        return;
    }
    
    self.isSearching(true);
    
    // Build blade configuration
    var bladeConfig = {
        mode: "select", // Always select mode for widget
        entityTypes: self.options.entityTypes,
        searchMode: self.options.searchMode,
        useMockPms: self.options.useMockPms,
        useMockOds: self.options.useMockOds,
        pmsTimeout: self.options.pmsTimeout,
        allowMultiple: self.options.allowMultiple,
        sharedoId: self.options.sharedoId,
        parentSharedoId: self.options.parentSharedoId,
        sharedoTypeSystemName: self.options.sharedoTypeSystemName
    };
    
    // Open the blade
    if (window.$ui && window.$ui.stacks && window.$ui.stacks.openPanel) {
        var panelInstance = $ui.stacks.openPanel(self.options.bladeName, bladeConfig);
        
        // Handle the panel close callback
        if (panelInstance && panelInstance.closed) {
            panelInstance.closed.then(function(result) {
                self.isSearching(false);
                
                // Handle result
                if (result && result.selectedEntity) {
                    if (self.options.allowMultiple) {
                        // Add to existing selection
                        var current = self.selectedEntities();
                        var exists = current.some(function(e) {
                            return (e.odsId || e.id) === (result.selectedEntity.odsId || result.selectedEntity.id);
                        });
                        
                        if (!exists) {
                            current.push(result.selectedEntity);
                            self.selectedEntities(current);
                        }
                    } else {
                        // Replace selection
                        self.selectedEntity(result.selectedEntity);
                    }
                }
            });
        } else {
            // Fallback if promise not available
            self.isSearching(false);
        }
    } else {
        self.isSearching(false);
        console.error("Cannot open search blade - $ui.stacks.openPanel not available");
    }
};

/**
 * Clear the current selection
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.clearSelection = function() {
    var self = this;
    self.selectedEntities([]);
};

/**
 * Remove a specific entity from selection
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.removeEntity = function(entity) {
    var self = this;
    
    var current = self.selectedEntities();
    var filtered = current.filter(function(e) {
        return (e.odsId || e.id) !== (entity.odsId || entity.id);
    });
    
    self.selectedEntities(filtered);
};

/**
 * Get display name for an entity
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.getEntityDisplayName = function(entity) {
    var self = this;
    
    if (!entity) {
        return "";
    }
    
    // Person
    if (entity.firstName || entity.lastName) {
        var parts = [];
        if (entity.firstName) parts.push(entity.firstName);
        if (entity.lastName) parts.push(entity.lastName);
        return parts.join(" ");
    }
    
    // Organisation
    if (entity.name || entity.organisationName) {
        return entity.name || entity.organisationName;
    }
    
    // Fallback
    return entity.displayName || entity.title || "Unknown Entity";
};

/**
 * Get icon for an entity
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.getEntityIcon = function(entity) {
    if (!entity) {
        return "fa-question";
    }
    
    if (entity.icon) {
        return entity.icon;
    }
    
    if (entity.odsType === "person" || entity.firstName || entity.lastName) {
        return "fa-user";
    }
    
    if (entity.odsType === "organisation" || entity.organisationName || entity.name) {
        return "fa-building";
    }
    
    return "fa-circle";
};

/**
 * Get source badge for entity
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.getSourceBadge = function(entity) {
    if (!entity || !entity.source) {
        return "";
    }
    
    switch(entity.source) {
        case "sharedo":
            return '<span class="source-badge source-sharedo"><i class="fa fa-database"></i> ODS</span>';
        case "pms":
            return '<span class="source-badge source-pms"><i class="fa fa-briefcase"></i> PMS</span>';
        case "matched":
            return '<span class="source-badge source-matched"><i class="fa fa-link"></i> Matched</span>';
        default:
            return "";
    }
};

/**
 * Load entity by ID (for initial binding)
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.loadEntityById = function(entityId) {
    var self = this;
    
    if (!entityId) {
        return;
    }
    
    // Try to load from ODS
    if (window.$ajax && window.$ajax.get) {
        // Try person first
        $ajax.get("/api/ods/person/" + entityId)
            .done(function(person) {
                person.odsType = "person";
                person.source = "sharedo";
                self.selectedEntity(person);
            })
            .fail(function() {
                // Try organisation
                $ajax.get("/api/ods/organisation/" + entityId)
                    .done(function(org) {
                        org.odsType = "organisation";
                        org.source = "sharedo";
                        self.selectedEntity(org);
                    })
                    .fail(function() {
                        console.warn("Could not load entity with ID: " + entityId);
                    });
            });
    }
};

/**
 * Called by the UI framework when this widget is being unloaded
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.onDestroy = function() {
    var self = this;
    
    // Clean up subscriptions
    if (self.selectedEntity && self.selectedEntity.dispose) {
        self.selectedEntity.dispose();
    }
    
    if (self.displayValue && self.displayValue.dispose) {
        self.displayValue.dispose();
    }
    
    if (self.isValid && self.isValid.dispose) {
        self.isValid.dispose();
    }
};

/**
 * Called by the UI framework after initial creation and binding
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.loadAndBind = function() {
    var self = this;
    
    // If we have an initial value in configuration, load it
    if (self.options.initialEntityId) {
        self.loadEntityById(self.options.initialEntityId);
    }
    
    // Subscribe to refresh events if in participant mode
    if (self.options.mode === "addParticipant" && self.options.sharedoId) {
        if (window.$ui && window.$ui.events && window.$ui.events.subscribe) {
            self.participantUpdateSubscription = $ui.events.subscribe(
                "Sharedo.Core.Case.Participants.Updated",
                function(data) {
                    if (data.sharedoId === self.options.sharedoId) {
                        // Could refresh the widget here if needed
                        console.log("Participants updated for: " + data.sharedoId);
                    }
                },
                self
            );
        }
    }
};

/**
 * Validation method
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.validate = function() {
    var self = this;
    return self.isValid();
};

/**
 * Get the current value(s)
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.getValue = function() {
    var self = this;
    
    if (self.options.allowMultiple) {
        return self.selectedEntities();
    } else {
        return self.selectedEntity();
    }
};

/**
 * Set the value(s)
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.setValue = function(value) {
    var self = this;
    
    if (self.options.allowMultiple) {
        if (Array.isArray(value)) {
            self.selectedEntities(value);
        } else if (value) {
            self.selectedEntities([value]);
        } else {
            self.selectedEntities([]);
        }
    } else {
        self.selectedEntity(value);
    }
};