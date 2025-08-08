/**
 * ShareDo FindByQuery Service
 * Enhanced service for work item searching using best practices from the knowledge base
 * 
 * Features:
 * - Field enrichment optimization
 * - Caching strategy
 * - Error handling
 * - Rate limiting
 * - Performance optimization
 */

// Namespace initialization
var Sharedo = Sharedo || {};
Sharedo.UI = Sharedo.UI || {};
Sharedo.UI.Framework = Sharedo.UI.Framework || {};
Sharedo.UI.Framework.Services = Sharedo.UI.Framework.Services || {};

/**
 * FindByQuery Service - Optimized work item search service
 * @param {Object} params - Configuration options
 */
Sharedo.UI.Framework.Services.FindByQueryService = function(params) {
    var self = this;
    
    var defaults = {
        baseUrl: '/api/v1/public/workItem/findByQuery',
        cacheTimeout: 60000, // 1 minute cache
        minSearchLength: 3,
        defaultPageSize: 20,
        enableCache: true,
        rateLimitMs: 500
    };
    
    self.options = $.extend(defaults, params);
    
    // Cache storage
    self.cache = {};
    
    // Subscription tracking for cleanup
    self.subscriptions = [];
};

/**
 * Build optimized search request
 * @param {Object} criteria - Search criteria
 * @param {Array} enrichFields - Fields to return
 * @returns {Object} Request object
 */
Sharedo.UI.Framework.Services.FindByQueryService.prototype.buildRequest = function(criteria, enrichFields) {
    var self = this;
    
    // Build field paths for enrichment
    var enrich = enrichFields.map(function(field) {
        return { path: field };
    });
    
    // Ensure pagination is set
    if (!criteria.page) {
        criteria.page = {
            page: 1,
            rowsPerPage: self.options.defaultPageSize
        };
    }
    
    return {
        search: criteria,
        enrich: enrich
    };
};

/**
 * Execute search with caching and error handling
 * @param {Object} criteria - Search criteria
 * @param {Array} enrichFields - Fields to return
 * @returns {Promise} jQuery promise with search results
 */
Sharedo.UI.Framework.Services.FindByQueryService.prototype.search = function(criteria, enrichFields) {
    var self = this;
    
    // Build request
    var request = self.buildRequest(criteria, enrichFields);
    
    // Check cache if enabled
    if (self.options.enableCache) {
        var cacheKey = JSON.stringify(request);
        var cached = self.cache[cacheKey];
        
        if (cached && (Date.now() - cached.timestamp < self.options.cacheTimeout)) {
            return $.Deferred().resolve(cached.data).promise();
        }
    }
    
    // Execute search
    return $.ajax({
        url: self.options.baseUrl,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(request)
    }).done(function(response) {
        // Cache successful response
        if (self.options.enableCache) {
            self.cache[cacheKey] = {
                data: response,
                timestamp: Date.now()
            };
        }
        
        // Log performance metrics
        if (response.tookMs) {
            console.log('FindByQuery completed in ' + response.tookMs + 'ms');
        }
        
        return response;
    }).fail(function(xhr, status, error) {
        // Handle errors gracefully
        console.error('FindByQuery failed:', {
            status: xhr.status,
            error: error,
            request: request
        });
        
        // Return empty result set on error
        return {
            totalCount: 0,
            results: [],
            error: true,
            errorMessage: self.getErrorMessage(xhr, error)
        };
    });
};

/**
 * Search with free text
 * @param {String} searchText - Text to search for
 * @param {Array} enrichFields - Fields to return
 * @param {Object} additionalCriteria - Additional search criteria
 * @returns {Promise} Search results
 */
Sharedo.UI.Framework.Services.FindByQueryService.prototype.searchText = function(searchText, enrichFields, additionalCriteria) {
    var self = this;
    
    // Validate minimum search length
    if (searchText && searchText.length < self.options.minSearchLength) {
        return $.Deferred().resolve({
            totalCount: 0,
            results: [],
            message: 'Enter at least ' + self.options.minSearchLength + ' characters'
        }).promise();
    }
    
    var criteria = $.extend({
        freeText: {
            input: searchText,
            wildcardStart: true,
            wildCardEnd: true
        }
    }, additionalCriteria || {});
    
    return self.search(criteria, enrichFields);
};

/**
 * Search by work item IDs
 * @param {Array} workItemIds - Array of work item GUIDs
 * @param {Array} enrichFields - Fields to return
 * @returns {Promise} Search results
 */
Sharedo.UI.Framework.Services.FindByQueryService.prototype.searchByIds = function(workItemIds, enrichFields) {
    var self = this;
    
    if (!workItemIds || workItemIds.length === 0) {
        return $.Deferred().resolve({
            totalCount: 0,
            results: []
        }).promise();
    }
    
    return self.search({
        workItemIds: workItemIds
    }, enrichFields);
};

/**
 * Search user's work items
 * @param {String} userId - User ID (optional, defaults to current user)
 * @param {Object} phaseFilter - Phase filtering options
 * @param {Array} enrichFields - Fields to return
 * @returns {Promise} Search results
 */
Sharedo.UI.Framework.Services.FindByQueryService.prototype.searchMyItems = function(userId, phaseFilter, enrichFields) {
    var self = this;
    
    var criteria = {
        ownership: {
            myScope: {
                primary: true,
                secondary: false
            }
        }
    };
    
    if (userId) {
        criteria.ownership.myScope.ownerIds = [userId];
    }
    
    if (phaseFilter) {
        criteria.phase = phaseFilter;
    } else {
        // Default to open items only
        criteria.phase = {
            includeOpen: true,
            includeClosed: false,
            includeRemoved: false
        };
    }
    
    return self.search(criteria, enrichFields);
};

/**
 * Search by date range
 * @param {String} dateField - Field to search (due, created, updated)
 * @param {String} from - Start date
 * @param {String} to - End date
 * @param {Array} enrichFields - Fields to return
 * @param {Object} additionalCriteria - Additional search criteria
 * @returns {Promise} Search results
 */
Sharedo.UI.Framework.Services.FindByQueryService.prototype.searchByDateRange = function(dateField, from, to, enrichFields, additionalCriteria) {
    var self = this;
    
    var criteria = $.extend({
        dates: {}
    }, additionalCriteria || {});
    
    criteria.dates[dateField] = {
        from: from,
        to: to
    };
    
    return self.search(criteria, enrichFields);
};

/**
 * Search with hierarchical/graph filtering
 * @param {Array} ancestorIds - Parent work item IDs
 * @param {Number} maxDistance - Maximum ancestor distance
 * @param {Array} enrichFields - Fields to return
 * @returns {Promise} Search results
 */
Sharedo.UI.Framework.Services.FindByQueryService.prototype.searchHierarchy = function(ancestorIds, maxDistance, enrichFields) {
    var self = this;
    
    return self.search({
        graph: {
            includeAncestors: true,
            ancestorIds: ancestorIds,
            maxAncestorDistance: maxDistance || 1
        }
    }, enrichFields);
};

/**
 * Clear cache
 */
Sharedo.UI.Framework.Services.FindByQueryService.prototype.clearCache = function() {
    var self = this;
    self.cache = {};
};

/**
 * Get user-friendly error message
 * @param {Object} xhr - XMLHttpRequest object
 * @param {String} error - Error string
 * @returns {String} Error message
 */
Sharedo.UI.Framework.Services.FindByQueryService.prototype.getErrorMessage = function(xhr, error) {
    if (xhr.status === 404) {
        return 'Search service not available';
    } else if (xhr.status === 401 || xhr.status === 403) {
        return 'You do not have permission to perform this search';
    } else if (xhr.status === 400) {
        return 'Invalid search criteria';
    } else if (xhr.status >= 500) {
        return 'Server error occurred. Please try again later';
    } else if (xhr.status === 0) {
        return 'Network error. Please check your connection';
    }
    
    return error || 'An error occurred during search';
};

/**
 * Create rate-limited search handler
 * @param {Function} searchFunction - Function to rate limit
 * @returns {Function} Rate-limited function
 */
Sharedo.UI.Framework.Services.FindByQueryService.prototype.createRateLimitedSearch = function(searchFunction) {
    var self = this;
    
    return _.debounce(searchFunction, self.options.rateLimitMs);
};

/**
 * Dispose and cleanup
 */
Sharedo.UI.Framework.Services.FindByQueryService.prototype.dispose = function() {
    var self = this;
    
    // Clear cache
    self.clearCache();
    
    // Dispose subscriptions
    _.each(self.subscriptions, function(sub) {
        if (typeof sub.dispose === 'function') {
            sub.dispose();
        }
    });
    
    self.subscriptions = [];
};

/**
 * Factory method to create service instance
 */
Sharedo.UI.Framework.Services.createFindByQueryService = function(options) {
    return new Sharedo.UI.Framework.Services.FindByQueryService(options);
};