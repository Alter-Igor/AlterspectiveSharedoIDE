# ShareDo VSCode Extension Guide

## Overview

The ShareDo VSCode extension is the official tool for developing, testing, and deploying ShareDo IDE widgets directly from Visual Studio Code.

## Project Structure Requirements

### Required Folder Structure
```
YourProject/
├── _IDE/                    # REQUIRED: All IDE components must be in this folder
│   ├── Widgets/            # Widget components
│   │   ├── WidgetName/
│   │   │   ├── widget.json
│   │   │   ├── widget.js
│   │   │   ├── widget.html
│   │   │   └── widget.css
│   ├── Aspects/            # Aspect widgets
│   ├── Panels/             # Blades/Panels
│   └── Components/         # Reusable components
├── .vscode/                # VSCode settings
│   └── settings.json       # Extension configuration
└── README.md
```

### Important Notes
- **The `_IDE` folder is mandatory** - The ShareDo VSCode extension looks for this folder
- All IDE components (widgets, aspects, panels) must be within `_IDE`
- The extension handles deployment from `_IDE` to the ShareDo environment

## VSCode Extension Features

### Key Capabilities
1. **Direct Deployment** - Deploy widgets directly to ShareDo from VSCode
2. **Live Testing** - Test widgets in ShareDo environment
3. **Manifest Validation** - Validate widget JSON manifests
4. **IntelliSense** - Auto-completion for ShareDo APIs
5. **Debugging** - Debug widgets in real-time

### Common Commands
- `ShareDo: Deploy Widget` - Deploy current widget to ShareDo
- `ShareDo: Validate Manifest` - Check widget.json for errors
- `ShareDo: Connect to ShareDo` - Establish connection to ShareDo instance
- `ShareDo: Refresh` - Refresh ShareDo connection

## Configuration

### VSCode Settings (.vscode/settings.json)
```json
{
    "sharedo.instance": "https://demo-aus.sharedo.tech",
    "sharedo.authentication": {
        "type": "bearer",
        "token": "YOUR_TOKEN_HERE"
    },
    "sharedo.deployment": {
        "targetFolder": "_IDE",
        "autoValidate": true
    }
}
```

## Deployment Workflow

### 1. Structure Your Widget
Place your widget in the correct structure:
```
_IDE/
└── Widgets/
    └── YourWidget/
        ├── widget.json     # Manifest (required)
        ├── widget.js       # JavaScript (required)
        ├── widget.html     # Template (required)
        └── widget.css      # Styles (optional)
```

### 2. Configure Manifest
Ensure your `widget.json` follows ShareDo requirements:
```json
{
    "id": "YourCompany.Widgets.YourWidget",
    "priority": 6000,
    "designer": {
        "allowInPortalDesigner": true,
        "allowInSharedoPortalDesigner": true,
        "title": "Your Widget",
        "icon": "fa-icon",
        "categories": ["Custom"],
        "isConfigurable": true
    },
    "scripts": ["widget.js"],
    "styles": ["widget.css"],
    "templates": ["widget.html"]
}
```

### 3. Deploy Using Extension
1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run `ShareDo: Deploy Widget`
3. Select your widget from the list
4. Confirm deployment

### 4. Test in ShareDo
1. Navigate to ShareDo portal designer
2. Find your widget in the widget library
3. Add to a portal page
4. Test functionality

## Best Practices

### Development Tips
1. **Always work in _IDE folder** - Extension only recognizes this structure
2. **Validate before deploy** - Use validation command to catch errors
3. **Use relative paths** - In manifests, use relative paths from widget folder
4. **Test incrementally** - Deploy and test frequently

### File Naming Conventions
- Widget folder: `PascalCase` (e.g., `WorkItemInfo`)
- Files: lowercase (e.g., `widget.js`, `widget.html`)
- Manifest: always `widget.json` for widgets

### Version Control
```gitignore
# ShareDo VSCode Extension
.vscode/settings.json    # Contains sensitive tokens
*.log
.sharedo/
```

## Troubleshooting

### Common Issues

#### Widget Not Deploying
- Check `_IDE` folder structure
- Validate manifest JSON syntax
- Ensure authentication is configured
- Check ShareDo instance connectivity

#### Widget Not Appearing in Designer
- Verify `designer` section in manifest
- Check `allowInPortalDesigner` flag
- Ensure unique widget ID
- Clear browser cache

#### JavaScript Errors
- Check browser console for errors
- Ensure Knockout.js syntax is correct
- Verify namespace declarations
- Check for missing dependencies

### Debug Mode
Enable debug logging in settings:
```json
{
    "sharedo.debug": true,
    "sharedo.logLevel": "verbose"
}
```

## Extension Updates

Keep the extension updated for latest features:
1. Check VSCode Extensions panel
2. Look for ShareDo extension updates
3. Review changelog for new features
4. Update your workflow accordingly

## Resources

- [ShareDo Developer Portal](https://sharedo.tech/developer)
- [VSCode Extension Marketplace](https://marketplace.visualstudio.com/)
- [Widget Development Guide](./SHAREDO-IDE-REFERENCE.md)
- [API Reference](./API-REGISTRY.md)

---

**Note**: This guide assumes you have the ShareDo VSCode extension installed. If not, search for "ShareDo" in the VSCode Extensions marketplace.