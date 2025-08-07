namespace("Alt.AdviceManagement");

/**
 * Blade constructor - remember the name of this JS type must match the ID of the blade in it's .panel.json manifest
 * @param {} element            // The HTML DOM Element to which this blade model is bound 
 * @param {} configuration      // The configuration passed in from the open blade command
 * @param {} stackModel         // The base blade stack model (contains unique id etc)
 * @returns {} 
 */
Alt.AdviceManagement.AdvicePauseResumeBlade = function(element, configuration, stackModel) {
    var self = this;
    var defaults = {};
    var options = $.extend(true, {}, defaults, configuration);

    console.log("Initializing Alt Ongoing Advice Manager Blade");
    console.log("Configuration received:", options);
    console.log("StackModel:", stackModel);

    // Store parameters
    self.element = element;
    self.configuration = options;
    self.stackModel = stackModel;
    
    // Get work item ID from configuration (supports multiple sources)
    self.workItemId = options.workItemId || 
                      options.sharedoId ||  // Direct token replacement
                      (stackModel && stackModel.sharedoId && stackModel.sharedoId()) ||
                      ShareDoUtils.getWorkItemId(options);
    
    // Store additional context from configuration
    self.workItemReference = options.workItemReference || options.sharedoReference || null;
    self.workItemTitle = options.workItemTitle || options.sharedoTitle || null;
    self.workTypeSystemName = options.workTypeSystemName || options.sharedoTypeSystemName || null;
    self.participantId = options.participantId || null;
    self.participantRoleId = options.participantRoleId || null;

    // Services
    self.apiService = new Alt.OngoingAdvice.Services.AttributeApiService();

    // Construct the blade model
    self.model = new Alt.OngoingAdvice.Models.OngoingAdviceModel({
        workItemId: self.workItemId
    });

    // Construct the blade validation model
    self.validation = {};

    // Store UI concerns
    self.blade = {
        ribbon: null
    };

    // Create the ribbon bar
    self.blade.ribbon = self.createRibbonBar();
};

/**
 * Create the ribbon bar for the blade
 */
Alt.AdviceManagement.AdvicePauseResumeBlade.prototype.createRibbonBar = function() {
    var self = this;

    var ribbon = new Components.Core.RibbonBar.Ribbon({
        alignment: Components.Core.RibbonBar.RibbonAlignment.Right,
        sectionTitles: true
    });

    // Main Actions section
    var actionsSection = ribbon.createAddSection("Actions", null, true);
    
    // Pause/Resume button - dynamic based on state
    actionsSection.createAddButton("Pause/Resume", function() {
        self.toggleOngoingAdvice();
    }, "btn-primary", "fa-play-circle");
    
    // Refresh button
    actionsSection.createAddButton("Refresh", function() {
        self.refreshStatus();
    }, "btn-default", "fa-refresh");

    // Navigation section
    var navSection = ribbon.createAddSection("Navigation", null, true);
    
    // Close button
    navSection.createAddButton("Close", function() {
        self.discard();
    }, "btn-danger", "fa-times");

    return ribbon;
};

/**
 * Called by the UI framework when this blade is being unloaded - clean up
 * any subscriptions or references here that would keep this instance alive
 */
Alt.AdviceManagement.AdvicePauseResumeBlade.prototype.onDestroy = function() {
    var self = this;
    console.log("Alt.AdviceManagement.AdvicePauseResumeBlade : onDestroy");
    
    // Clean up any subscriptions or resources
    if (self.model && self.model.dispose) {
        self.model.dispose();
    }
};

/**
 * Called by the UI framework after initial creation and binding to load data
 * into it's model
 */
Alt.AdviceManagement.AdvicePauseResumeBlade.prototype.loadAndBind = function() {
    var self = this;
    console.log("Loading data for work item:", self.workItemId);
    
    if (!self.workItemId) {
        self.model.showError("No work item ID provided. Please open this blade from a work item context.");
        self.model.loading(false);
        self.model.loaded(false);
        return;
    }

    self.model.loading(true);
    self.model.clearMessages();
    
    // Get current user from ShareDo page context (no API call needed)
    if (window.$ui && window.$ui.pageContext && window.$ui.pageContext.user) {
        var pageUser = window.$ui.pageContext.user;
        self.model.currentUser({
            id: pageUser.userid(),
            username: pageUser.username(),
            name: pageUser.firstname() + ' ' + pageUser.lastname(),
            firstname: pageUser.firstname(),
            lastname: pageUser.lastname(),
            displayName: pageUser.firstname() + ' ' + pageUser.lastname()
        });
        console.log("Current user from page context:", self.model.currentUser());
    } else {
        // Fallback if page context not available
        self.model.currentUser({
            id: 'unknown',
            name: 'Current User',
            displayName: 'Current User'
        });
    }
    
    // Load work item details and attributes in parallel
    var promises = [];
    
    // Load work item details
    promises.push(
        self.apiService.getWorkItem(self.workItemId)
            .done(function(workItem) {
                console.log("Work item loaded:", workItem);
                self.model.updateWorkItem(workItem);
            })
            .fail(function(xhr, status, error) {
                console.error("Failed to load work item:", error);
            })
    );
    
    // Load ongoing advice attributes
    promises.push(
        self.apiService.getOngoingAdviceAttributes(self.workItemId)
            .done(function(attributes) {
                console.log("Ongoing advice attributes loaded:", attributes);
                self.model.updateFromAttributes(attributes);
            })
            .fail(function(xhr, status, error) {
                console.error("Failed to load attributes:", error);
            })
    );
    
    // Wait for all promises to complete
    $.when.apply($, promises).always(function() {
        self.model.loading(false);
        self.model.loaded(true);
        
        // Set default next advice date if resuming
        self.model.setDefaultNextAdviceDate();
    });
};

/**
 * Refresh the status of the model
 */
Alt.AdviceManagement.AdvicePauseResumeBlade.prototype.refreshStatus = function() {
    var self = this;
    console.log("Refreshing status...");
    self.model.clearMessages();
    self.loadAndBind();
};

/**
 * Toggle the ongoing advice status
 */
Alt.AdviceManagement.AdvicePauseResumeBlade.prototype.toggleOngoingAdvice = function() {
    var self = this;
    console.log("Toggling ongoing advice status...");
    
    if (!self.model.canPerformAction()) {
        console.log("Cannot perform action - validation failed");
        return;
    }
    
    self.model.saving(true);
    self.model.clearMessages();
    
    // Get action options
    var options = self.model.getActionOptions();
    
    // Call API to toggle status
    self.apiService.toggleOngoingAdvice(self.workItemId, options)
        .done(function(result) {
            console.log("Toggle successful:", result);
            
            // Show success message
            var actionText = result.action === 'paused' ? 'paused' : 'resumed';
            self.model.showSuccess('Ongoing advice has been ' + actionText + ' successfully.');
            
            // Reload data to get updated state
            setTimeout(function() {
                self.loadAndBind();
                self.model.resetForm();
            }, 1500);
        })
        .fail(function(error) {
            console.error("Toggle failed:", error);
            var errorMessage = error.message || 'Failed to update ongoing advice status. Please try again.';
            self.model.showError(errorMessage);
        })
        .always(function() {
            self.model.saving(false);
        });
};

/**
 * Clear the form inputs
 */
Alt.AdviceManagement.AdvicePauseResumeBlade.prototype.clearForm = function() {
    var self = this;
    console.log("Clearing form inputs...");
    self.model.resetForm();
    console.log("Form inputs cleared.");
};

/**
 * Called from the ribbon to save data and close the blade (if using ribbon)
 */
Alt.AdviceManagement.AdvicePauseResumeBlade.prototype.saveAndClose = function() {
    var self = this;
    $ui.stacks.close(self, { action: "Saved" });
};

/**
 * Called from the ribbon to discard the blade (if using ribbon)
 */
Alt.AdviceManagement.AdvicePauseResumeBlade.prototype.discard = function() {
    var self = this;
    $ui.stacks.cancel(self);
};