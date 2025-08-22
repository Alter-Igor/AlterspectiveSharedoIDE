/**
 * Created by:   Igor Jericevich ( Alterspective Pty Ltd )
 * Created on:   28 Nov 2024
 * Copyright:   All Rights Reserved - Do Not Redistribute
 * License:     Private
 * Support:     Contact your Alterspective representative for support and licensing
 * Note:        Not supported by Slicedbread UK
 *
 */

console.log("RefreshWatcherLoaderDesigner.ts");
let moduleLocation = "/_ideFiles/PortalWidgets/SharedoEventSync/Designer/SharedoEventSyncDesigner.js";
let anyWindow = window;
anyWindow.PortalWidgets = anyWindow.PortalWidgets || {};
anyWindow.PortalWidgets.SharedoEventSyncDesigner = RefreshWatcherDesigner;
function RefreshWatcherDesigner(element, configuration, baseModel) {
    import(moduleLocation)
        .then((module) => {
        module.RefreshWatcherDesigner(element, configuration, baseModel);
    })
        .catch((e) => {
        console.log(e);
    });
}
