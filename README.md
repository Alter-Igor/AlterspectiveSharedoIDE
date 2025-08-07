# AlterspectiveIDE - ShareDo IDE Components

Custom ShareDo IDE components for enhanced work item management and workflow automation.

## Project Structure

```
AlterspectiveIDE/
├── _IDE/                              # ShareDo VSCode Extension deployment folder
│   ├── Alt/                          # Alterspective custom components
│   │   └── AdviceManagement/         # Advice management components
│   │       └── AdvicePauseResumeBlade/  # Ongoing advice pause/resume blade
│   └── BasicExamplesOfAllIdeComponents/ # ShareDo official examples (reference)
├── SHAREDO-IDE-REFERENCE.md         # Comprehensive ShareDo development guide
├── SHAREDO-API-BEST-PRACTICES.md    # Critical API usage guidelines
├── API-REGISTRY.md                  # API usage tracking
└── CLAUDE.md                         # AI assistant instructions
```

## Components

### 1. AdvicePauseResumeBlade

A ShareDo blade for managing ongoing advice status on work items.

**Features:**
- Pause ongoing advice with optional reason
- Resume ongoing advice with next review date
- Real-time status display
- Ribbon bar for quick actions
- Full ShareDo theming compliance

**Technical Stack:**
- Pure JavaScript (no TypeScript compilation required)
- ShareDo's `$ajax` for API calls
- Knockout.js for data binding
- Bootstrap-based responsive layout
- ShareDo widget chrome and theming

## Installation & Deployment

### Prerequisites
- ShareDo VSCode Extension installed
- Access to ShareDo instance
- Valid ShareDo API credentials

### Deployment Steps

1. **Using VSCode ShareDo Extension:**
   - Open VSCode
   - Navigate to ShareDo extension
   - Select "Deploy IDE Components"
   - Choose the `_IDE` folder
   - Components will be available at `/_ideFiles/Alt/...`

2. **Manual Deployment:**
   - Copy `_IDE` folder contents to ShareDo's `_ideFiles` directory
   - Restart ShareDo services if required
   - Verify in ShareDo designer

## Opening the Blade

### Quick Start

To open the AdvicePauseResumeBlade from your code:

```javascript
$ui.stacks.openPanel("Alt.AdviceManagement.AdvicePauseResumeBlade", {
    workItemId: "12345"  // Pass the work item ID
}, {
    closing: function(result) {
        // Handle blade closing
        if (result && result.action === "Saved") {
            // Advice status was changed
        }
    }
});
```

### Configuration with Tokens

When configuring in ShareDo Designer, use tokens that get replaced at runtime:

```json
{
    "workItemId": "{{sharedoId}}",
    "workItemReference": "{{sharedoReference}}",
    "workItemTitle": "{{sharedoTitle}}"
}
```

See [INSTRUCTIONS.md](./_IDE/Alt/AdviceManagement/AdvicePauseResumeBlade/INSTRUCTIONS.md) for detailed configuration examples and token usage.

## API Usage

This project uses ShareDo public APIs:

- **Work Item API** - `/api/v1/public/workItem/{id}`
- **Attributes API** - `/api/v1/public/workItem/{id}/attributes`
- **User API** - `/api/users/current`

All API calls use ShareDo's `$ajax` object for automatic authentication.

## Development Guidelines

### Key Principles

1. **Always use `$ajax` instead of `$.ajax`** - Critical for authentication
2. **Follow ShareDo naming conventions** - `*.panel.json` for blades
3. **Use prototype pattern** - All methods as prototype functions
4. **No custom CSS** - Rely on ShareDo theming
5. **Use `/_ideFiles/` paths** - Required for resource loading

### Best Practices

- Start simple with pure JavaScript
- Learn from ShareDo's official examples
- Track all API usage in API-REGISTRY.md
- Test in both light and dark themes
- Ensure responsive design works
- Always show loading states
- Provide clear error messages

## Lessons Learned

1. **File Structure Matters**: VSCode extension requires `_IDE` folder structure
2. **API Authentication**: Must use `$ajax`, not jQuery's `$.ajax`
3. **Manifest Format**: Blades use `.panel.json`, not `.blade.json`
4. **Prototype Pattern**: ShareDo expects prototype-based method definitions
5. **Component Loading**: All paths must be absolute from `/_ideFiles/`
6. **No Manual Binding**: ShareDo handles Knockout binding automatically

## Future Enhancements

- [ ] Add workflow action for bulk pause/resume
- [ ] Create dashboard widget for advice status overview
- [ ] Add email notifications on status changes
- [ ] Implement audit trail for advice management
- [ ] Add configurable business rules for auto-pause

## Support

For issues or questions:
- Check ShareDo developer documentation
- Review examples in `BasicExamplesOfAllIdeComponents`
- Consult SHAREDO-IDE-REFERENCE.md

## License

Proprietary - Alterspective

---

Built with ShareDo IDE Framework