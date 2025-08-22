# BladeBouncer Conditional Routing

## Overview

BladeBouncer now supports conditional routing, allowing you to dynamically determine which blade to open based on API response data. This is particularly useful when you need to open different blades based on entity types, status values, or any other data conditions.

## Key Features

- **Rule-based routing**: Define multiple conditions that are evaluated in order
- **Multiple operators**: Support for equals, contains, exists, numeric comparisons, and more
- **Fallback support**: Define a default blade when no conditions match
- **Backward compatible**: Existing configurations continue to work unchanged

## Configuration Structure

```json
{
  "conditionalRules": [
    {
      "condition": {
        "path": "workItem.roles.client.ods.type.name",
        "operator": "equals",
        "value": "people"
      },
      "targetBlade": "Sharedo.Core.Case.Panels.Ods.AddEditPerson",
      "configForTargetBlade": [/* optional blade-specific config */]
    }
  ],
  "defaultTargetBlade": "Sharedo.Core.Case.Panels.Ods.ViewEntity",
  "tokenSources": ["workItem"]
}
```

## Common Use Cases

### 1. Entity Type Routing (People vs Organisation)

```json
{
  "conditionalRules": [
    {
      "condition": {
        "path": "workItem.roles.client.ods.type.name",
        "operator": "equals",
        "value": "people"
      },
      "targetBlade": "Sharedo.Core.Case.Panels.Ods.AddEditPerson"
    },
    {
      "condition": {
        "path": "workItem.roles.client.ods.type.name",
        "operator": "equals",
        "value": "organisation"
      },
      "targetBlade": "Sharedo.Core.Case.Panels.Ods.AddEditOrganisation"
    }
  ],
  "defaultTargetBlade": "Sharedo.Core.Case.Panels.Ods.ViewEntity"
}
```

### 2. Priority-Based Routing

```json
{
  "conditionalRules": [
    {
      "condition": {
        "path": "workItem.customFields.priority",
        "operator": "equals",
        "value": "urgent"
      },
      "targetBlade": "Sharedo.Core.Tasks.CreateUrgentTask"
    },
    {
      "condition": {
        "path": "workItem.customFields.priority",
        "operator": "in",
        "value": ["normal", "low"]
      },
      "targetBlade": "Sharedo.Core.Tasks.CreateTask"
    }
  ]
}
```

### 3. Existence Check Routing

```json
{
  "conditionalRules": [
    {
      "condition": {
        "path": "workItem.roles.opponentsolicitor",
        "operator": "exists"
      },
      "targetBlade": "Sharedo.Core.Correspondence.ComposeToOpponent"
    },
    {
      "condition": {
        "path": "workItem.roles.opponentsolicitor",
        "operator": "notexists"
      },
      "targetBlade": "Sharedo.Core.Case.Panels.Ods.AddEditPerson"
    }
  ]
}
```

## Supported Operators

| Operator | Aliases | Description | Example |
|----------|---------|-------------|---------|
| `equals` | `==`, `===` | Exact match | `{"operator": "equals", "value": "people"}` |
| `notEquals` | `!=`, `!==` | Not equal | `{"operator": "notEquals", "value": "closed"}` |
| `contains` | - | String contains | `{"operator": "contains", "value": "litigation"}` |
| `startsWith` | - | String starts with | `{"operator": "startsWith", "value": "family"}` |
| `endsWith` | - | String ends with | `{"operator": "endsWith", "value": "_draft"}` |
| `in` | - | Value in array | `{"operator": "in", "value": ["urgent", "high"]}` |
| `notIn` | - | Value not in array | `{"operator": "notIn", "value": ["closed"]}` |
| `exists` | - | Field exists | `{"operator": "exists"}` |
| `notExists` | - | Field is null/undefined | `{"operator": "notExists"}` |
| `greaterThan` | `>` | Numeric greater | `{"operator": ">", "value": 100000}` |
| `lessThan` | `<` | Numeric less | `{"operator": "<", "value": 5000}` |
| `greaterOrEqual` | `>=` | Greater or equal | `{"operator": ">=", "value": 50}` |
| `lessOrEqual` | `<=` | Less or equal | `{"operator": "<=", "value": 100}` |

## How It Works

1. **Data Fetching**: BladeBouncer fetches data based on `tokenSources` configuration
2. **Rule Evaluation**: Rules are evaluated in order against the fetched data
3. **First Match Wins**: The first matching rule determines the target blade
4. **Fallback**: If no rules match, `defaultTargetBlade` is used (or standard `targetBlade`)
5. **Configuration Merge**: Rule-specific config is merged with global config

## Dynamic Path Resolution

Conditional rules support variable substitution in paths:

```json
{
  "inputConfiguration": [
    {"roleSystemName": "client"}
  ],
  "conditionalRules": [
    {
      "condition": {
        "path": "workItem.roles.{roleSystemName}.ods.type.name",
        "operator": "equals",
        "value": "people"
      },
      "targetBlade": "Sharedo.Core.Case.Panels.Ods.AddEditPerson"
    }
  ]
}
```

## Debugging

Enable `debugMode: true` to see:
- Which conditions are being evaluated
- The actual vs expected values
- Which rule matched (or if default was used)
- The final target blade determination

## Migration Guide

Existing configurations continue to work without changes. To add conditional routing:

1. Move your existing `targetBlade` to `defaultTargetBlade`
2. Add `conditionalRules` array with your conditions
3. Test with `debugMode: true` to verify behavior

## Examples

See `example-config.json` for complete examples including:
- ODS Type Routing
- Priority-Based Task Routing
- Document Type Smart Routing
- Role Existence Check Routing
- Numeric Comparison Routing

## Testing

Use `test-conditional-config.json` for testing scenarios with expected outcomes and test data.