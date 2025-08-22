// Namespacing
namespace("Alt.OngoingAdvice.Services");

/**
 * Service for interacting with Sharedo's public attribute APIs
 * Built by Alterspective
 *
 * API Endpoints Used:
 * - GET /api/v1/public/workItem/{workItemId} - Get work item details
 * - GET /api/v1/public/workItem/{workItemId}/attributes/{attributeName} - Get single attribute
 * - POST /api/v1/public/workItem/{workItemId}/attributes/{attributeName} - Set single attribute
 * - GET /api/v1/public/workItem/{workItemId}/attributesCollection - Get all attributes (bulk)
 */
Alt.OngoingAdvice.Services.AttributeApiService = function () {
  var self = this;

  // Configuration - hardcoded to avoid external file dependency
  self.config = {
    attributeNames: {
      enabled: "alt_ongoing_advice_enabled",
      pausedDate: "alt_ongoing_advice_paused_date",
      resumedDate: "alt_ongoing_advice_resumed_date",
      pausedBy: "alt_ongoing_advice_paused_by", // Now stores name directly
      resumedBy: "alt_ongoing_advice_resumed_by", // Now stores name directly
      pauseReason: "alt_ongoing_advice_pause_reason",
      resumeReason: "alt_ongoing_advice_resume_reason",
      nextAdviceDate: "alt_ongoing_advice_next_date",
    },
    workTypeSettings: {
        sharedoTypeSystemName: "alt-matter-advice-status-change-worktype-v1",
        formId: "733a0532-69a9-4bf6-8d97-2f28d5be5b7a",
        roleSystemName: "primary-owner"
    },
    defaults: {
      enabled: true,
      nextAdviceIntervalDays: 365,
    },
    validation: {
      reasonMaxLength: 500,
      requireReasonForPause: false,
      requireReasonForResume: false,
      requireNextDateForResume: false,
    },
    ui: {
      dateFormat: "DD/MM/YYYY",
      timeFormat: "HH:mm",
    },
    workflow: {
      // Default workflow to trigger on pause/resume actions
      pauseResumeWorkflowName: "alt-advice-management-pause-resume-workflow-v1",
      enableWorkflowTrigger: true,
      workflowTimeout: 30000, // 30 seconds timeout for workflow start
    },
  };

  // Get configuration (now just returns the hardcoded config)
  self.loadConfig = function () {
    var deferred = $.Deferred();
    deferred.resolve(self.config);
    return deferred.promise();
  };

  /**
   * Get work item details
   */
  self.getWorkItem = function (workItemId) {
    // Use ShareDo's $ajax.api for better error handling
    return $ajax.api.get("/api/v1/public/workItem/" + workItemId);
  };

  /**
   * Get a specific attribute value
   */
  self.getAttribute = function (workItemId, attributeName) {
    return $ajax.api.get(
      "/api/v1/public/workItem/" + workItemId + "/attributes/" + attributeName
    );
  };

  /**
   * Set a specific attribute value
   */
  self.setAttribute = function (workItemId, attributeName, value) {
    // According to Swagger, the API expects an object with a "value" property
    var stringValue =
      value !== null && value !== undefined ? String(value) : "";
    var payload = {
      value: stringValue,
    };

    console.log(
      "Setting attribute:",
      attributeName,
      "=",
      stringValue,
      "payload:",
      payload
    );

    return $ajax.api.post(
      "/api/v1/public/workItem/" + workItemId + "/attributes/" + attributeName,
      payload,
      { contentType: "application/json; charset=utf-8" }
    );
  };

  /**
   * Get all attributes for a work item using the bulk endpoint
   */
  self.getAllAttributes = function (workItemId) {
    return $ajax.api.get(
      "/api/v1/public/workItem/" + workItemId + "/attributesCollection"
    );
  };

  /**
   * Update multiple attributes using individual calls
   * (Based on screenshots, there doesn't appear to be a bulk update endpoint)
   */
  self.setMultipleAttributes = function (workItemId, attributesMap) {
    var promises = [];
    var results = {};

    _.each(attributesMap, function (value, attributeName) {
      var promise = self.setAttribute(workItemId, attributeName, value)
        .then(function (response) {
          results[attributeName] = response;
        }, function (error) {
          console.error("Failed to set attribute " + attributeName + ":", error);
          results[attributeName] = { error: error };
        });
      promises.push(promise);
    });

    var deferred = $.Deferred();
    $.when.apply($, promises).always(function () {
      deferred.resolve(results);
    });

    return deferred.promise();
  };

  /**
   * Get all ongoing advice attributes for a work item
   */
  self.getOngoingAdviceAttributes = function (workItemId) {
    var deferred = $.Deferred();
    var config = self.config;

    // Try to use bulk attributes endpoint first
    self
      .getAllAttributes(workItemId)
      .then(function (allAttributes) {
        var results = {};

        // Map the attributes we need from the bulk response
        _.each(config.attributeNames, function (attributeName, key) {
          var found = _.find(allAttributes, function (attr) {
            return attr.attribute === attributeName;
          });
          var value = found ? found.value : null;

          // Handle legacy work-types: if alt_ongoing_advice_enabled is null/undefined, default to true
          if (key === "enabled" && (value === null || value === undefined)) {
            value = true;
          }

          results[key] = value;
        });

        deferred.resolve(results);
      }, function () {
        // Fallback to individual attribute calls
        console.log("Bulk attributes failed, falling back to individual calls");
        var promises = [];
        var results = {};

        // Get all attribute values individually
        _.each(config.attributeNames, function (attributeName, key) {
          var promise = self
            .getAttribute(workItemId, attributeName)
            .then(function (response) {
              // Response should have a "value" property according to Swagger
              var value = response && response.value ? response.value : null;

              // Handle legacy work-types: if alt_ongoing_advice_enabled is null/undefined, default to true
              if (
                key === "enabled" &&
                (value === null || value === undefined)
              ) {
                value = true;
              }

              results[key] = value;
            }, function () {
              // Attribute doesn't exist or no value - use default for enabled, null for others
              var value = null;

              // Handle legacy work-types: if alt_ongoing_advice_enabled is null/undefined, default to true
              if (key === "enabled") {
                value = true;
              }

              results[key] = value;
            });
          promises.push(promise);
        });

        // Wait for all promises to complete
        $.when.apply($, promises).always(function () {
          deferred.resolve(results);
        });
      });

    return deferred.promise();
  };

  /**
   * Set multiple ongoing advice attributes
   */
  self.setOngoingAdviceAttributes = function (workItemId, attributes) {
    var deferred = $.Deferred();
    var config = self.config;
  var promises = [];
  var results = {};

    // Set each attribute that has a value (including empty strings for clearing)
    _.each(attributes, function (value, key) {
      if (config.attributeNames[key]) {
        var attributeName = config.attributeNames[key];
        console.log(
          "Setting attribute via setOngoingAdviceAttributes:",
          key,
          "=",
          value,
          "as",
          attributeName
        );
        var promise = self
          .setAttribute(workItemId, attributeName, value)
          .then(function (response) {
            console.log(
              "Successfully set",
              attributeName,
              "response:",
              response
            );
            // Response should have a "value" property according to Swagger
            results[key] = response && response.value ? response.value : value;
          }, function (error) {
            console.error(
              "Failed to set attribute " + attributeName + ":",
              error
            );
            results[key] = { error: error };
          });
        promises.push(promise);
      }
    });

    // Wait for all promises to complete
    $.when.apply($, promises).always(function () {
      deferred.resolve(results);
    });

    return deferred.promise();
  };

  /**
   * Toggle ongoing advice status (pause/resume)
   */
  self.toggleOngoingAdvice = function (workItemId, options) {
    var deferred = $.Deferred();

    // Get current status first
    self
  .getOngoingAdviceAttributes(workItemId)
  .then(function (currentAttributes) {
        console.log("Current attributes:", currentAttributes);
        // Handle legacy work-types: if enabled is null/undefined, it defaults to true (active)
        var enabledValue = currentAttributes.enabled;
        if (enabledValue === null || enabledValue === undefined) {
          enabledValue = true;
        }
        var isCurrentlyEnabled =
          enabledValue === true || enabledValue === "true";
        var newStatus = !isCurrentlyEnabled;
        var now = new Date().toISOString().split('T')[0];

        console.log("Current enabled status:", currentAttributes.enabled);
        console.log("Is currently enabled:", isCurrentlyEnabled);
        console.log("New status will be:", newStatus);

        var attributesToSet = {
          enabled: newStatus.toString(), // Convert boolean to string for API
        };

        if (newStatus) {
          // Resuming
          attributesToSet.resumedDate = now;
          attributesToSet.resumedBy = options.userName || "Unknown User"; // Store name directly
          if (options.reason) {
            attributesToSet.resumeReason = options.reason;
          }
          if (options.nextAdviceDate) {
            attributesToSet.nextAdviceDate = options.nextAdviceDate;
          }
        } else {
          // Pausing
          attributesToSet.pausedDate = now;
          attributesToSet.pausedBy = options.userName || "Unknown User"; // Store name directly
          if (options.reason) {
            attributesToSet.pauseReason = options.reason;
          }
          // Clear next advice date when pausing
          attributesToSet.nextAdviceDate = null;
        }

        // Set the attributes
        console.log("Attributes to set:", attributesToSet);
        self
          .setOngoingAdviceAttributes(workItemId, attributesToSet)
          .then(function (results) {
            console.log("Set attributes results:", results);

            // Trigger workflow for advice pause/resume
            var workflowAction = newStatus ? "resume" : "pause";
            var workflowOptions = {
              reason: options.reason,
              userName: options.userName,
              workflowName: options.workflowName, // Allow override from options
              formId: self.config.workTypeSettings.formId,
              workType: self.config.workTypeSettings.sharedoTypeSystemName

            };

            if (newStatus && options.nextAdviceDate) {
              workflowOptions.nextAdviceDate = options.nextAdviceDate;
            }

            // Pass the same attributes we applied to the parent so we can mirror them on the child
            workflowOptions.attributesToSet = attributesToSet;
            self
              .triggerAdviceWorkflow(
                workItemId,
                workflowAction,
                workflowOptions
              )
        .then(function (workflowResult) {
                console.log("Workflow trigger completed:", workflowResult);
                deferred.resolve({
                  success: true,
                  newStatus: newStatus,
                  action: workflowAction,
                  attributes: attributesToSet,
                  results: results,
                  workflow: workflowResult,
                });
        }, function (workflowError) {
                console.warn(
                  "Workflow trigger failed but attributes were updated:",
                  workflowError
                );
                // Don't fail the entire operation if workflow trigger fails
                deferred.resolve({
                  success: true,
                  newStatus: newStatus,
                  action: workflowAction,
                  attributes: attributesToSet,
                  results: results,
                  workflow: {
                    error: workflowError,
                    message:
                      "Workflow trigger failed but advice status was updated successfully",
                  },
                });
        });
      }, function (error) {
            deferred.reject({
              success: false,
              error: error,
              message: "Failed to update ongoing advice attributes",
            });
      });
    }, function (error) {
        deferred.reject({
          success: false,
          error: error,
          message: "Failed to get current ongoing advice status",
        });
    });

    return deferred.promise();
  };

  /**
   * Validate attribute values
   */
  self.validateAttributes = function (attributes) {
    var errors = [];
    var validation = self.config.validation || {};

    // Validate reason length
    if (attributes.reason && validation.reasonMaxLength) {
      if (attributes.reason.length > validation.reasonMaxLength) {
        errors.push(
          "Reason cannot exceed " + validation.reasonMaxLength + " characters"
        );
      }
    }

    // Validate required fields
    if (
      attributes.action === "pause" &&
      validation.requireReasonForPause &&
      !attributes.reason
    ) {
      errors.push("Reason is required when pausing ongoing advice");
    }

    if (attributes.action === "resume") {
      if (validation.requireReasonForResume && !attributes.reason) {
        errors.push("Reason is required when resuming ongoing advice");
      }
      if (validation.requireNextDateForResume && !attributes.nextAdviceDate) {
        errors.push(
          "Next advice date is required when resuming ongoing advice"
        );
      }
    }

    // Validate dates
    if (attributes.nextAdviceDate) {
      var nextDate = new Date(attributes.nextAdviceDate);
      var now = new Date();
      if (nextDate <= now) {
        errors.push("Next advice date must be in the future");
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  };

  /**
   * Trigger workflow for advice pause/resume actions
   */
  self.triggerAdviceWorkflow = function (workItemId, action, options) {
    var deferred = $.Deferred();
    var nowIso = new Date().toISOString();

    // Build title/description
    var actionWord = action === 'resume' ? 'Resume' : 'Pause';
    var title = 'Advice ' + actionWord;
    var descParts = [
      'Action: ' + action,
      'By: ' + (options.userName || 'Unknown'),
      'At: ' + nowIso
    ];
    if (action === 'resume' && options.nextAdviceDate) {
      descParts.push('Next advice date: ' + options.nextAdviceDate);
    }
    if (options.reason) {
      descParts.push('Reason: ' + options.reason);
    }
    var description = descParts.join(' | ');

    // Resolve current user ODS Id (best-effort) note $ui.pageContext.user.userid() is the user odsId 
    var userCtx = (window.$ui && $ui.pageContext && $ui.pageContext.user) ? $ui.pageContext.user : null;
    var currentOdsId = null;
    try {
      if (userCtx) {
        var u = (typeof userCtx === 'function') ? userCtx() : userCtx;
        currentOdsId = u && (u.userid() || u.odsid || u.id) || null;
      }
    } catch (e) { currentOdsId = null; }

    // Build form data mapping provided keys to actual attribute names
    var formData = {};
    if (options && options.attributesToSet) {
      _.each(options.attributesToSet, function (value, key) {
        var attributeName = (self.config.attributeNames && self.config.attributeNames[key]) || key;
        formData[attributeName] = value;
      });
    }

    var createRequest = {
      parentSharedoId: workItemId,
      workItem: {
        sharedoTypeSystemName: options.workType || (self.config.workTypeSettings && self.config.workTypeSettings.sharedoTypeSystemName),
        title: title,
        titleIsUserProvided: true,
        description: description
      },
      aspectData: {
        task: {
          dueDateTime: new Date().toISOString().slice(0, 16).replace('T', ' ')
        },
        FormBuilder: {
          formData: formData,
          formIds: Array.isArray(options.formId) ? options.formId : (options.formId ? [options.formId] : [])
        }
      },
      participants: []
    };

    // Attach participant if we resolved an ODS Id
    var roleName = self.config.workTypeSettings && self.config.workTypeSettings.roleSystemName;
    if (roleName && currentOdsId) {
      createRequest.participants.push({ roleSystemName: roleName, odsId: currentOdsId });
    }

    $ajax.api.post('/api/v1/public/workItem/', createRequest)
      .then(function (result) {
        console.log('Status-change work item created:', result);
        var childId = (result && result.workItem && result.workItem.id) || (result && result.id);
        var mirrorAttrs = options && options.attributesToSet;
        if (childId && mirrorAttrs) {
          self.setOngoingAdviceAttributes(childId, mirrorAttrs)
            .then(function (childSetResults) {
              deferred.resolve({
                success: true,
                method: 'create_child_work_item',
                workItemId: childId,
                result: result,
                childAttributes: childSetResults
              });
            }, function (err) {
              console.warn('Created child work item but failed to set attributes on child:', err);
              deferred.resolve({
                success: true,
                method: 'create_child_work_item',
                workItemId: childId,
                result: result,
                childAttributes: { error: err }
              });
            });
        } else {
          deferred.resolve({
            success: true,
            method: 'create_child_work_item',
            workItemId: childId,
            result: result
          });
        }
      }, function (error) {
        console.error('Failed to create status-change work item:', error);
        deferred.reject({
          success: false,
          error: error,
          message: 'Failed to create status-change work item'
        });
      });

    return deferred.promise();
  };

  /**
   * Get formatted display values for attributes
   */
  self.formatAttributeDisplay = function (attributes) {
    var ui = self.config.ui || {};
    var dateFormat = ui.dateFormat || "DD/MM/YYYY";
    var timeFormat = ui.timeFormat || "HH:mm";

    var formatted = {};

    _.each(attributes, function (value, key) {
      if (value && (key.includes("Date") || key.includes("date"))) {
        // Format dates
        var date = moment(value);
        if (date.isValid()) {
          formatted[key] = date.format(dateFormat + " " + timeFormat);
        } else {
          formatted[key] = value;
        }
      } else {
        formatted[key] = value;
      }
    });

    return formatted;
  };
};
