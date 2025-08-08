// Namespacing
namespace("Alt.OngoingAdvice.Models");

/**
 * Data model for ongoing advice management
 * Built by Alterspective
 */
Alt.OngoingAdvice.Models.OngoingAdviceModel = function(initialData) {
    var self = this;
    
    // Initialize with default or provided data
    var data = initialData || {};
    
    // Work item information
    self.workItemId = ko.observable(data.workItemId || null);
    self.workTypeId = ko.observable(data.workTypeId || null);
    self.workItemTitle = ko.observable(data.workItemTitle || '');
    
    // Current attribute values (loaded from API)
    self.enabled = ko.observable(data.enabled !== undefined ? data.enabled : null);
    self.pausedDate = ko.observable(data.pausedDate || null);
    self.resumedDate = ko.observable(data.resumedDate || null);
    self.pausedBy = ko.observable(data.pausedBy || null);
    self.resumedBy = ko.observable(data.resumedBy || null);
    self.pauseReason = ko.observable(data.pauseReason || null);
    self.resumeReason = ko.observable(data.resumeReason || null);
    self.nextAdviceDate = ko.observable(data.nextAdviceDate || null);
    
    // Form input observables
    self.reasonInput = ko.observable('');
    self.nextAdviceDateInput = ko.observable('');
    
    // UI state observables
    self.loading = ko.observable(false);
    self.saving = ko.observable(false);
    self.loaded = ko.observable(false);
    self.errorMessage = ko.observable(null);
    self.successMessage = ko.observable(null);
    
    // User context
    self.currentUser = ko.observable(null);
    
    // Computed properties
    self.hasError = ko.pureComputed(function() {
        return self.errorMessage() !== null;
    });
    
    self.hasSuccess = ko.pureComputed(function() {
        return self.successMessage() !== null;
    });
    
    self.isEnabled = ko.pureComputed(function() {
        var enabled = self.enabled();
        return enabled === true || enabled === 'true';
    });
    
    self.currentStatusText = ko.pureComputed(function() {
        return self.isEnabled() ? 'Active' : 'Paused';
    });
    
    self.currentStatusClass = ko.pureComputed(function() {
        return self.isEnabled() ? 'text-success' : 'text-warning';
    });
    
    self.currentStatusIcon = ko.pureComputed(function() {
        return self.isEnabled() ? 'fa-play' : 'fa-pause';
    });
    
    self.actionButtonText = ko.pureComputed(function() {
        return self.isEnabled() ? 'Pause Ongoing Advice' : 'Resume Ongoing Advice';
    });
    
    self.actionButtonClass = ko.pureComputed(function() {
        return self.isEnabled() ? 'btn-warning' : 'btn-success';
    });
    
    self.actionButtonIcon = ko.pureComputed(function() {
        return self.isEnabled() ? 'fa-pause' : 'fa-play';
    });
    
    self.showResumeFields = ko.pureComputed(function() {
        return !self.isEnabled(); // Show resume fields when currently paused
    });
    
    self.showPauseFields = ko.pureComputed(function() {
        return self.isEnabled(); // Show pause fields when currently active
    });
    
    self.actionType = ko.pureComputed(function() {
        return self.isEnabled() ? 'pause' : 'resume';
    });
    
    // Last modified information - now uses names directly
    self.lastModifiedText = ko.pureComputed(function() {
        if (self.isEnabled() && self.resumedDate()) {
            var byUser = self.resumedBy() || 'Unknown';
            return 'Resumed ' + self.formatDate(self.resumedDate()) + ' by ' + byUser;
        } else if (!self.isEnabled() && self.pausedDate()) {
            var byUser = self.pausedBy() || 'Unknown';
            return 'Paused ' + self.formatDate(self.pausedDate()) + ' by ' + byUser;
        }
        return 'Status unknown';
    });
    
    self.lastReason = ko.pureComputed(function() {
        if (self.isEnabled() && self.resumeReason()) {
            return self.resumeReason();
        } else if (!self.isEnabled() && self.pauseReason()) {
            return self.pauseReason();
        }
        return null;
    });
    
    self.formattedNextAdviceDate = ko.pureComputed(function() {
        var date = self.nextAdviceDate();
        if (!date) return 'Not scheduled';
        return self.formatDate(date);
    });
    
    // Validation
    self.nextAdviceDateValid = ko.pureComputed(function() {
        var dateString = self.nextAdviceDateInput();
        if (!dateString) return true; // Optional when pausing
        
        var date = moment(dateString, 'YYYY-MM-DD');
        return date.isValid() && date.isAfter(moment());
    });
    
    self.reasonValid = ko.pureComputed(function() {
        var reason = self.reasonInput();
        // Basic validation - can be extended
        return !reason || reason.length <= 500;
    });
    
    self.canPerformAction = ko.pureComputed(function() {
        if (!self.loaded() || self.loading() || self.saving()) return false;
        if (!self.workItemId()) return false;
        
        // Check required fields for resume action
        if (self.showResumeFields()) {
            if (!self.nextAdviceDateValid()) return false;
            // Could add requirement for next advice date here
        }
        
        if (!self.reasonValid()) return false;
        
        return true;
    });
    
    // Clear messages when user starts typing
    self.reasonInput.subscribe(function() {
        self.clearMessages();
    });
    
    self.nextAdviceDateInput.subscribe(function() {
        self.clearMessages();
    });
};

/**
 * Update the model with data from API
 */
Alt.OngoingAdvice.Models.OngoingAdviceModel.prototype.updateFromAttributes = function(attributes) {
    var self = this;
    
    if (!attributes) return;
    
    self.enabled(attributes.enabled);
    self.pausedDate(attributes.pausedDate);
    self.resumedDate(attributes.resumedDate);
    self.pausedBy(attributes.pausedBy);  // Now contains name directly
    self.resumedBy(attributes.resumedBy);  // Now contains name directly
    self.pauseReason(attributes.pauseReason);
    self.resumeReason(attributes.resumeReason);
    self.nextAdviceDate(attributes.nextAdviceDate);
};

/**
 * Update work item information
 */
Alt.OngoingAdvice.Models.OngoingAdviceModel.prototype.updateWorkItem = function(workItem) {
    var self = this;
    
    if (!workItem) return;
    
    self.workItemTitle(workItem.title || workItem.reference || 'Unknown Work Item');
    // Add other work item properties as needed
};

/**
 * Clear success and error messages
 */
Alt.OngoingAdvice.Models.OngoingAdviceModel.prototype.clearMessages = function() {
    var self = this;
    self.errorMessage(null);
    self.successMessage(null);
};

/**
 * Show an error message
 */
Alt.OngoingAdvice.Models.OngoingAdviceModel.prototype.showError = function(message) {
    var self = this;
    self.errorMessage(message);
    self.successMessage(null);
};

/**
 * Show a success message
 */
Alt.OngoingAdvice.Models.OngoingAdviceModel.prototype.showSuccess = function(message) {
    var self = this;
    self.successMessage(message);
    self.errorMessage(null);
};

/**
 * Reset form inputs
 */
Alt.OngoingAdvice.Models.OngoingAdviceModel.prototype.resetForm = function() {
    var self = this;
    self.reasonInput('');
    self.nextAdviceDateInput('');
    self.clearMessages();
};

/**
 * Get action options for API call
 */
Alt.OngoingAdvice.Models.OngoingAdviceModel.prototype.getActionOptions = function() {
    var self = this;
    
    // Get user name directly from page context - no need for IDs anymore
    var userName = 'Unknown User';
    
    // Get from $ui.pageContext.user
    if (window.$ui && window.$ui.pageContext && window.$ui.pageContext.user) {
        var pageUser = window.$ui.pageContext.user;
        var firstName = typeof pageUser.firstname === 'function' ? pageUser.firstname() : pageUser.firstname || '';
        var lastName = typeof pageUser.lastname === 'function' ? pageUser.lastname() : pageUser.lastname || '';
        userName = (firstName + ' ' + lastName).trim() || 'Unknown User';
    }
    
    var options = {
        userName: userName,
        reason: self.reasonInput() || null
    };
    
    // Add next advice date if resuming and provided
    if (self.showResumeFields() && self.nextAdviceDateInput()) {
        options.nextAdviceDate = moment(self.nextAdviceDateInput(), 'YYYY-MM-DD').toISOString();
    }
    
    return options;
};

/**
 * Format date for display
 */
Alt.OngoingAdvice.Models.OngoingAdviceModel.prototype.formatDate = function(dateValue) {
    if (!dateValue) return '';
    
    var date = moment(dateValue);
    if (!date.isValid()) return dateValue;
    
    return date.format('DD/MM/YYYY HH:mm');
};

/**
 * Set default next advice date
 */
Alt.OngoingAdvice.Models.OngoingAdviceModel.prototype.setDefaultNextAdviceDate = function() {
    var self = this;
    
    if (self.showResumeFields() && !self.nextAdviceDateInput()) {
        // Set default to 1 year from now
        var defaultDate = moment().add(1, 'year').format('YYYY-MM-DD');
        self.nextAdviceDateInput(defaultDate);
    }
};
