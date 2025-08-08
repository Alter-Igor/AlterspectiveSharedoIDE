/**
 * Enhanced TreeSelectDropdown with FindByQuery Integration
 * Optimized for work item hierarchical selection
 */

// Namespace initialization
var Sharedo = Sharedo || {};
Sharedo.UI = Sharedo.UI || {};
Sharedo.UI.Framework = Sharedo.UI.Framework || {};
Sharedo.UI.Framework.Components = Sharedo.UI.Framework.Components || {};

/**
 * Enhanced lazy load handler using FindByQuery API
 */
Sharedo.UI.Framework.Components.TreeSelectDropdownFindByQueryHandler = function(params, treeDropdown) {
    var self = this;
    
    var defaults = {
        enrichFields: ['title', 'reference', 'type', 'hasChildren', 'phase.name'],
        minSearchLength: 3,
        searchDebounceMs: 500,
        cacheTimeout: 60000
    };
    
    self.options = $.extend(defaults, params);
    self.treeDropdown = treeDropdown;
    
    // Initialize FindByQuery service
    self.searchService = new Sharedo.UI.Framework.Services.FindByQueryService({
        enableCache: true,
        cacheTimeout: self.options.cacheTimeout,
        minSearchLength: self.options.minSearchLength
    });
    
    self.isLoading = ko.observable(false);
    self.searchDebounced = _.debounce(self.searchNow, self.options.searchDebounceMs);
    self.selectedNodes = [];
};

/**
 * Load children using FindByQuery
 */
Sharedo.UI.Framework.Components.TreeSelectDropdownFindByQueryHandler.prototype.loadChildren = function(parentId) {
    var self = this;
    
    var criteria = {
        graph: {
            includeAncestors: false,
            ancestorIds: [parentId],
            maxAncestorDistance: 1
        },
        phase: {
            includeOpen: true,
            includeClosed: false,
            includeRemoved: false
        }
    };
    
    return self.searchService.search(criteria, self.options.enrichFields)
        .done(function(response) {
            // Transform results to tree nodes
            return response.results.map(function(item) {
                return self.transformToTreeNode(item);
            });
        });
};

/**
 * Search for items using FindByQuery
 */
Sharedo.UI.Framework.Components.TreeSelectDropdownFindByQueryHandler.prototype.searchNow = function(query) {
    var self = this;
    
    if (!query || query.length < self.options.minSearchLength) {
        self.treeDropdown.autoCompleteMessage('Enter at least ' + self.options.minSearchLength + ' characters');
        return;
    }
    
    self.isLoading(true);
    self.treeDropdown.autoCompleteMessage('Searching...');
    
    var criteria = {
        freeText: {
            input: query,
            wildcardStart: true,
            wildCardEnd: true
        },
        page: {
            page: 1,
            rowsPerPage: 50  // Limit results for dropdown
        }
    };
    
    self.searchService.search(criteria, self.options.enrichFields)
        .done(function(response) {
            self.isLoading(false);
            
            if (response.results.length === 0) {
                self.treeDropdown.autoCompleteMessage('No results found');
                self.treeDropdown.allNodes.removeAll();
            } else {
                self.treeDropdown.autoCompleteMessage(null);
                
                // Transform and display results
                var nodes = response.results.map(function(item) {
                    return self.transformToTreeNode(item);
                });
                
                // Update dropdown with search results
                self.treeDropdown.allNodes(nodes);
                
                // Show chosen dropdown for search results
                if (self.treeDropdown.chosen) {
                    self.treeDropdown.chosen.results_show();
                }
            }
            
            console.log('Tree search found ' + response.results.length + ' results in ' + response.tookMs + 'ms');
        })
        .fail(function(xhr, status, error) {
            self.isLoading(false);
            self.treeDropdown.autoCompleteMessage('Search failed: ' + error);
            console.error('Tree search failed:', error);
        });
};

/**
 * Transform FindByQuery result to tree node
 */
Sharedo.UI.Framework.Components.TreeSelectDropdownFindByQueryHandler.prototype.transformToTreeNode = function(item) {
    var self = this;
    
    var data = item.data;
    
    // Build display label
    var label = data.title || data.reference || item.id;
    if (data.reference && data.title) {
        label = data.reference + ' - ' + data.title;
    }
    
    // Determine icon
    var iconClass = 'fa ';
    if (data.type) {
        switch(data.type.toLowerCase()) {
            case 'task':
                iconClass += 'fa-tasks';
                break;
            case 'appointment':
                iconClass += 'fa-calendar';
                break;
            case 'instruction':
                iconClass += 'fa-list';
                break;
            default:
                iconClass += data.hasChildren ? 'fa-folder' : 'fa-file';
        }
    } else {
        iconClass += data.hasChildren ? 'fa-folder' : 'fa-file';
    }
    
    return {
        value: item.id,
        label: label,
        labelPath: label,
        valuePath: '/' + item.id,
        iconClass: iconClass,
        hasChildren: data.hasChildren || false,
        disabled: ko.observable(data.phase && data.phase.name === 'closed'),
        selected: ko.observable(false),
        visible: ko.observable(true),
        active: ko.observable(false),
        activeManuallySet: ko.observable(false),
        children: ko.observableArray(),
        childrenLoaded: ko.observable(!data.hasChildren),
        // Store additional data for reference
        metadata: {
            score: item.score,
            type: data.type,
            phase: data.phase,
            due: data.due,
            reference: data.reference
        }
    };
};

/**
 * Load item by ID using FindByQuery
 */
Sharedo.UI.Framework.Components.TreeSelectDropdownFindByQueryHandler.prototype.loadById = function(id) {
    var self = this;
    
    return self.searchService.searchByIds([id], self.options.enrichFields)
        .done(function(response) {
            if (response.results.length > 0) {
                return self.transformToTreeNode(response.results[0]);
            }
            return null;
        });
};

/**
 * Initialize handler
 */
Sharedo.UI.Framework.Components.TreeSelectDropdownFindByQueryHandler.prototype.onInitialised = function() {
    var self = this;
    
    var mainPromise = $.Deferred();
    
    // Check if initially selected values need to be loaded
    var selectedValues = self.treeDropdown.selectedValues();
    if (selectedValues.length === 0) {
        mainPromise.resolve();
        return mainPromise;
    }
    
    // Get selected values not in current nodes
    var valuesNotLoaded = selectedValues.filter(function(val) {
        return !self.treeDropdown.allNodes().some(function(node) {
            return node.value === val;
        });
    });
    
    if (valuesNotLoaded.length === 0) {
        mainPromise.resolve();
        return mainPromise;
    }
    
    // Load missing values using FindByQuery
    self.searchService.searchByIds(valuesNotLoaded, self.options.enrichFields)
        .done(function(response) {
            // Add loaded nodes
            response.results.forEach(function(item) {
                var node = self.transformToTreeNode(item);
                node.selected(true);
                self.treeDropdown.allNodes.push(node);
                self.selectedNodes.push(node);
            });
            
            mainPromise.resolve();
        })
        .fail(function(xhr, status, error) {
            console.error('Failed to load selected items:', error);
            mainPromise.resolve(); // Resolve anyway to continue
        });
    
    return mainPromise;
};

/**
 * Handle node creation with lazy loading
 */
Sharedo.UI.Framework.Components.TreeSelectDropdownFindByQueryHandler.prototype.onNodeCreated = function(node, dto) {
    var self = this;
    
    // Check if node has children that need lazy loading
    node.childrenLoaded = ko.observable(!dto.hasChildren);
    
    // Override hasAnyChildren computed
    node.hasAnyChildren = ko.pureComputed(function() {
        return node.children().length > 0 || !node.childrenLoaded();
    });
    
    // Override activeOrFiltered for lazy loading
    node.activeOrFiltered = ko.computed({
        read: function() {
            return node.active() || (self.treeDropdown.isFiltered() && !node.activeManuallySet());
        },
        write: function() {
            var uiActive = node.active() || (self.treeDropdown.isFiltered() && !node.activeManuallySet());
            node.activeManuallySet(true);
            
            // Load children if expanding and not loaded
            if (!uiActive && !node.childrenLoaded()) {
                self.isLoading(true);
                
                self.loadChildren(node.value)
                    .done(function(children) {
                        // Add children to node
                        children.forEach(function(childData) {
                            var childNode = self.treeDropdown.buildNode(childData, node, node.valuePath, node.labelPath);
                            node.children.push(childNode);
                            self.treeDropdown.allNodes.push(childNode);
                        });
                        
                        node.childrenLoaded(true);
                        self.isLoading(false);
                    })
                    .fail(function(xhr, status, error) {
                        console.error('Failed to load children:', error);
                        node.childrenLoaded(true); // Mark as loaded to prevent retry
                        self.isLoading(false);
                    });
            }
            
            node.active(!uiActive);
        }
    });
};

/**
 * Handle search query changes
 */
Sharedo.UI.Framework.Components.TreeSelectDropdownFindByQueryHandler.prototype.onSearchQueryChanged = function(query) {
    var self = this;
    
    if (!query) {
        self.treeDropdown.autoCompleteMessage(null);
        return;
    }
    
    if (query.length > 0 && query.length < self.options.minSearchLength) {
        self.treeDropdown.autoCompleteMessage('Enter at least ' + self.options.minSearchLength + ' characters');
        return;
    }
    
    // Debounced search
    self.searchDebounced(query);
};

/**
 * Dispose handler
 */
Sharedo.UI.Framework.Components.TreeSelectDropdownFindByQueryHandler.prototype.dispose = function() {
    var self = this;
    
    if (self.searchService) {
        self.searchService.dispose();
    }
};

/**
 * Factory function to create enhanced tree select with FindByQuery
 */
Sharedo.UI.Framework.Components.createWorkItemTreeSelect = function(params) {
    var defaults = {
        mode: 'tree',
        filterMode: 'standard',
        display: 'label',
        value: 'value',
        icon: 'iconClass',
        selectionMode: 'single',
        placeholder: 'Search work items...',
        dropDownHeight: '300px',
        
        // FindByQuery specific options
        useFinByQuery: true,
        enrichFields: ['title', 'reference', 'type', 'hasChildren', 'phase.name', 'due'],
        
        // Observable bindings
        selectedItems: ko.observableArray(),
        singleSelectItem: ko.observable()
    };
    
    var options = $.extend(defaults, params);
    
    // Create tree select component
    var treeSelect = new Sharedo.UI.Framework.Components.TreeSelectDropdown(options);
    
    // Replace default lazy load handler with FindByQuery handler if enabled
    if (options.useFinByQuery) {
        if (treeSelect.loadHandler) {
            treeSelect.loadHandler.dispose();
        }
        treeSelect.loadHandler = new Sharedo.UI.Framework.Components.TreeSelectDropdownFindByQueryHandler(options, treeSelect);
    }
    
    return treeSelect;
};