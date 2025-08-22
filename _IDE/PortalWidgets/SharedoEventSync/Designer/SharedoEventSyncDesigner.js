/**
 * Created by:   Igor Jericevich ( Alterspective Pty Ltd )
 * Created on:   28 Nov 2024
 * Copyright:   All Rights Reserved - Do Not Redistribute
 * License:     Private
 * Support:     Contact your Alterspective representative for support and licensing
 * Note:        Not supported by Slicedbread UK
 *
 */

function ensureLowdashBackwardCompatibility() {
    if (!_.isNil) {
        _.isNil = _.isUndefined;
    }
    // Handle the case where the user has not included the lodash library
    //@ts-ignore
    if (!_.contains && _.includes) {
        //@ts-ignore
        _.contains = _.includes;
    }
    //@ts-ignore
    if (!_.findWhere && _.find) {
        //@ts-ignore
        _.findWhere = _.find;
    }
}
//Add this module to the global scope
let anyWindow = window;
anyWindow.PortalWidgets = anyWindow.PortalWidgets || {};
anyWindow.PortalWidgets.SharedoEventSyncDesigner = RefreshWatcherDesigner;
function RefreshWatcherDesigner(element, configuration, baseModel) {
    return new RefreshWatcherDesignerClass(element, configuration, baseModel);
}
class RefreshWatcherDesignerClass {
    constructor(element, configuration, baseModel) {
        this.element = element;
        const defaults = {
            configuration: {
                widgets: [],
                useIntervalRefreshEveryXSeconds: false,
                refreshOnEvents: false,
                eventsToListenTo: [],
                intervalSeconds: undefined,
                disabled: false,
            },
        };
        const options = $.extend(true, {}, defaults, configuration);
        this.model = ko.observable(options.configuration);
        this.jsonOfModel = ko.observable(JSON.stringify(this.model()));
        this.model.subscribe((newValue) => {
            console.log(newValue);
            this.jsonOfModel(JSON.stringify(newValue));
        });
        this.model.subscribe((newValue) => {
            console.log(newValue);
            // if (this.formIO) {
            //     console.log("setting data");//todo
            // }
        });
        this.validation = {
            configuration: ko.pureComputed(() => {
                const message = this.model();
                if (!message)
                    return "The message is required";
                return null;
            }),
        };
        this.validationErrorCount = ko.pureComputed(() => {
            let fails = 0;
            if (this.validation.configuration())
                fails++;
            return fails;
        });
    }
    onDestroy() { }
    loadAndBind() {
        this.render();
    }
    async render() {
        await import("./formiojs/formio.full.min.js");
        ensureLowdashBackwardCompatibility();
        let DESIGNFORM = await import("./TheDesignerForm.js");
        let formDiv = this.element.querySelector(".formio-component-form");
        if (!formDiv) {
            throw new Error("Could not find formio-component-form");
        }
        let data;
        if (this.model()) {
            // data = JSON.parse(this.model());
            data = this.model();
        }
        console.log(data);
        window.dataContext = window.dataContext || {};
        window.dataContext.eventsOptions = DESIGNFORM.SHAREDO_EVENTS;
        Formio.createForm(formDiv, DESIGNFORM.REFRESH_WATCHER_FORMIO, {
            noDefaultSubmitButton: true,
            eventsOptions: DESIGNFORM.SHAREDO_EVENTS,
        }).then((form) => {
            if (!form) {
                throw new Error("Could not render formio");
            }
            if (data) {
                if (data.widgets.length === 0) {
                    data.widgets = [
                        {
                            typeName: "Sharedo.Core.Case.Menus.Widgets.WorkItemRibbon",
                            methodToExecute: "loadAndBind",
                        },
                    ];
                }
                form.submission = { data: data };
            }
            form.on("submit", (submission) => {
                console.log(submission);
                this.model(form.data);
                console.log("Model Updated");
            });
            // import { DefaultEvents, DefaultWidgets } from "./TheDesignerForm.js";
            form.on("customEvent", (event) => {
                console.log(event);
                if (event.type === "AddDefaults") {
                    form.submission.data.widgets = this.addToArrayNoDuplicates(form.submission.data.widgets, DESIGNFORM.DefaultWidgets);
                    form.submission.data.eventsToListenTo = this.addToArrayNoDuplicates(form.submission.data.eventsToListenTo, DESIGNFORM.DefaultEvents);
                    form.refresh();
                }
            });
            form.on("change", (formData) => {
                console.log(formData);
                try {
                    // let data = JSON.stringify(submission.data)
                    console.log("setting model");
                    this.model(form.data);
                }
                catch (e) {
                    console.error(e);
                }
            }, false);
        });
    }
    addToArrayNoDuplicates(array, newItems) {
        array = array || [];
        // Existing items in the array
        // Combine existing and new items, and remove duplicates
        let uniqueSet = [...new Set([...array, ...newItems])];
        uniqueSet = [...new Set([...uniqueSet, ...uniqueSet])]; //ensure no duplicates
        // Update the original array
        return uniqueSet;
    }
    getModel() {
        let koModel = ko.toJS(this.model);
        return { configuration: koModel };
    }
}
// export {};
//Make sure there is no export below this line in the Javascript as the ShareDo widget loaded is not a module.
