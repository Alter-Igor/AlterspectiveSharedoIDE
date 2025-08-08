# AdviceManager End User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard Widgets](#dashboard-widgets)
4. [Managing Advice Status](#managing-advice-status)
5. [Bulk Operations](#bulk-operations)
6. [Workflow Automation](#workflow-automation)
7. [Common Tasks](#common-tasks)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)
10. [Quick Reference](#quick-reference)

## Introduction

### What is AdviceManager?

AdviceManager is a comprehensive tool for managing ongoing legal advice workflows within your practice management system. It helps legal professionals track, pause, resume, and monitor continuous advisory services provided to clients.

### Key Features

- **Real-time Status Monitoring**: See at a glance which advice workflows are active or paused
- **Flexible Management**: Pause and resume advice with documented reasons
- **Bulk Operations**: Manage multiple advice items simultaneously
- **Automated Workflows**: Set up rules to automatically manage advice based on conditions
- **Audit Trail**: Complete history of all status changes and actions
- **Dashboard Integration**: Multiple widget options for your portal dashboard

### Who Should Use This Guide?

This guide is designed for:
- Legal practitioners managing ongoing client advice
- Practice managers overseeing multiple matters
- Administrative staff handling workflow coordination
- System administrators configuring automation rules

## Getting Started

### Accessing AdviceManager

1. **From a Work Item**:
   - Open any work item in your practice management system
   - Look for the "Advice Management" button or panel
   - Click to open the advice management interface

2. **From Dashboard Widgets**:
   - Add advice management widgets to your dashboard
   - Click on any widget to access full management features

3. **From Workflow Actions**:
   - Advice management can be triggered automatically through workflows
   - Configure workflow rules in the workflow designer

### Understanding Advice Status

Advice can have two main statuses:

- **Active** ✅: Ongoing advice is currently being provided
  - Displayed with green indicators
  - Work continues as normal
  - Next review dates are tracked

- **Paused** ⏸️: Advice has been temporarily suspended
  - Displayed with yellow/amber indicators
  - Requires a reason for pausing
  - Can be resumed at any time

## Dashboard Widgets

### 1. Advice Paused Notification Widget

**Purpose**: Alerts you when advice has been paused on a work item

**Features**:
- Only appears when advice is paused
- Shows pause duration and reason
- Click to open management panel
- Auto-refreshes status

**Configuration**:
1. Add widget to dashboard
2. Configure settings:
   - **Auto Refresh**: Enable/disable automatic checking
   - **Check Interval**: How often to check (10 seconds to 10 minutes)
   - **Show Reason**: Display pause reason in widget

**Visual Indicators**:
- 🟡 Yellow background for paused status
- ⏸️ Animated pause icon
- 📅 Duration since paused
- ⚠️ Red indicator if paused > 24 hours

### 2. Advice Summary Card Widget

**Purpose**: Compact overview of advice status with quick actions

**Display Information**:
- Current status (Active/Paused)
- Days active
- Times paused
- Completion progress
- Last action date
- Next scheduled action

**Quick Actions**:
- **Pause/Resume Button**: Toggle status instantly
- **View Details**: Open full management panel
- **Refresh**: Update current information

**Configuration Options**:
- **Refresh Interval**: Auto-update frequency
- **Show Progress Bar**: Display completion percentage
- **Show Stats**: Show/hide statistics section
- **Compact Mode**: Minimal display option

### 3. Advice Bulk Manager Widget

**Purpose**: Manage multiple advice items from a single interface

**Features**:
- View all advice items in a table
- Filter by status (All/Active/Paused)
- Select multiple items for bulk actions
- Export data to CSV

**Available Actions**:
- **Bulk Pause**: Pause multiple items with single reason
- **Bulk Resume**: Resume multiple paused items
- **Export**: Download selected items as CSV
- **Individual Actions**: Pause/Resume/View each item

**How to Use**:
1. Use checkboxes to select items
2. Choose bulk action from dropdown
3. Provide reason if pausing
4. Confirm action

## Managing Advice Status

### Pausing Advice

**When to Pause**:
- Client requests temporary suspension
- Awaiting client instructions
- Payment issues
- Resource availability
- Regulatory requirements

**How to Pause**:

1. **From Management Panel**:
   ```
   1. Open work item
   2. Click "Advice Management"
   3. Click "Pause Advice" button
   4. Enter pause reason (required)
   5. Click "Confirm"
   ```

2. **From Widget**:
   ```
   1. Click pause button on widget
   2. Enter reason in popup
   3. Confirm action
   ```

**What Happens When Paused**:
- Status changes to "Paused"
- Pause date and time recorded
- User who paused is logged
- Reason is stored for reference
- Notifications sent to relevant parties
- Next action date cleared

### Resuming Advice

**When to Resume**:
- Client ready to proceed
- Issues resolved
- Resources available
- Instructions received

**How to Resume**:

1. **From Management Panel**:
   ```
   1. Open paused work item
   2. Click "Advice Management"
   3. Click "Resume Advice" button
   4. Optionally enter resume reason
   5. Set next advice date
   6. Click "Confirm"
   ```

2. **From Widget**:
   ```
   1. Click resume button on widget
   2. Set next advice date
   3. Confirm action
   ```

**What Happens When Resumed**:
- Status changes to "Active"
- Resume date and time recorded
- User who resumed is logged
- Next advice date set
- Notifications sent
- Work continues normally

### Viewing Advice History

To see the complete history of advice status changes:

1. Open the work item
2. Navigate to "Advice Management"
3. Click "View History" tab
4. Review timeline of changes:
   - Status changes
   - Dates and times
   - Users responsible
   - Reasons provided

## Bulk Operations

### Selecting Multiple Items

1. **Select All**: Click checkbox in table header
2. **Select Individual**: Click checkbox for each item
3. **Filter First**: Use status filter to narrow selection

### Bulk Pause Operation

**Steps**:
1. Select items to pause
2. Click "Bulk Actions" → "Pause Selected"
3. Enter reason for pausing
4. Review affected items
5. Click "Confirm Pause"

**Considerations**:
- Same reason applies to all items
- Each item updated individually
- Failed items reported separately
- Partial success possible

### Bulk Resume Operation

**Steps**:
1. Select paused items
2. Click "Bulk Actions" → "Resume Selected"
3. Set next advice date (optional)
4. Click "Confirm Resume"

**Note**: Only paused items can be resumed

### Exporting Data

**Export to CSV**:
1. Select items to export
2. Click "Export" → "Export to CSV"
3. File downloads automatically

**CSV Contents**:
- Work item reference
- Title
- Current status
- Last action date
- Days active
- Pause/resume history

## Workflow Automation

### Understanding Workflow Actions

The AdviceStatusController allows automatic management of advice based on conditions.

### Available Conditions

**Status Conditions**:
- `isPaused`: Advice is currently paused
- `isActive`: Advice is currently active

**Time-Based Conditions**:
- `pausedMoreThan24Hours`: Paused for over 24 hours
- `pausedMoreThan7Days`: Paused for over 7 days

### Available Actions

- **Check Only**: Just check status, no changes
- **Pause**: Pause active advice
- **Resume**: Resume paused advice
- **Toggle**: Switch current status

### Setting Up Automation

**Example 1: Auto-Resume After Review**
```
Condition: Work item status = "Review Complete"
Action: Resume advice
Next Date: Today + 30 days
```

**Example 2: Pause on Payment Overdue**
```
Condition: Invoice overdue > 30 days
Action: Pause advice
Reason: "Payment overdue - automated pause"
```

**Example 3: Escalate Long Pauses**
```
Condition: Paused more than 7 days
Action: Send notification to manager
Branch: escalation
```

### Workflow Configuration

1. **Open Workflow Designer**
2. **Add AdviceStatusController Action**
3. **Configure Settings**:
   - Default action
   - Conditions and rules
   - Pause reasons
   - Retry settings
   - Timeout values

4. **Connect Branches**:
   - Success
   - Paused
   - Resumed
   - No Action
   - Error

## Common Tasks

### Task 1: Daily Status Review

**Morning Routine**:
1. Open dashboard
2. Check Advice Paused widgets
3. Review items paused > 24 hours
4. Take action on urgent items
5. Document any concerns

### Task 2: Weekly Bulk Review

**Weekly Process**:
1. Open Bulk Manager widget
2. Filter: Status = "Paused"
3. Sort by pause date
4. Review items paused > 7 days
5. Resume where appropriate
6. Export report for management

### Task 3: Client Request to Pause

**When Client Calls**:
1. Open client's work item
2. Click "Advice Management"
3. Click "Pause Advice"
4. Enter reason: "Client requested pause - [specific reason]"
5. Confirm and note follow-up date

### Task 4: Month-End Reporting

**Generate Report**:
1. Open Bulk Manager
2. Select all items
3. Export to CSV
4. Open in Excel
5. Create pivot table by status
6. Calculate metrics:
   - Active vs Paused ratio
   - Average pause duration
   - Most common pause reasons

### Task 5: Setting Up Notifications

**Configure Alerts**:
1. Add Advice Paused widget to dashboard
2. Set auto-refresh: ON
3. Set check interval: 5 minutes
4. Position prominently on dashboard
5. Test with sample work item

## Troubleshooting

### Common Issues and Solutions

#### Widget Not Showing

**Problem**: Advice widget not appearing on dashboard

**Solutions**:
1. Check widget is added to dashboard
2. Verify work item has advice attributes
3. Ensure you have permissions
4. Refresh browser cache
5. Check widget configuration

#### Cannot Pause/Resume

**Problem**: Buttons disabled or not working

**Solutions**:
1. Check you have edit permissions
2. Verify work item is not locked
3. Ensure network connection
4. Check for validation errors
5. Try refreshing the page

#### Status Not Updating

**Problem**: Changes not reflected immediately

**Solutions**:
1. Click refresh button
2. Check auto-refresh settings
3. Clear browser cache
4. Verify API connectivity
5. Wait for cache timeout (5 minutes)

#### Bulk Operations Failing

**Problem**: Some items fail during bulk operation

**Review**:
1. Check error messages
2. Verify permissions on all items
3. Ensure items are in correct state
4. Try smaller batches
5. Check for locked items

#### Missing History

**Problem**: Cannot see previous changes

**Check**:
1. History may be limited by retention policy
2. Ensure you have view permissions
3. Check date range filters
4. Verify audit logging is enabled

### Error Messages

#### "No work item ID provided"
- Ensure you're accessing from a work item context
- Check URL parameters
- Verify configuration

#### "Failed to update status"
- Check network connection
- Verify permissions
- Ensure work item not locked
- Review validation rules

#### "Operation timed out"
- Check server status
- Verify network speed
- Try again with fewer items
- Contact support if persistent

## Best Practices

### 1. Documentation Standards

**Always Document**:
- ✅ Provide clear, specific reasons when pausing
- ✅ Include client instructions or requirements
- ✅ Note expected resume date if known
- ✅ Reference related documents or communications

**Reason Examples**:
- Good: "Client requested pause until board meeting on 15/2"
- Poor: "Paused"

### 2. Regular Reviews

**Daily**:
- Check paused items each morning
- Review urgent indicators (>24 hours)
- Action items requiring immediate attention

**Weekly**:
- Comprehensive review of all paused items
- Follow up on items paused >7 days
- Update next action dates

**Monthly**:
- Generate status reports
- Analyze pause patterns
- Review automation rules
- Update procedures as needed

### 3. Team Coordination

**Communication**:
- Notify team when pausing shared matters
- Document handover requirements
- Use consistent pause reasons
- Set up team dashboards

**Permissions**:
- Ensure appropriate access levels
- Regular permission audits
- Document role responsibilities
- Training for new team members

### 4. Automation Guidelines

**Use Automation For**:
- Routine status checks
- Time-based escalations
- Compliance requirements
- Standard workflows

**Manual Review For**:
- Complex client situations
- Sensitive matters
- Exceptional cases
- Quality control

### 5. Performance Tips

**Optimize Dashboard**:
- Limit widgets to essential ones
- Set appropriate refresh intervals
- Use compact mode where suitable
- Organize by priority

**Efficient Bulk Operations**:
- Filter before selecting
- Process in batches of 20-30
- Schedule during low-usage times
- Monitor success rates

## Quick Reference

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Refresh | F5 |
| Select All | Ctrl+A |
| Open Panel | Enter |
| Close Panel | Esc |

### Status Indicators

| Icon | Status | Meaning |
|------|--------|---------|
| 🟢 | Active | Advice ongoing |
| 🟡 | Paused | Temporarily suspended |
| 🔴 | Urgent | Paused >24 hours |
| ⏸️ | Paused | Visual indicator |
| ▶️ | Active | Play indicator |

### Time Thresholds

| Duration | Alert Level | Action Required |
|----------|-------------|-----------------|
| <24 hours | Normal | Monitor |
| 24-48 hours | Warning | Review |
| 48-72 hours | Important | Follow up |
| >7 days | Critical | Escalate |

### Common Workflows

```
New Matter → Set Active → Monitor → Client Request → Pause → 
Review → Resume → Continue → Complete
```

### API Limits

- Maximum items per bulk operation: 50
- API timeout: 30 seconds
- Cache duration: 5 minutes
- Retry attempts: 3
- Auto-refresh minimum: 10 seconds

### Support Contacts

- **Technical Support**: Use in-app help system
- **Feature Requests**: Submit through feedback portal
- **Training**: Contact practice manager
- **Emergency**: Follow escalation procedures

## Conclusion

AdviceManager provides comprehensive tools for managing ongoing legal advice workflows. By following this guide and best practices, you can efficiently track, manage, and report on advice status across your practice.

Remember to:
- Document all status changes
- Review paused items regularly
- Use automation appropriately
- Maintain clear communication
- Follow your organization's procedures

For additional help, consult your system administrator or practice manager.