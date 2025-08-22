# CLAUDE.md - UnifiedDataSearch Implementation Guide

## Overview
This guide provides complete instructions for implementing the UnifiedDataSearch module - a frontend-only solution for searching across ShareDo ODS and external PMS systems with NO backend changes required.

## CRITICAL REQUIREMENTS

### 🚫 NO Backend Changes
- **DO NOT** create new API endpoints
- **DO NOT** modify server code
- **DO NOT** change database schemas
- **ALL** code must be client-side JavaScript
- **USE ONLY** existing ShareDo APIs

### ✅ Must Follow ShareDo Patterns
- Use `namespace()` function, NOT ES6 modules
- Use Knockout.js observables, NOT plain JavaScript variables
- Use `$ui.events` for event publishing/subscribing
- Use `$ajax` or `$ajaxMutex` for API calls
- Follow existing file path patterns with `/_ideFiles/`

## Implementation Instructions

### Step 1: Create Directory Structure

Create the following directory structure under `_IDE/Alt/UnifiedDataSearch/`:

```
_IDE/Alt/UnifiedDataSearch/
├── SPECIFICATION.md (already exists)
├── IMPLEMENTATION_PLAN.md (already exists)
├── CLAUDE.md (this file)
├── Helpers/
│   └── namespace.js
├── Models/
│   ├── UnifiedSearchResult.js
│   └── DataConflict.js
├── Services/
│   ├── MockPmsService.js
│   ├── ResultMergerService.js
│   └── ConflictDetectorService.js
├── Blades/
│   └── UnifiedOdsPmsSearch/
│       ├── UnifiedOdsPmsSearchBlade.panel.json
│       ├── blade.html
│       ├── blade.js
│       └── blade.css
└── Widgets/
    └── UnifiedOdsEntityPicker/
        ├── UnifiedOdsEntityPicker.widget.json
        ├── widget.html
        ├── widget.js
        └── widget.css
```

### Step 2: Implement Namespace Helper

**File: `Helpers/namespace.js`**
```javascript
// Ensure namespace function exists
if (typeof namespace !== 'function') {
    window.namespace = function(ns) {
        var parts = ns.split('.');
        var parent = window;
        for (var i = 0; i < parts.length; i++) {
            if (typeof parent[parts[i]] === 'undefined') {
                parent[parts[i]] = {};
            }
            parent = parent[parts[i]];
        }
        return parent;
    };
}

// Create namespaces for this module
namespace("Alt.UnifiedDataSearch");
namespace("Alt.UnifiedDataSearch.Blades");
namespace("Alt.UnifiedDataSearch.Services");
namespace("Alt.UnifiedDataSearch.Widgets");
namespace("Alt.UnifiedDataSearch.Models");
```

### Step 3: Implement Mock PMS Service

**File: `Services/MockPmsService.js`**

This service provides mock PMS data for development/demonstration when no real PMS integration exists.

```javascript
namespace("Alt.UnifiedDataSearch.Services");

Alt.UnifiedDataSearch.Services.MockPmsService = function() {
    var self = this;
    
    // Initialize mock data from localStorage or defaults
    self.initializeMockData = function() {
        var stored = localStorage.getItem('alt.unifiedSearch.mockPmsData');
        if (stored) {
            try {
                var data = JSON.parse(stored);
                self.mockPersons = data.persons || [];
                self.mockOrganisations = data.organisations || [];
                return;
            } catch(e) {
                console.error("Failed to parse mock PMS data", e);
            }
        }
        
        // Default mock data
        self.mockPersons = [
            {
                id: "PMS-P001",
                firstName: "John",
                lastName: "Smith",
                email: "john.smith@example.com",
                phone: "0412345678",
                dateOfBirth: "1980-01-15",
                address: "123 Main St",
                suburb: "Sydney",
                postcode: "2000",
                source: "pms",
                odsType: "person"
            },
            {
                id: "PMS-P002",
                firstName: "Jane",
                lastName: "Doe",
                email: "jane.doe@example.com",
                phone: "0423456789",
                source: "pms",
                odsType: "person"
            },
            {
                id: "PMS-P003",
                firstName: "Robert",
                lastName: "Johnson",
                email: "r.johnson@lawfirm.com",
                phone: "0434567890",
                source: "pms",
                odsType: "person"
            }
        ];
        
        self.mockOrganisations = [
            {
                id: "PMS-O001",
                name: "ABC Legal Services",
                tradingName: "ABC Legal",
                abn: "12345678901",
                email: "contact@abclegal.com",
                phone: "0298765432",
                address: "456 Corporate Blvd",
                suburb: "Melbourne",
                postcode: "3000",
                source: "pms",
                odsType: "organisation"
            },
            {
                id: "PMS-O002",
                name: "XYZ Corporation",
                abn: "98765432109",
                email: "info@xyzcorp.com",
                source: "pms",
                odsType: "organisation"
            }
        ];
        
        self.saveMockData();
    };
    
    self.saveMockData = function() {
        var data = {
            persons: self.mockPersons,
            organisations: self.mockOrganisations,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('alt.unifiedSearch.mockPmsData', JSON.stringify(data));
    };
    
    self.search = function(type, query, page) {
        var deferred = $.Deferred();
        
        // Simulate network delay (300-700ms)
        var delay = 300 + Math.random() * 400;
        
        setTimeout(function() {
            try {
                var dataset = type === "persons" ? self.mockPersons : self.mockOrganisations;
                var results = [];
                
                if (query && query.trim()) {
                    var searchTerm = query.toLowerCase();
                    results = dataset.filter(function(item) {
                        var searchableText = JSON.stringify(item).toLowerCase();
                        return searchableText.indexOf(searchTerm) > -1;
                    });
                } else {
                    results = dataset;
                }
                
                // Paginate results
                var pageSize = 10;
                var startIndex = (page || 0) * pageSize;
                var paged = results.slice(startIndex, startIndex + pageSize);
                
                deferred.resolve({
                    success: true,
                    results: paged,
                    totalResults: results.length,
                    page: page || 0,
                    hasMore: results.length > startIndex + pageSize
                });
            } catch(e) {
                deferred.reject({
                    success: false,
                    error: e.message
                });
            }
        }, delay);
        
        return deferred.promise();
    };
    
    // Initialize on creation
    self.initializeMockData();
};

// Create singleton instance
Alt.UnifiedDataSearch.Services.mockPmsService = new Alt.UnifiedDataSearch.Services.MockPmsService();
```

### Step 4: Implement Result Merger Service

**File: `Services/ResultMergerService.js`**

```javascript
namespace("Alt.UnifiedDataSearch.Services");

Alt.UnifiedDataSearch.Services.ResultMergerService = function() {
    var self = this;
    
    self.mergeResults = function(odsResults, pmsResults) {
        var merged = [];
        var matchMap = {};
        
        // Process ODS results first
        if (odsResults && odsResults.results) {
            (odsResults.results || odsResults).forEach(function(item) {
                var key = self.generateMatchKey(item);
                var result = {
                    id: "merged-" + (merged.length + 1),
                    source: "sharedo",
                    odsId: item.id || item.odsId,
                    displayName: self.getDisplayName(item),
                    data: item,
                    matchKey: key,
                    icon: self.getIcon(item)
                };
                matchMap[key] = result;
                merged.push(result);
            });
        }
        
        // Process PMS results and find matches
        if (pmsResults && pmsResults.results) {
            pmsResults.results.forEach(function(item) {
                var key = self.generateMatchKey(item);
                
                if (matchMap[key]) {
                    // Found a match - update existing record
                    matchMap[key].source = "matched";
                    matchMap[key].pmsId = item.id;
                    matchMap[key].pmsData = item;
                    matchMap[key].hasConflicts = self.detectConflicts(matchMap[key].data, item);
                    matchMap[key].conflicts = self.getConflictDetails(matchMap[key].data, item);
                } else {
                    // PMS only record
                    merged.push({
                        id: "merged-" + (merged.length + 1),
                        source: "pms",
                        pmsId: item.id,
                        displayName: self.getDisplayName(item),
                        data: item,
                        matchKey: key,
                        icon: self.getIcon(item)
                    });
                }
            });
        }
        
        return merged;
    };
    
    self.generateMatchKey = function(item) {
        // Generate unique key for matching
        if (item.odsType === "person" || item.firstName || item.lastName) {
            var first = (item.firstName || "").toLowerCase().trim();
            var last = (item.lastName || "").toLowerCase().trim();
            var dob = item.dateOfBirth || "";
            return "person:" + first + ":" + last + ":" + dob;
        } else {
            var name = (item.name || item.organisationName || "").toLowerCase().trim();
            var abn = (item.abn || "").replace(/\s/g, "");
            return "org:" + name + ":" + abn;
        }
    };
    
    self.getDisplayName = function(item) {
        if (item.firstName || item.lastName) {
            return (item.firstName || "") + " " + (item.lastName || "");
        }
        return item.name || item.organisationName || item.tradingName || "Unknown";
    };
    
    self.getIcon = function(item) {
        if (item.odsType === "person" || item.firstName || item.lastName) {
            return "fa-user";
        }
        return "fa-building";
    };
    
    self.detectConflicts = function(odsData, pmsData) {
        var conflictFields = ['email', 'phone', 'address', 'postcode', 'suburb'];
        for (var i = 0; i < conflictFields.length; i++) {
            var field = conflictFields[i];
            if (odsData[field] && pmsData[field] && 
                odsData[field].toLowerCase() !== pmsData[field].toLowerCase()) {
                return true;
            }
        }
        return false;
    };
    
    self.getConflictDetails = function(odsData, pmsData) {
        var conflicts = [];
        var conflictFields = ['email', 'phone', 'address', 'postcode', 'suburb'];
        
        conflictFields.forEach(function(field) {
            if (odsData[field] && pmsData[field] && 
                odsData[field].toLowerCase() !== pmsData[field].toLowerCase()) {
                conflicts.push({
                    field: field,
                    odsValue: odsData[field],
                    pmsValue: pmsData[field]
                });
            }
        });
        
        return conflicts;
    };
};

// Create singleton instance
Alt.UnifiedDataSearch.Services.resultMergerService = new Alt.UnifiedDataSearch.Services.ResultMergerService();
```

### Step 5: Implement the Blade

**File: `Blades/UnifiedOdsPmsSearch/UnifiedOdsPmsSearchBlade.panel.json`**

```json
{
    "id": "Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch",
    "priority": 6000,
    "width": 750,
    "scripts": [
        "/_ideFiles/Alt/UnifiedDataSearch/Helpers/namespace.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/MockPmsService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/ResultMergerService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Blades/UnifiedOdsPmsSearch/blade.js"
    ],
    "styles": [
        "/_ideFiles/Alt/UnifiedDataSearch/Blades/UnifiedOdsPmsSearch/blade.css"
    ],
    "templates": [
        "/_ideFiles/Alt/UnifiedDataSearch/Blades/UnifiedOdsPmsSearch/blade.html"
    ],
    "components": [
        "Sharedo.UI.Framework.Components.RibbonBar"
    ]
}
```

**File: `Blades/UnifiedOdsPmsSearch/blade.js`**

```javascript
namespace("Alt.UnifiedDataSearch.Blades");

Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch = function(element, configuration, stackModel) {
    var self = this;
    
    // Store parameters
    self.element = element;
    self.configuration = configuration || {};
    self.stackModel = stackModel;
    
    // Configuration defaults
    var defaults = {
        rowsPerPage: 20,
        sharedoId: null,
        parentSharedoId: null,
        sharedoTypeSystemName: null,
        addNewParticipantsToSharedoId: null,
        mode: "addParticipant", // "select" or "addParticipant"
        entityTypes: ["person", "organisation"],
        useMockPms: true, // Default to mock
        pmsTimeout: 5000,
        allowAddNew: true,
        tryAutoAddParticipant: false
    };
    
    self.options = $.extend(defaults, configuration);
    
    // Initialize observables for search
    self.searchQuery = ko.observable("").extend({ rateLimit: 500 });
    self.isSearching = ko.observable(false);
    self.hasSearched = ko.observable(false);
    self.page = ko.observable(0);
    
    // Progress tracking observables
    self.odsSearchComplete = ko.observable(false);
    self.odsSearchError = ko.observable(false);
    self.odsResultCount = ko.observable(0);
    
    self.pmsSearchComplete = ko.observable(false);
    self.pmsSearchError = ko.observable(false);
    self.pmsResultCount = ko.observable(0);
    
    // Results
    self.searchResults = ko.observableArray([]);
    self.selectedEntity = ko.observable();
    self.searchErrors = ko.observableArray([]);
    
    // Entity type toggle
    self.searchEntityType = ko.observable("all"); // "all", "person", "organisation"
    
    // Computed observables
    self.searchProgressPercent = ko.computed(function() {
        var progress = 0;
        if (self.odsSearchComplete() || self.odsSearchError()) progress += 50;
        if (self.pmsSearchComplete() || self.pmsSearchError()) progress += 50;
        return progress;
    });
    
    self.searchProgressText = ko.computed(function() {
        if (!self.isSearching()) return "";
        if (self.searchProgressPercent() === 100) return "Search complete";
        if (self.searchProgressPercent() === 50) {
            return "Waiting for " + (self.odsSearchComplete() ? "PMS" : "ShareDo");
        }
        return "Searching both systems...";
    });
    
    self.filteredResults = ko.computed(function() {
        var results = self.searchResults();
        var entityType = self.searchEntityType();
        
        if (entityType === "all") return results;
        
        return results.filter(function(item) {
            if (entityType === "person") {
                return item.icon === "fa-user";
            } else {
                return item.icon === "fa-building";
            }
        });
    });
    
    // Create ribbon bar
    self.ribbon = self.createRibbonBar();
    
    // Blade metadata
    self.blade = {
        title: ko.observable("Unified ODS/PMS Search"),
        subtitle: ko.observable("Search across ShareDo and Practice Management System"),
        ribbon: self.ribbon
    };
    
    // Build services
    self.buildServices();
};

// Initialize services
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.buildServices = function() {
    var self = this;
    
    // Get service instances
    self.mockPmsService = Alt.UnifiedDataSearch.Services.mockPmsService;
    self.resultMergerService = Alt.UnifiedDataSearch.Services.resultMergerService;
    
    // Build participant service if in add mode
    if (self.options.mode === "addParticipant") {
        var addConfig = {
            sharedoId: self.options.sharedoId,
            parentSharedoId: self.options.parentSharedoId,
            addNewParticipantsToSharedoId: self.options.addNewParticipantsToSharedoId,
            sharedoTypeSystemName: self.options.sharedoTypeSystemName,
            tryAutoAddParticipant: self.options.tryAutoAddParticipant,
            selectedEntity: self.selectedEntity
        };
        
        // Check if participant service is available
        if (window.Sharedo && window.Sharedo.Core && window.Sharedo.Core.Case && 
            window.Sharedo.Core.Case.Participants && window.Sharedo.Core.Case.Participants.AddParticipantService) {
            self.addParticipantService = new Sharedo.Core.Case.Participants.AddParticipantService(addConfig);
        }
    }
};

// Lifecycle method - called after blade is loaded
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.loadAndBind = function() {
    var self = this;
    
    // Check PMS provider availability
    self.checkPmsProvider();
    
    // Subscribe to search query changes
    self.searchQuery.subscribe(function(newValue) {
        if (newValue && newValue.length >= 2) {
            self.executeSearch();
        } else if (!newValue) {
            self.searchResults([]);
            self.hasSearched(false);
        }
    });
    
    // Load participant service if needed
    if (self.addParticipantService && self.addParticipantService.load) {
        self.addParticipantService.load();
    }
};

// Check if PMS provider is available
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.checkPmsProvider = function() {
    var self = this;
    
    // Try to check if external search provider exists
    $ajax.get("/api/ods/externalSearch/providers")
        .done(function(providers) {
            self.pmsProviderAvailable = providers && providers.some(function(p) {
                return p.systemName === "pms";
            });
            
            if (!self.pmsProviderAvailable) {
                console.log("PMS provider not configured, using mock service");
                self.options.useMockPms = true;
            }
        })
        .fail(function() {
            console.log("Could not check PMS providers, using mock service");
            self.options.useMockPms = true;
        });
};

// Execute search
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.executeSearch = function() {
    var self = this;
    var query = self.searchQuery();
    var page = self.page();
    
    if (!query) return;
    
    // Reset status indicators
    self.isSearching(true);
    self.hasSearched(true);
    self.odsSearchComplete(false);
    self.odsSearchError(false);
    self.pmsSearchComplete(false);
    self.pmsSearchError(false);
    self.odsResultCount(0);
    self.pmsResultCount(0);
    self.searchErrors([]);
    
    // Execute ODS search
    var odsPromise = self.searchOds(query, page)
        .done(function(results) {
            self.odsSearchComplete(true);
            self.odsResultCount((results && results.totalResults) || 0);
        })
        .fail(function(error) {
            self.odsSearchError(true);
            self.searchErrors.push("ShareDo search failed: " + (error.responseText || "Unknown error"));
        });
    
    // Execute PMS search with timeout
    var pmsPromise = self.searchPmsWithTimeout(query, page, self.options.pmsTimeout)
        .done(function(results) {
            self.pmsSearchComplete(true);
            self.pmsResultCount((results && results.totalResults) || 0);
        })
        .fail(function(error) {
            self.pmsSearchError(true);
            self.searchErrors.push("PMS search failed: " + (error === "timeout" ? "Request timed out" : error));
        });
    
    // Wait for both to complete
    $.when(odsPromise, pmsPromise)
        .always(function(odsResponse, pmsResponse) {
            // Get results (handle both success and failure)
            var odsResults = (odsResponse && odsResponse[0]) || { results: [] };
            var pmsResults = (pmsResponse && pmsResponse[0]) || { results: [] };
            
            // Merge results
            var merged = self.resultMergerService.mergeResults(odsResults, pmsResults);
            self.searchResults(merged);
            
            // Hide progress after delay
            setTimeout(function() {
                self.isSearching(false);
            }, 1000);
        });
};

// Search ODS
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.searchOds = function(query, page) {
    var self = this;
    
    // Build search parameters
    var params = {
        q: query,
        page: page || 0,
        pageSize: self.options.rowsPerPage
    };
    
    // Add entity type filter if needed
    if (self.searchEntityType() !== "all") {
        params.entityTypes = [self.searchEntityType()];
    }
    
    return $ajax.get("/api/ods/search", params);
};

// Search PMS with timeout
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.searchPmsWithTimeout = function(query, page, timeout) {
    var self = this;
    var deferred = $.Deferred();
    var timeoutHandle;
    
    // Set timeout
    timeoutHandle = setTimeout(function() {
        deferred.reject("timeout");
    }, timeout);
    
    // Execute search
    self.searchPms(query, page)
        .done(function(results) {
            clearTimeout(timeoutHandle);
            deferred.resolve(results);
        })
        .fail(function(error) {
            clearTimeout(timeoutHandle);
            deferred.reject(error);
        });
    
    return deferred.promise();
};

// Search PMS
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.searchPms = function(query, page) {
    var self = this;
    
    // Determine entity type
    var type = "persons";
    if (self.searchEntityType() === "organisation") {
        type = "organisations";
    }
    
    // Use mock or real PMS
    if (self.options.useMockPms || !self.pmsProviderAvailable) {
        return self.mockPmsService.search(type, query, page);
    } else {
        return $ajax.get("/api/ods/externalSearch/providers/pms/" + type, {
            q: query,
            page: page || 0
        });
    }
};

// Handle entity selection
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.selectEntity = function(entity) {
    var self = this;
    
    self.selectedEntity(entity);
    
    if (self.options.mode === "select") {
        // Just close and return
        self.close();
    } else if (self.options.mode === "addParticipant") {
        // Handle based on source
        if (entity.source === "pms") {
            // Check settings for action blade
            self.checkSettingsAndAddPmsEntity(entity);
        } else {
            // Use standard participant service
            self.addAsParticipant(entity);
        }
    }
};

// Check settings and add PMS entity
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.checkSettingsAndAddPmsEntity = function(entity) {
    var self = this;
    
    // Check for configured action blade
    var settingName = entity.icon === "fa-user" ? 
        "alt.ods.person.external.search.actionBlade" : 
        "alt.ods.organisation.external.search.actionBlade";
    
    $ajax.get("/api/v2/public/settings/" + settingName)
        .done(function(setting) {
            if (setting && setting.value) {
                // Open configured blade
                self.openActionBlade(setting.value, entity);
            } else {
                // Auto-add to ODS
                self.importPmsEntity(entity);
            }
        })
        .fail(function() {
            // Default: auto-add
            self.importPmsEntity(entity);
        });
};

// Import PMS entity to ODS
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.importPmsEntity = function(entity) {
    var self = this;
    
    // Create ODS entity from PMS data
    var odsEntity = {
        odsType: entity.data.odsType || (entity.icon === "fa-user" ? "person" : "organisation"),
        firstName: entity.data.firstName,
        lastName: entity.data.lastName,
        name: entity.data.name,
        email: entity.data.email,
        phone: entity.data.phone,
        address: entity.data.address,
        suburb: entity.data.suburb,
        postcode: entity.data.postcode,
        abn: entity.data.abn
    };
    
    // Import to ODS
    $ajax.post("/api/ods/" + odsEntity.odsType, odsEntity)
        .done(function(created) {
            // Update entity with ODS ID
            entity.odsId = created.id;
            entity.source = "sharedo";
            
            // Add as participant
            self.addAsParticipant(entity);
        })
        .fail(function(error) {
            alert("Failed to import entity: " + (error.responseText || "Unknown error"));
        });
};

// Add entity as participant
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.addAsParticipant = function(entity) {
    var self = this;
    
    if (self.addParticipantService) {
        var sharedoId = ko.unwrap(self.options.sharedoId) || ko.unwrap(self.options.addNewParticipantsToSharedoId);
        self.addParticipantService.addParticipant(sharedoId, entity);
    }
    
    self.close();
};

// Open action blade
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.openActionBlade = function(bladeName, entity) {
    var self = this;
    
    var config = {
        entity: entity,
        sharedoId: self.options.sharedoId,
        mode: "review"
    };
    
    $ui.showBlade(bladeName, config, function() {
        self.close();
    });
};

// Create ribbon bar
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.createRibbonBar = function() {
    var self = this;
    
    if (!window.Components || !window.Components.Core || !window.Components.Core.RibbonBar) {
        return null;
    }
    
    var ribbon = new Components.Core.RibbonBar.Ribbon({
        alignment: Components.Core.RibbonBar.RibbonAlignment.Right,
        style: Components.Core.RibbonBar.RibbonStyle.Dark,
        sectionTitles: false
    });
    
    var actions = new Components.Core.RibbonBar.Section({ 
        useLargeButtons: true, 
        useFlatButtons: true 
    });
    
    actions.createAddButton("Close", function() {
        self.close();
    }, "btn-default", "fa-times");
    
    ribbon.add(actions);
    
    return ribbon;
};

// Close blade
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.close = function() {
    var self = this;
    
    // Publish events if entity was selected
    if (self.selectedEntity() && self.options.mode === "addParticipant") {
        // Publish custom event
        if (window.$ui && window.$ui.events && window.$ui.events.publish) {
            $ui.events.publish("Alt.UnifiedDataSearch.ParticipantAdded", {
                sharedoId: self.options.sharedoId,
                entity: self.selectedEntity(),
                source: self.selectedEntity().source
            });
            
            // Also publish standard ShareDo event for widget refresh
            $ui.events.publish("Sharedo.Core.Case.Participants.Updated", {
                sharedoId: self.options.sharedoId
            });
        }
    }
    
    // Close the blade
    if (self.stackModel && self.stackModel.close) {
        self.stackModel.close();
    }
};
```

### Step 6: Event Handling

Widgets that need to refresh when participants are added should subscribe to events:

```javascript
// In any widget that displays participants
if (window.$ui && window.$ui.events && window.$ui.events.subscribe) {
    // Subscribe to standard ShareDo event
    var subscriptionId = $ui.events.subscribe("Sharedo.Core.Case.Participants.Updated", 
        function(data) {
            if (data.sharedoId === self.sharedoId) {
                self.reload(); // Refresh widget data
            }
        }, self);
    
    // Also subscribe to our custom event for additional info
    var customSubscriptionId = $ui.events.subscribe("Alt.UnifiedDataSearch.ParticipantAdded",
        function(data) {
            if (data.sharedoId === self.sharedoId) {
                // Can check source: "sharedo", "pms", or "matched"
                console.log("Participant added from: " + data.source);
                self.reload();
            }
        }, self);
}
```

### Step 7: HTML Templates

**File: `Blades/UnifiedOdsPmsSearch/blade.html`**

```html
<div class="unified-search-blade">
    <!-- Search Progress Indicator -->
    <div class="search-progress-indicator" data-bind="visible: isSearching">
        <div class="search-systems">
            <!-- ShareDo ODS Status -->
            <div class="search-system" data-bind="css: { 'completed': odsSearchComplete, 'error': odsSearchError }">
                <div class="system-icon">
                    <i class="fa fa-database"></i>
                </div>
                <div class="system-name">ShareDo ODS</div>
                <div class="system-status">
                    <!-- ko if: !odsSearchComplete() && !odsSearchError() -->
                    <div class="spinner">
                        <i class="fa fa-spinner fa-spin"></i>
                    </div>
                    <!-- /ko -->
                    <!-- ko if: odsSearchComplete() -->
                    <div class="checkmark">
                        <i class="fa fa-check-circle"></i>
                    </div>
                    <span class="result-count" data-bind="text: odsResultCount() + ' results'"></span>
                    <!-- /ko -->
                    <!-- ko if: odsSearchError() -->
                    <div class="error-mark">
                        <i class="fa fa-exclamation-circle"></i>
                    </div>
                    <!-- /ko -->
                </div>
            </div>
            
            <!-- Connector -->
            <div class="connector">
                <div class="pulse-line"></div>
            </div>
            
            <!-- PMS Status -->
            <div class="search-system" data-bind="css: { 'completed': pmsSearchComplete, 'error': pmsSearchError }">
                <div class="system-icon">
                    <i class="fa fa-briefcase"></i>
                </div>
                <div class="system-name">PMS System</div>
                <div class="system-status">
                    <!-- ko if: !pmsSearchComplete() && !pmsSearchError() -->
                    <div class="spinner">
                        <i class="fa fa-spinner fa-spin"></i>
                    </div>
                    <!-- /ko -->
                    <!-- ko if: pmsSearchComplete() -->
                    <div class="checkmark">
                        <i class="fa fa-check-circle"></i>
                    </div>
                    <span class="result-count" data-bind="text: pmsResultCount() + ' results'"></span>
                    <!-- /ko -->
                    <!-- ko if: pmsSearchError() -->
                    <div class="error-mark">
                        <i class="fa fa-exclamation-circle"></i>
                    </div>
                    <span class="error-text">Timeout</span>
                    <!-- /ko -->
                </div>
            </div>
        </div>
        
        <!-- Progress Bar -->
        <div class="overall-progress">
            <div class="progress-bar">
                <div class="progress-fill" data-bind="style: { width: searchProgressPercent() + '%' }"></div>
            </div>
            <div class="progress-text" data-bind="text: searchProgressText"></div>
        </div>
    </div>
    
    <!-- Search Input -->
    <div class="search-header">
        <div class="search-input-group">
            <input type="text" 
                   class="form-control search-input" 
                   placeholder="Search for person or organisation..." 
                   data-bind="value: searchQuery, valueUpdate: 'input'" />
            <span class="search-icon">
                <i class="fa fa-search"></i>
            </span>
        </div>
        
        <!-- Entity Type Filter -->
        <div class="entity-type-filter">
            <label class="radio-inline">
                <input type="radio" value="all" data-bind="checked: searchEntityType" />
                All
            </label>
            <label class="radio-inline">
                <input type="radio" value="person" data-bind="checked: searchEntityType" />
                People
            </label>
            <label class="radio-inline">
                <input type="radio" value="organisation" data-bind="checked: searchEntityType" />
                Organisations
            </label>
        </div>
    </div>
    
    <!-- Error Messages -->
    <!-- ko if: searchErrors().length > 0 -->
    <div class="alert alert-warning">
        <!-- ko foreach: searchErrors -->
        <div data-bind="text: $data"></div>
        <!-- /ko -->
    </div>
    <!-- /ko -->
    
    <!-- Search Results -->
    <div class="search-results" data-bind="visible: hasSearched">
        <!-- ko if: filteredResults().length === 0 -->
        <div class="no-results">
            <i class="fa fa-search fa-3x"></i>
            <p>No results found</p>
        </div>
        <!-- /ko -->
        
        <!-- ko foreach: filteredResults -->
        <div class="result-card" data-bind="click: $parent.selectEntity, css: { 'has-conflicts': hasConflicts }">
            <div class="result-header">
                <i class="result-icon" data-bind="css: icon"></i>
                <span class="result-name" data-bind="text: displayName"></span>
                
                <!-- Source Badge -->
                <span class="source-badge" data-bind="css: 'source-' + source">
                    <!-- ko if: source === 'sharedo' -->
                    <i class="fa fa-database"></i> ShareDo
                    <!-- /ko -->
                    <!-- ko if: source === 'pms' -->
                    <i class="fa fa-briefcase"></i> PMS
                    <!-- /ko -->
                    <!-- ko if: source === 'matched' -->
                    <i class="fa fa-link"></i> Matched
                    <!-- /ko -->
                </span>
            </div>
            
            <div class="result-details">
                <!-- ko if: data.email -->
                <div class="detail-item">
                    <i class="fa fa-envelope"></i>
                    <span data-bind="text: data.email"></span>
                </div>
                <!-- /ko -->
                <!-- ko if: data.phone -->
                <div class="detail-item">
                    <i class="fa fa-phone"></i>
                    <span data-bind="text: data.phone"></span>
                </div>
                <!-- /ko -->
            </div>
            
            <!-- ko if: hasConflicts -->
            <div class="conflict-indicator">
                <i class="fa fa-exclamation-triangle"></i>
                Data differences detected
            </div>
            <!-- /ko -->
        </div>
        <!-- /ko -->
    </div>
</div>
```

### Step 8: CSS Styles

**File: `Blades/UnifiedOdsPmsSearch/blade.css`**

Create comprehensive styles as shown in the specification. Key styles include:
- `.search-progress-indicator` with gradient background
- `.search-system` cards with status indicators
- `.connector` with pulse animation
- `.result-card` with hover effects
- `.source-badge` with different colors for each source

## Testing Instructions

### 1. Test Mock PMS Service
```javascript
// In browser console
var service = Alt.UnifiedDataSearch.Services.mockPmsService;
service.search("persons", "john", 0).done(function(results) {
    console.log("Results:", results);
});
```

### 2. Test Blade Opening
```javascript
// CORRECT: Use $ui.stacks.openPanel (NOT $ui.showBlade which doesn't exist!)
$ui.stacks.openPanel("Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch", {
    sharedoId: "{{sharedoId}}",
    mode: "addParticipant",
    entityTypes: ["person", "organisation"], // What entity types to search
    useMockPms: true,  // Use mock PMS data
    useMockOds: true   // Use mock ODS data (when API not available)
});
```

### 3. Test Event Publishing
```javascript
// Subscribe to events in console
$ui.events.subscribe("Alt.UnifiedDataSearch.ParticipantAdded", function(data) {
    console.log("Participant added:", data);
});
```

## Troubleshooting

### Common Issues

1. **Namespace not defined**
   - Ensure namespace.js is loaded first in panel.json

2. **Mock data not appearing**
   - Check browser localStorage for `alt.unifiedSearch.mockPmsData`
   - Clear and reinitialize if corrupted

3. **Events not firing**
   - Verify `$ui.events` is available
   - Check subscription is active

4. **PMS timeout**
   - Adjust timeout in configuration
   - Check network tab for actual response times

## Configuration Options

### Blade Configuration
```javascript
{
    sharedoId: "WI-123",              // Work item ID
    mode: "addParticipant",           // or "select"
    useMockPms: true,                  // Use mock data
    pmsTimeout: 5000,                  // Timeout in ms
    entityTypes: ["person", "organisation"],
    rowsPerPage: 20
}
```

### Settings (via ShareDo settings API)
- `alt.ods.person.external.search.actionBlade` - Blade for person review
- `alt.ods.organisation.external.search.actionBlade` - Blade for org review
- `alt.ods.unified.search.conflictResolution` - How to handle conflicts

## Deployment Checklist

✅ Create all directory structure  
✅ Implement namespace helper  
✅ Create MockPmsService  
✅ Create ResultMergerService  
✅ Implement blade JavaScript  
✅ Create blade HTML template  
✅ Add CSS styles  
✅ Create panel.json configuration  
✅ Test mock service  
✅ Test blade opening  
✅ Test search functionality  
✅ Test event publishing  
✅ Verify widget refresh on participant add  

## Important Notes

1. **NO Backend Changes** - Everything is frontend JavaScript
2. **Use Mock for Demo** - Real PMS integration requires backend configuration
3. **Event Publishing** - Critical for widget refresh
4. **Error Handling** - Always include try-catch blocks
5. **Performance** - Use pagination for large result sets
6. **Knockout.js** - Use observables for all UI-bound data

## Next Steps

After implementation:
1. Test thoroughly with mock data
2. Configure real PMS provider if available
3. Customize action blades if needed
4. Add to work item UI configuration
5. Train users on unified search features