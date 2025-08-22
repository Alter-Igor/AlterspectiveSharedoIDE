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
        
        // Default mock data - some will match ODS data for testing
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
                firstName: "Igor",
                lastName: "Jericevich",
                email: "igor.j@alterspective.com", // Different email from ODS
                phone: "0445555666", // Same phone as ODS
                dateOfBirth: "1985-06-20",
                address: "301 Tech Park", // Slightly different address
                suburb: "Brisbane",
                postcode: "4001", // Different postcode
                source: "pms",
                odsType: "person"
            },
            {
                id: "PMS-P003",
                firstName: "Jane",
                lastName: "Doe",
                email: "jane.doe@example.com",
                phone: "0423456789",
                dateOfBirth: "1990-03-25",
                address: "456 Oak Ave",
                suburb: "Melbourne",
                postcode: "3000",
                source: "pms",
                odsType: "person"
            },
            {
                id: "PMS-P004",
                firstName: "Sarah",
                lastName: "Anderson",
                email: "sarah.anderson@lawfirm.com", // Same as ODS
                phone: "0412111223", // Slightly different
                dateOfBirth: "1982-04-15", // Same as ODS
                address: "100 Legal St",
                suburb: "Sydney",
                postcode: "2000",
                source: "pms",
                odsType: "person"
            },
            {
                id: "PMS-P005",
                firstName: "Robert",
                lastName: "Johnson",
                email: "r.johnson@lawfirm.com",
                phone: "0434567890",
                dateOfBirth: "1975-03-10",
                address: "789 Pine Rd",
                suburb: "Brisbane",
                postcode: "4000",
                source: "pms",
                odsType: "person"
            },
            {
                id: "PMS-P006",
                firstName: "Emily",
                lastName: "Williams",
                email: "emily.w@example.com",
                phone: "0445678901",
                dateOfBirth: "1990-11-25",
                address: "321 Elm St",
                suburb: "Perth",
                postcode: "6000",
                source: "pms",
                odsType: "person"
            },
            {
                id: "PMS-P007",
                firstName: "Michael",
                lastName: "Brown",
                email: "m.brown@business.com",
                phone: "0456789012",
                dateOfBirth: "1982-07-30",
                address: "654 Maple Dr",
                suburb: "Adelaide",
                postcode: "5000",
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
                name: "Legal Solutions Pty Ltd",
                tradingName: "Legal Solutions",
                abn: "11223344556", // Same ABN as ODS
                email: "enquiries@legalsolutions.com.au", // Different email
                phone: "0298887778", // Slightly different phone
                address: "456 Corporate Blvd",
                suburb: "Sydney",
                postcode: "2001",
                source: "pms",
                odsType: "organisation"
            },
            {
                id: "PMS-O003",
                name: "XYZ Corporation",
                tradingName: "XYZ Corp",
                abn: "98765432109",
                email: "info@xyzcorp.com",
                phone: "0387654321",
                address: "789 Business Park",
                suburb: "Sydney",
                postcode: "2000",
                source: "pms",
                odsType: "organisation"
            },
            {
                id: "PMS-O004",
                name: "Smith & Associates Law Firm",
                tradingName: "Smith Law",
                abn: "45678901234",
                email: "reception@smithlaw.com.au",
                phone: "0276543210",
                address: "100 Legal Plaza",
                suburb: "Brisbane",
                postcode: "4000",
                source: "pms",
                odsType: "organisation"
            },
            {
                id: "PMS-O005",
                name: "Global Consulting Group",
                tradingName: "GCG",
                abn: "56789012345",
                email: "contact@gcg.com.au",
                phone: "0865432109",
                address: "200 Consulting Tower",
                suburb: "Perth",
                postcode: "6000",
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
                        // Search in relevant fields based on type
                        if (type === "persons") {
                            return (
                                (item.firstName && item.firstName.toLowerCase().indexOf(searchTerm) > -1) ||
                                (item.lastName && item.lastName.toLowerCase().indexOf(searchTerm) > -1) ||
                                (item.email && item.email.toLowerCase().indexOf(searchTerm) > -1) ||
                                (item.phone && item.phone.indexOf(searchTerm) > -1)
                            );
                        } else {
                            return (
                                (item.name && item.name.toLowerCase().indexOf(searchTerm) > -1) ||
                                (item.tradingName && item.tradingName.toLowerCase().indexOf(searchTerm) > -1) ||
                                (item.abn && item.abn.indexOf(searchTerm) > -1) ||
                                (item.email && item.email.toLowerCase().indexOf(searchTerm) > -1)
                            );
                        }
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
    
    // Add/update mock data methods for testing
    self.addMockPerson = function(person) {
        person.id = "PMS-P" + (self.mockPersons.length + 1).toString().padStart(3, '0');
        person.source = "pms";
        person.odsType = "person";
        self.mockPersons.push(person);
        self.saveMockData();
        return person;
    };
    
    self.addMockOrganisation = function(organisation) {
        organisation.id = "PMS-O" + (self.mockOrganisations.length + 1).toString().padStart(3, '0');
        organisation.source = "pms";
        organisation.odsType = "organisation";
        self.mockOrganisations.push(organisation);
        self.saveMockData();
        return organisation;
    };
    
    self.clearMockData = function() {
        self.mockPersons = [];
        self.mockOrganisations = [];
        localStorage.removeItem('alt.unifiedSearch.mockPmsData');
    };
    
    // Initialize on creation
    self.initializeMockData();
};

// Create singleton instance
Alt.UnifiedDataSearch.Services.mockPmsService = new Alt.UnifiedDataSearch.Services.MockPmsService();