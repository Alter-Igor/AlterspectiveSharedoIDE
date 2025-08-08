/**
 * Enhanced ConfigurableSearch Component
 * Integrates with FindByQuery API using best practices
 */

// Namespace initialization
var Sharedo = Sharedo || {};
Sharedo.UI = Sharedo.UI || {};
Sharedo.UI.Framework = Sharedo.UI.Framework || {};
Sharedo.UI.Framework.Components = Sharedo.UI.Framework.Components || {};

/**
 * Enhanced ConfigurableSearch with FindByQuery integration
 * @param {Object} configuration - Component configuration
 */
Sharedo.UI.Framework.Components.ConfigurableSearchEnhanced = function(configuration) {
    var self = this;
    
    var defaults = {
        searchType: 'workItem',
        enableCache: true,
        minSearchLength: 3,
        pageSize: 20,
        rateLimitMs: 500,
        enrichFields: ['title', 'reference', 'type', 'phase.name', 'due'],
        buttons: [],
        showLoadingIndicator: true,
        showExecutionTime: true,
        showResultCount: true
    };
    
    self.configuration = $.extend(defaults, configuration);
    
    // Initialize FindByQuery service
    self.searchService = new Sharedo.UI.Framework.Services.FindByQueryService({
        enableCache: self.configuration.enableCache,
        minSearchLength: self.configuration.minSearchLength,
        defaultPageSize: self.configuration.pageSize,
        rateLimitMs: self.configuration.rateLimitMs
    });
    
    // Observable properties
    self.name = ko.observable(self.configuration.searchType);
    self.searchBlocks = ko.observableArray();
    self.referenceData = ko.observableArray();
    self.doneSearch = ko.observable(false);
    self.formIsValid = ko.observable(false);
    self.isSearching = ko.observable(false);
    self.searchError = ko.observable(null);
    self.executionTime = ko.observable(null);
    self.resultCount = ko.observable(0);
    
    // Search criteria observables
    self.searchText = ko.observable('');
    self.selectedTypes = ko.observableArray();
    self.selectedPhase = ko.observable('open');
    self.dateRangeField = ko.observable('due');
    self.dateFrom = ko.observable('');
    self.dateTo = ko.observable('');
    self.includeMyItems = ko.observable(false);
    
    // Pagination
    self.currentPage = ko.observable(1);
    self.totalPages = ko.observable(0);
    self.pageSize = ko.observable(self.configuration.pageSize);
    
    // Results
    self.results = ko.observableArray();
    
    // Additional buttons
    self.additionalButtons = ko.observableArray();
    
    // Rate-limited search
    self.searchTextThrottled = ko.pureComputed(function() {
        return self.searchText();
    }).extend({ rateLimit: { timeout: self.configuration.rateLimitMs, method: "notifyWhenChangesStop" } });
    
    // Subscribe to auto-search on text change
    self.searchTextThrottled.subscribe(function(value) {
        if (value && value.length >= self.configuration.minSearchLength) {
            self.search();
        }
    });
    
    // Initialize buttons
    self.initializeButtons();
    
    // Load initial settings if configured
    if (self.configuration.autoLoadSettings) {
        self.loadSettings();
    }
    
    // Track subscriptions for disposal
    self.subscriptions = [];
};

/**
 * Initialize additional buttons
 */
Sharedo.UI.Framework.Components.ConfigurableSearchEnhanced.prototype.initializeButtons = function() {
    var self = this;
    
    _.each(self.configuration.buttons, function(button) {
        self.additionalButtons.push({
            text: ko.observable(button.text),
            css: ko.observable(button.css || 'btn btn-default'),
            iconClass: ko.observable(button.iconClass),
            callBack: button.callBack,
            enable: ko.computed(function() {
                if (!button.enableAfterSearch) {
                    return true;
                }
                return self.doneSearch() && !self.isSearching();
            })
        });
    });
    
    // Add default buttons
    self.additionalButtons.push({
        text: ko.observable('Clear Cache'),
        css: ko.observable('btn btn-link'),
        iconClass: ko.observable('fa fa-refresh'),
        callBack: function() {
            self.searchService.clearCache();
            console.log('Search cache cleared');
        },
        enable: ko.observable(true)
    });
};

/**
 * Build search criteria from UI inputs
 */
Sharedo.UI.Framework.Components.ConfigurableSearchEnhanced.prototype.buildSearchCriteria = function() {
    var self = this;
    
    var criteria = {};
    
    // Free text search
    if (self.searchText()) {
        criteria.freeText = {
            input: self.searchText(),
            wildcardStart: true,
            wildCardEnd: true
        };
    }
    
    // Type filtering
    if (self.selectedTypes().length > 0) {
        criteria.types = {
            includeTypes: self.selectedTypes()
        };
    }
    
    // Phase filtering
    if (self.selectedPhase()) {
        switch(self.selectedPhase()) {
            case 'open':
                criteria.phase = {
                    includeOpen: true,
                    includeClosed: false,
                    includeRemoved: false
                };
                break;
            case 'closed':
                criteria.phase = {
                    includeOpen: false,
                    includeClosed: true,
                    includeRemoved: false
                };
                break;
            case 'all':
                criteria.phase = {
                    includeOpen: true,
                    includeClosed: true,
                    includeRemoved: false
                };
                break;
        }
    }
    
    // Date range filtering
    if (self.dateFrom() && self.dateTo()) {
        criteria.dates = {};
        criteria.dates[self.dateRangeField()] = {
            from: self.dateFrom(),
            to: self.dateTo()
        };
    }
    
    // Ownership filtering
    if (self.includeMyItems()) {
        criteria.ownership = {
            myScope: {
                primary: true,
                secondary: true
            }
        };
    }
    
    // Pagination
    criteria.page = {
        page: self.currentPage(),
        rowsPerPage: self.pageSize()
    };
    
    // Sorting
    if (self.configuration.defaultSort) {
        criteria.sort = {
            orderBy: self.configuration.defaultSort.field,
            direction: self.configuration.defaultSort.direction || 'ascending'
        };
    }
    
    return criteria;
};

/**
 * Execute search
 */
Sharedo.UI.Framework.Components.ConfigurableSearchEnhanced.prototype.search = function() {
    var self = this;
    
    // Validate form
    if (!self.formIsValid()) {
        self.searchError('Please complete all required fields');
        return;
    }
    
    // Clear previous error
    self.searchError(null);
    self.isSearching(true);
    
    // Build search criteria
    var criteria = self.buildSearchCriteria();
    
    // Log search request for debugging
    console.log('Executing search with criteria:', criteria);
    
    // Execute search
    var startTime = Date.now();
    
    self.searchService.search(criteria, self.configuration.enrichFields)
        .done(function(response) {
            // Handle successful response
            if (response.error) {
                self.searchError(response.errorMessage || 'Search failed');
                self.results.removeAll();
                self.resultCount(0);
            } else {
                // Transform results for display
                var transformedResults = response.results.map(function(item) {
                    return {
                        id: item.id,
                        score: item.score,
                        data: item.data,
                        selected: ko.observable(false)
                    };
                });
                
                // Update results
                self.results.removeAll();
                ko.utils.arrayPushAll(self.results, transformedResults);
                
                // Update metadata
                self.resultCount(response.totalCount);
                self.executionTime(response.tookMs || (Date.now() - startTime));
                
                // Calculate total pages
                var totalPages = Math.ceil(response.totalCount / self.pageSize());
                self.totalPages(totalPages);
                
                // Mark search as done
                self.doneSearch(true);
                
                // Log performance
                console.log('Search completed:', {
                    totalCount: response.totalCount,
                    executionTime: self.executionTime() + 'ms',
                    resultsReturned: response.results.length
                });
            }
        })
        .fail(function(xhr, status, error) {
            // Handle error
            self.searchError('Search failed: ' + error);
            self.results.removeAll();
            self.resultCount(0);
            console.error('Search failed:', error);
        })
        .always(function() {
            self.isSearching(false);
        });
};

/**
 * Clear search and results
 */
Sharedo.UI.Framework.Components.ConfigurableSearchEnhanced.prototype.clearSearch = function() {
    var self = this;
    
    self.searchText('');
    self.selectedTypes.removeAll();
    self.selectedPhase('open');
    self.dateFrom('');
    self.dateTo('');
    self.includeMyItems(false);
    self.currentPage(1);
    self.results.removeAll();
    self.doneSearch(false);
    self.searchError(null);
    self.executionTime(null);
    self.resultCount(0);
    self.totalPages(0);
};

/**
 * Navigate to page
 */
Sharedo.UI.Framework.Components.ConfigurableSearchEnhanced.prototype.goToPage = function(page) {
    var self = this;
    
    if (page < 1 || page > self.totalPages()) {
        return;
    }
    
    self.currentPage(page);
    self.search();
};

/**
 * Next page
 */
Sharedo.UI.Framework.Components.ConfigurableSearchEnhanced.prototype.nextPage = function() {
    var self = this;
    
    if (self.currentPage() < self.totalPages()) {
        self.goToPage(self.currentPage() + 1);
    }
};

/**
 * Previous page
 */
Sharedo.UI.Framework.Components.ConfigurableSearchEnhanced.prototype.previousPage = function() {
    var self = this;
    
    if (self.currentPage() > 1) {
        self.goToPage(self.currentPage() - 1);
    }
};

/**
 * Load search settings/configuration
 */
Sharedo.UI.Framework.Components.ConfigurableSearchEnhanced.prototype.loadSettings = function() {
    var self = this;
    
    self.doneSearch(false);
    
    // Load search configuration if URL is provided
    if (self.configuration.settingsUrl) {
        $.ajax({
            url: self.configuration.settingsUrl,
            type: 'GET',
            contentType: 'application/json'
        }).done(function(settings) {
            // Apply loaded settings
            if (settings.defaultTypes) {
                self.selectedTypes(settings.defaultTypes);
            }
            if (settings.enrichFields) {
                self.configuration.enrichFields = settings.enrichFields;
            }
            if (settings.defaultPhase) {
                self.selectedPhase(settings.defaultPhase);
            }
            
            console.log('Search settings loaded:', settings);
        }).fail(function(xhr, status, error) {
            console.error('Failed to load search settings:', error);
        });
    }
    
    // Set form as valid initially
    self.formIsValid(true);
};

/**
 * Export results
 */
Sharedo.UI.Framework.Components.ConfigurableSearchEnhanced.prototype.exportResults = function(format) {
    var self = this;
    
    var exportData = self.results().map(function(item) {
        return {
            id: item.id,
            score: item.score,
            ...item.data
        };
    });
    
    if (format === 'json') {
        var json = JSON.stringify(exportData, null, 2);
        var blob = new Blob([json], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'search-results.json';
        a.click();
        URL.revokeObjectURL(url);
    } else if (format === 'csv') {
        // Simple CSV export (would need enhancement for nested data)
        var csv = self.convertToCSV(exportData);
        var blob = new Blob([csv], { type: 'text/csv' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'search-results.csv';
        a.click();
        URL.revokeObjectURL(url);
    }
};

/**
 * Convert data to CSV
 */
Sharedo.UI.Framework.Components.ConfigurableSearchEnhanced.prototype.convertToCSV = function(data) {
    if (!data || data.length === 0) {
        return '';
    }
    
    var keys = Object.keys(data[0]);
    var csv = keys.join(',') + '\n';
    
    data.forEach(function(row) {
        var values = keys.map(function(key) {
            var value = row[key];
            if (typeof value === 'string' && value.includes(',')) {
                return '"' + value + '"';
            }
            return value || '';
        });
        csv += values.join(',') + '\n';
    });
    
    return csv;
};

/**
 * Get selected results
 */
Sharedo.UI.Framework.Components.ConfigurableSearchEnhanced.prototype.getSelectedResults = function() {
    var self = this;
    
    return self.results().filter(function(item) {
        return item.selected();
    });
};

/**
 * Select all results
 */
Sharedo.UI.Framework.Components.ConfigurableSearchEnhanced.prototype.selectAll = function() {
    var self = this;
    
    self.results().forEach(function(item) {
        item.selected(true);
    });
};

/**
 * Deselect all results
 */
Sharedo.UI.Framework.Components.ConfigurableSearchEnhanced.prototype.deselectAll = function() {
    var self = this;
    
    self.results().forEach(function(item) {
        item.selected(false);
    });
};

/**
 * Dispose and cleanup
 */
Sharedo.UI.Framework.Components.ConfigurableSearchEnhanced.prototype.dispose = function() {
    var self = this;
    
    // Dispose search service
    if (self.searchService) {
        self.searchService.dispose();
    }
    
    // Dispose subscriptions
    _.each(self.subscriptions, function(sub) {
        if (typeof sub.dispose === 'function') {
            sub.dispose();
        }
    });
    
    self.subscriptions = [];
};