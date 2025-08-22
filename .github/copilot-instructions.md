## Copilot instructions – AlterspectiveIDE (ShareDo)

Be productive fast by following these repo-specific rules.

### Big picture
- Ship ShareDo IDE components in `/_IDE` (no build). Focus area: `_IDE/Alt/AdviceManagement`.
- Layers: Blades/Widgets → Services → Models; state lives in Work Item attributes; EventBus keeps UI in sync.
- Namespaces: UI `Alt.AdviceManagement.*`, shared `Alt.OngoingAdvice.*` (use `namespace("…")`).

### Conventions (nonstandard vs typical web)
- Use `$ajax.api` (never `$.ajax`) for auth-aware API calls.
- Persist booleans as strings: `"true"|"false"`; dates are ISO strings; UI formats via `moment` (`DD/MM/YYYY HH:mm`).
- Blade manifests are `*.panel.json`; resource paths must be absolute from `/_ideFiles`.
- Use prototype functions, not ES6 classes.

### Attributes (ongoing advice)
- Keys are registered under `alt_ongoing_advice_*`; mapping lives in `Blades/AdvicePauseResume/services/AttributeApiService.js`.
- Core: `enabled`, `pausedDate`, `pausedBy`, `pauseReason`, `resumedDate`, `resumedBy`, `resumeReason`, `nextAdviceDate`.

### API patterns (copy these)
- Read (bulk first): GET `/api/v1/public/workItem/{id}/attributesCollection` → `[ { attribute, value } ]`; fallback GET `/attributes/{name}` → `{ value }`.
- Write: POST `/attributes/{name}` with `{ value: "…" }`.
- Example: `new Alt.OngoingAdvice.Services.AttributeApiService().setOngoingAdviceAttributes(id, { pausedDate: new Date().toISOString() })`.

### Events (keep UIs in sync)
- Broadcast on all three: `$ui.eventManager.broadcast(...)`, `Alt.AdviceManagement.Common.EventBus.publish(...)`, and `document.dispatchEvent(new CustomEvent(...))`. Filter by `workItemId`; unsubscribe on dispose. See `EVENTBUS_EXPLANATION.md`.

### Blade/widget usage
- Open: `$ui.stacks.openPanel("Alt.AdviceManagement.AdvicePauseResumeBlade", { workItemId })`.
- Don’t manually bind Knockout—ShareDo does it. For client logs use `$ui.log.debug|warning|error`.

### UI and $ui surfaces
- Events: prefer `$ui.eventManager.broadcast(name, data)`; subscribe via `$ui.eventManager.subscribe(name, handler)` and (where available) `$ui.events.on(name, handler)`. Always filter by `workItemId` and unsubscribe on dispose.
- Panels/Blades: open with `$ui.stacks.openPanel(...)` (some contexts expose `$ui.bladeManager.open({ id, workItemId })`). Manifests are `*.panel.json`.
- Logging: client-side use `$ui.log.debug|warning|error`; server-side workflow actions use lowercase `log.Information|Warning|Error` (not `Log.*`).
- Models/Controllers: use prototype functions under a proper `namespace("…")`; do not call `ko.applyBindings` manually.

### Build widgets, panels, blades (quick patterns)
- Widget: `<Name>.widget.json`, `<Name>.html` (Knockout bindings), `<Name>.js` (controller), optional designer under `designer/` with matching files. Use `$ajax.api` for data; auto-hide/show via observables.
- Panel/Blade: `*.panel.json` + controller JS; extract `workItemId` from config or `stackModel`; create ribbon/actions in the controller; use services under `Alt.OngoingAdvice.Services.*`.
- Portal/ShareDo widgets: follow ShareDo widget chrome/theming; absolute paths from `/_ideFiles`; no custom binding/bootstrap beyond platform conventions.

### Workflow actions (how to build)
- File set: `ActionName.js`, `ActionName.action.json`, `ActionName.wf-action.json`, factory/template/designer files as per `CLAUDE.md` guidance.
- Logging: use `log.Information/Warning/Error` (lowercase). Implement validation, retries (exponential backoff), timeouts, and clear branching (success/paused/resumed/noAction/error).
- Inputs/Outputs: accept context/configuration; return a branch key and a payload with `workItemId`, status, attempts, duration, and logs.
- APIs: reuse the same `$ajax.api` patterns and attribute mappings; never call unsupported endpoints.

### Workflow-side effects
- `toggleOngoingAdvice` also creates a child “status-change” work item via POST `/api/v1/public/workItem/` and mirrors `attributesToSet`. Don’t change `workType`, `formId`, or mapping without reviewing downstream usage (`triggerAdviceWorkflow`).

### Dev workflow
- Deploy via ShareDo VS Code extension by selecting `/_IDE`; files appear under `/_ideFiles/Alt/...` in ShareDo.
- Test with a real `workItemId`; record calls in `API-REGISTRY.md`.

### Do / Don’t
- Do: `$ajax.api`, string booleans, ISO dates, absolute `/_ideFiles` paths, attribute name map.
- Don’t: invent attribute names (update registry first), call unsupported endpoints (`workItem/{id}/history` doesn’t exist), or use `$.ajax`.

### References
- Root: `README.md`, `SHAREDO-IDE-REFERENCE.md`, `SHAREDO-API-BEST-PRACTICES.md`, `SHAREDO-BLADE-STRUCTURE-GUIDE.md`
- Advice module: `TECHNICAL_ARCHITECTURE.md`, `DETAILED_IMPLEMENTATION.md`, `EVENTBUS_EXPLANATION.md`, `CLAUDE.md`
- Code to copy: `_IDE/Alt/AdviceManagement/Blades/AdvicePauseResume/services/AttributeApiService.js`
 - ShareDo Knowledge Base (local): `C:\GitHub\LearnSD\KB` — start with `WORKFLOW-001/002`, `ARCH-001/003/004`, `DEV-001/002/004/005`, and `QUICK_REFERENCE.md` before implementing workflows, blades, or APIs.

Missing or unclear? Tell me which section to refine.
