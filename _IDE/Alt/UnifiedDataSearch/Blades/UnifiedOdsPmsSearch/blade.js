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
        useMockPms: true, // Always use mock for PMS (no real PMS integration yet)
        pmsTimeout: 5000,
        allowAddNew: true,
        tryAutoAddParticipant: false,
        promptOnPmsAdd: true,
        conflictResolutionMode: "prompt" // "ignore", "prompt", "autoUpdate", "review"
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
    
    // Blade metadata
    self.blade = {
        title: ko.observable("Unified ODS/PMS Search"),
        subtitle: ko.observable("Search across ShareDo and Practice Management System"),
        ribbon: null
    };
    
    // Create ribbon bar
    self.blade.ribbon = self.createRibbonBar();
    
    // Build services
    self.buildServices();
};

// Create the ribbon for the blade
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.createRibbonBar = function() {
    var self = this;
    
    // Check if RibbonBar components are available
    if (!window.Components || !window.Components.Core || !window.Components.Core.RibbonBar) {
        console.warn("RibbonBar components not available");
        return null;
    }
    
    var ribbon = new Components.Core.RibbonBar.Ribbon({
        alignment: Components.Core.RibbonBar.RibbonAlignment.Right,
        style: Components.Core.RibbonBar.RibbonStyle.Dark,
        sectionTitles: false
    });
    
    // Create Actions section using createAddSection method
    var actions = ribbon.createAddSection("Actions", null, true);
    
    // Add buttons using createAddButton method
    if (self.options.mode === "select") {
        actions.createAddButton("Select", function() {
            if (self.selectedEntity()) {
                self.close(true);
            } else {
                alert("Please select an entity first");
            }
        }, "btn-primary", "fa-check");
    }
    
    if (self.options.allowAddNew) {
        actions.createAddButton("Add New", function() {
            self.openAddNewEntity();
        }, "btn-success", "fa-plus");
    }
    
    actions.createAddButton("Close", function() {
        self.close(false);
    }, "btn-default", "fa-times");
    
    return ribbon;
};

// Initialize services
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.buildServices = function() {
    var self = this;
    
    // Get service instances
    self.mockPmsService = Alt.UnifiedDataSearch.Services.mockPmsService;
    self.resultMergerService = Alt.UnifiedDataSearch.Services.resultMergerService;
    self.conflictDetectorService = Alt.UnifiedDataSearch.Services.conflictDetectorService;
    
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
            try {
                self.addParticipantService = new Sharedo.Core.Case.Participants.AddParticipantService(addConfig);
            } catch(e) {
                console.warn("Could not initialize AddParticipantService:", e);
            }
        }
    }
};

// Called by the UI framework when this blade is being unloaded - clean up
// any subscriptions or references here that would keep this instance alive
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.onDestroy = function() {
    var self = this;
    
    // Dispose of any computed observables to prevent memory leaks
    if (self.searchProgressPercent && self.searchProgressPercent.dispose) {
        self.searchProgressPercent.dispose();
    }
    if (self.searchProgressText && self.searchProgressText.dispose) {
        self.searchProgressText.dispose();
    }
    if (self.filteredResults && self.filteredResults.dispose) {
        self.filteredResults.dispose();
    }
    
    // Clean up any service references
    self.mockPmsService = null;
    self.resultMergerService = null;
    self.conflictDetectorService = null;
    self.addParticipantService = null;
};

// Lifecycle method - called after blade is loaded
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.loadAndBind = function() {
    var self = this;
    
    // Subscribe to search query changes
    self.searchQuery.subscribe(function(newValue) {
        if (newValue && newValue.length >= 2) {
            self.executeSearch();
        } else if (!newValue) {
            self.searchResults([]);
            self.hasSearched(false);
        }
    });
    
    // Subscribe to entity type changes
    self.searchEntityType.subscribe(function() {
        if (self.searchQuery() && self.hasSearched()) {
            self.executeSearch();
        }
    });
    
    // Load participant service if needed
    if (self.addParticipantService && self.addParticipantService.load) {
        try {
            self.addParticipantService.load();
        } catch(e) {
            console.warn("Could not load AddParticipantService:", e);
        }
    }
};

// Note: PMS provider check removed - always using mock PMS data
// In future, when real PMS integration is available, uncomment and update this method
/*
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.checkPmsProvider = function() {
    var self = this;
    // Implementation for checking real PMS provider would go here
};
*/

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
            self.odsResultCount((results && results.totalResults) || (results && results.length) || 0);
        })
        .fail(function(error) {
            self.odsSearchError(true);
            var errorMsg = "ShareDo search failed";
            if (error && error.responseText) {
                try {
                    var parsed = JSON.parse(error.responseText);
                    errorMsg += ": " + (parsed.message || parsed.error || "Unknown error");
                } catch(e) {
                    errorMsg += ": " + error.responseText;
                }
            }
            self.searchErrors.push(errorMsg);
        });
    
    // Execute PMS search with timeout
    var pmsPromise = self.searchPmsWithTimeout(query, page, self.options.pmsTimeout)
        .done(function(results) {
            self.pmsSearchComplete(true);
            self.pmsResultCount((results && results.totalResults) || 0);
        })
        .fail(function(error) {
            self.pmsSearchError(true);
            var errorMsg = error === "timeout" ? "PMS search timed out" : "PMS search failed";
            if (error && error.message) {
                errorMsg += ": " + error.message;
            }
            self.searchErrors.push(errorMsg);
        });
    
    // Wait for both to complete
    $.when(odsPromise, pmsPromise)
        .always(function(odsResponse, pmsResponse) {
            console.log("Search responses received:", { odsResponse: odsResponse, pmsResponse: pmsResponse });
            
            // Get results (handle both success and failure)
            var odsResults = null;
            var pmsResults = null;
            
            // Parse ODS response - when() wraps successful responses in array [data, status, xhr]
            if (odsResponse) {
                if (Array.isArray(odsResponse) && odsResponse.length > 0) {
                    // Success case - response is [data, status, xhr]
                    odsResults = odsResponse[0];
                } else if (odsResponse.results !== undefined) {
                    // Direct object with results
                    odsResults = odsResponse;
                } else {
                    // Might be the data directly
                    odsResults = odsResponse;
                }
            }
            
            // Parse PMS response
            if (pmsResponse) {
                if (Array.isArray(pmsResponse) && pmsResponse.length > 0) {
                    // Success case - response is [data, status, xhr]
                    pmsResults = pmsResponse[0];
                } else if (pmsResponse.results !== undefined) {
                    // Direct object with results
                    pmsResults = pmsResponse;
                } else {
                    // Might be the data directly
                    pmsResults = pmsResponse;
                }
            }
            
            // Ensure we have valid results structures
            odsResults = odsResults || { results: [] };
            pmsResults = pmsResults || { results: [] };
            
            console.log("Parsed results:", { odsResults: odsResults, pmsResults: pmsResults });
            
            // Merge results
            var merged = self.resultMergerService.mergeResults(odsResults, pmsResults);
            
            // Enrich results with display data
            if (self.resultMergerService.enrichResults) {
                merged = self.resultMergerService.enrichResults(merged);
            }
            
            console.log("Merged results:", merged);
            
            self.searchResults(merged);
            
            // Hide progress quickly to prevent flashing
            setTimeout(function() {
                self.isSearching(false);
            }, 300);
        });
};

// Search ODS - Always use real ShareDo API
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.searchOds = function(query, page) {
    var self = this;
    
    // Build search payload for ShareDo ODS _search endpoint
    var payload = {
        startPage: (page || 0) + 1,  // ShareDo uses 1-based pages
        endPage: (page || 0) + 1,
        rowsPerPage: self.options.rowsPerPage || 20,
        searchString: query || "",
        odsEntityTypes: [],
        availability: {
            isAvailable: null,
            isOutOfOffice: null,
            isNotAvailable: null
        },
        location: {
            postcode: null,
            range: 10
        },
        connection: {
            systemName: null,
            label: null,
            otherOdsIds: []
        },
        competencies: [],
        teams: [],
        roles: [],
        odsTypes: [],
        wallManagement: false
    };
    
    // Add entity type filter
    if (self.searchEntityType() === "person") {
        payload.odsEntityTypes = ["person"];
    } else if (self.searchEntityType() === "organisation") {
        payload.odsEntityTypes = ["organisation"];
    } else {
        // For "all", include both types
        payload.odsEntityTypes = ["person", "organisation"];
    }
    
    // Create a deferred to handle fallback
    var deferred = $.Deferred();
    
    // Try real API first using POST to _search endpoint
    var apiCall = window.$ajax && window.$ajax.post ? 
        $ajax.post("/api/ods/_search", payload) :
        $.ajax({
            url: "/api/ods/_search",
            method: "POST",
            data: JSON.stringify(payload),
            contentType: "application/json",
            dataType: "json"
        });
    
    apiCall
        .done(function(data) {
            console.log("ODS API raw response:", data);
            
            // Parse the ShareDo response format
            var results = [];
            
            // ShareDo returns data in rows property with result as JSON string
            if (data.rows && Array.isArray(data.rows)) {
                data.rows.forEach(function(row) {
                    try {
                        // Parse the JSON string in the result property
                        var entity = JSON.parse(row.result);
                        // Add the ID and entity type from the row
                        entity.id = entity.id || row.id;
                        entity.odsId = entity.id || row.id;
                        entity.odsEntityType = entity.odsEntityType || row.odsEntityType;
                        
                        // Extract contact details if they're in aspectData
                        if (entity.aspectData && entity.aspectData.ContactDetails) {
                            var contacts = entity.aspectData.ContactDetails;
                            // Find primary email
                            var emailContact = contacts.find(function(c) {
                                return c.contactTypeSystemName === "email" && c.isPrimary;
                            }) || contacts.find(function(c) {
                                return c.contactTypeSystemName === "email";
                            });
                            if (emailContact) {
                                entity.email = emailContact.contactValue;
                            }
                            
                            // Find primary phone
                            var phoneContact = contacts.find(function(c) {
                                return (c.contactTypeSystemName === "mobile" || c.contactTypeSystemName === "direct-line") && c.isPrimary;
                            }) || contacts.find(function(c) {
                                return c.contactTypeSystemName === "mobile";
                            }) || contacts.find(function(c) {
                                return c.contactTypeSystemName === "direct-line";
                            });
                            if (phoneContact) {
                                entity.phone = phoneContact.contactValue;
                            }
                        }
                        
                        // Extract location/address if available
                        if (entity.locations && entity.locations.length > 0) {
                            var location = entity.locations[0];
                            entity.address = location.addressLine1;
                            entity.suburb = location.town;
                            entity.postcode = location.postCode;
                            entity.state = location.county;
                            entity.country = location.country;
                        }
                        
                        results.push(entity);
                    } catch(e) {
                        console.error("Failed to parse ODS result row:", e, row);
                    }
                });
            } else if (data.results) {
                // Handle if results are already parsed
                results = data.results;
            } else if (Array.isArray(data)) {
                // Handle if data is directly an array
                results = data;
            }
            
            // Transform the response to match our expected format
            var transformed = {
                success: true,
                results: results,
                totalResults: data.totalRows || data.totalCount || results.length,
                page: page || 0,
                hasMore: data.totalPages ? (data.endPage < data.totalPages) : false,
                totalPages: data.totalPages || 1
            };
            
            console.log("ODS API transformed response:", transformed);
            deferred.resolve(transformed);
        })
        .fail(function(error) {
            console.warn("ODS API failed, falling back to mock data:", error);
            // Fallback to mock data
            self.getMockOdsData(query, page)
                .done(function(mockData) {
                    deferred.resolve(mockData);
                })
                .fail(function(mockError) {
                    deferred.reject(mockError);
                });
        });
    
    return deferred.promise();
};

// Get mock ODS data
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.getMockOdsData = function(query, page) {
    var self = this;
    var deferred = $.Deferred();
    
    // Mock ODS data
    var mockOdsPersons = [
        {
            id: "ODS-P001",
            odsId: "ODS-P001",
            odsType: "person",
            firstName: "Sarah",
            lastName: "Anderson",
            email: "sarah.anderson@lawfirm.com",
            phone: "0412111222",
            dateOfBirth: "1982-04-15",
            address: "100 Legal St",
            suburb: "Sydney",
            postcode: "2000"
        },
        {
            id: "ODS-P002",
            odsId: "ODS-P002",
            odsType: "person",
            firstName: "David",
            lastName: "Chen",
            email: "david.chen@example.com",
            phone: "0423333444",
            address: "200 Court Ave",
            suburb: "Melbourne",
            postcode: "3000"
        },
        {
            id: "ODS-P003",
            odsId: "ODS-P003",
            odsType: "person",
            firstName: "Maria",
            lastName: "Garcia",
            email: "m.garcia@business.com",
            phone: "0434444555"
        },
        {
            id: "ODS-P004",
            odsId: "ODS-P004",
            odsType: "person",
            firstName: "Igor",
            lastName: "Jericevich",
            email: "igor@alterspective.com",
            phone: "0445555666",
            address: "300 Tech Park",
            suburb: "Brisbane",
            postcode: "4000"
        }
    ];
    
    var mockOdsOrganisations = [
        {
            id: "ODS-O001",
            odsId: "ODS-O001",
            odsType: "organisation",
            name: "Legal Solutions Pty Ltd",
            organisationName: "Legal Solutions Pty Ltd",
            tradingName: "Legal Solutions",
            abn: "11223344556",
            email: "info@legalsolutions.com.au",
            phone: "0298887777"
        },
        {
            id: "ODS-O002",
            odsId: "ODS-O002",
            odsType: "organisation",
            name: "Corporate Advisory Services",
            organisationName: "Corporate Advisory Services",
            abn: "22334455667",
            email: "contact@cas.com.au"
        }
    ];
    
    // Simulate async delay
    setTimeout(function() {
        var results = [];
        var searchTerm = (query || "").toLowerCase();
        
        // Determine what to search
        var searchPersons = self.searchEntityType() === "all" || self.searchEntityType() === "person";
        var searchOrgs = self.searchEntityType() === "all" || self.searchEntityType() === "organisation";
        
        // Search persons
        if (searchPersons) {
            mockOdsPersons.forEach(function(person) {
                if (!searchTerm || 
                    (person.firstName && person.firstName.toLowerCase().indexOf(searchTerm) > -1) ||
                    (person.lastName && person.lastName.toLowerCase().indexOf(searchTerm) > -1) ||
                    (person.email && person.email.toLowerCase().indexOf(searchTerm) > -1)) {
                    results.push(person);
                }
            });
        }
        
        // Search organisations
        if (searchOrgs) {
            mockOdsOrganisations.forEach(function(org) {
                if (!searchTerm ||
                    (org.name && org.name.toLowerCase().indexOf(searchTerm) > -1) ||
                    (org.tradingName && org.tradingName.toLowerCase().indexOf(searchTerm) > -1) ||
                    (org.abn && org.abn.indexOf(searchTerm) > -1)) {
                    results.push(org);
                }
            });
        }
        
        // Paginate
        var pageSize = self.options.rowsPerPage;
        var startIndex = (page || 0) * pageSize;
        var paged = results.slice(startIndex, startIndex + pageSize);
        
        deferred.resolve({
            success: true,
            results: paged,
            totalResults: results.length,
            page: page || 0,
            hasMore: results.length > startIndex + pageSize
        });
    }, 200); // Simulate network delay
    
    return deferred.promise();
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

// Search PMS - Always use mock data (no real PMS integration available)
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.searchPms = function(query, page) {
    var self = this;
    
    // Determine entity type for mock search
    var type = "persons";
    if (self.searchEntityType() === "organisation") {
        type = "organisations";
    } else if (self.searchEntityType() === "all") {
        // For "all", search persons (in a real implementation, would search both)
        type = "persons";
    }
    
    // Always use mock PMS service
    return self.mockPmsService.search(type, query, page);
};

// Handle entity selection
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.selectEntity = function(entity) {
    var self = this;
    
    console.log("Entity selected:", entity);
    self.selectedEntity(entity);
    
    if (self.options.mode === "select") {
        // Just close and return the selected entity
        self.close(true); // Pass true to return result
    } else if (self.options.mode === "addParticipant") {
        // Handle based on source
        if (entity.source === "pms") {
            console.log("PMS entity selected, checking for auto-create settings...");
            // Check settings for action blade
            if (self.options.promptOnPmsAdd) {
                self.checkSettingsAndAddPmsEntity(entity);
            } else {
                // Default behavior: check settings first, which will auto-create if no action blade configured
                self.checkSettingsAndAddPmsEntity(entity);
            }
        } else if (entity.source === "matched" && entity.hasConflicts) {
            // Handle conflicts
            self.handleConflictedEntity(entity);
        } else {
            // Use standard participant service
            self.addAsParticipant(entity);
        }
    }
};

// Handle conflicted entity
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.handleConflictedEntity = function(entity) {
    var self = this;
    
    switch(self.options.conflictResolutionMode) {
        case "ignore":
            // Just add as participant using ODS data
            self.addAsParticipant(entity);
            break;
            
        case "autoUpdate":
            // Auto-resolve conflicts and update
            self.autoResolveConflicts(entity);
            break;
            
        case "review":
            // Open review blade
            self.openConflictReviewBlade(entity);
            break;
            
        case "prompt":
        default:
            // Show conflict prompt
            if (confirm("This entity has data differences between ShareDo and PMS.\n\nWould you like to review the differences?")) {
                self.openConflictReviewBlade(entity);
            } else {
                self.addAsParticipant(entity);
            }
            break;
    }
};

// Check settings and add PMS entity
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.checkSettingsAndAddPmsEntity = function(entity) {
    var self = this;
    
    // Check for configured action blade
    var settingName = entity.icon === "fa-user" ? 
        "alt.ods.person.external.search.actionBlade" : 
        "alt.ods.organisation.external.search.actionBlade";
    
    console.log("Checking for action blade setting:", settingName);
    
    var checkSetting = function() {
        if (window.$ajax && window.$ajax.get) {
            return $ajax.get("/api/v2/public/settings/" + settingName);
        } else {
            return $.ajax({
                url: "/api/v2/public/settings/" + settingName,
                method: "GET",
                dataType: "json"
            });
        }
    };
    
    checkSetting()
        .done(function(setting) {
            if (setting && setting.value) {
                console.log("Action blade configured:", setting.value);
                // Open configured blade
                self.openActionBlade(setting.value, entity);
            } else {
                console.log("No action blade configured, auto-creating in ODS...");
                // Auto-add to ODS
                self.importPmsEntity(entity);
            }
        })
        .fail(function(error) {
            console.log("Settings check failed, defaulting to auto-create:", error);
            // Default: auto-add
            self.importPmsEntity(entity);
        });
};

// Import PMS entity to ODS
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.importPmsEntity = function(entity) {
    var self = this;
    
    console.log("Importing PMS entity to ShareDo ODS:", entity);
    
    // Create ODS entity from PMS data
    var odsEntity = {
        odsType: entity.data.odsType || (entity.icon === "fa-user" ? "person" : "organisation"),
        firstName: entity.data.firstName,
        lastName: entity.data.lastName,
        name: entity.data.name,
        organisationName: entity.data.name,
        email: entity.data.email,
        phone: entity.data.phone,
        address: entity.data.address,
        suburb: entity.data.suburb,
        postcode: entity.data.postcode,
        state: entity.data.state,
        country: entity.data.country,
        abn: entity.data.abn,
        acn: entity.data.acn,
        tradingName: entity.data.tradingName,
        dateOfBirth: entity.data.dateOfBirth,
        reference: entity.pmsId || entity.data.id  // Store PMS ID in Reference field
    };
    
    // Remove null/undefined values
    Object.keys(odsEntity).forEach(function(key) {
        if (odsEntity[key] === null || odsEntity[key] === undefined) {
            delete odsEntity[key];
        }
    });
    
    // Import to ODS
    var importRequest = function() {
        var endpoint = "/api/ods/" + odsEntity.odsType;
        if (window.$ajax && window.$ajax.post) {
            return $ajax.post(endpoint, odsEntity);
        } else {
            return $.ajax({
                url: endpoint,
                method: "POST",
                data: JSON.stringify(odsEntity),
                contentType: "application/json",
                dataType: "json"
            });
        }
    };
    
    console.log("Creating ODS entity with data:", odsEntity);
    
    importRequest()
        .done(function(created) {
            console.log("Successfully created ODS entity:", created);
            
            // Update entity with ODS ID
            entity.odsId = created.id;
            entity.source = "sharedo";
            entity.data = created;
            
            // Add as participant
            self.addAsParticipant(entity);
        })
        .fail(function(error) {
            var errorMsg = "Failed to import entity";
            if (error && error.responseText) {
                try {
                    var parsed = JSON.parse(error.responseText);
                    errorMsg += ": " + (parsed.message || parsed.error || "Unknown error");
                } catch(e) {
                    errorMsg += ": " + error.responseText;
                }
            }
            alert(errorMsg);
        });
};

// Add entity as participant
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.addAsParticipant = function(entity) {
    var self = this;
    
    if (self.addParticipantService && self.addParticipantService.addParticipant) {
        var sharedoId = ko.unwrap(self.options.sharedoId) || ko.unwrap(self.options.addNewParticipantsToSharedoId);
        
        try {
            self.addParticipantService.addParticipant(sharedoId, entity);
        } catch(e) {
            console.error("Failed to add participant:", e);
            alert("Failed to add participant: " + e.message);
        }
    } else {
        // Fallback: direct API call
        var sharedoId = ko.unwrap(self.options.sharedoId) || ko.unwrap(self.options.addNewParticipantsToSharedoId);
        var participantData = {
            sharedoId: sharedoId,
            odsId: entity.odsId || entity.data.id,
            odsType: entity.data.odsType || (entity.icon === "fa-user" ? "person" : "organisation"),
            role: self.options.forRoleSystemName || "participant"
        };
        
        var addRequest = function() {
            if (window.$ajax && window.$ajax.post) {
                return $ajax.post("/api/v2/participants", participantData);
            } else {
                return $.ajax({
                    url: "/api/v2/participants",
                    method: "POST",
                    data: JSON.stringify(participantData),
                    contentType: "application/json",
                    dataType: "json"
                });
            }
        };
        
        addRequest()
            .done(function() {
                self.close();
            })
            .fail(function(error) {
                var errorMsg = "Failed to add participant";
                if (error && error.responseText) {
                    try {
                        var parsed = JSON.parse(error.responseText);
                        errorMsg += ": " + (parsed.message || parsed.error || "Unknown error");
                    } catch(e) {
                        errorMsg += ": " + error.responseText;
                    }
                }
                alert(errorMsg);
            });
        
        return;
    }
    
    self.close();
};

// Open add new entity blade
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.openAddNewEntity = function() {
    var self = this;
    
    // Determine which blade to open based on entity type filter
    var bladeName = null;
    var entityType = self.searchEntityType();
    
    if (entityType === "person" || entityType === "all") {
        bladeName = "Sharedo.Core.Ods.AddPersonBlade";
    } else if (entityType === "organisation") {
        bladeName = "Sharedo.Core.Ods.AddOrganisationBlade";
    }
    
    if (!bladeName) {
        alert("Please select an entity type to add");
        return;
    }
    
    var config = {
        sharedoId: self.options.sharedoId,
        addMode: true,
        onSuccess: function(newEntity) {
            // Refresh search if needed
            if (self.searchQuery()) {
                self.executeSearch();
            }
        }
    };
    
    if (window.$ui && window.$ui.stacks && window.$ui.stacks.openPanel) {
        $ui.stacks.openPanel(bladeName, config, function(result) {
            if (result && result.entity) {
                // If entity was created, select it
                var wrappedEntity = {
                    id: result.entity.id,
                    odsId: result.entity.id,
                    displayName: self.resultMergerService.getDisplayName(result.entity),
                    data: result.entity,
                    source: "sharedo",
                    icon: entityType === "person" ? "fa-user" : "fa-building"
                };
                
                if (self.options.mode === "addParticipant") {
                    self.addAsParticipant(wrappedEntity);
                } else {
                    self.selectedEntity(wrappedEntity);
                    self.close(true);
                }
            }
        });
    } else {
        console.error("Cannot open add new entity blade - $ui.stacks.openPanel not available");
    }
};

// Open action blade
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.openActionBlade = function(bladeName, entity) {
    var self = this;
    
    var config = {
        entity: entity,
        sharedoId: self.options.sharedoId,
        mode: "review"
    };
    
    if (window.$ui && window.$ui.stacks && window.$ui.stacks.openPanel) {
        $ui.stacks.openPanel(bladeName, config, function() {
            self.close();
        });
    } else {
        console.error("Cannot open blade - $ui.stacks.openPanel not available");
        // Fallback to import
        self.importPmsEntity(entity);
    }
};

// Open conflict review blade
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.openConflictReviewBlade = function(entity) {
    var self = this;
    
    // For now, just show an alert with conflicts
    // In production, this would open a proper conflict resolution blade
    var message = "Data conflicts detected:\n\n";
    
    if (entity.conflicts && entity.conflicts.length > 0) {
        entity.conflicts.forEach(function(conflict) {
            message += conflict.label + ":\n";
            message += "  ShareDo: " + conflict.odsValue + "\n";
            message += "  PMS: " + conflict.pmsValue + "\n\n";
        });
    }
    
    message += "\nWould you like to proceed with ShareDo values?";
    
    if (confirm(message)) {
        self.addAsParticipant(entity);
    }
};

// Auto-resolve conflicts
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.autoResolveConflicts = function(entity) {
    var self = this;
    
    // For auto-resolution, we'll prefer PMS values for non-critical fields
    // and ODS values for critical fields
    if (entity.conflicts && entity.conflicts.length > 0) {
        var updates = {};
        
        entity.conflicts.forEach(function(conflict) {
            // Analyze conflict and decide resolution
            var analysis = self.conflictDetectorService.analyzeConflicts([conflict]);
            
            if (analysis.severity === "low" || conflict.canAutoResolve) {
                // Use PMS value for low severity or auto-resolvable
                updates[conflict.field] = conflict.pmsValue;
            }
            // For high severity, keep ODS value (no update needed)
        });
        
        // If we have updates, apply them
        if (Object.keys(updates).length > 0) {
            // Update ODS entity
            console.log("Auto-resolving conflicts with updates:", updates);
        }
    }
    
    self.addAsParticipant(entity);
};


// Close blade
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.close = function(returnResult) {
    var self = this;
    
    // Prepare result to return
    var result = null;
    if (returnResult !== false && self.selectedEntity()) {
        result = {
            selectedEntity: self.selectedEntity(),
            source: self.selectedEntity().source,
            action: "selected"
        };
    }
    
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
    
    // Close the blade using the standard ShareDo pattern
    if (window.$ui && window.$ui.stacks) {
        if (returnResult === false) {
            // Cancel without returning result
            $ui.stacks.cancel(self);
        } else {
            // Close with result
            $ui.stacks.close(self, result);
        }
    } else if (self.stackModel && self.stackModel.close) {
        // Fallback to stackModel if $ui.stacks not available
        self.stackModel.close(result);
    }
};