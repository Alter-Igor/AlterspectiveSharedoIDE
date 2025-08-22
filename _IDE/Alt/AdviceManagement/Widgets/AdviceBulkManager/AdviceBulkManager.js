// Ensure namespace function exists
if (typeof namespace !== 'function') {
    window.namespace = function(namespaceString) {
        var parts = namespaceString.split('.');
        var parent = window;
        var currentPart = '';
        
        for (var i = 0, length = parts.length; i < length; i++) {
            currentPart = parts[i];
            parent[currentPart] = parent[currentPart] || {};
            parent = parent[currentPart];
        }
        
        return parent;
    };
}

// Create namespace
namespace("Alt.AdviceManagement");

/**
 * AdviceBulkManager - Widget for managing multiple advice items in bulk
 * @param {HTMLElement} element - DOM element to bind to
 * @param {Object} configuration - Configuration from designer
 * @param {Object} baseModel - Base widget model
 */
Alt.AdviceManagement.AdviceBulkManager = function(element, configuration, baseModel) {
    var self = this;
    
    // Check if Foundation Bundle is loaded
    if (!Alt.AdviceManagement.Common || !Alt.AdviceManagement.Common.Constants) {
        console.error('[AdviceBulkManager] Foundation Bundle not loaded. Please ensure common modules are included.');
        // Provide fallback defaults
        Alt.AdviceManagement.Common = Alt.AdviceManagement.Common || {};
        Alt.AdviceManagement.Common.Constants = Alt.AdviceManagement.Common.Constants || {
            WIDGETS: { BULK_MANAGER: { PAGE_SIZE: 10, AUTO_LOAD: true, SHOW_FILTERS: true, EXPORT_BATCH_SIZE: 100 } },
            API: { BASE_URL: '/api/v1/public', TIMEOUT: 30000, CACHE_TTL: 5000 },
            STATUS: { PAUSED: 'paused', ACTIVE: 'active' },
            EVENTS: { ADVICE_PAUSED: 'advice:paused', ADVICE_RESUMED: 'advice:resumed', ADVICE_ERROR: 'advice:error', WIDGET_LOADED: 'widget:loaded', WIDGET_DESTROYED: 'widget:destroyed' },
            ERRORS: { API_ERROR: 'API error occurred. Please contact support.' }
        };
        Alt.AdviceManagement.Common.EventBus = Alt.AdviceManagement.Common.EventBus || { publish: function() {}, subscribe: function() { return { unsubscribe: function() {} }; } };
        Alt.AdviceManagement.Common.CacheManager = Alt.AdviceManagement.Common.CacheManager || { get: function() { return null; }, set: function() {}, remove: function() {}, clear: function() {} };
    }
    
    // Import Foundation Bundle components
    var Constants = Alt.AdviceManagement.Common.Constants;
    var EventBus = Alt.AdviceManagement.Common.EventBus;
    var Cache = Alt.AdviceManagement.Common.CacheManager;
    
    var defaults = Constants.WIDGETS.BULK_MANAGER;
    var options = $.extend(true, {}, defaults, configuration);
    
    // Get current context work type filter if available
    self.getCurrentWorkType = function() {
        // Try to get from $ui.pageContext (portal context)
        if (window.$ui && window.$ui.pageContext) {
            // Check different possible locations for work type
            if (window.$ui.pageContext.matterSummary && window.$ui.pageContext.matterSummary.workType) {
                var workType = window.$ui.pageContext.matterSummary.workType;
                return ko.isObservable(workType) ? workType() : workType;
            }
            // Check if there's a filter in the page context
            if (window.$ui.pageContext.workTypeFilter) {
                var filter = window.$ui.pageContext.workTypeFilter;
                return ko.isObservable(filter) ? filter() : filter;
            }
        }
        return null;
    };
    
    // Work Item Model
    function WorkItemModel(data) {
        var item = this;
        item.id = ko.observable(data.id);
        item.title = ko.observable(data.title || 'Untitled');
        item.status = ko.observable(data.status || 'active');
        item.lastAction = ko.observable(data.lastAction || 'N/A');
        item.daysActive = ko.observable(data.daysActive || 0);
        item.selected = ko.observable(false);
        item.pausedReason = ko.observable(data.pausedReason || '');
        item.assignee = ko.observable(data.assignee || '');
    }
    
    // Setup the model
    self.model = {
        // Work items
        workItems: ko.observableArray([]),
        isLoading: ko.observable(false),
        loadingMessage: ko.observable('Loading work items...'),
        errorMessage: ko.observable(''),
        hasError: ko.observable(false),
        retryCount: ko.observable(0),
        maxRetries: 3,
        
        // Filtering
        filterStatus: ko.observable('all'),
        searchTerm: ko.observable(''),
        searchTermDebounced: ko.observable('').extend({ rateLimit: { timeout: 500, method: "notifyWhenChangesStop" } }),
        
        // Pagination
        currentPage: ko.observable(1),
        itemsPerPage: ko.observable(10),
        
        // Selection
        allSelected: ko.observable(false),
        
        // Bulk actions
        bulkPauseReason: ko.observable('Client Request'),
        customPauseReason: ko.observable(''),
        
        // Undo
        showUndo: ko.observable(false),
        undoMessage: ko.observable(''),
        lastAction: null,
        
        // UI helpers
        showKeyboardHelp: ko.observable(false),
        
        // Computed
        filteredItems: ko.pureComputed(function() {
            var items = self.model.workItems();
            var filter = self.model.filterStatus();
            var search = self.model.searchTerm().toLowerCase();
            
            var filtered = items.filter(function(item) {
                // Status filter
                if (filter !== 'all' && item.status() !== filter) {
                    return false;
                }
                
                // Search filter
                if (search && item.title().toLowerCase().indexOf(search) === -1 && 
                    item.id().toString().indexOf(search) === -1) {
                    return false;
                }
                
                return true;
            });
            
            // Apply pagination
            var page = self.model.currentPage();
            var perPage = self.model.itemsPerPage();
            var start = (page - 1) * perPage;
            var end = start + perPage;
            
            return filtered.slice(start, end);
        }),
        
        totalItems: ko.pureComputed(function() {
            var items = self.model.workItems();
            var filter = self.model.filterStatus();
            var search = self.model.searchTerm().toLowerCase();
            
            return items.filter(function(item) {
                if (filter !== 'all' && item.status() !== filter) return false;
                if (search && item.title().toLowerCase().indexOf(search) === -1 && 
                    item.id().toString().indexOf(search) === -1) return false;
                return true;
            }).length;
        }),
        
        totalPages: ko.pureComputed(function() {
            return Math.ceil(self.model.totalItems() / self.model.itemsPerPage());
        }),
        
        pageNumbers: ko.pureComputed(function() {
            var total = self.model.totalPages();
            var current = self.model.currentPage();
            var pages = [];
            
            // Show max 5 page numbers
            var start = Math.max(1, current - 2);
            var end = Math.min(total, start + 4);
            
            for (var i = start; i <= end; i++) {
                pages.push(i);
            }
            
            return pages;
        }),
        
        startItem: ko.pureComputed(function() {
            if (self.model.totalItems() === 0) return 0;
            return ((self.model.currentPage() - 1) * self.model.itemsPerPage()) + 1;
        }),
        
        endItem: ko.pureComputed(function() {
            return Math.min(self.model.currentPage() * self.model.itemsPerPage(), self.model.totalItems());
        }),
        
        selectedItems: ko.pureComputed(function() {
            return self.model.workItems().filter(function(item) {
                return item.selected();
            });
        }),
        
        selectedCount: ko.pureComputed(function() {
            return self.model.selectedItems().length;
        }),
        
        activeSelectedCount: ko.pureComputed(function() {
            return self.model.selectedItems().filter(function(item) {
                return item.status() === Constants.STATUS.ACTIVE;
            }).length;
        }),
        
        pausedSelectedCount: ko.pureComputed(function() {
            return self.model.selectedItems().filter(function(item) {
                return item.status() === Constants.STATUS.PAUSED;
            }).length;
        }),
        
        canPause: ko.pureComputed(function() {
            return self.model.activeSelectedCount() > 0;
        }),
        
        canResume: ko.pureComputed(function() {
            return self.model.pausedSelectedCount() > 0;
        })
    };
    
    // Store references
    self.element = element;
    self.baseModel = baseModel;
    self.options = options;
    
    // Calculate days between dates
    self.daysBetween = function(date1, date2) {
        var oneDay = 24 * 60 * 60 * 1000;
        return Math.round(Math.abs((date1 - date2) / oneDay));
    };
    
    // Format date
    self.formatDate = function(dateString) {
        if (!dateString) return 'N/A';
        var date = new Date(dateString);
        return date.toLocaleDateString();
    };
    
    // Load work items with retry logic
    self.loadWorkItems = function(isRetry) {
        // Reset error state
        self.model.hasError(false);
        self.model.errorMessage('');
        
        // Update loading message
        if (isRetry) {
            self.model.loadingMessage('Retrying... (Attempt ' + (self.model.retryCount() + 1) + ' of ' + self.model.maxRetries + ')');
        } else {
            self.model.loadingMessage('Loading work items...');
            self.model.retryCount(0);
        }
        
        self.model.isLoading(true);
        self.model.workItems.removeAll();
        
        // Check cache first
        var cacheKey = 'bulkAdviceItems';
        var cached = Cache.get('bulkManager', cacheKey);
        if (cached) {
            self.processWorkItems(cached);
            self.model.isLoading(false);
            return;
        }
        
        // Get current work type filter if available
        var currentWorkType = self.getCurrentWorkType();
        
        // Build search criteria using correct FindByQuery structure
        var searchCriteria = {
            // Filter for items with advice attributes - using correct attribute filter structure
            attributes: [{
                key: 'alt_ongoing_advice_enabled',
                values: ['true', 'false'], // Changed from selectedValues to values
                operator: 'in' // Explicitly specify operator
            }],
            
            // Include only open phases
            phase: {
                includeOpen: true,
                includeClosed: false,
                includeRemoved: false
            },
            
            // Pagination
            page: {
                page: 1,
                rowsPerPage: options.pageSize || Constants.WIDGETS.BULK_MANAGER.PAGE_SIZE || 50
            }
            
            // Note: Sorting removed - will use default ordering
            // If sorting is needed, use valid field paths like 'title' or 'reference'
        };
        
        // Add work type filter if in work type context
        if (currentWorkType) {
            searchCriteria.types = {
                includeTypes: [currentWorkType]
            };
        }
        
        // Define fields to enrich - try simpler paths
        var enrichFields = [
            { path: 'title' },
            { path: 'reference' }
            // Note: aspectData/formBuilder fields might not be enrichable
            // We'll fetch full details if needed
        ];
        
        // Build proper FindByQuery request
        var request = {
            search: searchCriteria,
            enrich: enrichFields
        };
        
        // Query for work items with advice using correct API structure
        $ajax.api.post('/api/v1/public/workItem/findByQuery', request)
        .then(function(response) {
            if (response && response.results) {
                console.log('[AdviceBulkManager] FindByQuery returned ' + response.results.length + ' results');
                
                // Check if we need to fetch full details (when data is empty)
                var needsFullDetails = response.results.some(function(result) {
                    return !result.data || Object.keys(result.data).length === 0;
                });
                
                if (needsFullDetails) {
                    console.log('[AdviceBulkManager] Data is empty, fetching full work item details...');
                    
                    // Fetch full details for each work item
                    var detailPromises = response.results.map(function(result) {
                        return $ajax.api.get('/api/v1/public/workItem/' + result.id)
                            .then(function(workItemResponse) {
                                // Extract advice attributes from aspectData.formBuilder.formData
                                // Check multiple possible locations for attributes
                                var formData = {};
                                if (workItemResponse.aspectData && workItemResponse.aspectData.formBuilder && workItemResponse.aspectData.formBuilder.formData) {
                                    formData = workItemResponse.aspectData.formBuilder.formData;
                                } else if (workItemResponse.attributes) {
                                    formData = workItemResponse.attributes;
                                }
                                
                                // Safely extract workItem data
                                var workItem = workItemResponse && workItemResponse.workItem ? workItemResponse.workItem : {};
                                
                                return {
                                    id: result.id,
                                    score: result.score,
                                    title: workItem.title || 'Untitled',
                                    reference: workItem.reference || '',
                                    // Map formData attributes to expected structure
                                    'attributes.alt_ongoing_advice_enabled': formData.alt_ongoing_advice_enabled,
                                    'attributes.alt_ongoing_advice_paused_date': formData.alt_ongoing_advice_paused_date,
                                    'attributes.alt_ongoing_advice_resumed_date': formData.alt_ongoing_advice_resumed_date,
                                    'attributes.alt_ongoing_advice_pause_reason': formData.alt_ongoing_advice_pause_reason,
                                    'attributes.alt_ongoing_advice_paused_by': formData.alt_ongoing_advice_paused_by,
                                    'attributes.alt_ongoing_advice_resumed_by': formData.alt_ongoing_advice_resumed_by,
                                    createdDate: workItem.createdDate
                                };
                            })
                            .catch(function(error) {
                                console.error('[AdviceBulkManager] Failed to fetch details for item ' + result.id, error);
                                // Return basic item even if details fetch fails
                                return {
                                    id: result.id,
                                    score: result.score,
                                    title: result.data && result.data.title || 'Unknown',
                                    reference: result.data && result.data.reference || ''
                                };
                            });
                    });
                    
                    // Wait for all detail fetches to complete
                    return $.when.apply($, detailPromises).then(function() {
                        // Convert arguments to array
                        var items = Array.prototype.slice.call(arguments);
                        
                        var transformedResponse = {
                            totalCount: response.totalCount,
                            tookMs: response.tookMs,
                            items: items
                        };
                        
                        // Cache the enriched response
                        // Cache with timestamp for smart invalidation
                        var cacheData = {
                            data: transformedResponse,
                            timestamp: Date.now(),
                            workType: self.getCurrentWorkType()
                        };
                        Cache.set('bulkManager', cacheKey, cacheData, 300000); // 5 minute TTL
                        self.processWorkItems(transformedResponse);
                        
                        console.log('[AdviceBulkManager] Fetched full details for ' + items.length + ' items');
                    });
                } else {
                    // Data is already enriched, use it directly
                    var transformedResponse = {
                        totalCount: response.totalCount,
                        tookMs: response.tookMs,
                        items: response.results.map(function(result) {
                            var item = result.data || {};
                            item.id = result.id;
                            item.score = result.score;
                            return item;
                        })
                    };
                    
                    // Cache the transformed response
                    Cache.set('bulkManager', cacheKey, transformedResponse, Constants.API.CACHE_TTL);
                    self.processWorkItems(transformedResponse);
                    
                    // Log performance metrics
                    if (response.tookMs) {
                        console.log('[AdviceBulkManager] Query completed in ' + response.tookMs + 'ms, found ' + response.totalCount + ' items');
                    }
                }
            } else {
                // Handle empty response
                self.model.workItems.removeAll();
                console.warn('[AdviceBulkManager] No results returned from FindByQuery');
            }
            self.model.isLoading(false);
        })
        .catch(function(error) {
            console.error("[AdviceBulkManager] Failed to load work items", error);
            self.model.isLoading(false);
            
            // Provide user-friendly error message
            var errorMessage = 'Failed to load work items';
            if (error.status === 401 || error.status === 403) {
                errorMessage = 'You do not have permission to view these items';
                self.model.hasError(true);
                self.model.errorMessage(errorMessage);
            } else if (error.status === 400) {
                errorMessage = 'Invalid search criteria. Please check your filters.';
                self.model.hasError(true);
                self.model.errorMessage(errorMessage);
            } else if (error.status === 404) {
                errorMessage = 'The requested resource was not found';
                self.model.hasError(true);
                self.model.errorMessage(errorMessage);
            } else if (error.status >= 500) {
                errorMessage = 'Server error. ';
                // Implement retry logic for server errors
                if (self.model.retryCount() < self.model.maxRetries) {
                    self.model.retryCount(self.model.retryCount() + 1);
                    errorMessage += 'Retrying in 3 seconds...';
                    self.model.errorMessage(errorMessage);
                    setTimeout(function() {
                        self.loadWorkItems(true);
                    }, 3000);
                    return;
                } else {
                    errorMessage += 'Please try again later.';
                    self.model.hasError(true);
                    self.model.errorMessage(errorMessage);
                }
            } else if (error.status === 0) {
                errorMessage = 'Network error. Please check your connection.';
                self.model.hasError(true);
                self.model.errorMessage(errorMessage);
            }
            
            EventBus.publish(Constants.EVENTS.ADVICE_ERROR, {
                error: errorMessage,
                details: error
            });
        });
    };
    
    // Process work items response
    self.processWorkItems = function(response) {
        if (response && response.items) {
            var workItems = response.items.map(function(item) {
                // Handle both nested and flat attribute structures
                var attributes = item.attributes || {};
                
                // Check if attributes are nested under 'attributes' property
                // This handles the FindByQuery response structure
                if (typeof attributes === 'object' && !attributes['alt_ongoing_advice_enabled']) {
                    // Check if the advice attributes are at the item level
                    if (item['attributes.alt_ongoing_advice_enabled'] !== undefined) {
                        // Attributes were flattened in the response
                        attributes = {
                            'alt_ongoing_advice_enabled': item['attributes.alt_ongoing_advice_enabled'],
                            'alt_ongoing_advice_paused_date': item['attributes.alt_ongoing_advice_paused_date'],
                            'alt_ongoing_advice_resumed_date': item['attributes.alt_ongoing_advice_resumed_date'],
                            'alt_ongoing_advice_pause_reason': item['attributes.alt_ongoing_advice_pause_reason'],
                            'alt_ongoing_advice_paused_by': item['attributes.alt_ongoing_advice_paused_by'],
                            'alt_ongoing_advice_resumed_by': item['attributes.alt_ongoing_advice_resumed_by']
                        };
                    }
                }
                
                var isEnabled = attributes['alt_ongoing_advice_enabled'];
                var status = isEnabled === 'false' ? 'paused' : 'active';
                
                // Calculate days active from resume date or creation
                var daysActive = 0;
                var resumedDate = attributes['alt_ongoing_advice_resumed_date'];
                if (resumedDate) {
                    daysActive = self.daysBetween(new Date(resumedDate), new Date());
                } else if (item.createdDate) {
                    daysActive = self.daysBetween(new Date(item.createdDate), new Date());
                }
                
                // Format last action from pause/resume dates
                var lastAction = 'N/A';
                var pausedDate = attributes['alt_ongoing_advice_paused_date'];
                
                if (pausedDate || resumedDate) {
                    var pausedTime = pausedDate ? new Date(pausedDate).getTime() : 0;
                    var resumedTime = resumedDate ? new Date(resumedDate).getTime() : 0;
                    
                    if (pausedTime > resumedTime && pausedDate) {
                        lastAction = 'Paused ' + self.formatDate(pausedDate);
                    } else if (resumedTime > 0 && resumedDate) {
                        lastAction = 'Resumed ' + self.formatDate(resumedDate);
                    }
                }
                
                return new WorkItemModel({
                    id: item.id || item.Id,  // Handle different casing
                    title: item.title || item.Title || 'Untitled',
                    status: status,
                    lastAction: lastAction,
                    daysActive: daysActive,
                    pausedReason: attributes['alt_ongoing_advice_pause_reason'] || '',
                    assignee: item.assignee || item.Assignee || '',
                    createdDate: item.createdDate
                });
            });
            
            self.model.workItems(workItems);
        } else {
            console.warn('[AdviceBulkManager] No items in response');
            self.model.workItems.removeAll();
        }
    };
    
    // Select all items
    self.selectAll = function() {
        self.model.filteredItems().forEach(function(item) {
            item.selected(true);
        });
        self.model.allSelected(true);
    };
    
    // Deselect all items
    self.deselectAll = function() {
        self.model.workItems().forEach(function(item) {
            item.selected(false);
        });
        self.model.allSelected(false);
    };
    
    // Toggle select all
    self.toggleSelectAll = function() {
        if (self.model.allSelected()) {
            self.deselectAll();
        } else {
            self.selectAll();
        }
        return true; // Allow default checkbox behavior
    };
    
    // Show bulk pause modal
    self.showBulkPauseModal = function() {
        // ShareDo doesn't use Bootstrap modals directly
        // Use jQuery to show the modal manually
        var modal = $('#bulkPauseModal');
        if (modal.length > 0) {
            modal.fadeIn(300);
            // Add backdrop if not exists
            if ($('.modal-backdrop').length === 0) {
                $('body').append('<div class="modal-backdrop fade in"></div>');
            }
        }
    };
    
    // Show bulk assign modal
    self.showBulkAssignModal = function() {
        // Implementation for reassignment modal
        if (window.$ui && window.$ui.showNotification) {
            window.$ui.showNotification('Reassignment feature coming soon', 'info');
        } else {
            alert('Reassignment feature coming soon');
        }
    };
    
    // Bulk pause
    self.bulkPause = function() {
        var itemsToPause = self.model.selectedItems().filter(function(item) {
            return item.status() === 'active';
        });
        
        if (itemsToPause.length === 0) {
            return;
        }
        
        var reason = self.model.bulkPauseReason();
        if (reason === 'Other') {
            reason = self.model.customPauseReason();
        }
        
        self.model.isLoading(true);
        var promises = [];
        
        itemsToPause.forEach(function(item) {
            promises.push(
                $ajax.api.put('/api/v1/public/workItem/' + item.id() + '/attributes', {
                    attributes: {
                        'alt_ongoing_advice_enabled': 'false',
                        'alt_ongoing_advice_paused_date': new Date().toISOString(),
                        'alt_ongoing_advice_paused_by': window.$ui && window.$ui.pageContext && window.$ui.pageContext.user ? window.$ui.pageContext.user.userid() : 'unknown',
                        'alt_ongoing_advice_pause_reason': reason,
                        'alt_ongoing_advice_next_date': '' // Clear next date when pausing
                    }
                })
            );
        });
        
        $.when.apply($, promises).done(function() {
            // Hide modal manually
            $('#bulkPauseModal').fadeOut(300);
            $('.modal-backdrop').remove();
            
            Cache.clear('bulkManager'); // Clear cache to force refresh
            self.loadWorkItems(); // Reload to get updated status
            
            // Publish bulk pause event
            EventBus.publish(Constants.EVENTS.ADVICE_PAUSED, {
                items: itemsToPause.map(function(item) { return item.id(); }),
                reason: reason,
                count: itemsToPause.length
            });
            
            self.showUndoNotification('Paused ' + itemsToPause.length + ' items', function() {
                // Undo function
                self.bulkResume();
            });
        }).fail(function() {
            if (window.$ui && window.$ui.showError) {
                window.$ui.showError(Constants.ERRORS.API_ERROR);
            } else {
                alert(Constants.ERRORS.API_ERROR);
            }
            self.model.isLoading(false);
        });
    };
    
    // Bulk resume
    self.bulkResume = function() {
        var itemsToResume = self.model.selectedItems().filter(function(item) {
            return item.status() === 'paused';
        });
        
        if (itemsToResume.length === 0) {
            return;
        }
        
        var confirmMessage = 'Resume ' + itemsToResume.length + ' paused advice items?';
        if (window.$ui && window.$ui.showConfirm) {
            if (!window.$ui.showConfirm(confirmMessage)) {
                return;
            }
        } else if (!confirm(confirmMessage)) {
            return;
        }
        
        self.model.isLoading(true);
        var promises = [];
        
        itemsToResume.forEach(function(item) {
            promises.push(
                $ajax.api.put('/api/v1/public/workItem/' + item.id() + '/attributes', {
                    attributes: {
                        'alt_ongoing_advice_enabled': 'true',
                        'alt_ongoing_advice_resumed_date': new Date().toISOString(),
                        'alt_ongoing_advice_resumed_by': window.$ui && window.$ui.pageContext && window.$ui.pageContext.user ? window.$ui.pageContext.user.userid() : 'unknown',
                        'alt_ongoing_advice_resume_reason': 'Bulk resume action'
                    }
                })
            );
        });
        
        $.when.apply($, promises).done(function() {
            Cache.clear('bulkManager'); // Clear cache to force refresh
            self.loadWorkItems(); // Reload to get updated status
            
            // Publish bulk resume event
            EventBus.publish(Constants.EVENTS.ADVICE_RESUMED, {
                items: itemsToResume.map(function(item) { return item.id(); }),
                count: itemsToResume.length
            });
            
            self.showUndoNotification('Resumed ' + itemsToResume.length + ' items', function() {
                // Undo function
                self.bulkPause();
            });
        }).fail(function() {
            if (window.$ui && window.$ui.showError) {
                window.$ui.showError(Constants.ERRORS.API_ERROR);
            } else {
                alert(Constants.ERRORS.API_ERROR);
            }
            self.model.isLoading(false);
        });
    };
    
    // Pause single item
    self.pauseSingle = function(item) {
        self.openAdvicePanel(item.id(), 'pause');
    };
    
    // Resume single item
    self.resumeSingle = function(item) {
        var confirmMessage = 'Resume advice for "' + item.title() + '"?';
        var shouldResume = window.$ui && window.$ui.showConfirm ? 
            window.$ui.showConfirm(confirmMessage) : confirm(confirmMessage);
        if (shouldResume) {
            self.model.isLoading(true);
            $ajax.api.put('/api/v1/public/workItem/' + item.id() + '/attributes', {
                attributes: {
                    'alt_ongoing_advice_enabled': 'true',
                    'alt_ongoing_advice_resumed_date': new Date().toISOString(),
                    'alt_ongoing_advice_resumed_by': window.$ui && window.$ui.currentUser ? window.$ui.currentUser.id : 'unknown',
                    'alt_ongoing_advice_resume_reason': 'Individual resume action'
                }
            })
            .then(function() {
                self.loadWorkItems();
            })
            .catch(function(error) {
                if (window.$ui && window.$ui.showError) {
                    window.$ui.showError('Failed to resume advice');
                } else {
                    alert('Failed to resume advice');
                }
                self.model.isLoading(false);
            });
        }
    };
    
    // View details
    self.viewDetails = function(item) {
        self.openAdvicePanel(item.id(), 'view');
    };
    
    // Open advice panel
    self.openAdvicePanel = function(workItemId, mode) {
        var panelOptions = {
            panelId: "Alt.AdviceManagement.AdvicePauseResumeBlade",
            title: mode === 'pause' ? "Pause Advice" : mode === 'resume' ? "Resume Advice" : "Advice Details",
            width: 600,
            height: 400,
            modal: true,
            data: {
                workItemId: workItemId,
                mode: mode
            },
            onClose: function() {
                self.loadWorkItems();
            }
        };
        
        // Try multiple methods to open panel
        var panelOpened = false;
        
        if (window.$ui && window.$ui.stacks && window.$ui.stacks.openPanel) {
            // Stack manager method - primary method for ShareDo panels
            console.log('[AdviceBulkManager] Opening panel using $ui.stacks.openPanel');
            
            var stackConfig = panelOptions.data || {};
            stackConfig.bladeWidth = panelOptions.width;
            
            var events = {
                closing: function(resultData) {
                    if (panelOptions.onClose) {
                        panelOptions.onClose(resultData);
                    }
                },
                cancelled: function() {
                    if (panelOptions.onClose) {
                        panelOptions.onClose({ cancelled: true });
                    }
                }
            };
            
            window.$ui.stacks.openPanel(
                panelOptions.panelId,
                stackConfig,
                events,
                false,  // isInNewWindow
                false   // refreshExisting
            );
            panelOpened = true;
        } else if (window.$ui && window.$ui.openPanel) {
            // Standard UI method
            window.$ui.openPanel(panelOptions);
            panelOpened = true;
        } else if (window.ShareDo && window.ShareDo.UI && window.ShareDo.UI.openPanel) {
            window.ShareDo.UI.openPanel(panelOptions);
            panelOpened = true;
        } else if (window.parent && window.parent.ShareDo && window.parent.ShareDo.UI && window.parent.ShareDo.UI.openPanel) {
            window.parent.ShareDo.UI.openPanel(panelOptions);
            panelOpened = true;
        } else {
            console.error("[AdviceBulkManager] Unable to open panel - no panel opening mechanism available");
        }
        
        if (panelOpened) {
            console.log('[AdviceBulkManager] Panel opened successfully');
        }
    };
    
    // Pagination functions
    self.goToPage = function(page) {
        self.model.currentPage(page);
    };
    
    self.nextPage = function() {
        if (self.model.currentPage() < self.model.totalPages()) {
            self.model.currentPage(self.model.currentPage() + 1);
        }
    };
    
    self.previousPage = function() {
        if (self.model.currentPage() > 1) {
            self.model.currentPage(self.model.currentPage() - 1);
        }
    };
    
    // Undo functionality
    self.showUndoNotification = function(message, action) {
        self.model.undoMessage(message);
        self.model.lastAction = action;
        self.model.showUndo(true);
        
        // Auto-hide after 10 seconds
        setTimeout(function() {
            self.model.showUndo(false);
        }, 10000);
    };
    
    self.undoLastAction = function() {
        if (self.model.lastAction && typeof self.model.lastAction === 'function') {
            self.model.lastAction();
            self.model.showUndo(false);
            self.loadWorkItems(); // Refresh after undo
        }
    };
    
    self.dismissUndo = function() {
        self.model.showUndo(false);
    };
    
    // Search work items using FindByQuery free text search
    self.searchWorkItems = function(searchText) {
        if (!searchText || searchText.length < 3) {
            return;
        }
        
        self.model.isLoading(true);
        
        // Get current work type filter if available
        var currentWorkType = self.getCurrentWorkType();
        
        // Build search criteria with free text search
        var searchCriteria = {
            // Free text search
            freeText: {
                input: searchText,
                wildcardStart: true,
                wildCardEnd: true
            },
            
            // Filter for items with advice attributes - using correct attribute filter structure
            attributes: [{
                key: 'alt_ongoing_advice_enabled',
                values: ['true', 'false'], // Changed from selectedValues to values
                operator: 'in' // Explicitly specify operator
            }],
            
            // Include only open phases
            phase: {
                includeOpen: true,
                includeClosed: false,
                includeRemoved: false
            },
            
            // Pagination
            page: {
                page: 1,
                rowsPerPage: 100 // Get more results for search
            }
            
            // Note: When using freeText search, results are automatically sorted by relevance
            // No need to specify sort explicitly
        };
        
        // Add work type filter if in work type context
        if (currentWorkType) {
            searchCriteria.types = {
                includeTypes: [currentWorkType]
            };
        }
        
        // Define fields to enrich - keep simple as API might not support complex paths
        var enrichFields = [
            { path: 'title' },
            { path: 'reference' }
        ];
        
        // Build request
        var request = {
            search: searchCriteria,
            enrich: enrichFields
        };
        
        // Execute search
        $ajax.api.post('/api/v1/public/workItem/findByQuery', request)
        .then(function(response) {
            if (response && response.results) {
                // Check if we need to fetch full details
                var needsFullDetails = response.results.some(function(result) {
                    return !result.data || Object.keys(result.data).length === 0;
                });
                
                if (needsFullDetails && response.results.length <= 10) {
                    // Only fetch details for small result sets to avoid too many API calls
                    console.log('[AdviceBulkManager] Fetching full details for search results...');
                    
                    var detailPromises = response.results.map(function(result) {
                        return $ajax.api.get('/api/v1/public/workItem/' + result.id)
                            .then(function(workItemResponse) {
                                // Check multiple possible locations for attributes
                                var formData = {};
                                if (workItemResponse.aspectData && workItemResponse.aspectData.formBuilder && workItemResponse.aspectData.formBuilder.formData) {
                                    formData = workItemResponse.aspectData.formBuilder.formData;
                                } else if (workItemResponse.attributes) {
                                    formData = workItemResponse.attributes;
                                }
                                
                                return {
                                    id: result.id,
                                    score: result.score,
                                    title: workItemResponse.workItem ? workItemResponse.workItem.title : 'Untitled',
                                    reference: workItemResponse.workItem ? workItemResponse.workItem.reference : '',
                                    'attributes.alt_ongoing_advice_enabled': formData.alt_ongoing_advice_enabled,
                                    'attributes.alt_ongoing_advice_paused_date': formData.alt_ongoing_advice_paused_date,
                                    'attributes.alt_ongoing_advice_resumed_date': formData.alt_ongoing_advice_resumed_date,
                                    'attributes.alt_ongoing_advice_pause_reason': formData.alt_ongoing_advice_pause_reason,
                                    'attributes.alt_ongoing_advice_paused_by': formData.alt_ongoing_advice_paused_by,
                                    'attributes.alt_ongoing_advice_resumed_by': formData.alt_ongoing_advice_resumed_by,
                                    createdDate: workItem.createdDate
                                };
                            })
                            .catch(function(error) {
                                console.error('[AdviceBulkManager] Failed to fetch search result details', error);
                                return {
                                    id: result.id,
                                    score: result.score,
                                    title: 'Unknown'
                                };
                            });
                    });
                    
                    return $.when.apply($, detailPromises).then(function() {
                        var items = Array.prototype.slice.call(arguments);
                        var transformedResponse = {
                            totalCount: response.totalCount,
                            tookMs: response.tookMs,
                            items: items
                        };
                        self.processWorkItems(transformedResponse);
                        console.log('[AdviceBulkManager] Search with details completed');
                    });
                } else {
                    // Use data as-is or show limited info for large result sets
                    var transformedResponse = {
                        totalCount: response.totalCount,
                        tookMs: response.tookMs,
                        items: response.results.map(function(result) {
                            var item = result.data || {};
                            item.id = result.id;
                            item.score = result.score;
                            // For large result sets without data, show minimal info
                            if (Object.keys(item).length === 2) {
                                item.title = 'Loading...';
                                item['attributes.alt_ongoing_advice_enabled'] = 'unknown';
                            }
                            return item;
                        })
                    };
                    
                    self.processWorkItems(transformedResponse);
                    
                    // Log search performance
                    console.log('[AdviceBulkManager] Search for "' + searchText + '" completed in ' + 
                               (response.tookMs || 'unknown') + 'ms, found ' + response.totalCount + ' items');
                }
            } else {
                self.model.workItems.removeAll();
            }
            self.model.isLoading(false);
        })
        .catch(function(error) {
            console.error('[AdviceBulkManager] Search failed', error);
            self.model.isLoading(false);
            
            // Show error to user
            if (window.$ui && window.$ui.showError) {
                window.$ui.showError('Search failed. Please try again.');
            }
        });
    };
    
    // Export to CSV with progress indication
    self.exportSelected = function() {
        var items = self.model.selectedItems();
        if (items.length === 0) {
            if (window.$ui && window.$ui.showNotification) {
                window.$ui.showNotification('No items selected for export', 'warning');
            } else {
                alert('No items selected for export');
            }
            return;
        }
        
        // Show export progress for large datasets
        if (items.length > 50) {
            self.model.loadingMessage('Preparing export for ' + items.length + ' items...');
            self.model.isLoading(true);
        }
        
        // Process in chunks for better performance
        setTimeout(function() {
            try {
                // Create CSV content with BOM for Excel compatibility
                var BOM = '\uFEFF';
                var csv = BOM + 'ID,Title,Status,Last Action,Days Active,Paused Reason,Assigned To\n';
                
                items.forEach(function(item, index) {
                    // Add progress update for large exports
                    if (items.length > 50 && index % 20 === 0) {
                        self.model.loadingMessage('Processing item ' + (index + 1) + ' of ' + items.length + '...');
                    }
                    
                    csv += '"' + item.id() + '",';
            csv += '"' + item.title().replace(/"/g, '""') + '",';
            csv += '"' + item.status() + '",';
            csv += '"' + item.lastAction() + '",';
            csv += '"' + item.daysActive() + '",';
                    csv += '"' + (item.pausedReason() || '').replace(/"/g, '""') + '",';  
                    csv += '"' + (item.assignee() || '').replace(/"/g, '""') + '"\n';
                });
                
                // Download CSV using $ui service
                if (window.$ui && window.$ui.downloadFile) {
                    window.$ui.downloadFile({
                        content: csv,
                        filename: 'advice-items-' + new Date().toISOString().split('T')[0] + '.csv',
                        mimeType: 'text/csv;charset=utf-8'
                    });
                } else {
                    // Fallback for older environments with UTF-8 BOM
                    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
                    var url = window.URL.createObjectURL(blob);
                    var a = window.$ui ? window.$ui.createElement('a') : document.createElement('a');
                    a.href = url;
                    a.download = 'advice-items-' + new Date().toISOString().split('T')[0] + '.csv';
                    var container = window.$ui && window.$ui.getContainer ? window.$ui.getContainer() : document.body;
                    container.appendChild(a);
                    a.click();
                    container.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }
                
                // Show success message
                self.showUndoNotification('Exported ' + items.length + ' items to CSV', null);
                
            } catch (exportError) {
                console.error('[AdviceBulkManager] Export failed:', exportError);
                if (window.$ui && window.$ui.showError) {
                    window.$ui.showError('Failed to export items. Please try again.');
                }
            } finally {
                if (items.length > 50) {
                    self.model.isLoading(false);
                }
            }
        }, 10); // Small delay to show loading state
    };
};

/**
 * Refresh the current view (either search results or full list)
 */
Alt.AdviceManagement.AdviceBulkManager.prototype.refreshCurrentView = function() {
    var self = this;
    
    // If there's a search term, re-run the search
    if (self.model.searchTerm() && self.model.searchTerm().length >= 3) {
        self.searchWorkItems(self.model.searchTerm());
    } else {
        // Otherwise reload the full list
        self.loadWorkItems();
    }
};

/**
 * Clean up when widget is destroyed
 */
Alt.AdviceManagement.AdviceBulkManager.prototype.onDestroy = function() {
    var self = this;
    
    // Clean up event subscriptions
    self.cleanupEventSubscriptions();
    
    // Clean up subscriptions
    if (self.model) {
        for (var prop in self.model) {
            if (self.model[prop] && typeof self.model[prop].dispose === 'function') {
                self.model[prop].dispose();
            }
        }
    }
    
    // Publish widget destroyed event
    var EventBus = Alt.AdviceManagement.Common.EventBus;
    var Constants = Alt.AdviceManagement.Common.Constants;
    EventBus.publish(Constants.EVENTS.WIDGET_DESTROYED, {
        widget: 'AdviceBulkManager'
    });
};

/**
 * Load data after widget is bound
 */
Alt.AdviceManagement.AdviceBulkManager.prototype.loadAndBind = function() {
    var self = this;
    
    // Initialize keyboard shortcuts
    self.initializeKeyboardShortcuts();
    
    // Publish widget loaded event
    var EventBus = Alt.AdviceManagement.Common.EventBus;
    var Constants = Alt.AdviceManagement.Common.Constants;
    EventBus.publish(Constants.EVENTS.WIDGET_LOADED, {
        widget: 'AdviceBulkManager'
    });
    
    // Setup search term subscription with debouncing
    self.model.searchTerm.subscribe(function(value) {
        self.model.searchTermDebounced(value);
    });
    
    // Subscribe to debounced search term to trigger search
    self.model.searchTermDebounced.subscribe(function(value) {
        if (value && value.length >= 3) {
            // Perform search with FindByQuery when user types
            self.searchWorkItems(value);
        } else if (!value) {
            // Reset to full list when search is cleared
            self.loadWorkItems();
        }
    });
    
    // Auto-load if configured
    if (self.options.autoLoad) {
        // Add a small delay to ensure DOM is ready
        setTimeout(function() {
            self.loadWorkItems();
        }, 100);
    }
    
    // Subscribe to advice status change events using ShareDo native event system
    self.initializeEventSubscriptions();
};

/**
 * Initialize event subscriptions using ShareDo native event system
 */
Alt.AdviceManagement.AdviceBulkManager.prototype.initializeEventSubscriptions = function() {
    var self = this;
    
    if (!window.$ui || !window.$ui.events) {
        console.warn('[AdviceBulkManager] ShareDo events not available');
        return;
    }
    
    // Store subscription IDs for cleanup
    self.eventSubscriptions = [];
    
    // Helper function to handle all events
    var handleEvent = function(eventName) {
        return function(data) {
            console.log('[AdviceBulkManager] Received ' + eventName + ' event:', data);
            // Refresh the list to show updated status
            self.refreshCurrentView();
        };
    };
    
    // Subscribe to all relevant events
    var events = ['advice:paused', 'advice:resumed', 'advice:statusChanged', 'advice:statusLoaded', 'advice:statusRefreshed', 'advice:cacheInvalidated'];
    events.forEach(function(eventName) {
        var subscriptionId = $ui.events.subscribe(eventName, 
            handleEvent(eventName), self);
        self.eventSubscriptions.push(subscriptionId);
    });
    
    console.log('[AdviceBulkManager] Subscribed to ShareDo events:', events);
};

/**
 * Initialize keyboard shortcuts for accessibility
 */
Alt.AdviceManagement.AdviceBulkManager.prototype.initializeKeyboardShortcuts = function() {
    var self = this;
    
    // Store the handler for cleanup
    self.keyboardHandler = function(e) {
        // Check if user is typing in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        var handled = false;
        
        // Ctrl/Cmd + A: Select all visible items
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            self.selectAll();
            handled = true;
        }
        // Ctrl/Cmd + D: Deselect all
        else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            self.deselectAll();
            handled = true;
        }
        // Ctrl/Cmd + E: Export selected
        else if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            self.exportSelected();
            handled = true;
        }
        // R: Refresh/Reload
        else if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            self.loadWorkItems();
            handled = true;
        }
        // P: Pause selected (opens modal)
        else if (e.key === 'p' && !e.ctrlKey && !e.metaKey) {
            if (self.model.canPause()) {
                e.preventDefault();
                self.showBulkPauseModal();
                handled = true;
            }
        }
        // U: Resume selected
        else if (e.key === 'u' && !e.ctrlKey && !e.metaKey) {
            if (self.model.canResume()) {
                e.preventDefault();
                self.bulkResume();
                handled = true;
            }
        }
        
        if (handled) {
            console.log('[AdviceBulkManager] Keyboard shortcut handled:', e.key);
        }
    };
    
    // Attach keyboard handler
    $(document).on('keydown.adviceBulkManager', self.keyboardHandler);
};

/**
 * Clean up event subscriptions
 */
Alt.AdviceManagement.AdviceBulkManager.prototype.cleanupEventSubscriptions = function() {
    var self = this;
    
    if (window.$ui && window.$ui.events && self.eventSubscriptions) {
        self.eventSubscriptions.forEach(function(subscriptionId) {
            if (subscriptionId) {
                $ui.events.unsubscribe(subscriptionId);
            }
        });
        console.log('[AdviceBulkManager] Cleaned up event subscriptions');
    }
    self.eventSubscriptions = [];
    
    // Clean up keyboard shortcuts
    if (self.keyboardHandler) {
        $(document).off('keydown.adviceBulkManager', self.keyboardHandler);
    }
};