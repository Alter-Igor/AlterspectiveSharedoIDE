/******/ (() => { // webpackBootstrap
/******/ 	// runtime can't be in strict mode because a global variable is assign and maybe created.
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!***********************************************************************************************************!*\
  !*** ./src/NodeBased/WorkflowActions/CustomProgressMilestone/Designer/CustomProgressMilestoneDesigner.ts ***!
  \***********************************************************************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CustomProgressMilestoneDesigner: () => (/* binding */ CustomProgressMilestoneDesigner),
/* harmony export */   CustomProgressMilestoneDesignerClass: () => (/* binding */ CustomProgressMilestoneDesignerClass)
/* harmony export */ });
// Assuming there are relevant type definitions for the used properties and methods.
// For the purpose of this conversion, I'm making some assumptions about the types, which might need further refinement.
function CustomProgressMilestoneDesigner(element, configuration, baseModel) {
    return new CustomProgressMilestoneDesignerClass(element, configuration, baseModel);
}
class CustomProgressMilestoneDesignerClass {
    ;
    constructor(element, configuration, baseModel) {
        this.disposables = []; // Define specific type if known.
        const defaults = {
            node: null,
            model: null
        };
        const options = $.extend(true, {}, defaults, configuration);
        this.action = options.node;
        this.model = options.model;
        this.expectedTypePicker = {
            multiSelect: false,
            selectMode: "systemName",
            selectedItem: this.action.config.expectedTypeSystemName
        };
        this.phasesLoading = ko.observable(true);
        this.phasesFeaturesLoading = ko.observable(true);
        this.phases = ko.observableArray();
        this.phaseFeatures = ko.observableArray();
        this.reasonsLoading = ko.observable(true);
        this.reasons = ko.observableArray();
        this.loadAvailablePhasesFeatures();
        if (this.action.config) {
            this.disposables = [
                this.action.config.expectedTypeSystemName?.subscribe(() => {
                    this.loadAvailablePhases();
                    this.loadReasons();
                })
            ];
        }
    }
    onDestroy() {
        this.loadAvailablePhases();
    }
    loadAndBind() {
        this.loadAvailablePhases();
        this.loadReasons();
        this.loadAvailablePhasesFeatures();
    }
    loadAvailablePhases() {
        this.phasesLoading(true);
        const setPhases = (validPhases) => {
            this.phases(validPhases);
            this.phasesLoading(false);
        };
        const type = this.action.config.expectedTypeSystemName();
        if (!type) {
            setPhases([]);
        }
        else {
            $ajaxMutex.getOnce(`/api/modeller/sharedoTypes/${type}/phasePlan`).then((res) => {
                setPhases(res.phases);
            });
        }
    }
    loadAvailablePhasesFeatures() {
        this.phasesFeaturesLoading(true);
        $ajaxMutex.getOnce(`/api/featureframework/flags/subFeatures`).then((res) => {
            console.log("subFeatures");
            console.log(res);
            this.phasesFeaturesLoading(false);
            this.phaseFeatures(res);
        });
    }
    loadReasons() {
        this.reasonsLoading(true);
        const type = this.action.config.expectedTypeSystemName();
        if (!type) {
            this.reasons([]);
            this.reasonsLoading(false);
            return;
        }
        $ajaxMutex.getOnce(`/api/jumpToPhase/reasons/for/${type}`).then((reasons) => {
            this.reasons(reasons);
            this.reasonsLoading(false);
        });
    }
}

})();

var __webpack_export_target__ = (WorkflowActions = typeof WorkflowActions === "undefined" ? {} : WorkflowActions);
for(var i in __webpack_exports__) __webpack_export_target__[i] = __webpack_exports__[i];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGVzaWduZXIvQ3VzdG9tUHJvZ3Jlc3NNaWxlc3RvbmVEZXNpZ25lci5qcyIsIm1hcHBpbmdzIjoiOztVQUFBO1VBQ0E7Ozs7O1dDREE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx5Q0FBeUMsd0NBQXdDO1dBQ2pGO1dBQ0E7V0FDQTs7Ozs7V0NQQTs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSx1REFBdUQsaUJBQWlCO1dBQ3hFO1dBQ0EsZ0RBQWdELGFBQWE7V0FDN0Q7Ozs7Ozs7Ozs7Ozs7Ozs7QUNOQSxvRkFBb0Y7QUFDcEYsd0hBQXdIO0FBRWpILFNBQVMsK0JBQStCLENBQUMsT0FBb0IsRUFBRSxhQUFrQixFQUFFLFNBQWM7SUFDcEcsT0FBTyxJQUFJLG9DQUFvQyxDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDdkYsQ0FBQztBQWNjLE1BQU0sb0NBQW9DO0lBVUcsQ0FBQztJQUVqRCxZQUFZLE9BQW9CLEVBQUUsYUFBNEIsRUFBRSxTQUFjO1FBSjlFLGdCQUFXLEdBQVUsRUFBRSxDQUFDLENBQUMsaUNBQWlDO1FBS3RELE1BQU0sUUFBUSxHQUFHO1lBQ2IsSUFBSSxFQUFFLElBQUk7WUFDVixLQUFLLEVBQUUsSUFBSTtTQUNkLENBQUM7UUFFRixNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBRTVELElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztRQUMzQixJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7UUFFM0IsSUFBSSxDQUFDLGtCQUFrQixHQUFHO1lBQ3RCLFdBQVcsRUFBRSxLQUFLO1lBQ2xCLFVBQVUsRUFBRSxZQUFZO1lBQ3hCLFlBQVksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxzQkFBc0I7U0FDMUQsQ0FBQztRQUVGLElBQUksQ0FBQyxhQUFhLEdBQUcs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T0FBTztTQUNWO1FBRUQsVUFBVSxDQUFDLE9BQU8sQ0FBQyxnQ0FBZ0MsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFZLEVBQUUsRUFBRTtZQUM3RSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3RCLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0IsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBRUoiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9Xb3JrZmxvd0FjdGlvbnMvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vV29ya2Zsb3dBY3Rpb25zL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9Xb3JrZmxvd0FjdGlvbnMvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9Xb3JrZmxvd0FjdGlvbnMvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9Xb3JrZmxvd0FjdGlvbnMvLi9zcmMvTm9kZUJhc2VkL1dvcmtmbG93QWN0aW9ucy9DdXN0b21Qcm9ncmVzc01pbGVzdG9uZS9EZXNpZ25lci9DdXN0b21Qcm9ncmVzc01pbGVzdG9uZURlc2lnbmVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIFRoZSByZXF1aXJlIHNjb3BlXG52YXIgX193ZWJwYWNrX3JlcXVpcmVfXyA9IHt9O1xuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiLy8gQXNzdW1pbmcgdGhlcmUgYXJlIHJlbGV2YW50IHR5cGUgZGVmaW5pdGlvbnMgZm9yIHRoZSB1c2VkIHByb3BlcnRpZXMgYW5kIG1ldGhvZHMuXG4vLyBGb3IgdGhlIHB1cnBvc2Ugb2YgdGhpcyBjb252ZXJzaW9uLCBJJ20gbWFraW5nIHNvbWUgYXNzdW1wdGlvbnMgYWJvdXQgdGhlIHR5cGVzLCB3aGljaCBtaWdodCBuZWVkIGZ1cnRoZXIgcmVmaW5lbWVudC5cblxuZXhwb3J0IGZ1bmN0aW9uIEN1c3RvbVByb2dyZXNzTWlsZXN0b25lRGVzaWduZXIoZWxlbWVudDogSFRNTEVsZW1lbnQsIGNvbmZpZ3VyYXRpb246IGFueSwgYmFzZU1vZGVsOiBhbnkpOiBDdXN0b21Qcm9ncmVzc01pbGVzdG9uZURlc2lnbmVyQ2xhc3Mge1xuICAgIHJldHVybiBuZXcgQ3VzdG9tUHJvZ3Jlc3NNaWxlc3RvbmVEZXNpZ25lckNsYXNzKGVsZW1lbnQsIGNvbmZpZ3VyYXRpb24sIGJhc2VNb2RlbCk7XG59XG5cblxuICAgICAgICBpbnRlcmZhY2UgQ29uZmlndXJhdGlvbiB7XG4gICAgICAgICAgICBub2RlPzogYW55OyAvLyBEZWZpbmUgYSBzcGVjaWZpYyB0eXBlIGlmIGtub3duLlxuICAgICAgICAgICAgbW9kZWw/OiBhbnk7IC8vIERlZmluZSBhIHNwZWNpZmljIHR5cGUgaWYga25vd24uXG4gICAgICAgIH1cblxuICAgICAgICBpbnRlcmZhY2UgRXhwZWN0ZWRUeXBlUGlja2VyIHtcbiAgICAgICAgICAgIG11bHRpU2VsZWN0OiBib29sZWFuO1xuICAgICAgICAgICAgc2VsZWN0TW9kZTogc3RyaW5nO1xuICAgICAgICAgICAgc2VsZWN0ZWRJdGVtOiBrby5PYnNlcnZhYmxlPHN0cmluZyB8IG51bGw+O1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBleHBvcnQgY2xhc3MgQ3VzdG9tUHJvZ3Jlc3NNaWxlc3RvbmVEZXNpZ25lckNsYXNzIHtcbiAgICAgICAgICAgIGFjdGlvbjogYW55O1xuICAgICAgICAgICAgbW9kZWw6IGFueTtcbiAgICAgICAgICAgIGV4cGVjdGVkVHlwZVBpY2tlcjogRXhwZWN0ZWRUeXBlUGlja2VyIDtcbiAgICAgICAgICAgIHBoYXNlc0xvYWRpbmc6IGtvLk9ic2VydmFibGU8Ym9vbGVhbj4gO1xuICAgICAgICAgICAgcGhhc2VzOiBrby5PYnNlcnZhYmxlQXJyYXk8YW55W10+IDtcbiAgICAgICAgICAgIHJlYXNvbnNMb2FkaW5nOiBrby5PYnNlcnZhYmxlPGJvb2xlYW4+IDtcbiAgICAgICAgICAgIHJlYXNvbnM6IGtvLk9ic2VydmFibGVBcnJheTxhbnlbXT4gO1xuICAgICAgICAgICAgZGlzcG9zYWJsZXM6IGFueVtdID0gW107IC8vIERlZmluZSBzcGVjaWZpYyB0eXBlIGlmIGtub3duLlxuICAgICAgICAgICAgcGhhc2VGZWF0dXJlczoga28uT2JzZXJ2YWJsZUFycmF5PGFueVtdPiA7XG4gICAgICAgICAgICBwaGFzZXNGZWF0dXJlc0xvYWRpbmc6ICBrby5PYnNlcnZhYmxlPGJvb2xlYW4+IDs7XG5cbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjb25maWd1cmF0aW9uOiBDb25maWd1cmF0aW9uLCBiYXNlTW9kZWw6IGFueSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRzID0ge1xuICAgICAgICAgICAgICAgICAgICBub2RlOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBtb2RlbDogbnVsbFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBjb25maWd1cmF0aW9uKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uID0gb3B0aW9ucy5ub2RlO1xuICAgICAgICAgICAgICAgIHRoaXMubW9kZWwgPSBvcHRpb25zLm1vZGVsO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5leHBlY3RlZFR5cGVQaWNrZXIgPSB7XG4gICAgICAgICAgICAgICAgICAgIG11bHRpU2VsZWN0OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0TW9kZTogXCJzeXN0ZW1OYW1lXCIsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkSXRlbTogdGhpcy5hY3Rpb24uY29uZmlnLmV4cGVjdGVkVHlwZVN5c3RlbU5hbWVcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdGhpcy5waGFzZXNMb2FkaW5nID0ga28ub2JzZXJ2YWJsZSh0cnVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBoYXNlc0ZlYXR1cmVzTG9hZGluZyA9IGtvLm9ic2VydmFibGUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5waGFzZXMgPSBrby5vYnNlcnZhYmxlQXJyYXkoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBoYXNlRmVhdHVyZXMgPSBrby5vYnNlcnZhYmxlQXJyYXkoKTtcblxuICAgICAgICAgICAgICAgIHRoaXMucmVhc29uc0xvYWRpbmcgPSBrby5vYnNlcnZhYmxlKHRydWUpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVhc29ucyA9IGtvLm9ic2VydmFibGVBcnJheSgpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZEF2YWlsYWJsZVBoYXNlc0ZlYXR1cmVzKCk7XG5cbiAgICAgICAgICAgICAgICBpZih0aGlzLmFjdGlvbi5jb25maWcpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZXMgPSBbXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uLmNvbmZpZy5leHBlY3RlZFR5cGVTeXN0ZW1OYW1lPy5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2FkQXZhaWxhYmxlUGhhc2VzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWRSZWFzb25zKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkQXZhaWxhYmxlUGhhc2VzKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxvYWRBbmRCaW5kKCk6IHZvaWQge1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZEF2YWlsYWJsZVBoYXNlcygpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZFJlYXNvbnMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRBdmFpbGFibGVQaGFzZXNGZWF0dXJlcygpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsb2FkQXZhaWxhYmxlUGhhc2VzKCk6IHZvaWQge1xuICAgICAgICAgICAgICAgIHRoaXMucGhhc2VzTG9hZGluZyh0cnVlKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHNldFBoYXNlcyA9ICh2YWxpZFBoYXNlczogYW55W10pOiB2b2lkID0+IHsgLy8gRGVmaW5lIHNwZWNpZmljIHR5cGUgaWYga25vd24uXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGhhc2VzKHZhbGlkUGhhc2VzKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5waGFzZXNMb2FkaW5nKGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgY29uc3QgdHlwZSA9IHRoaXMuYWN0aW9uLmNvbmZpZy5leHBlY3RlZFR5cGVTeXN0ZW1OYW1lKCk7XG4gICAgICAgICAgICAgICAgaWYgKCF0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldFBoYXNlcyhbXSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJGFqYXhNdXRleC5nZXRPbmNlKGAvYXBpL21vZGVsbGVyL3NoYXJlZG9UeXBlcy8ke3R5cGV9L3BoYXNlUGxhbmApLnRoZW4oKHJlczphbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFBoYXNlcyhyZXMucGhhc2VzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsb2FkQXZhaWxhYmxlUGhhc2VzRmVhdHVyZXMoKTogdm9pZCB7XG4gICAgICAgICAgICAgICAgdGhpcy5waGFzZXNGZWF0dXJlc0xvYWRpbmcodHJ1ZSk7XG4gICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgJGFqYXhNdXRleC5nZXRPbmNlKGAvYXBpL2ZlYXR1cmVmcmFtZXdvcmsvZmxhZ3Mvc3ViRmVhdHVyZXNgKS50aGVuKChyZXM6YW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInN1YkZlYXR1cmVzXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGhhc2VzRmVhdHVyZXNMb2FkaW5nKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGhhc2VGZWF0dXJlcyhyZXMpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgIFxuXG4gICAgICAgICAgICBsb2FkUmVhc29ucygpOiB2b2lkIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlYXNvbnNMb2FkaW5nKHRydWUpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgdHlwZSA9IHRoaXMuYWN0aW9uLmNvbmZpZy5leHBlY3RlZFR5cGVTeXN0ZW1OYW1lKCk7XG4gICAgICAgICAgICAgICAgaWYgKCF0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVhc29ucyhbXSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVhc29uc0xvYWRpbmcoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgJGFqYXhNdXRleC5nZXRPbmNlKGAvYXBpL2p1bXBUb1BoYXNlL3JlYXNvbnMvZm9yLyR7dHlwZX1gKS50aGVuKChyZWFzb25zOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWFzb25zKHJlYXNvbnMpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlYXNvbnNMb2FkaW5nKGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICB9XG5cblxuICAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=