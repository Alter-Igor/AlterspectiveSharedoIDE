# ShareDo UI Framework Knowledge Base

## Overview
The ShareDo UI Framework is a comprehensive component-based UI system built on Knockout.js, jQuery, and Bootstrap. It provides a consistent architecture for building interactive web components, widgets, and forms within the ShareDo platform.

## Core Architecture

### 1. Namespace Structure
The framework uses two namespace patterns:

**Traditional JavaScript Pattern:**
```javascript
var Sharedo = Sharedo || {};
Sharedo.UI = Sharedo.UI || {};
Sharedo.UI.Framework = Sharedo.UI.Framework || {};
Sharedo.UI.Framework.Components = Sharedo.UI.Framework.Components || {};
Sharedo.UI.Framework.Widgets = Sharedo.UI.Framework.Widgets || {};
Sharedo.UI.Framework.Panels = Sharedo.UI.Framework.Panels || {};
```

**Modern Namespace Function Pattern:**
```javascript
namespace("Sharedo.UI.Framework.Components");
namespace("Sharedo.UI.Framework.Widgets");
namespace("Sharedo.UI.Framework.Panels");
```

### 2. Component Architecture Pattern
Every component follows a three-file structure:
- **component.js**: JavaScript ViewModel with Knockout observables
- **component.html**: HTML template with Knockout bindings
- **component.css**: Component-specific styles

### 3. Configuration-Driven Design
Components use JSON configuration files:
- `.component.json`: Component metadata and dependencies
- `.widget.json`: Widget configuration
- `.panel.json`: Panel/blade configuration

## Component Categories

### UI Components
Located in `_Content/Components/`

#### AutoComplete
Advanced search/selection control with multiple modes:
```javascript
var handler = new Sharedo.UI.Framework.Components.AutoCompleteHandler({
    mode: AUTOCOMPLETE_MODE.CHOOSE, // or SELECT
    onFind: function(searchValue, handler) {
        // Return AutoCompleteFindCard[] or Promise
        return [
            new AutoCompleteFindCard({
                key: "1",
                title: "Option 1",
                subtitle: "Description"
            })
        ];
    },
    choose: {
        onSelect: function(selectedCard, handler) {
            // Handle selection
        }
    }
});
```

**Key Features:**
- Two modes: CHOOSE (select and clear) and SELECT (persistent)
- Card-based results with templates
- Rate-limited search (500ms default)
- Keyboard navigation support
- Custom result templates

#### RibbonBar
Responsive action toolbar:
```javascript
self.ribbonBar = new Sharedo.UI.Framework.Components.RibbonBar({
    sections: [
        {
            title: "Actions",
            buttons: [
                {
                    text: "Save",
                    iconClass: "fa fa-save",
                    click: function() { /* action */ }
                }
            ]
        }
    ]
});
```

**Features:**
- Section-based organization
- Button types: regular, menu, mega-menu, dropdown
- Responsive overflow handling
- Template support for custom content

#### TreeSelectDropdown
Hierarchical data selector:
```javascript
new Sharedo.UI.Framework.Components.TreeSelectDropdown({
    selectionType: "single", // single, multiple, singleLeaf, multipleLeaf
    loadOptionsUrl: "/api/tree/load",
    searchOptionsUrl: "/api/tree/search",
    lazyLoadChildren: true,
    onSelect: function(selectedNode) { /* handle */ }
});
```

**Features:**
- Lazy loading of tree nodes
- Search with filtering
- Multiple selection modes
- Node templates

#### Other Components
- **Breadcrumbs**: Navigation path display
- **ColourPicker**: Color selection with jQuery Simple Color
- **ConfigurableSearch**: Extensible search interface
- **CoreUiNav**: Navigation container system
- **IconPicker**: Font Awesome icon selector
- **Map**: Interactive mapping component
- **MegaMenu**: Large dropdown menu system
- **OptionSetControl**: Multiple option selection
- **SaveableInput**: Input with save/cancel actions
- **SyntaxEditor**: ACE editor integration
- **Toggle**: Bootstrap toggle switch
- **UserProfile**: User presence and profile display
- **VersionInfo**: Version display component

### Widgets
Located in `_Content/Widgets/`

#### Widget Base Pattern
```javascript
Sharedo.UI.Framework.Widgets.WidgetName = function(element, configuration, baseModel) {
    var self = this;
    var defaults = {
        // Default configuration
    };
    var options = $.extend(defaults, configuration);
    
    // Widget implementation
    self.dispose = function() {
        // Cleanup subscriptions
    };
};
```

#### Available Widgets
- **DockedSidebarContainer**: Sidebar container management
- **HtmlContent**: Dynamic HTML content loader
- **SimpleIFrame**: IFrame wrapper widget
- **TitleBar**: Standard title bar with icon
- **TransparentTitleBar**: Transparent variant

### Panels (Blades)
Located in `_Content/Panels/`

#### Panel Pattern
```javascript
Sharedo.UI.Framework.Panels.PanelName = function(element, configuration, stackModel) {
    var self = this;
    var defaults = { /* default options */ };
    var options = $.extend(defaults, configuration);
    
    self.blade = {
        title: options.title,
        subtitle: options.subtitle,
        iconClass: options.iconClass,
        ribbon: self.createRibbonBar()
    };
    
    // Panel lifecycle methods
    self.loadAndBind = function() {
        // Initialize panel after DOM binding
    };
    
    self.onDestroy = function() {
        // Cleanup when panel is destroyed
    };
    
    self.cancel = function() {
        // Handle user cancellation
    };
};
```

**Panel Lifecycle Methods:**
- `loadAndBind()`: Called after panel is bound to DOM
- `onDestroy()`: Called when panel is being destroyed
- `cancel()`: Called when user cancels the panel

## Form Builder (Alpaca) Extensions

### Custom Field Types

#### UniqueTextField
Text field with uniqueness validation:
```javascript
Alpaca.Fields.UniqueTextField = Alpaca.Fields.TextField.extend({
    setup: function() {
        this.base();
        this.options.validationUrl = "/api/forms/formfield/{fieldName}/isUnique/{value}";
    }
});
```

#### SelectExtendedField
Enhanced select with icons and colors:
```javascript
{
    "type": "select",
    "options": {
        "showSelectedIcon": true,
        "showSelectedColour": true,
        "dataSource": [
            {
                "value": "1",
                "text": "Option 1",
                "icon": "fa fa-star",
                "colour": "#FF0000"
            }
        ]
    }
}
```

### Custom Alpaca Controls
- **currency**: Currency input with formatting
- **datetime-sharedo**: Enhanced datetime picker
- **decimal**: Decimal number input
- **header**: Section header display
- **icon-picker**: Icon selection field
- **integer**: Integer number input
- **label**: Display-only label field
- **memo**: Multi-line text area
- **ods-entity-picker**: Entity selection
- **participant-picker**: User/participant selection
- **percentage**: Percentage input
- **toggle**: Toggle switch field
- **tree-selector**: Tree-based selection

### Layout Templates
- **simple**: Basic vertical layout
- **two-column**: Two column layout
- **four-column**: Four column layout
- **horizontal/vertical**: Orientation variants

## Knockout.js Custom Bindings

### Available Bindings

#### rejectLocalBlur
Prevents blur when clicking within container:
```html
<div data-bind="rejectLocalBlur: { onBlur: handleBlur }">
    <!-- Content that shouldn't trigger blur internally -->
</div>
```

#### toggleSwitch
Bootstrap toggle integration:
```html
<input type="checkbox" data-bind="toggleSwitch: isEnabled, 
    toggleOptions: { on: 'Yes', off: 'No', size: 'small' }" />
```

#### telephoneNumber
International phone input:
```html
<input data-bind="telephoneNumber: phoneNumber, 
    telephoneOptions: { modelName: 'phoneModel', defaultCountry: 'GB' }" />
```

#### uiCaptureWheel
Captures mouse wheel events:
```html
<div data-bind="uiCaptureWheel: true">
    <!-- Scrollable content -->
</div>
```

#### uiScrollIntoViewIfNeeded
Auto-scrolls element into view:
```html
<div data-bind="uiScrollIntoViewIfNeeded: shouldScroll">
    <!-- Content -->
</div>
```

#### uiToggle
Toggle visibility with animation:
```html
<div data-bind="uiToggle: isVisible">
    <!-- Toggleable content -->
</div>
```

#### icon
FontAwesome icon picker binding:
```html
<input data-bind="icon: selectedIcon, iconOptions: { dropdown: true, search: true }" />
```

#### colour
Color picker with CSS variable support:
```html
<input data-bind="colour: selectedColor, colourOptions: { allowCssVariables: true }" />
```

## CSS Framework and Conventions

### Class Naming Patterns
- Component prefix: `.component-name-*`
- State modifiers: `.selected`, `.disabled`, `.active`, `.highlight`, `.error`
- Size variants: `.large`, `.small`, `.compact`
- Theme variants: `.inverse`, `.primary`, `.secondary`
- Component-scoped: `.ui-auto-tree`, `.auto-complete-results`
- Hierarchical indentation: 16px per level for tree structures

### Layout Classes
```css
.flex-row { display: flex; flex-direction: row; }
.flex-column { display: flex; flex-direction: column; }
.column-fit { flex: 0 0 auto; }
.column-auto { flex: 1 1 auto; }
.fill-height { height: 100%; }
.fill-width { width: 100%; }
```

### Component-Specific Patterns
```css
/* AutoComplete */
.auto-complete-container { }
.auto-complete-results { }
.auto-complete-result-card { }

/* RibbonBar */
.ribbon-bar { }
.ribbon-bar-section { }
.ribbon-bar-button { }

/* TreeSelect */
.tree-select-dropdown { }
.tree-select-node { }
.tree-select-leaf { }
```

## Data Integration Patterns

### Component Data Flow
Components in the ShareDo UI Framework follow an event-driven, observable-based architecture:

```javascript
// Components receive data via parameters
var component = new Sharedo.UI.Framework.Components.ComponentName({
    data: observableData,
    onUpdate: function(newValue) {
        // Handle data changes
    }
});

// Components emit events for parent handling
component.onSelect = function(selectedItem) {
    // Parent handles selection
};
```

### ShareDo Platform Integration
```javascript
// Components integrate with ShareDo through property parsing
this._parseSharedoProperties = function() {
    // Parse platform-specific configuration
};
```

### Common API Endpoints (Used by Parent Controllers)
- `/api/forms/formfield/{fieldName}/isUnique/{value}` - Field uniqueness
- `/api/tree/load` - Tree node loading
- `/api/tree/search` - Tree search
- `/api/entity/search` - Entity search
- `/api/participant/search` - Participant search
- `/api/v1/public/workItem/findByQuery` - Advanced work item search

**Note:** Components themselves don't make direct API calls. They receive data through observables and emit events for parent controllers to handle.

### ShareDo FindByQuery API Integration

The FindByQuery API is ShareDo's primary search interface for work items, providing powerful querying capabilities:

#### Endpoint Structure
```javascript
POST /api/v1/public/workItem/findByQuery
Content-Type: application/json
```

#### Request Model
```javascript
{
    search: {
        // Pagination
        page: { page: 1, rowsPerPage: 20 },
        
        // Sorting
        sort: { direction: "ascending", orderBy: "title" },
        
        // Basic search
        title: "search term",
        reference: "REF.001",
        externalReference: "EXT.001",
        workItemIds: ["guid1", "guid2"],
        
        // Free text search
        freeText: {
            input: "search text",
            wildcardStart: true,
            wildCardEnd: true
        },
        
        // Phase filtering
        phase: {
            includeOpen: true,
            includeClosed: false,
            includeRemoved: false,
            searchPhaseName: "active"
        },
        
        // Type filtering
        types: {
            includeTypes: ["task-appointment"],
            includeTypesDerivedFrom: ["instruction"],
            searchCategoryName: "Medical"
        },
        
        // Date filtering
        dates: {
            due: { from: "2024-01-01", to: "2024-12-31" },
            created: { from: "2024-01-01", to: "2024-12-31" },
            updated: { from: "2024-01-01", to: "2024-12-31" }
        },
        
        // Role filtering
        roles: [{
            role: "client",
            subjectIdsHoldingRole: ["subject-guid"]
        }],
        
        // Custom attributes
        attributes: [{
            key: "customField",
            selectedValues: ["value1", "value2"]
        }],
        
        // Tags
        tags: ["tag1", "tag2"]
    },
    
    // Field enrichment (specify fields to return)
    enrich: [
        { path: "title" },
        { path: "reference" },
        { path: "roles.client.ods.name" }  // Nested field access
    ]
}
```

#### Response Model
```javascript
{
    totalCount: 100,        // Total matching records
    tookMs: 59,            // Query execution time
    results: [
        {
            score: 267.55,  // Relevance score
            id: "work-item-guid",
            data: {
                // Only enriched fields are returned
                title: "Work Item Title",
                reference: "REF.001"
            }
        }
    ]
}
```

#### Integration Pattern for UI Components
```javascript
// In a parent controller or service
Sharedo.UI.Framework.Services.WorkItemSearch = function() {
    var self = this;
    
    self.search = function(criteria, enrichFields) {
        var request = {
            search: criteria,
            enrich: enrichFields.map(f => ({ path: f }))
        };
        
        return $.ajax({
            url: '/api/v1/public/workItem/findByQuery',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(request)
        }).done(function(response) {
            // Transform results for UI components
            return response.results.map(r => ({
                id: r.id,
                score: r.score,
                ...r.data
            }));
        });
    };
};

// Using with AutoComplete component
var autoComplete = new Sharedo.UI.Framework.Components.AutoCompleteHandler({
    onFind: function(searchValue, handler) {
        var searchService = new Sharedo.UI.Framework.Services.WorkItemSearch();
        return searchService.search(
            { freeText: { input: searchValue, wildcardStart: true, wildCardEnd: true } },
            ['title', 'reference', 'type']
        ).then(function(results) {
            return results.map(r => new AutoCompleteFindCard({
                key: r.id,
                title: r.title,
                subtitle: r.reference
            }));
        });
    }
});
```

#### Key Features for UI Integration
- **Field Enrichment**: Only request fields needed by UI components (performance optimization)
- **Security Trimming**: Results automatically filtered by user permissions
- **Relevance Scoring**: Use scores to order search results in UI
- **Flexible Filtering**: Combine multiple criteria for advanced searches
- **Pagination Support**: Built-in support for paginated UI components

#### Best Practices for FindByQuery Integration

1. **Performance Optimization**
```javascript
// Good: Only request needed fields
enrich: [
    { path: "title" },
    { path: "reference" }
]

// Avoid: Requesting unnecessary nested data
enrich: [
    { path: "roles" },  // Returns entire roles object
    { path: "attributes" }  // Returns all attributes
]
```

2. **Error Handling**
```javascript
self.search = function(criteria, enrichFields) {
    return $.ajax({
        url: '/api/v1/public/workItem/findByQuery',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ search: criteria, enrich: enrichFields })
    }).done(function(response) {
        // Handle success
        return response;
    }).fail(function(xhr, status, error) {
        // Handle errors gracefully
        console.error('FindByQuery failed:', error);
        // Show user-friendly message
        self.showError('Search failed. Please try again.');
        return { totalCount: 0, results: [] };
    });
};
```

3. **Caching Strategy**
```javascript
Sharedo.UI.Framework.Services.CachedWorkItemSearch = function() {
    var self = this;
    var cache = {};
    var cacheTimeout = 60000; // 1 minute
    
    self.search = function(criteria, enrichFields) {
        var cacheKey = JSON.stringify({ criteria, enrichFields });
        var cached = cache[cacheKey];
        
        if (cached && (Date.now() - cached.timestamp < cacheTimeout)) {
            return $.Deferred().resolve(cached.data);
        }
        
        return $.ajax({
            url: '/api/v1/public/workItem/findByQuery',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ search: criteria, enrich: enrichFields })
        }).done(function(response) {
            cache[cacheKey] = {
                data: response,
                timestamp: Date.now()
            };
            return response;
        });
    };
};
```

4. **Rate Limiting for User Input**
```javascript
// Use with AutoComplete or search inputs
var searchHandler = ko.observable('').extend({ 
    rateLimit: { timeout: 500, method: "notifyWhenChangesStop" }
});

searchHandler.subscribe(function(searchValue) {
    if (searchValue.length >= 3) {  // Minimum search length
        self.performSearch(searchValue);
    }
});
```

## Best Practices

### 1. Component Development
- Always provide sensible defaults
- Implement dispose() for cleanup
- Use ko.pureComputed for expensive operations
- Rate-limit user inputs (typically 500ms)
- Handle both sync and async data sources

### 2. Memory Management
```javascript
// Track subscriptions
self.subscriptions = [];
self.subscriptions.push(observable.subscribe(handler));

// Dispose pattern
self.dispose = function() {
    // Dispose all subscriptions
    self.subscriptions.forEach(function(sub) {
        if (typeof sub.dispose === 'function') {
            sub.dispose();
        }
    });
    
    // Dispose nested models
    if (self.model && self.model.dispose) {
        self.model.dispose();
    }
    
    // Additional cleanup
};

// Alternative pattern using lodash
Sharedo.UI.Framework.Components.ComponentName.prototype.dispose = function() {
    var self = this;
    _.each(self.subscriptions, function(s) {
        if (typeof s.dispose === "function") {
            s.dispose();
        }
    });
};
```

### 3. Template Organization
- External files for complex templates
- Inline templates for simple components
- Use Knockout comment syntax for conditionals
- Leverage template composition

### 4. Error Handling
```javascript
try {
    // Component logic
} catch (error) {
    console.error('Component error:', error);
    // Graceful fallback
}
```

### 5. Performance Optimization
- Use throttle/debounce for expensive operations
- Implement virtual scrolling for large lists
- Lazy load data when possible
- Cache computed values

## Integration with ShareDo Platform

### 1. Widget Registration
```javascript
Sharedo.UI.Framework.registerWidget({
    name: 'CustomWidget',
    constructor: Sharedo.UI.Framework.Widgets.CustomWidget,
    template: 'path/to/template.html',
    styles: ['path/to/styles.css']
});
```

### 2. Panel Registration
```javascript
Sharedo.UI.Framework.registerPanel({
    name: 'CustomPanel',
    constructor: Sharedo.UI.Framework.Panels.CustomPanel,
    blade: true,
    modal: false
});
```

### 3. Component Registration
```javascript
ko.components.register('custom-component', {
    viewModel: Sharedo.UI.Framework.Components.CustomComponent,
    template: { element: 'custom-component-template' }
});
```

## Framework Dependencies

### Core Libraries
- **jQuery**: 3.x (DOM manipulation, AJAX)
- **Knockout.js**: 3.x (MVVM data binding)
- **Bootstrap**: 3.x (CSS framework)
- **Font Awesome**: 4.x (Icons)

### Plugin Libraries
- **ACE Editor**: Code editing
- **Chosen.js**: Enhanced selects
- **Alpaca**: Form builder
- **Handlebars**: Templating
- **vanillaTextMask**: Input masking

## Common Usage Patterns

### 1. Integrating FindByQuery with UI Components

#### With TreeSelectDropdown
```javascript
// Custom tree data provider using FindByQuery
Sharedo.UI.Framework.Components.WorkItemTreeProvider = function() {
    var self = this;
    
    self.loadChildren = function(parentId) {
        var request = {
            search: {
                graph: {
                    includeAncestors: false,
                    ancestorIds: [parentId],
                    maxAncestorDistance: 1
                }
            },
            enrich: [
                { path: "title" },
                { path: "reference" },
                { path: "type" },
                { path: "hasChildren" }
            ]
        };
        
        return $.ajax({
            url: '/api/v1/public/workItem/findByQuery',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(request)
        });
    };
};

// Use with TreeSelectDropdown
var treeSelect = new Sharedo.UI.Framework.Components.TreeSelectDropdown({
    loadOptionsUrl: function(node) {
        var provider = new Sharedo.UI.Framework.Components.WorkItemTreeProvider();
        return provider.loadChildren(node.id);
    },
    selectionType: "single",
    onSelect: function(selectedNode) {
        console.log("Selected work item:", selectedNode);
    }
});
```

#### With ConfigurableSearch
```javascript
// Advanced search using FindByQuery
Sharedo.UI.Framework.Components.WorkItemSearch = function(params) {
    var self = this;
    var defaults = {
        searchableFields: ['title', 'reference', 'externalReference'],
        filterableTypes: ['task', 'instruction', 'appointment'],
        dateFields: ['due', 'created', 'updated']
    };
    var options = $.extend(defaults, params);
    
    self.buildSearchRequest = function(userInput) {
        var request = {
            search: {},
            enrich: [
                { path: "title" },
                { path: "reference" },
                { path: "type" },
                { path: "phase.name" },
                { path: "due" }
            ]
        };
        
        // Build dynamic search criteria
        if (userInput.searchText) {
            request.search.freeText = {
                input: userInput.searchText,
                wildcardStart: true,
                wildCardEnd: true
            };
        }
        
        if (userInput.types && userInput.types.length > 0) {
            request.search.types = {
                includeTypes: userInput.types
            };
        }
        
        if (userInput.dateRange) {
            request.search.dates = {
                [userInput.dateField]: {
                    from: userInput.dateRange.from,
                    to: userInput.dateRange.to
                }
            };
        }
        
        // Pagination
        request.search.page = {
            page: userInput.page || 1,
            rowsPerPage: userInput.pageSize || 20
        };
        
        // Sorting
        if (userInput.sortBy) {
            request.search.sort = {
                orderBy: userInput.sortBy,
                direction: userInput.sortDirection || "ascending"
            };
        }
        
        return request;
    };
    
    self.executeSearch = function(userInput) {
        var request = self.buildSearchRequest(userInput);
        
        return $.ajax({
            url: '/api/v1/public/workItem/findByQuery',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(request)
        }).done(function(response) {
            // Transform for UI display
            return {
                total: response.totalCount,
                executionTime: response.tookMs,
                items: response.results.map(r => ({
                    id: r.id,
                    relevance: r.score,
                    ...r.data
                }))
            };
        });
    };
};
```

#### With RibbonBar Actions
```javascript
// RibbonBar with FindByQuery-powered actions
self.ribbonBar = new Sharedo.UI.Framework.Components.RibbonBar({
    sections: [
        {
            title: "Quick Filters",
            buttons: [
                {
                    text: "My Open Items",
                    iconClass: "fa fa-user",
                    click: function() {
                        self.searchService.executeSearch({
                            search: {
                                ownership: {
                                    myScope: {
                                        primary: true
                                    }
                                },
                                phase: {
                                    includeOpen: true,
                                    includeClosed: false
                                }
                            },
                            enrich: ["title", "reference", "due"]
                        }).done(self.displayResults);
                    }
                },
                {
                    text: "Due Today",
                    iconClass: "fa fa-calendar",
                    click: function() {
                        var today = new Date().toISOString().split('T')[0];
                        self.searchService.executeSearch({
                            search: {
                                dates: {
                                    due: {
                                        from: today + " 00:00",
                                        to: today + " 23:59"
                                    }
                                }
                            },
                            enrich: ["title", "reference", "due", "priority"]
                        }).done(self.displayResults);
                    }
                }
            ]
        }
    ]
});
```

### 2. Creating a Simple Component
```javascript
// Define component
Sharedo.UI.Framework.Components.MyComponent = function(params) {
    var self = this;
    var defaults = {
        title: 'Default Title',
        showIcon: true
    };
    var options = $.extend(defaults, params);
    
    // Observables
    self.title = ko.observable(options.title);
    self.isVisible = ko.observable(true);
    
    // Computed
    self.displayTitle = ko.pureComputed(function() {
        return self.title().toUpperCase();
    });
    
    // Methods
    self.toggle = function() {
        self.isVisible(!self.isVisible());
    };
};

// Register with Knockout
ko.components.register('my-component', {
    viewModel: Sharedo.UI.Framework.Components.MyComponent,
    template: '<div data-bind="visible: isVisible, text: displayTitle"></div>'
});
```

### 2. Creating a Widget
```javascript
Sharedo.UI.Framework.Widgets.MyWidget = function(element, configuration, baseModel) {
    var self = this;
    var $element = $(element);
    
    // Initialize
    var defaults = { autoLoad: true };
    var options = $.extend(defaults, configuration);
    
    // Widget logic
    if (options.autoLoad) {
        self.loadContent();
    }
    
    self.loadContent = function() {
        $.get(options.contentUrl).done(function(html) {
            $element.html(html);
        });
    };
    
    // Cleanup
    self.dispose = function() {
        $element.empty();
    };
};
```

### 3. Extending Alpaca Field
```javascript
Alpaca.Fields.CustomField = Alpaca.Fields.TextField.extend({
    getFieldType: function() {
        return "custom";
    },
    
    setup: function() {
        this.base();
        this._parseSharedoProperties(); // ShareDo-specific pattern
        // Custom setup
    },
    
    getValue: function() {
        var value = this.base();
        // Custom processing
        return value;
    },
    
    setValue: function(value) {
        // Custom processing
        this.base(value);
    }
});

Alpaca.registerFieldClass("custom", Alpaca.Fields.CustomField);
```

## Troubleshooting Guide

### Common Issues

1. **Component not rendering**
   - Check component registration
   - Verify template path
   - Check console for binding errors

2. **Memory leaks**
   - Ensure dispose() is implemented
   - Clean up subscriptions
   - Remove event listeners

3. **Performance issues**
   - Use pureComputed instead of computed
   - Implement rate limiting
   - Check for unnecessary re-renders

4. **Styling conflicts**
   - Use component-specific class prefixes
   - Check CSS load order
   - Verify Bootstrap version compatibility

## Version History and Compatibility

- **Current Version**: Part of ShareDo Platform
- **Knockout.js**: 3.x compatible
- **jQuery**: 3.x required
- **Bootstrap**: 3.x (migration to 4.x planned)
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

## Additional Resources

### File Locations
- Components: `_Content/Components/`
- Widgets: `_Content/Widgets/`
- Panels: `_Content/Panels/`
- Forms: `_Content/Forms/`
- Scripts: `_Content/Script/`
- Styles: `_Content/Content/`

### Key Files
- Core: `sharedo.core.min.js`
- Framework: `sharedo.framework.min.js`
- Styles: `sharedo.radarzones.css`
- Localisation: `ko-localisation.js`

This knowledge base provides comprehensive documentation for developing with the ShareDo UI Framework. Use these patterns and conventions to ensure consistency and maintainability in your UI components.