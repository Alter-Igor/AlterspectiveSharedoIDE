# ShareDo UI Context Reference

## Overview
The `$ui.pageContext` object provides runtime access to ShareDo UI context information. All properties are Knockout observables and must be called as functions to retrieve their values.

## Actual Data Structure
Based on real ShareDo implementation (`ko.toJS($ui.pageContext)`), the object contains:

### Important Notes from Actual Data
1. **sharedoId is context-dependent** - Only exists when viewing a work item (matter/task/document)
2. **User properties can be null** - `organisationId` and `presence` are often null
3. **Permissions are arrays** - `systemPermissions` contains string identifiers, `objectPermissions` is context-specific
4. **Currency object is massive** - Contains definitions for ALL ISO currencies, not just enabled ones
5. **All properties are observables** - Must call as functions: `property()` not `property`

## $ui.pageContext Properties

### User Context (`$ui.pageContext.user`)
Access user information through nested observables (actual ShareDo structure):

```javascript
$ui.pageContext.user.username()         // Email address used as username (e.g., "igor@alterspective.com.au")
$ui.pageContext.user.userid()           // UUID format (e.g., "75ab7c74-e377-4dd5-a300-9066e5f82245")
$ui.pageContext.user.firstname()        // User's first name (e.g., "Igor")
$ui.pageContext.user.lastname()         // User's last name (e.g., "Alterspective")
$ui.pageContext.user.presence()         // User presence status (often null)
$ui.pageContext.user.organisationId()   // Organization ID (can be null)
$ui.pageContext.user.personaSystemName() // User role/persona (e.g., "Manager", "Lawyer", "Admin")
```

### Page & Portal Context
```javascript
$ui.pageContext.pageSystemName()     // Current page identifier (e.g., "menus", "dashboard")
$ui.pageContext.pageTitle()          // Current page title (e.g., "Sharedo type modeller")
$ui.pageContext.portalSystemName()   // Portal system name (e.g., "modeller-sharedotypes")
$ui.pageContext.portalTitle()        // Portal title (e.g., "Model sharedo type")
$ui.pageContext.portalBrandLogoUrl() // Portal logo URL (e.g., "/themes/sharedo-default/images/portal-brand-logo")
$ui.pageContext.sharedoType()        // Current ShareDo type (e.g., "matter", "task", "document")
$ui.pageContext.sharedoId()          // Current work item ID (only available in work item context)
```

### Currency & Localization
```javascript
$ui.pageContext.contextCurrencyCode()   // Context currency code (e.g., "AUD", "USD", "GBP")
$ui.pageContext.contextCurrencySymbol() // Context currency symbol (e.g., "$", "£", "€")
$ui.pageContext.currency                // Object with ALL ISO currency definitions (extensive)

// Localization nested object (actual structure)
$ui.pageContext.localisation.defaultCountrySystemName() // Country code (e.g., "aus", "gbr", "usa")
$ui.pageContext.localisation.defaultDialingCode()      // Phone prefix (e.g., "+61", "+44", "+1")
$ui.pageContext.localisation.defaultCultureCode()      // Culture/locale (e.g., "en-GB", "en-US", "en-AU")
$ui.pageContext.localisation.defaultTimeZone()         // Timezone (e.g., "Australia/Sydney", "Europe/London")
```

### Request & Parameters
```javascript
$ui.pageContext.request()                    // Current request object
$ui.pageContext.requestParameter(key, defaultValue) // Get request parameter
$ui.pageContext.map(key)                     // Map function for context values
```

### Organization & Permissions
```javascript
$ui.pageContext.defaultOrg()         // Default organization name (e.g., "Sharedo", "Maurice Blackburn")
$ui.pageContext.defaultOrgId()       // Default organization UUID (e.g., "33c81671-8211-472e-a1b1-40e14a378945")
$ui.pageContext.objectPermissions()  // Object-level permissions (array, often empty [])
$ui.pageContext.systemPermissions()  // System-level permissions (array of permission strings like "core.documents.upload")
```

### Other Properties
```javascript
$ui.pageContext.cspNonce()          // Content Security Policy nonce (e.g., "c7a7dd1c62f9432e8044914484ed80d1")
$ui.pageContext.debugMode()         // Debug mode flag (boolean: true/false)
$ui.pageContext.terminology()       // Terminology customizations (array of terminology objects)
$ui.pageContext.request()           // Request object (usually empty {} or contains route parameters)
```

## Usage in BladeBouncer

### In Token Expressions
Use these in configuration with the `$ui.pageContext` prefix:
```javascript
{
    "userId": "$ui.pageContext.user.userid()",
    "fullName": "$ui.pageContext.user.firstname() + ' ' + $ui.pageContext.user.lastname()",
    "orgId": "$ui.pageContext.user.organisationId()",
    "pageType": "$ui.pageContext.pageSystemName()"
}
```

### In JavaScript Expressions ($[...])
Access through the $ui object in sandboxed expressions:
```javascript
{
    "userDisplay": "$[$ui.pageContext.user.firstname() + ' ' + $ui.pageContext.user.lastname()]",
    "timestamp": "$[new Date().toISOString() + ' - ' + $ui.pageContext.user.username()]",
    "contextInfo": "$[concat($ui.pageContext.portalTitle(), ' - ', $ui.pageContext.pageTitle())]",
    "currencyDisplay": "$[$ui.pageContext.contextCurrencySymbol() + '100.00']"
}
```

### Complex Examples
```javascript
{
    "configuration": {
        "targetBlade": "Custom.Blade",
        "configForTargetBlade": [
            {
                "userId": "$ui.pageContext.user.userid()",
                "userName": "$ui.pageContext.user.username()",
                "fullName": "$[concat($ui.pageContext.user.firstname(), ' ', $ui.pageContext.user.lastname())]",
                "orgContext": "$[$ui.pageContext.user.organisationId() || $ui.pageContext.defaultOrgId()]",
                "pageContext": {
                    "page": "$ui.pageContext.pageSystemName()",
                    "portal": "$ui.pageContext.portalSystemName()",
                    "title": "$ui.pageContext.pageTitle()"
                },
                "localeInfo": {
                    "currency": "$ui.pageContext.contextCurrencyCode()",
                    "country": "$[$ui.pageContext.localisation.defaultCountrySystemName()]",
                    "timezone": "$[$ui.pageContext.localisation.defaultTimeZone()]"
                },
                "debugInfo": "$[$ui.pageContext.debugMode() ? 'DEBUG:' + $ui.pageContext.user.userid() : '']"
            }
        ]
    }
}
```

## Important Notes

1. **All properties are Knockout observables** - Must be called as functions with parentheses `()`
2. **Null checking** - Some properties may be undefined in certain contexts
3. **Context availability** - Not all properties are available in all pages/portals
4. **Performance** - Cache values when using multiple times in expressions
5. **Security** - User permissions should be validated server-side

## Real-World Data Example

From actual ShareDo instance:
```json
{
    "user": {
        "username": "igor@alterspective.com.au",
        "userid": "75ab7c74-e377-4dd5-a300-9066e5f82245",
        "firstname": "Igor",
        "lastname": "Alterspective",
        "presence": null,
        "organisationId": null,
        "personaSystemName": "Manager"
    },
    "pageSystemName": "menus",
    "portalSystemName": "modeller-sharedotypes",
    "sharedoType": "matter",
    "contextCurrencyCode": "AUD",
    "contextCurrencySymbol": "$",
    "defaultOrg": "Sharedo",
    "defaultOrgId": "33c81671-8211-472e-a1b1-40e14a378945",
    "localisation": {
        "defaultCountrySystemName": "aus",
        "defaultDialingCode": "+61",
        "defaultCultureCode": "en-GB",
        "defaultTimeZone": "Australia/Sydney"
    }
}
```

## Error Handling

When accessing nested properties, use defensive coding:
```javascript
// Safe access pattern
"$[defaultValue($ui.pageContext.user.firstname(), 'Unknown')]"

// Conditional access
"$[$ui.pageContext.user ? $ui.pageContext.user.userid() : null]"

// Fallback values
"$[$ui.pageContext.defaultOrgId() || 'NO_ORG']"
```