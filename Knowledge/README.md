# ShareDo Platform Knowledge Base

This folder contains consolidated ShareDo platform documentation that is generic and reusable across projects.

## External Knowledge Base Reference

**Primary ShareDo Knowledge Base Path**: 
`C:\Users\IgorJericevich\Alterspective\Alterspective Knowledge Base - Documents\AI Knowledgebase\LearnSD\KB`

The external knowledge base contains comprehensive ShareDo documentation including:
- Complete API specifications
- Platform architecture documentation
- Historical implementation examples
- Advanced patterns and best practices

## Knowledge Structure

### 📁 API/
ShareDo API documentation and best practices

- **API-REGISTRY.md** - Complete registry of all ShareDo APIs
- **API_KNOWLEDGE_BASE.md** - Detailed API documentation
- **SHAREDO_API_KNOWLEDGE_BASE.md** - ShareDo-specific API patterns and examples
- **SHAREDO-API-BEST-PRACTICES.md** - Best practices for API usage

### 📁 UI/
User Interface framework documentation

- **SHAREDO-BLADE-STRUCTURE-GUIDE.md** - Blade architecture and implementation patterns
- **SHAREDO-PANEL-STACK-API.md** - Panel stack management API
- **ShareDo_UI_Framework_Knowledge_Base.md** - Complete UI framework reference
- **KNOWLEDGE_BASE_PANEL_COMPONENTS.md** - Panel component catalog
- **Element_Configuration_stackModel.md** - Stack model configuration guide
- **SHAREDO_UI_CONTEXT.md** - UI context and data passing patterns

### 📁 Workflows/
Workflow engine documentation

- **WORKFLOW-TEMPLATE-GUIDE.md** - Critical patterns for workflow template development
  - Variable declaration rules
  - Conditional compilation directives
  - ShareDo workflow API usage

### 📁 IDE/
ShareDo IDE configuration and tooling

- **SHAREDO-IDE-REFERENCE.md** - IDE configuration and customization
- **SHAREDO-VSCODE-EXTENSION.md** - VSCode extension for ShareDo development

## Quick Reference

### Most Important Documents for New Developers

1. **Start Here**: `UI/SHAREDO-BLADE-STRUCTURE-GUIDE.md` - Understanding the blade pattern
2. **API Basics**: `API/SHAREDO-API-BEST-PRACTICES.md` - How to call ShareDo APIs correctly
3. **Workflows**: `Workflows/WORKFLOW-TEMPLATE-GUIDE.md` - Critical workflow patterns

### Common Patterns

#### API Calls
```javascript
// Always use ShareDo's HTTP client
let result = sharedo.http.get("/api/v1/public/workItem/" + workItemId);
if (result.success) {
    // Process result.body
}
```

#### Blade Structure
```javascript
YourCompany.YourBlade = function(element, configuration, stackModel) {
    var self = this;
    self.element = element;
    self.configuration = configuration || {};
    self.stackModel = stackModel;
    
    self.afterInitialise = function() {
        // Initialization code
    };
}
```

#### Workflow Templates
```javascript
// CORRECT: Declare once, assign conditionally
let myVariable;
// $ifNotNull.Configuration.myConfig
myVariable = "$model.Configuration.myConfig";
// $else
myVariable = "defaultValue";
// $endif
```

## Version History

- **2024-01**: Initial knowledge base consolidation
- **Latest Update**: Consolidated from multiple project files into organized structure

## Contributing

When adding new ShareDo generic documentation:
1. Place in the appropriate subfolder (API, UI, Workflows, or IDE)
2. Update this README with a description
3. Ensure the document is truly generic (not project-specific)
4. Include examples and patterns where applicable