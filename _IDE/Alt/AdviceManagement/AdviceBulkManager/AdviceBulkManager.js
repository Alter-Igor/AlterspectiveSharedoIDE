namespace("Alt.AdviceManagement");

/**
 * AdviceBulkManager - Widget for managing multiple advice items in bulk
 * @param {HTMLElement} element - DOM element to bind to
 * @param {Object} configuration - Configuration from designer
 * @param {Object} baseModel - Base widget model
 */
Alt.AdviceManagement.AdviceBulkManager = function(element, configuration, baseModel) {
    var self = this;
    var defaults = {
        pageSize: 50,
        autoLoad: true,
        showFilters: true
    };
    var options = $.extend(true, {}, defaults, configuration);
    
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
        
        // Filtering
        filterStatus: ko.observable('all'),
        searchTerm: ko.observable(''),
        
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
                return item.status() === 'active';
            }).length;
        }),
        
        pausedSelectedCount: ko.pureComputed(function() {
            return self.model.selectedItems().filter(function(item) {
                return item.status() === 'paused';
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
    
    // Load work items
    self.loadWorkItems = function() {
        self.model.isLoading(true);
        self.model.workItems.removeAll();
        
        // Query for work items with advice
        $.ajax({
            url: '/api/v1/public/workItem/findByQuery',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                query: {
                    attributes: {
                        'AdviceStatus': { $exists: true }
                    }
                },
                limit: options.pageSize,
                includeAttributes: true
            }),
            success: function(response) {
                if (response && response.items) {
                    var workItems = response.items.map(function(item) {
                        var attributes = item.attributes || {};
                        var status = (attributes['AdviceStatus'] || '').toLowerCase();
                        
                        // Calculate days active
                        var daysActive = 0;
                        if (attributes['AdviceStartDate']) {
                            daysActive = self.daysBetween(new Date(attributes['AdviceStartDate']), new Date());
                        }
                        
                        // Format last action
                        var lastAction = 'N/A';
                        if (attributes['AdviceLastActionDate']) {
                            var actionType = attributes['AdviceLastActionType'] || 'Updated';
                            lastAction = actionType + ' ' + self.formatDate(attributes['AdviceLastActionDate']);
                        }
                        
                        return new WorkItemModel({
                            id: item.id,
                            title: item.title,
                            status: status === 'paused' ? 'paused' : 'active',
                            lastAction: lastAction,
                            daysActive: daysActive,
                            pausedReason: attributes['AdvicePausedReason'] || '',
                            assignee: item.assignee || ''
                        });
                    });
                    
                    self.model.workItems(workItems);
                }
                self.model.isLoading(false);
            },
            error: function() {
                console.error("Failed to load work items");
                self.model.isLoading(false);
            }
        });
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
        $('#bulkPauseModal').modal('show');
    };
    
    // Show bulk assign modal
    self.showBulkAssignModal = function() {
        // Implementation for reassignment modal
        alert('Reassignment feature coming soon');
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
            promises.push($.ajax({
                url: '/api/v1/public/workItem/' + item.id() + '/attributes',
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({
                    attributes: {
                        'AdviceStatus': 'paused',
                        'AdvicePausedDate': new Date().toISOString(),
                        'AdvicePausedReason': reason,
                        'AdviceLastActionDate': new Date().toISOString(),
                        'AdviceLastActionType': 'Paused'
                    }
                })
            }));
        });
        
        $.when.apply($, promises).done(function() {
            $('#bulkPauseModal').modal('hide');
            self.loadWorkItems(); // Reload to get updated status
        }).fail(function() {
            alert('Failed to pause some items');
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
        
        if (!confirm('Resume ' + itemsToResume.length + ' paused advice items?')) {
            return;
        }
        
        self.model.isLoading(true);
        var promises = [];
        
        itemsToResume.forEach(function(item) {
            promises.push($.ajax({
                url: '/api/v1/public/workItem/' + item.id() + '/attributes',
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({
                    attributes: {
                        'AdviceStatus': 'active',
                        'AdviceResumedDate': new Date().toISOString(),
                        'AdviceLastActionDate': new Date().toISOString(),
                        'AdviceLastActionType': 'Resumed'
                    }
                })
            }));
        });
        
        $.when.apply($, promises).done(function() {
            self.loadWorkItems(); // Reload to get updated status
        }).fail(function() {
            alert('Failed to resume some items');
            self.model.isLoading(false);
        });
    };
    
    // Pause single item
    self.pauseSingle = function(item) {
        self.openAdvicePanel(item.id(), 'pause');
    };
    
    // Resume single item
    self.resumeSingle = function(item) {
        if (confirm('Resume advice for "' + item.title() + '"?')) {
            self.model.isLoading(true);
            $.ajax({
                url: '/api/v1/public/workItem/' + item.id() + '/attributes',
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({
                    attributes: {
                        'AdviceStatus': 'active',
                        'AdviceResumedDate': new Date().toISOString(),
                        'AdviceLastActionDate': new Date().toISOString(),
                        'AdviceLastActionType': 'Resumed'
                    }
                }),
                success: function() {
                    self.loadWorkItems();
                },
                error: function() {
                    alert('Failed to resume advice');
                    self.model.isLoading(false);
                }
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
        
        if (window.ShareDo && window.ShareDo.UI && window.ShareDo.UI.openPanel) {
            window.ShareDo.UI.openPanel(panelOptions);
        } else if (window.parent && window.parent.ShareDo && window.parent.ShareDo.UI && window.parent.ShareDo.UI.openPanel) {
            window.parent.ShareDo.UI.openPanel(panelOptions);
        } else {
            console.error("Unable to open panel");
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
    
    // Export to CSV
    self.exportSelected = function() {
        var items = self.model.selectedItems();
        if (items.length === 0) {
            alert('No items selected for export');
            return;
        }
        
        // Create CSV content
        var csv = 'ID,Title,Status,Last Action,Days Active,Paused Reason\n';
        items.forEach(function(item) {
            csv += '"' + item.id() + '",';
            csv += '"' + item.title().replace(/"/g, '""') + '",';
            csv += '"' + item.status() + '",';
            csv += '"' + item.lastAction() + '",';
            csv += '"' + item.daysActive() + '",';
            csv += '"' + (item.pausedReason() || '').replace(/"/g, '""') + '"\n';
        });
        
        // Download CSV
        var blob = new Blob([csv], { type: 'text/csv' });
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'advice-items-' + new Date().toISOString().split('T')[0] + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };
};

/**
 * Clean up when widget is destroyed
 */
Alt.AdviceManagement.AdviceBulkManager.prototype.onDestroy = function() {
    var self = this;
    
    // Clean up subscriptions
    if (self.model) {
        for (var prop in self.model) {
            if (self.model[prop] && typeof self.model[prop].dispose === 'function') {
                self.model[prop].dispose();
            }
        }
    }
};

/**
 * Load data after widget is bound
 */
Alt.AdviceManagement.AdviceBulkManager.prototype.loadAndBind = function() {
    var self = this;
    
    // Auto-load if configured
    if (self.options.autoLoad) {
        self.loadWorkItems();
    }
};