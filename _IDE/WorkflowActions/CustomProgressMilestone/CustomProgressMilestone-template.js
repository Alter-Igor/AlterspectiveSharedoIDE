"use strict";

// src/NodeBased/WorkflowActions/CustomProgressMilestone/CustomProgressMilestone-template.ts
log.Information("");
log.Information("--- Custom Progress Milestone ---");
var configuration = $model.Configuration;
var connections = $model.Connections;
var workItemId = ctx[configuration.workItemIdVariable];
if (!workItemId) {
  throw new Error("Cannot progress work item - no work item id");
}
function setPhaseByFeature() {
  let req = {
    "search": {
      "page": { "page": 1, "rowsPerPage": 20 },
      "sort": { "direction": "ascending", "orderBy": "title" },
      "workItemIds": [workItemId]
    },
    "enrich": [
      { "path": "title" },
      { "path": "type.systemName" },
      { "path": "phase.systemName" },
      { "path": "reference" }
    ]
  };
  log.Information("Getting ShareDo Details for work item " + workItemId);
  let httpResultFindByQuery = sharedo.http.post("/api/v1/public/workItem/findByQuery", req);
  httpResultFindByQuery.success = true;
  if (!httpResultFindByQuery.success) {
    log.Error("Error getting ShareDo Details here is the JSON result");
    log.Information("");
    log.Information(JSON.stringify(httpResultFindByQuery, null, 4));
    log.Information("");
    throw new Error("Failed to jump to phase - API returned '".concat(httpResultFindByQuery.status, "'"));
  }
  let typeSystemName = httpResultFindByQuery.body.results[0].data["type.systemName"];
  let currentPhase = httpResultFindByQuery.body.results[0].data["phase.systemName"];
  let title = httpResultFindByQuery.body.results[0].data["title"];
  log.Information("");
  log.Information("----------------- Details of Sharedo ---------------------------------");
  log.Information("");
  log.Information("Type system name is    : ".concat(typeSystemName));
  log.Information("Current phase is       : ".concat(currentPhase));
  log.Information("Title is               : ".concat(title));
  log.Information("");
  log.Information("----------------- Details of Sharedo ---------------------------------");
  log.Information("");
  log.Information("Getting phases on type ".concat(typeSystemName, " that have feature flag ").concat(configuration.phaseFeature, " enabled"));
  let httpResultFeature = sharedo.http.get("/api/featureframework/flags/".concat(configuration.phaseFeature, "/").concat(typeSystemName, "/enabledPhases"));
  if (!httpResultFeature.success) {
    log.Error("- Error getting sub features for type ".concat(typeSystemName));
    log.Information("");
    log.Information(JSON.stringify(httpResultFeature, null, 4));
    log.Information("");
    throw new Error("Failed to jump to phase - API returned '".concat(httpResultFeature.status, "'"));
  }
  if (!httpResultFeature.body || httpResultFeature.body.length == 0) {
    log.Warning("No features found - Ignoring this action, though you may want to check the configuration");
    return false;
  }
  log.Information("- Found ".concat(configuration.phaseFeature, " and has been used on ").concat(httpResultFeature.body.length, " phase"));
  if (httpResultFeature.body.length > 1) {
    log.Warning("  - More than one feature found! Could be an issue - Check these phases: ".concat(JSON.stringify(httpResultFeature.body)));
  }
  let phaseToSet = httpResultFeature.body[0];
  log.Information("- Setting phase to ".concat(phaseToSet));
  configuration.phaseSystemName = phaseToSet;
  log.Information("- Calling setPhase(".concat(phaseToSet, ")"));
  setPhase(phaseToSet);
  return true;
}
var setPhase = (targetPhase) => {
  if (!targetPhase) {
    throw new Error("Cannot progress work item - no target phase");
  }
  if (configuration.jumpToPhase) {
    log.Information("Jumping phase of work item ".concat(workItemId, " to ").concat(targetPhase));
    let model = {
      toPhaseSystemName: targetPhase,
      description: sharedo.buildString(configuration.description || ""),
      reasonOptionSetValue: configuration.reasonType,
      suppressEvents: configuration.suppressEvents,
      suppressGuards: configuration.suppressChecksAndGuards
    };
    log.Information("------------------ Jump --------------------");
    log.Information("Jump model: ".concat(JSON.stringify(model)));
    let httpResult = sharedo.http.post("/api/sharedo/".concat(workItemId, "/phase/jumpTo"), model);
    if (!httpResult.success) {
      log.Information("Failed DOING JUMP TO PHASE - JSON result:");
      log.Information("");
      log.Information(JSON.stringify(httpResult, null, 4));
      log.Information("");
      if (httpResult.status === "Forbidden") {
        throw new Error("Failed to jump to phase - API returned '".concat(httpResult.status, "' - please verify that the Event Engine application has the 'core.admin.jumptophase' permission"));
      }
      throw new Error("Failed to jump to phase - API returned '".concat(httpResult.status, "'"));
    }
    log.Information("------------------ Jump Completed --------------------");
    return true;
  }
  log.Information("------------------ Set Phase --------------------");
  log.Information("- Progress milestone action of work item ".concat(workItemId, " to ").concat(targetPhase));
  sharedo.setPhase(workItemId, targetPhase, false, sharedo.buildString(configuration.reasonText || ""));
  log.Information("- Progress milestone action of work item ".concat(workItemId, " to ").concat(targetPhase, " has been completed"));
  log.Information("------------------ Set Phase Completed --------------------");
  return true;
};
var success = false;
if (!configuration.dynamic) {
  let targetPhase = configuration.phaseSystemName;
  log.Information("Static phase jump for work item ".concat(workItemId));
  if (!targetPhase) {
    throw new Error("Cannot progress work item - no target phase");
  }
  success = setPhase(targetPhase);
} else {
  log.Information("Dynamic phase jump for work item ".concat(workItemId));
  success = setPhaseByFeature();
}
if (success) {
  log.Information("Progress Milestone Success - calling connection [success]");
  if (connections.success) {
    trigger.SubProcess(connections.success.step).Now();
  } else {
    log.Warning("No connection [success] found");
  }
} else {
  log.Information("Progress Milestone Failed - calling connection [failed]");
  if (connections.failed) {
    trigger.SubProcess(connections.failed.step).Now();
  } else {
    log.Warning("No connection [failed] found");
  }
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3JjL05vZGVCYXNlZC9Xb3JrZmxvd0FjdGlvbnMvQ3VzdG9tUHJvZ3Jlc3NNaWxlc3RvbmUvQ3VzdG9tUHJvZ3Jlc3NNaWxlc3RvbmUtdGVtcGxhdGUudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIlxuaW1wb3J0IHsgQ29uZmlndXJhdGlvblR5cGUsIEh0dHBSZXN1bHRUeXBlLCBJTWF0dGVyU2VhcmNoUmVzdWx0IH0gZnJvbSBcIi4vSUNvbmZpZ3VyYXRpb25cIjtcblxubG9nLkluZm9ybWF0aW9uKGBgKTtcbmxvZy5JbmZvcm1hdGlvbihgLS0tIEN1c3RvbSBQcm9ncmVzcyBNaWxlc3RvbmUgLS0tYCk7XG5cbmxldCBjb25maWd1cmF0aW9uOiBDb25maWd1cmF0aW9uVHlwZSA9ICRtb2RlbC5Db25maWd1cmF0aW9uO1xubGV0IGNvbm5lY3Rpb25zID0gJG1vZGVsLkNvbm5lY3Rpb25zO1xubGV0IHdvcmtJdGVtSWQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IGN0eFtjb25maWd1cmF0aW9uLndvcmtJdGVtSWRWYXJpYWJsZV07XG5cbmlmICghd29ya0l0ZW1JZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBwcm9ncmVzcyB3b3JrIGl0ZW0gLSBubyB3b3JrIGl0ZW0gaWRcIik7XG59XG5cbmZ1bmN0aW9uIHNldFBoYXNlQnlGZWF0dXJlKCkge1xuICAgIC8vZ2V0IHRoZSBtYXR0ZXJcbiAgICBsZXQgcmVxID0ge1xuICAgICAgICBcInNlYXJjaFwiOiB7XG4gICAgICAgICAgICBcInBhZ2VcIjogeyBcInBhZ2VcIjogMSwgXCJyb3dzUGVyUGFnZVwiOiAyMCB9LFxuICAgICAgICAgICAgXCJzb3J0XCI6IHsgXCJkaXJlY3Rpb25cIjogXCJhc2NlbmRpbmdcIiwgXCJvcmRlckJ5XCI6IFwidGl0bGVcIiB9LFxuICAgICAgICAgICAgXCJ3b3JrSXRlbUlkc1wiOiBbd29ya0l0ZW1JZF1cbiAgICAgICAgfSxcbiAgICAgICAgXCJlbnJpY2hcIjogW1xuICAgICAgICAgICAgeyBcInBhdGhcIjogXCJ0aXRsZVwiIH0sXG4gICAgICAgICAgICB7IFwicGF0aFwiOiBcInR5cGUuc3lzdGVtTmFtZVwiIH0sXG4gICAgICAgICAgICB7IFwicGF0aFwiOiBcInBoYXNlLnN5c3RlbU5hbWVcIiB9LFxuICAgICAgICAgICAgeyBcInBhdGhcIjogXCJyZWZlcmVuY2VcIiB9XG4gICAgICAgIF1cbiAgICB9XG4gICAgbG9nLkluZm9ybWF0aW9uKFwiR2V0dGluZyBTaGFyZURvIERldGFpbHMgZm9yIHdvcmsgaXRlbSBcIiArIHdvcmtJdGVtSWQpO1xuICAgIGxldCBodHRwUmVzdWx0RmluZEJ5UXVlcnk6IEh0dHBSZXN1bHRUeXBlPElNYXR0ZXJTZWFyY2hSZXN1bHQ+ID0gc2hhcmVkby5odHRwLnBvc3QoYC9hcGkvdjEvcHVibGljL3dvcmtJdGVtL2ZpbmRCeVF1ZXJ5YCwgcmVxKTtcblxuICAgIGh0dHBSZXN1bHRGaW5kQnlRdWVyeS5zdWNjZXNzID0gdHJ1ZTtcbiAgICBpZiAoIWh0dHBSZXN1bHRGaW5kQnlRdWVyeS5zdWNjZXNzKSB7XG4gICAgICAgIGxvZy5FcnJvcihcIkVycm9yIGdldHRpbmcgU2hhcmVEbyBEZXRhaWxzIGhlcmUgaXMgdGhlIEpTT04gcmVzdWx0XCIpO1xuICAgICAgICBsb2cuSW5mb3JtYXRpb24oJycpO1xuICAgICAgICBsb2cuSW5mb3JtYXRpb24oSlNPTi5zdHJpbmdpZnkoaHR0cFJlc3VsdEZpbmRCeVF1ZXJ5LCBudWxsLCA0KSk7XG4gICAgICAgIGxvZy5JbmZvcm1hdGlvbignJyk7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGp1bXAgdG8gcGhhc2UgLSBBUEkgcmV0dXJuZWQgJyR7aHR0cFJlc3VsdEZpbmRCeVF1ZXJ5LnN0YXR1c30nYCk7XG4gICAgfVxuXG4gICAgbGV0IHR5cGVTeXN0ZW1OYW1lID0gaHR0cFJlc3VsdEZpbmRCeVF1ZXJ5LmJvZHkucmVzdWx0c1swXS5kYXRhW1widHlwZS5zeXN0ZW1OYW1lXCJdO1xuICAgIGxldCBjdXJyZW50UGhhc2UgPSBodHRwUmVzdWx0RmluZEJ5UXVlcnkuYm9keS5yZXN1bHRzWzBdLmRhdGFbXCJwaGFzZS5zeXN0ZW1OYW1lXCJdO1xuICAgIGxldCB0aXRsZSA9IGh0dHBSZXN1bHRGaW5kQnlRdWVyeS5ib2R5LnJlc3VsdHNbMF0uZGF0YVtcInRpdGxlXCJdO1xuXG4gICAgbG9nLkluZm9ybWF0aW9uKGBgKTtcbiAgICBsb2cuSW5mb3JtYXRpb24oYC0tLS0tLS0tLS0tLS0tLS0tIERldGFpbHMgb2YgU2hhcmVkbyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1gKTtcbiAgICBsb2cuSW5mb3JtYXRpb24oYGApO1xuICAgIGxvZy5JbmZvcm1hdGlvbihgVHlwZSBzeXN0ZW0gbmFtZSBpcyAgICA6ICR7dHlwZVN5c3RlbU5hbWV9YCk7XG4gICAgbG9nLkluZm9ybWF0aW9uKGBDdXJyZW50IHBoYXNlIGlzICAgICAgIDogJHtjdXJyZW50UGhhc2V9YCk7XG4gICAgbG9nLkluZm9ybWF0aW9uKGBUaXRsZSBpcyAgICAgICAgICAgICAgIDogJHt0aXRsZX1gKTtcbiAgICBsb2cuSW5mb3JtYXRpb24oYGApO1xuICAgIGxvZy5JbmZvcm1hdGlvbihgLS0tLS0tLS0tLS0tLS0tLS0gRGV0YWlscyBvZiBTaGFyZWRvIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLWApO1xuICAgIGxvZy5JbmZvcm1hdGlvbihgYCk7XG5cbiAgICBsb2cuSW5mb3JtYXRpb24oYEdldHRpbmcgcGhhc2VzIG9uIHR5cGUgJHt0eXBlU3lzdGVtTmFtZX0gdGhhdCBoYXZlIGZlYXR1cmUgZmxhZyAke2NvbmZpZ3VyYXRpb24ucGhhc2VGZWF0dXJlfSBlbmFibGVkYCk7XG4gICAgbGV0IGh0dHBSZXN1bHRGZWF0dXJlOiBIdHRwUmVzdWx0VHlwZTxzdHJpbmdbXT4gPSBzaGFyZWRvLmh0dHAuZ2V0KGAvYXBpL2ZlYXR1cmVmcmFtZXdvcmsvZmxhZ3MvJHtjb25maWd1cmF0aW9uLnBoYXNlRmVhdHVyZX0vJHt0eXBlU3lzdGVtTmFtZX0vZW5hYmxlZFBoYXNlc2ApO1xuXG4gICAgaWYgKCFodHRwUmVzdWx0RmVhdHVyZS5zdWNjZXNzKSB7XG4gICAgICAgIGxvZy5FcnJvcihgLSBFcnJvciBnZXR0aW5nIHN1YiBmZWF0dXJlcyBmb3IgdHlwZSAke3R5cGVTeXN0ZW1OYW1lfWApO1xuICAgICAgICBsb2cuSW5mb3JtYXRpb24oJycpO1xuICAgICAgICBsb2cuSW5mb3JtYXRpb24oSlNPTi5zdHJpbmdpZnkoaHR0cFJlc3VsdEZlYXR1cmUsIG51bGwsIDQpKTtcbiAgICAgICAgbG9nLkluZm9ybWF0aW9uKCcnKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8ganVtcCB0byBwaGFzZSAtIEFQSSByZXR1cm5lZCAnJHtodHRwUmVzdWx0RmVhdHVyZS5zdGF0dXN9J2ApO1xuICAgIH1cblxuICAgIGlmICghaHR0cFJlc3VsdEZlYXR1cmUuYm9keSB8fCBodHRwUmVzdWx0RmVhdHVyZS5ib2R5Lmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIGxvZy5XYXJuaW5nKFwiTm8gZmVhdHVyZXMgZm91bmQgLSBJZ25vcmluZyB0aGlzIGFjdGlvbiwgdGhvdWdoIHlvdSBtYXkgd2FudCB0byBjaGVjayB0aGUgY29uZmlndXJhdGlvblwiKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxvZy5JbmZvcm1hdGlvbihgLSBGb3VuZCAke2NvbmZpZ3VyYXRpb24ucGhhc2VGZWF0dXJlfSBhbmQgaGFzIGJlZW4gdXNlZCBvbiAke2h0dHBSZXN1bHRGZWF0dXJlLmJvZHkubGVuZ3RofSBwaGFzZWApO1xuICAgIGlmIChodHRwUmVzdWx0RmVhdHVyZS5ib2R5Lmxlbmd0aCA+IDEpIHtcbiAgICAgICAgbG9nLldhcm5pbmcoYCAgLSBNb3JlIHRoYW4gb25lIGZlYXR1cmUgZm91bmQhIENvdWxkIGJlIGFuIGlzc3VlIC0gQ2hlY2sgdGhlc2UgcGhhc2VzOiAke0pTT04uc3RyaW5naWZ5KGh0dHBSZXN1bHRGZWF0dXJlLmJvZHkpfWApO1xuICAgIH1cbiAgICBsZXQgcGhhc2VUb1NldCA9IGh0dHBSZXN1bHRGZWF0dXJlLmJvZHlbMF07XG5cbiAgICBsb2cuSW5mb3JtYXRpb24oYC0gU2V0dGluZyBwaGFzZSB0byAke3BoYXNlVG9TZXR9YCk7XG4gICAgY29uZmlndXJhdGlvbi5waGFzZVN5c3RlbU5hbWUgPSBwaGFzZVRvU2V0O1xuICAgIGxvZy5JbmZvcm1hdGlvbihgLSBDYWxsaW5nIHNldFBoYXNlKCR7cGhhc2VUb1NldH0pYCk7XG4gICAgc2V0UGhhc2UocGhhc2VUb1NldCk7XG4gICAgcmV0dXJuIHRydWU7XG5cbn1cblxuY29uc3Qgc2V0UGhhc2UgPSAodGFyZ2V0UGhhc2U6IHN0cmluZyk6IGJvb2xlYW4gPT4ge1xuXG4gICAgaWYgKCF0YXJnZXRQaGFzZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBwcm9ncmVzcyB3b3JrIGl0ZW0gLSBubyB0YXJnZXQgcGhhc2VgKTtcbiAgICB9XG5cbiAgICBpZiAoY29uZmlndXJhdGlvbi5qdW1wVG9QaGFzZSkge1xuICAgICAgICBsb2cuSW5mb3JtYXRpb24oYEp1bXBpbmcgcGhhc2Ugb2Ygd29yayBpdGVtICR7d29ya0l0ZW1JZH0gdG8gJHt0YXJnZXRQaGFzZX1gKTtcblxuICAgICAgICBsZXQgbW9kZWwgPSB7XG4gICAgICAgICAgICB0b1BoYXNlU3lzdGVtTmFtZTogdGFyZ2V0UGhhc2UsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogc2hhcmVkby5idWlsZFN0cmluZyhjb25maWd1cmF0aW9uLmRlc2NyaXB0aW9uIHx8IFwiXCIpLFxuICAgICAgICAgICAgcmVhc29uT3B0aW9uU2V0VmFsdWU6IGNvbmZpZ3VyYXRpb24ucmVhc29uVHlwZSxcbiAgICAgICAgICAgIHN1cHByZXNzRXZlbnRzOiBjb25maWd1cmF0aW9uLnN1cHByZXNzRXZlbnRzLFxuICAgICAgICAgICAgc3VwcHJlc3NHdWFyZHM6IGNvbmZpZ3VyYXRpb24uc3VwcHJlc3NDaGVja3NBbmRHdWFyZHNcbiAgICAgICAgfTtcblxuICAgICAgICBsb2cuSW5mb3JtYXRpb24oYC0tLS0tLS0tLS0tLS0tLS0tLSBKdW1wIC0tLS0tLS0tLS0tLS0tLS0tLS0tYCk7XG4gICAgICAgIGxvZy5JbmZvcm1hdGlvbihgSnVtcCBtb2RlbDogJHtKU09OLnN0cmluZ2lmeShtb2RlbCl9YCk7XG5cbiAgICAgICAgbGV0IGh0dHBSZXN1bHQ6IEh0dHBSZXN1bHRUeXBlPGFueT4gPSBzaGFyZWRvLmh0dHAucG9zdChgL2FwaS9zaGFyZWRvLyR7d29ya0l0ZW1JZH0vcGhhc2UvanVtcFRvYCwgbW9kZWwpO1xuICAgICAgICBpZiAoIWh0dHBSZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgbG9nLkluZm9ybWF0aW9uKGBGYWlsZWQgRE9JTkcgSlVNUCBUTyBQSEFTRSAtIEpTT04gcmVzdWx0OmApO1xuICAgICAgICAgICAgbG9nLkluZm9ybWF0aW9uKGBgKTtcbiAgICAgICAgICAgIGxvZy5JbmZvcm1hdGlvbihKU09OLnN0cmluZ2lmeShodHRwUmVzdWx0LCBudWxsLCA0KSk7XG4gICAgICAgICAgICBsb2cuSW5mb3JtYXRpb24oYGApO1xuXG4gICAgICAgICAgICBpZiAoaHR0cFJlc3VsdC5zdGF0dXMgPT09ICdGb3JiaWRkZW4nKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8ganVtcCB0byBwaGFzZSAtIEFQSSByZXR1cm5lZCAnJHtodHRwUmVzdWx0LnN0YXR1c30nIC0gcGxlYXNlIHZlcmlmeSB0aGF0IHRoZSBFdmVudCBFbmdpbmUgYXBwbGljYXRpb24gaGFzIHRoZSAnY29yZS5hZG1pbi5qdW1wdG9waGFzZScgcGVybWlzc2lvbmApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8ganVtcCB0byBwaGFzZSAtIEFQSSByZXR1cm5lZCAnJHtodHRwUmVzdWx0LnN0YXR1c30nYCk7XG4gICAgICAgIH1cbiAgICAgICAgbG9nLkluZm9ybWF0aW9uKGAtLS0tLS0tLS0tLS0tLS0tLS0gSnVtcCBDb21wbGV0ZWQgLS0tLS0tLS0tLS0tLS0tLS0tLS1gKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgbG9nLkluZm9ybWF0aW9uKGAtLS0tLS0tLS0tLS0tLS0tLS0gU2V0IFBoYXNlIC0tLS0tLS0tLS0tLS0tLS0tLS0tYCk7XG4gICAgbG9nLkluZm9ybWF0aW9uKGAtIFByb2dyZXNzIG1pbGVzdG9uZSBhY3Rpb24gb2Ygd29yayBpdGVtICR7d29ya0l0ZW1JZH0gdG8gJHt0YXJnZXRQaGFzZX1gKTtcbiAgICBzaGFyZWRvLnNldFBoYXNlKHdvcmtJdGVtSWQsIHRhcmdldFBoYXNlLCBmYWxzZSwgc2hhcmVkby5idWlsZFN0cmluZyhjb25maWd1cmF0aW9uLnJlYXNvblRleHQgfHwgXCJcIikpO1xuICAgIGxvZy5JbmZvcm1hdGlvbihgLSBQcm9ncmVzcyBtaWxlc3RvbmUgYWN0aW9uIG9mIHdvcmsgaXRlbSAke3dvcmtJdGVtSWR9IHRvICR7dGFyZ2V0UGhhc2V9IGhhcyBiZWVuIGNvbXBsZXRlZGApO1xuICAgIGxvZy5JbmZvcm1hdGlvbihgLS0tLS0tLS0tLS0tLS0tLS0tIFNldCBQaGFzZSBDb21wbGV0ZWQgLS0tLS0tLS0tLS0tLS0tLS0tLS1gKTtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxubGV0IHN1Y2Nlc3M6IGJvb2xlYW4gPSBmYWxzZTtcbmlmICghY29uZmlndXJhdGlvbi5keW5hbWljKSB7XG5cbiAgICBsZXQgdGFyZ2V0UGhhc2U6IHN0cmluZyB8IHVuZGVmaW5lZCB8IG51bGwgPSBjb25maWd1cmF0aW9uLnBoYXNlU3lzdGVtTmFtZTtcbiAgICBsb2cuSW5mb3JtYXRpb24oYFN0YXRpYyBwaGFzZSBqdW1wIGZvciB3b3JrIGl0ZW0gJHt3b3JrSXRlbUlkfWApO1xuICAgIGlmICghdGFyZ2V0UGhhc2UpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHByb2dyZXNzIHdvcmsgaXRlbSAtIG5vIHRhcmdldCBwaGFzZVwiKTtcbiAgICB9XG4gICAgc3VjY2VzcyA9IHNldFBoYXNlKHRhcmdldFBoYXNlKTtcbn1cbmVsc2Uge1xuICAgIGxvZy5JbmZvcm1hdGlvbihgRHluYW1pYyBwaGFzZSBqdW1wIGZvciB3b3JrIGl0ZW0gJHt3b3JrSXRlbUlkfWApO1xuICAgIHN1Y2Nlc3MgPSBzZXRQaGFzZUJ5RmVhdHVyZSgpO1xufVxuXG5pZihzdWNjZXNzKSB7XG4gICAgbG9nLkluZm9ybWF0aW9uKFwiUHJvZ3Jlc3MgTWlsZXN0b25lIFN1Y2Nlc3MgLSBjYWxsaW5nIGNvbm5lY3Rpb24gW3N1Y2Nlc3NdXCIpO1xuICAgIGlmIChjb25uZWN0aW9ucy5zdWNjZXNzKSB7XG4gICAgICAgIHRyaWdnZXIuU3ViUHJvY2Vzcyhjb25uZWN0aW9ucy5zdWNjZXNzLnN0ZXApLk5vdygpO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgICBsb2cuV2FybmluZyhcIk5vIGNvbm5lY3Rpb24gW3N1Y2Nlc3NdIGZvdW5kXCIpO1xuICAgIH1cbn1cbmVsc2VcbntcbiAgICBsb2cuSW5mb3JtYXRpb24oXCJQcm9ncmVzcyBNaWxlc3RvbmUgRmFpbGVkIC0gY2FsbGluZyBjb25uZWN0aW9uIFtmYWlsZWRdXCIpO1xuICAgIGlmIChjb25uZWN0aW9ucy5mYWlsZWQpIHtcbiAgICAgICAgdHJpZ2dlci5TdWJQcm9jZXNzKGNvbm5lY3Rpb25zLmZhaWxlZC5zdGVwKS5Ob3coKTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgICAgbG9nLldhcm5pbmcoXCJObyBjb25uZWN0aW9uIFtmYWlsZWRdIGZvdW5kXCIpO1xuICAgIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7OztBQUdBLElBQUksWUFBWSxFQUFFO0FBQ2xCLElBQUksWUFBWSxtQ0FBbUM7QUFFbkQsSUFBSSxnQkFBbUMsT0FBTztBQUM5QyxJQUFJLGNBQWMsT0FBTztBQUN6QixJQUFJLGFBQWlDLElBQUksY0FBYyxrQkFBa0I7QUFFekUsSUFBSSxDQUFDLFlBQVk7QUFDYixRQUFNLElBQUksTUFBTSw2Q0FBNkM7QUFDakU7QUFFQSxTQUFTLG9CQUFvQjtBQUV6QixNQUFJLE1BQU07QUFBQSxJQUNOLFVBQVU7QUFBQSxNQUNOLFFBQVEsRUFBRSxRQUFRLEdBQUcsZUFBZSxHQUFHO0FBQUEsTUFDdkMsUUFBUSxFQUFFLGFBQWEsYUFBYSxXQUFXLFFBQVE7QUFBQSxNQUN2RCxlQUFlLENBQUMsVUFBVTtBQUFBLElBQzlCO0FBQUEsSUFDQSxVQUFVO0FBQUEsTUFDTixFQUFFLFFBQVEsUUFBUTtBQUFBLE1BQ2xCLEVBQUUsUUFBUSxrQkFBa0I7QUFBQSxNQUM1QixFQUFFLFFBQVEsbUJBQW1CO0FBQUEsTUFDN0IsRUFBRSxRQUFRLFlBQVk7QUFBQSxJQUMxQjtBQUFBLEVBQ0o7QUFDQSxNQUFJLFlBQVksMkNBQTJDLFVBQVU7QUFDckUsTUFBSSx3QkFBNkQsUUFBUSxLQUFLLEtBQUssdUNBQXVDLEdBQUc7QUFFN0gsd0JBQXNCLFVBQVU7QUFDaEMsTUFBSSxDQUFDLHNCQUFzQixTQUFTO0FBQ2hDLFFBQUksTUFBTSx1REFBdUQ7QUFDakUsUUFBSSxZQUFZLEVBQUU7QUFDbEIsUUFBSSxZQUFZLEtBQUssVUFBVSx1QkFBdUIsTUFBTSxDQUFDLENBQUM7QUFDOUQsUUFBSSxZQUFZLEVBQUU7QUFDbEIsVUFBTSxJQUFJLE1BQU0sMkNBQTJDLDZCQUFzQixRQUFNLElBQUc7QUFBQSxFQUM5RjtBQUVBLE1BQUksaUJBQWlCLHNCQUFzQixLQUFLLFFBQVEsQ0FBQyxFQUFFLEtBQUssaUJBQWlCO0FBQ2pGLE1BQUksZUFBZSxzQkFBc0IsS0FBSyxRQUFRLENBQUMsRUFBRSxLQUFLLGtCQUFrQjtBQUNoRixNQUFJLFFBQVEsc0JBQXNCLEtBQUssUUFBUSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBRTlELE1BQUksWUFBWSxFQUFFO0FBQ2xCLE1BQUksWUFBWSx3RUFBd0U7QUFDeEYsTUFBSSxZQUFZLEVBQUU7QUFDbEIsTUFBSSxZQUFZLDRCQUE0QixzQkFBZ0I7QUFDNUQsTUFBSSxZQUFZLDRCQUE0QixvQkFBYztBQUMxRCxNQUFJLFlBQVksNEJBQTRCLGFBQU87QUFDbkQsTUFBSSxZQUFZLEVBQUU7QUFDbEIsTUFBSSxZQUFZLHdFQUF3RTtBQUN4RixNQUFJLFlBQVksRUFBRTtBQUVsQixNQUFJLFlBQVksMEJBQTBCLHVCQUFjLDRCQUEyQixxQkFBYyxjQUFZLFdBQVU7QUFDdkgsTUFBSSxvQkFBOEMsUUFBUSxLQUFLLElBQUksK0JBQStCLHFCQUFjLGNBQVksS0FBSSx1QkFBYyxpQkFBZ0I7QUFFOUosTUFBSSxDQUFDLGtCQUFrQixTQUFTO0FBQzVCLFFBQUksTUFBTSx5Q0FBeUMsc0JBQWdCO0FBQ25FLFFBQUksWUFBWSxFQUFFO0FBQ2xCLFFBQUksWUFBWSxLQUFLLFVBQVUsbUJBQW1CLE1BQU0sQ0FBQyxDQUFDO0FBQzFELFFBQUksWUFBWSxFQUFFO0FBQ2xCLFVBQU0sSUFBSSxNQUFNLDJDQUEyQyx5QkFBa0IsUUFBTSxJQUFHO0FBQUEsRUFDMUY7QUFFQSxNQUFJLENBQUMsa0JBQWtCLFFBQVEsa0JBQWtCLEtBQUssVUFBVSxHQUFHO0FBQy9ELFFBQUksUUFBUSwwRkFBMEY7QUFDdEcsV0FBTztBQUFBLEVBQ1g7QUFFQSxNQUFJLFlBQVksV0FBVyxxQkFBYyxjQUFZLDBCQUF5Qix5QkFBa0IsS0FBSyxRQUFNLFNBQVE7QUFDbkgsTUFBSSxrQkFBa0IsS0FBSyxTQUFTLEdBQUc7QUFDbkMsUUFBSSxRQUFRLDRFQUE0RSxZQUFLLFVBQVUsa0JBQWtCLElBQUksRUFBRztBQUFBLEVBQ3BJO0FBQ0EsTUFBSSxhQUFhLGtCQUFrQixLQUFLLENBQUM7QUFFekMsTUFBSSxZQUFZLHNCQUFzQixrQkFBWTtBQUNsRCxnQkFBYyxrQkFBa0I7QUFDaEMsTUFBSSxZQUFZLHNCQUFzQixtQkFBVSxJQUFHO0FBQ25ELFdBQVMsVUFBVTtBQUNuQixTQUFPO0FBRVg7QUFFQSxJQUFNLFdBQVcsQ0FBQyxnQkFBaUM7QUFFL0MsTUFBSSxDQUFDLGFBQWE7QUFDZCxVQUFNLElBQUksTUFBTSw2Q0FBNkM7QUFBQSxFQUNqRTtBQUVBLE1BQUksY0FBYyxhQUFhO0FBQzNCLFFBQUksWUFBWSw4QkFBOEIsbUJBQVUsUUFBTyxtQkFBYTtBQUU1RSxRQUFJLFFBQVE7QUFBQSxNQUNSLG1CQUFtQjtBQUFBLE1BQ25CLGFBQWEsUUFBUSxZQUFZLGNBQWMsZUFBZSxFQUFFO0FBQUEsTUFDaEUsc0JBQXNCLGNBQWM7QUFBQSxNQUNwQyxnQkFBZ0IsY0FBYztBQUFBLE1BQzlCLGdCQUFnQixjQUFjO0FBQUEsSUFDbEM7QUFFQSxRQUFJLFlBQVksOENBQThDO0FBQzlELFFBQUksWUFBWSxlQUFlLFlBQUssVUFBVSxLQUFLLEVBQUc7QUFFdEQsUUFBSSxhQUFrQyxRQUFRLEtBQUssS0FBSyxnQkFBZ0IsbUJBQVUsa0JBQWlCLEtBQUs7QUFDeEcsUUFBSSxDQUFDLFdBQVcsU0FBUztBQUNyQixVQUFJLFlBQVksMkNBQTJDO0FBQzNELFVBQUksWUFBWSxFQUFFO0FBQ2xCLFVBQUksWUFBWSxLQUFLLFVBQVUsWUFBWSxNQUFNLENBQUMsQ0FBQztBQUNuRCxVQUFJLFlBQVksRUFBRTtBQUVsQixVQUFJLFdBQVcsV0FBVyxhQUFhO0FBQ25DLGNBQU0sSUFBSSxNQUFNLDJDQUEyQyxrQkFBVyxRQUFNLGtHQUFpRztBQUFBLE1BQ2pMO0FBQ0EsWUFBTSxJQUFJLE1BQU0sMkNBQTJDLGtCQUFXLFFBQU0sSUFBRztBQUFBLElBQ25GO0FBQ0EsUUFBSSxZQUFZLHdEQUF3RDtBQUN4RSxXQUFPO0FBQUEsRUFDWDtBQUVBLE1BQUksWUFBWSxtREFBbUQ7QUFDbkUsTUFBSSxZQUFZLDRDQUE0QyxtQkFBVSxRQUFPLG1CQUFhO0FBQzFGLFVBQVEsU0FBUyxZQUFZLGFBQWEsT0FBTyxRQUFRLFlBQVksY0FBYyxjQUFjLEVBQUUsQ0FBQztBQUNwRyxNQUFJLFlBQVksNENBQTRDLG1CQUFVLFFBQU8sb0JBQVcsc0JBQXFCO0FBQzdHLE1BQUksWUFBWSw2REFBNkQ7QUFDN0UsU0FBTztBQUNYO0FBRUEsSUFBSSxVQUFtQjtBQUN2QixJQUFJLENBQUMsY0FBYyxTQUFTO0FBRXhCLE1BQUksY0FBeUMsY0FBYztBQUMzRCxNQUFJLFlBQVksbUNBQW1DLGtCQUFZO0FBQy9ELE1BQUksQ0FBQyxhQUFhO0FBQ2QsVUFBTSxJQUFJLE1BQU0sNkNBQTZDO0FBQUEsRUFDakU7QUFDQSxZQUFVLFNBQVMsV0FBVztBQUNsQyxPQUNLO0FBQ0QsTUFBSSxZQUFZLG9DQUFvQyxrQkFBWTtBQUNoRSxZQUFVLGtCQUFrQjtBQUNoQztBQUVBLElBQUcsU0FBUztBQUNSLE1BQUksWUFBWSwyREFBMkQ7QUFDM0UsTUFBSSxZQUFZLFNBQVM7QUFDckIsWUFBUSxXQUFXLFlBQVksUUFBUSxJQUFJLEVBQUUsSUFBSTtBQUFBLEVBQ3JELE9BRUE7QUFDSSxRQUFJLFFBQVEsK0JBQStCO0FBQUEsRUFDL0M7QUFDSixPQUVBO0FBQ0ksTUFBSSxZQUFZLHlEQUF5RDtBQUN6RSxNQUFJLFlBQVksUUFBUTtBQUNwQixZQUFRLFdBQVcsWUFBWSxPQUFPLElBQUksRUFBRSxJQUFJO0FBQUEsRUFDcEQsT0FFQTtBQUNJLFFBQUksUUFBUSw4QkFBOEI7QUFBQSxFQUM5QztBQUNKOyIsCiAgIm5hbWVzIjogW10KfQo=
