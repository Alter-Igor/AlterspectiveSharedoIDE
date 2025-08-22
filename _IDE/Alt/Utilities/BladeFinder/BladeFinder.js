namespace("Alt.Utilities");

/**
 * BladeFinder - A searchable catalog of ShareDo blades with documentation
 * 
 * @param {HTMLElement} element - The HTML DOM Element to which this blade is bound
 * @param {Object} configuration - Configuration passed to the blade
 * @param {Object} stackModel - The base blade stack model
 */
Alt.Utilities.BladeFinder = function(element, configuration, stackModel) {
    var self = this;
    
    // Store references
    self.element = element;
    self.configuration = configuration || {};
    self.stackModel = stackModel;
    
    // Callback for blade selection
    self.onBladeSelected = configuration.onBladeSelected || null;
    
    // Observable properties
    self.searchQuery = ko.observable('');
    self.selectedCategory = ko.observable('');
    self.selectedBlade = ko.observable(null);
    self.isLoading = ko.observable(true);
    self.allPanels = ko.observableArray([]);
    self.availableCategories = ko.observableArray([]);
    
    // Filtered panels based on search and category
    self.filteredPanels = ko.computed(function() {
        var query = (self.searchQuery() || '').toLowerCase();
        var category = self.selectedCategory();
        var panels = self.allPanels();
        
        // Filter by search query
        if (query) {
            panels = panels.filter(function(panel) {
                return (panel.id && panel.id.toLowerCase().indexOf(query) !== -1) ||
                       (panel.title && panel.title.toLowerCase().indexOf(query) !== -1) ||
                       (panel.description && panel.description.toLowerCase().indexOf(query) !== -1) ||
                       (panel.category && panel.category.toLowerCase().indexOf(query) !== -1);
            });
        }
        
        // Filter by category
        if (category) {
            panels = panels.filter(function(panel) {
                return panel.category === category;
            });
        }
        
        // Sort by relevance (ID match first, then title, then description)
        if (query) {
            panels.sort(function(a, b) {
                var aIdMatch = a.id.toLowerCase().indexOf(query) === 0 ? 0 : 1;
                var bIdMatch = b.id.toLowerCase().indexOf(query) === 0 ? 0 : 1;
                if (aIdMatch !== bIdMatch) return aIdMatch - bIdMatch;
                
                var aTitleMatch = a.title && a.title.toLowerCase().indexOf(query) !== -1 ? 0 : 1;
                var bTitleMatch = b.title && b.title.toLowerCase().indexOf(query) !== -1 ? 0 : 1;
                if (aTitleMatch !== bTitleMatch) return aTitleMatch - bTitleMatch;
                
                return a.id.localeCompare(b.id);
            });
        }
        
        return panels;
    });
    
    // Result count
    self.resultCount = ko.computed(function() {
        var count = self.filteredPanels().length;
        var total = self.allPanels().length;
        if (self.searchQuery() || self.selectedCategory()) {
            return count + ' of ' + total + ' blades';
        }
        return total + ' blades available';
    });
};

/**
 * Load and bind the blade
 */
Alt.Utilities.BladeFinder.prototype.loadAndBind = function() {
    var self = this;
    
    // Load the blade catalog
    self.loadBladeCatalog();
    
    // Set initial search if provided
    if (self.configuration.initialSearch) {
        self.searchQuery(self.configuration.initialSearch);
    }
};

/**
 * Load the blade catalog
 */
Alt.Utilities.BladeFinder.prototype.loadBladeCatalog = function() {
    var self = this;
    
    // Try to load from external catalog file
    var catalogPath = '/_ideFiles/Alt/Utilities/BladeFinder/blade-catalog.json';
    
    // First try to load the full catalog if available
    if (window.$ajax) {
        $ajax.get(catalogPath).then(function(data) {
            self.processCatalogData(data);
        }).catch(function() {
            // Fallback to embedded catalog
            self.loadEmbeddedCatalog();
        });
    } else {
        // Use embedded catalog
        self.loadEmbeddedCatalog();
    }
};

/**
 * Load embedded catalog (subset of most common blades)
 */
Alt.Utilities.BladeFinder.prototype.loadEmbeddedCatalog = function() {
    var self = this;
    
    // Embedded catalog with most common ShareDo blades
    var embeddedCatalog = {
        panels: [
            // ODS/Participant Panels
            {
                id: "Sharedo.Core.Case.Panels.Ods.AddEditPerson",
                title: "Add/Edit Person",
                description: "Create or modify person entities in the ODS system",
                category: "Core > Case",
                subcategory: "ODS",
                configuration: { width: 650, hasScripts: true, hasTemplates: true }
            },
            {
                id: "Sharedo.Core.Case.Panels.Ods.AddEditOrganisation",
                title: "Add/Edit Organisation",
                description: "Create or modify organisation entities in the ODS system",
                category: "Core > Case",
                subcategory: "ODS",
                configuration: { width: 650, hasScripts: true, hasTemplates: true }
            },
            {
                id: "Sharedo.Core.Case.Panels.Ods.ViewEntity",
                title: "View Entity",
                description: "View entity details in read-only mode",
                category: "Core > Case",
                subcategory: "ODS",
                configuration: { width: 600, hasScripts: true, hasTemplates: true }
            },
            {
                id: "Sharedo.Core.Case.Panels.ParticipantsList",
                title: "Participants List",
                description: "View and manage case participants",
                category: "Core > Case",
                subcategory: "Participants",
                configuration: { width: 800, hasScripts: true, hasTemplates: true }
            },
            
            // Case Management
            {
                id: "Sharedo.Core.Case.Dashboard",
                title: "Case Dashboard",
                description: "Main case/matter dashboard with overview and actions",
                category: "Core > Case",
                subcategory: "Dashboard",
                configuration: { width: 900, hasScripts: true, hasTemplates: true }
            },
            {
                id: "Sharedo.Core.Case.ActiveMatterWorkflow",
                title: "Active Matter Workflow",
                description: "Manage workflow for active matters",
                category: "Core > Case",
                subcategory: "Workflow",
                configuration: { width: 850, hasScripts: true, hasTemplates: true }
            },
            
            // Document Management
            {
                id: "Sharedo.Core.Documents.CreateDocument",
                title: "Create Document",
                description: "Create new documents with templates",
                category: "Core > Documents",
                subcategory: "Creation",
                configuration: { width: 700, hasScripts: true, hasTemplates: true }
            },
            {
                id: "Sharedo.Core.Documents.DocumentViewer",
                title: "Document Viewer",
                description: "View and annotate documents",
                category: "Core > Documents",
                subcategory: "Viewer",
                configuration: { width: 900, hasScripts: true, hasTemplates: true }
            },
            
            // Tasks
            {
                id: "Sharedo.Core.Tasks.CreateTask",
                title: "Create Task",
                description: "Create new tasks with assignment and due dates",
                category: "Core > Tasks",
                subcategory: "Creation",
                configuration: { width: 600, hasScripts: true, hasTemplates: true }
            },
            {
                id: "Sharedo.Core.Tasks.TaskList",
                title: "Task List",
                description: "View and manage tasks",
                category: "Core > Tasks",
                subcategory: "Management",
                configuration: { width: 850, hasScripts: true, hasTemplates: true }
            },
            
            // Time Recording
            {
                id: "Sharedo.Core.TimeRecording.CreateTimeEntry",
                title: "Create Time Entry",
                description: "Record time entries for billing",
                category: "Core > Time",
                subcategory: "Recording",
                configuration: { width: 550, hasScripts: true, hasTemplates: true }
            },
            
            // Custom/Alt Blades
            {
                id: "Alt.Utilities.BladeBouncer",
                title: "Blade Bouncer",
                description: "Dynamic blade routing with configuration",
                category: "Alt > Utilities",
                subcategory: "Routing",
                configuration: { width: 650, hasScripts: true, hasTemplates: true }
            },
            {
                id: "Alt.AdviceManagement.AdvicePauseResumeBlade",
                title: "Advice Pause/Resume",
                description: "Manage advice workflow pause and resume",
                category: "Alt > Advice",
                subcategory: "Management",
                configuration: { width: 700, hasScripts: true, hasTemplates: true }
            }
        ]
    };
    
    self.processCatalogData(embeddedCatalog);
};

/**
 * Process catalog data
 */
Alt.Utilities.BladeFinder.prototype.processCatalogData = function(data) {
    var self = this;
    
    if (data && data.panels) {
        self.allPanels(data.panels);
        
        // Extract unique categories
        var categories = {};
        data.panels.forEach(function(panel) {
            if (panel.category) {
                categories[panel.category] = true;
            }
        });
        
        self.availableCategories(Object.keys(categories).sort());
    }
    
    self.isLoading(false);
};

/**
 * Select a blade
 */
Alt.Utilities.BladeFinder.prototype.selectBlade = function(blade) {
    var self = this;
    self.selectedBlade(blade);
};

/**
 * Use the selected blade
 */
Alt.Utilities.BladeFinder.prototype.useSelectedBlade = function() {
    var self = this;
    var blade = self.selectedBlade();
    
    if (blade) {
        // If callback provided, use it
        if (self.onBladeSelected && typeof self.onBladeSelected === 'function') {
            self.onBladeSelected(blade.id);
        }
        
        // Close this blade and return the selection
        if (window.$ui && window.$ui.stacks) {
            $ui.stacks.close(self, { 
                action: "Selected",
                bladeId: blade.id
            });
        }
    }
};

/**
 * Copy blade path to clipboard
 */
Alt.Utilities.BladeFinder.prototype.copyPath = function(blade) {
    var self = this;
    
    if (blade && blade.path) {
        self.copyToClipboard(blade.path);
    }
};

/**
 * Copy usage example to clipboard
 */
Alt.Utilities.BladeFinder.prototype.copyExample = function(blade) {
    var self = this;
    
    if (blade) {
        var example = '// JavaScript\n' +
                     '$ui.stacks.openPanel("' + blade.id + '", {\n' +
                     '    // Your configuration here\n' +
                     '});\n\n' +
                     '// BladeBouncer Configuration\n' +
                     '{\n' +
                     '    "targetBlade": "' + blade.id + '",\n' +
                     '    "configForTargetBlade": [\n' +
                     '        // Add configuration properties\n' +
                     '    ]\n' +
                     '}';
        
        self.copyToClipboard(example);
    }
};

/**
 * Copy text to clipboard
 */
Alt.Utilities.BladeFinder.prototype.copyToClipboard = function(text) {
    try {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        // Show feedback (you could add a toast notification here)
        console.log('Copied to clipboard:', text.substring(0, 50) + '...');
    } catch (e) {
        console.error('Failed to copy to clipboard:', e);
    }
};

/**
 * Clear search
 */
Alt.Utilities.BladeFinder.prototype.clearSearch = function() {
    var self = this;
    self.searchQuery('');
    self.selectedCategory('');
};

/**
 * Close the blade
 */
Alt.Utilities.BladeFinder.prototype.close = function() {
    var self = this;
    
    if (window.$ui && window.$ui.stacks) {
        $ui.stacks.close(self, { action: "Cancelled" });
    }
};

/**
 * Cleanup on destroy
 */
Alt.Utilities.BladeFinder.prototype.onDestroy = function() {
    var self = this;
    
    // Clean up references
    self.element = null;
    self.configuration = null;
    self.stackModel = null;
};