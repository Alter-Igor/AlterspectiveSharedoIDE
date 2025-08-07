# User Experience Bundle Task

## For AI Instance 2

Please implement the following improvements for the AdviceManagement module:

### 1. STATUS BADGES
Add count badges to widgets:
- **AdvicePausedWidget**: Show count of total paused items in corner
- **AdviceSummaryCard**: Show "X days paused" badge when paused
- **AdviceBulkManager**: Show selected count as badge on buttons

Location: Update existing widget HTML/JS files
Pattern: Use KnockoutJS observables and computed properties

### 2. KEYBOARD SHORTCUTS
Add keyboard support:
- `Space` = Toggle pause/resume on focused item
- `R` = Resume advice
- `P` = Pause advice  
- `ESC` = Close panels/modals
- `?` = Show help

Files to update:
- AdvicePausedWidget.js
- AdviceSummaryCard.js
- AdviceBulkManager.js

Use jQuery keydown event handlers.

### Example Implementation:
```javascript
// In widget constructor
$(document).on('keydown', function(e) {
    if (e.key === ' ' && !$(e.target).is('input, textarea')) {
        e.preventDefault();
        self.toggleAdvice();
    }
});
```

Commit when done with message: "Add status badges and keyboard shortcuts for better UX"