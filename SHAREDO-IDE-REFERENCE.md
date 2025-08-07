# ShareDo IDE Development Reference Guide

> Comprehensive guide for developing ShareDo IDE widgets, workflow actions, blades, and aspect widgets

## 🎯 Quick Reference

### Component Types

| Component Type | Purpose | Use Cases | Key Features |
|---------------|---------|-----------|--------------|
| **Widgets** | Reusable UI components for displaying and interacting with data | Dashboard charts, data entry forms, custom reports | Data binding, API integration, configurable properties |
| **Aspect Widgets** | Work item context-specific widgets | Custom data entry for work items, business rule enforcement | Lifecycle integration, validation, host model access |
| **Blades/Panels** | Modal dialogs and side panels for focused workflows | Edit forms, multi-step wizards, settings panels | Slide-out UI, data passing, validation patterns |
| **Workflow Actions** | Custom actions for visual workflow designer | Business logic steps, API integrations, approvals | Drag-drop integration, runtime execution, error handling |
| **Component Manifests** | Reusable UI components and form controls | Input controls, layout components, data displays | Knockout.js integration, validation, theming |

## 📁 Project Structure

```
AlterspectiveIDE/
├── common/                     # Shared components and utilities
│   ├── components/            # Reusable UI components
│   ├── services/             # Shared services and APIs
│   ├── styles/               # Common styles and themes
│   └── utils/                # Utility functions
├── widgets/                   # Individual widget projects
│   ├── widget1/
│   │   ├── manifest.json     # Widget configuration
│   │   ├── widget.js        # JavaScript implementation
│   │   ├── widget.html      # HTML template
│   │   ├── widget.css       # Styles
│   │   └── package.json     # Dependencies
│   └── widget2/
├── build/                    # Build configurations
│   ├── webpack.common.js
│   ├── webpack.widget.js
│   └── build-all.js
├── dist/                     # Built widgets ready for deployment
├── docs/                     # Documentation
├── tests/                    # Test suites
└── package.json             # Root dependencies
```

## 🏗️ Widget Architecture

### Basic Widget Structure

Every ShareDo widget requires:

1. **Manifest File** (`widget.json`)
```json
{
    "id": "YourCompany.Widgets.WidgetName",
    "priority": 6000,
    "designer": {
        "allowInPortalDesigner": true,
        "allowInSharedoPortalDesigner": true,
        "title": "Widget Title",
        "icon": "fa-icon-name",
        "description": "Widget description",
        "categories": ["Category1"],
        "isConfigurable": true,
        "defaultConfigurationJson": {}
    },
    "scripts": ["/path/to/widget.js"],
    "styles": ["/path/to/widget.css"],
    "templates": ["/path/to/widget.html"],
    "components": []
}
```

2. **JavaScript Implementation** (`widget.js`)
```javascript
namespace("YourCompany.Widgets");

YourCompany.Widgets.WidgetName = function(element, configuration, stackModel) {
    var self = this;
    
    // Configuration
    this.element = element;
    this.config = configuration || {};
    this.stackModel = stackModel;
    
    // Observable properties
    this.loading = ko.observable(false);
    this.data = ko.observableArray([]);
    
    // Initialize
    this.initialize();
};

YourCompany.Widgets.WidgetName.prototype.initialize = function() {
    this.loadData();
};

YourCompany.Widgets.WidgetName.prototype.loadData = function() {
    // Load data implementation
};

YourCompany.Widgets.WidgetName.prototype.dispose = function() {
    // Cleanup resources
};
```

3. **HTML Template** (`widget.html`)
```html
<div class="widget-container">
    <div data-bind="widgetChrome:{icon:'fa-cog', title: 'Widget Title'}">
        <!-- Widget content -->
        <div data-bind="visible: loading">
            <i class="fa fa-spinner fa-spin"></i> Loading...
        </div>
        <div data-bind="visible: !loading()">
            <!-- Main content here -->
        </div>
    </div>
</div>
```

4. **CSS Styles** (`widget.css`)
```css
.widget-container {
    /* Component-specific styles */
}
```

## 🎯 Aspect Widgets

### Key Differences from Regular Widgets

- **Context-Aware**: Receive work item context through `_host` parameter
- **Lifecycle Integration**: Hook into save/load/validation operations
- **Required**: Must implement `validationErrorCount` computed observable

### Aspect Widget Implementation

```javascript
namespace("YourCompany.Aspects");

YourCompany.Aspects.CustomAspect = function(element, configuration, baseModel) {
    var self = this;
    
    // Setup configuration with host parameters
    var defaults = {
        _host: {
            model: null,
            blade: null,
            enabled: false
        },
        // Custom config
    };
    
    var options = $.extend(true, {}, defaults, configuration);
    self._host = options._host;
    
    // Setup model binding to work item
    self.model = {
        workItemTitle: options._host.model.title,
        // Custom observables
    };
    
    // REQUIRED: Validation integration
    self.validationErrorCount = ko.pureComputed(function() {
        var errors = 0;
        // Add validation logic
        return errors;
    });
};

// Lifecycle methods
YourCompany.Aspects.CustomAspect.prototype.loadAndBind = function() {
    // Called after creation
};

YourCompany.Aspects.CustomAspect.prototype.onBeforeSave = function(model) {
    // Called before work item save
};

YourCompany.Aspects.CustomAspect.prototype.onSave = function(model) {
    // Called during save
};

YourCompany.Aspects.CustomAspect.prototype.onAfterSave = function(model) {
    // Called after save
};

YourCompany.Aspects.CustomAspect.prototype.onReload = function(model) {
    // Called when reloading
};

YourCompany.Aspects.CustomAspect.prototype.onDestroy = function() {
    // Cleanup
};
```

### Aspect Widget Manifest

```json
{
    "id": "YourCompany.Aspects.CustomAspect",
    "priority": 6000,
    "designer": {
        "allowAspectAdapter": true,  // CRITICAL for aspect widgets
        "allowInPortalDesigner": false,
        "allowInSharedoPortalDesigner": false,
        "title": "Custom Aspect",
        "icon": "fa-cog",
        "description": "Work item aspect widget",
        "categories": ["Aspects"],
        "defaultConfigurationJson": {}
    },
    "scripts": ["/_ideFiles/aspects/CustomAspect.js"],
    "styles": ["/_ideFiles/aspects/CustomAspect.css"],
    "templates": ["/_ideFiles/aspects/CustomAspect.html"]
}
```

## 🗂️ Blades/Panels

### Blade Implementation

```javascript
var YourCompany = YourCompany || {};
YourCompany.Panels = YourCompany.Panels || {};

YourCompany.Panels.CustomBlade = function(element, configuration, formModel) {
    var self = this;
    
    self.options = configuration || {};
    self.element = element;
    
    // Observables
    self.isLoading = ko.observable(false);
    self.data = ko.observable({});
    
    // Lifecycle methods
    self.afterInitialise = function() {
        // Called after Knockout bindings applied
        self.loadData();
    };
    
    self.loadAndBind = function() {
        // Called for data loading
    };
    
    // Actions
    self.save = function() {
        // Save and close blade
        $ui.stacks.close(self, self.data());
    };
    
    self.cancel = function() {
        $ui.stacks.cancel();
    };
};
```

### Blade Manifest

```json
{
    "systemName": "YourCompany.Panels.CustomBlade",
    "title": "Custom Blade",
    "width": 600,
    "scripts": ["CustomBlade/panel.js"],
    "styles": ["CustomBlade/panel.css"],
    "templates": ["CustomBlade/panel.html"],
    "components": []
}
```

### Opening Blades

```javascript
// Open blade from widget or another component
$ui.stacks.openPanel("YourCompany.Panels.CustomBlade", {
    // Configuration data
    itemId: 123,
    mode: "edit"
}, {
    // Event handlers
    closing: function(result) {
        // Handle blade closing with result
    }
});
```

## 🔧 Build Configuration

### Webpack Configuration for Widgets

```javascript
// webpack.widget.js
const path = require('path');

module.exports = (widgetName) => ({
    entry: `./widgets/${widgetName}/widget.js`,
    output: {
        path: path.resolve(__dirname, `../dist/${widgetName}`),
        filename: 'widget.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: 'babel-loader'
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.html$/,
                use: 'html-loader'
            }
        ]
    },
    externals: {
        'knockout': 'ko',
        'jquery': '$'
    }
});
```

### Package.json Scripts

```json
{
    "scripts": {
        "build": "node build/build-all.js",
        "build:widget": "webpack --config build/webpack.widget.js",
        "dev": "webpack --watch --config build/webpack.widget.js",
        "test": "jest",
        "lint": "eslint widgets/**/*.js",
        "package": "node build/package-widgets.js"
    }
}
```

## 🎨 Theming and Styling

### ShareDo CSS Variables

```css
/* Use ShareDo theme variables */
.widget-container {
    background-color: var(--sharedo-bg-primary);
    color: var(--sharedo-text-primary);
    border: 1px solid var(--sharedo-border-color);
}

/* Bootstrap integration */
.widget-container .btn {
    /* Uses Bootstrap button styles */
}

/* Font Awesome icons */
.widget-container .fa {
    /* Font Awesome icon styles */
}
```

### Responsive Design

```css
/* Mobile-first approach */
.widget-container {
    padding: 10px;
}

@media (min-width: 768px) {
    .widget-container {
        padding: 20px;
    }
}

@media (min-width: 1200px) {
    .widget-container {
        padding: 30px;
    }
}
```

## 🧪 Testing

### Unit Testing with Jest

```javascript
// widget.test.js
describe('CustomWidget', () => {
    let widget;
    let element;
    let configuration;
    
    beforeEach(() => {
        element = document.createElement('div');
        configuration = { title: 'Test Widget' };
        widget = new YourCompany.Widgets.CustomWidget(element, configuration);
    });
    
    test('initializes correctly', () => {
        expect(widget.config.title).toBe('Test Widget');
        expect(widget.loading()).toBe(false);
    });
    
    test('loads data successfully', async () => {
        await widget.loadData();
        expect(widget.data().length).toBeGreaterThan(0);
    });
    
    afterEach(() => {
        widget.dispose();
    });
});
```

## 📦 Deployment

### Widget Packaging

1. **Build the widget**
```bash
npm run build:widget -- --widget-name=CustomWidget
```

2. **Package for deployment**
```bash
npm run package -- --widget=CustomWidget --output=./packages
```

3. **Deploy to ShareDo**
- Copy built files to ShareDo plugin directory
- Restart ShareDo services if required
- Verify in widget designer

### File Structure for Deployment

```
ShareDo/
├── _ideFiles/
│   └── YourCompany/
│       └── Widgets/
│           └── CustomWidget/
│               ├── widget.json
│               ├── widget.js
│               ├── widget.html
│               └── widget.css
```

## 🔌 API Integration

### Available ShareDo APIs

ShareDo provides comprehensive public APIs for widget development:

#### Core Work Item APIs
- **Attributes API** (`/api/v1/public/workItem/{id}/attributes`) - Store custom key-value data
- **Comments API** (`/api/v1/public/workItem/{id}/comments`) - Manage comments
- **Chronology API** (`/api/v1/public/workItem/{id}/chronology`) - Timeline entries
- **Phase API** (`/api/v2/public/workItem/{id}/phase`) - Workflow state management
- **CRUD API** (`/api/v1/public/workItem`) - Create, read, update operations
- **Search API** (`/api/v1/public/workItem/findByQuery`) - Advanced querying

#### User & System APIs
- **Bookmarks API** (`/api/public/v2/my/workitems/bookmarked`) - User bookmarks
- **Notifications API** (`/api/public/v1/notifications`) - Notification system
- **Smart Variables API** (`/api/v1/public/workItem/{id}/smartVariables`) - Computed attributes
- **Types API** (`/api/v2/public/types/tree`) - Work item type hierarchy
- **Users API** (`/api/public/v2/users/{id}`) - User profiles

### API Authentication

**CRITICAL**: Always use ShareDo's `$ajax` object, NOT jQuery's `$.ajax`:

```javascript
// ✅ CORRECT - Use ShareDo's $ajax
$ajax.api.get('/api/v1/public/workItem/123/attributes')
    .then(function(response) {
        // Handle success
    })
    .catch(function(error) {
        // Handle error
    });

// ❌ WRONG - Don't use jQuery's $.ajax
$.ajax({
    url: '/api/v1/public/workItem/123/attributes',
    headers: { 'Authorization': 'Bearer token' }
});
```

ShareDo's `$ajax` automatically handles:
- Bearer token authentication
- Token refresh on 401 errors
- Error dialogs
- Toast notifications
- Session management

See [API Best Practices](./SHAREDO-API-BEST-PRACTICES.md) for details.

### Common API Patterns

```javascript
// Get work item attributes
async function getAttributes(workItemId) {
    return $.ajax({
        url: `/api/v1/public/workItem/${workItemId}/attributes`,
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    });
}

// Update attributes
async function updateAttributes(workItemId, attributes) {
    return $.ajax({
        url: `/api/v1/public/workItem/${workItemId}/attributes`,
        method: 'POST',
        data: JSON.stringify(attributes),
        contentType: 'application/json',
        headers: { 'Authorization': 'Bearer ' + token }
    });
}

// Add comment
async function addComment(workItemId, commentText) {
    return $.ajax({
        url: `/api/v1/public/workItem/${workItemId}/comments`,
        method: 'POST',
        data: JSON.stringify({ body: commentText }),
        contentType: 'application/json',
        headers: { 'Authorization': 'Bearer ' + token }
    });
}

// Search work items
async function searchWorkItems(query, filters) {
    return $.ajax({
        url: '/api/v1/public/workItem/findByQuery',
        method: 'POST',
        data: JSON.stringify({
            query: query,
            filters: filters,
            pagination: { page: 1, pageSize: 20 }
        }),
        contentType: 'application/json',
        headers: { 'Authorization': 'Bearer ' + token }
    });
}
```

### API Registry

**Important**: Track all API usage in `API-REGISTRY.md`:
- Document public API usage per widget
- Register any private/internal API usage with justification
- Monitor for API deprecation and changes

See [API Registry](./API-REGISTRY.md) for complete tracking

## 🚀 Best Practices

### Code Organization
- Use consistent namespacing: `YourCompany.ComponentType.ComponentName`
- Group related components together
- Implement proper error handling
- Add comprehensive comments

### Performance
- Use computed observables for derived data
- Implement lazy loading for large datasets
- Debounce user input for search
- Dispose resources properly

### User Experience
- Always show loading states
- Provide clear error messages
- Implement responsive design
- Support keyboard navigation

### Security
- Validate all user inputs
- Use proper API authentication
- Never hard-code sensitive data
- Follow secure coding practices

## 🐛 Common Issues and Solutions

### Widget Not Loading
- Check manifest syntax and file paths
- Verify namespace matches constructor
- Ensure all dependencies are available
- Check browser console for errors

### Data Binding Issues
- Use observable patterns correctly
- Check template binding syntax
- Ensure proper Knockout.js integration
- Verify computed observable dependencies

### Styling Conflicts
- Use component-scoped CSS classes
- Namespace your styles properly
- Avoid global style overrides
- Use ShareDo theme variables

## 📚 Resources

- [Knockout.js Documentation](https://knockoutjs.com/documentation/introduction.html)
- [Bootstrap Documentation](https://getbootstrap.com/docs/)
- [Font Awesome Icons](https://fontawesome.com/icons)
- ShareDo Developer Portal (internal)

## 🔗 Quick Links

- Widget Manifest Template: `./templates/widget-manifest.json`
- Aspect Widget Template: `./templates/aspect-widget.js`
- Blade Template: `./templates/blade.js`
- Build Scripts: `./build/`
- Common Components: `./common/components/`
- Test Utilities: `./tests/utils/`