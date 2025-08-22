# CLAUDE.md - AI Assistant Guide for AlterspectiveIDE

This file provides guidance to Claude Code (claude.ai/code) and other AI assistants when working with code in this repository.

## Repository Overview

This is the AlterspectiveIDE repository containing ShareDo IDE customizations, workflow actions, blades, widgets, and extensive documentation for legal practice management solutions.

## Knowledge Base Locations

### Primary External Knowledge Base
**Path**: `C:\Users\IgorJericevich\Alterspective\Alterspective Knowledge Base - Documents\AI Knowledgebase\LearnSD\KB`

This comprehensive knowledge base contains:
- Complete ShareDo API documentation
- Workflow engine specifications
- Blade development patterns
- Widget implementation guides
- Code examples and templates
- Best practices and troubleshooting guides
- Historical implementation examples

### Consolidated ShareDo Knowledge (./Knowledge/)

Generic ShareDo platform documentation has been consolidated into the `Knowledge/` folder:

1. **API Documentation** (`Knowledge/API/`)
   - `API-REGISTRY.md` - Registry of all available APIs
   - `API_KNOWLEDGE_BASE.md` - Detailed API knowledge
   - `SHAREDO_API_KNOWLEDGE_BASE.md` - ShareDo-specific API documentation
   - `SHAREDO-API-BEST-PRACTICES.md` - Best practices for API usage
   - `CONSOLIDATED_API_REFERENCE.md` - Combined API reference guide

2. **UI Framework Documentation** (`Knowledge/UI/`)
   - `ShareDo_UI_Framework_Knowledge_Base.md` - Complete UI framework reference
   - `SHAREDO-BLADE-STRUCTURE-GUIDE.md` - Blade implementation patterns
   - `SHAREDO-PANEL-STACK-API.md` - Panel stack API documentation
   - `KNOWLEDGE_BASE_PANEL_COMPONENTS.md` - Panel component reference
   - `Element_Configuration_stackModel.md` - Stack model configuration
   - `SHAREDO_UI_CONTEXT.md` - UI context patterns

3. **Workflow Documentation** (`Knowledge/Workflows/`)
   - `WORKFLOW-TEMPLATE-GUIDE.md` - Critical workflow template patterns

4. **IDE Reference** (`Knowledge/IDE/`)
   - `SHAREDO-IDE-REFERENCE.md` - ShareDo IDE configuration and usage
   - `SHAREDO-VSCODE-EXTENSION.md` - VSCode extension documentation

### Project-Specific Documentation

1. **Advice Management System**
   - `_IDE/Alt/AdviceManagement/CLAUDE.md` - Advice management specific guide
   - `_IDE/Alt/AdviceManagement/TECHNICAL_ARCHITECTURE.md` - Technical architecture
   - `_IDE/Alt/AdviceManagement/DETAILED_IMPLEMENTATION.md` - Implementation details
   - `_IDE/Alt/AdviceManagement/ATTRIBUTE_REGISTRY.md` - Attribute definitions
   - `_IDE/Alt/AdviceManagement/EVENTBUS_EXPLANATION.md` - Event system documentation

2. **Component-Specific Documentation**
   - Component READMEs in their respective folders
   - Integration guides for specific implementations

## Development Guidelines

### When to Reference Knowledge Bases

1. **External Knowledge Base** (`C:\Users\IgorJericevich\...\LearnSD\KB`)
   - ShareDo platform fundamentals
   - Core API documentation
   - Platform architecture
   - Standard patterns and conventions

2. **Repository Knowledge Files**
   - Project-specific implementations
   - Custom components and workflows
   - Local configuration and setup
   - Project-specific patterns

### Key Technologies

- **ShareDo Platform**: Legal practice management system
- **Languages**: JavaScript, HTML, CSS
- **Frameworks**: Knockout.js, jQuery, FormIO
- **Architecture**: Blade-based UI, Workflow engine, Widget system
- **APIs**: RESTful APIs for work items, participants, attributes

### Project Structure

```
_IDE/
├── Alt/                    # Alterspective customizations
│   ├── AdviceManagement/  # Ongoing advice management system
│   ├── Common/            # Shared services
│   └── Utilities/         # Utility blades and tools
├── BasicExamplesOfAllIdeComponents/  # Reference implementations
├── Globals/               # Global includes and helpers
├── PortalWidgets/        # Portal-specific widgets
└── Prototype/            # Experimental features

_Workflow/                 # Workflow definitions
_Forms/                   # Form schemas and templates
```

### Critical Patterns to Follow

1. **Workflow Templates**: Always declare variables once, then conditionally assign
   - See `Knowledge/Workflows/WORKFLOW-TEMPLATE-GUIDE.md`

2. **Blade Structure**: Follow ShareDo blade patterns
   - See `Knowledge/UI/SHAREDO-BLADE-STRUCTURE-GUIDE.md`

3. **API Usage**: Use ShareDo HTTP client for API calls
   - See `Knowledge/API/SHAREDO-API-BEST-PRACTICES.md`

4. **Event System**: Use centralized EventBus for component communication
   - See `_IDE/Alt/AdviceManagement/EVENTBUS_EXPLANATION.md`

### Common Tasks

1. **Creating Workflow Actions**
   - Reference: `AdviceStatusChecker-template.js`
   - Follow patterns in `Knowledge/Workflows/WORKFLOW-TEMPLATE-GUIDE.md`

2. **Building Blades**
   - Reference: `BasicBlade` example
   - Follow `Knowledge/UI/SHAREDO-BLADE-STRUCTURE-GUIDE.md`
   - **IMPORTANT**: Open blades using `$ui.stacks.openPanel()` NOT `$ui.showBlade()` (which doesn't exist!)
   ```javascript
   // CORRECT way to open a blade:
   $ui.stacks.openPanel("Blade.ID", configuration, callback);
   
   // WRONG - this method doesn't exist:
   // $ui.showBlade(...) // DON'T USE THIS
   ```

3. **Implementing Widgets**
   - Reference: `BasicExamplesOfAllIdeComponents/WidgetBasicDesign`
   - Use designer pattern for configurable widgets

## Important Notes

- Always check external knowledge base first for ShareDo platform documentation
- Use repository knowledge files for project-specific implementations
- Follow established patterns - don't reinvent solutions
- Test workflow templates for both configuration present/absent scenarios
- Maintain consistency with existing code style and patterns

## Support Resources

- External KB: `C:\Users\IgorJericevich\Alterspective\Alterspective Knowledge Base - Documents\AI Knowledgebase\LearnSD\KB`
- Repository Issues: Report problems in project issue tracker
- Documentation: Always update relevant .md files when implementing new features