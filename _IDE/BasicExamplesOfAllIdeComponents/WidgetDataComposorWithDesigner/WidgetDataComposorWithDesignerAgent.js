namespace("BasicExamplesOfAllIdeComponents");

/**
 * Agent for accessing the APIs to obtain data for this widget
 */
BasicExamplesOfAllIdeComponents.WidgetDataComposorWithDesignerAgent = function()
{
    /**
     * Example of using findByQuery API to load work item
     * by it's ID, and enrich with specific parameters
     */
    var loadWorkItem = function(id)
    {
        var promise = $.Deferred();

        var request = {

            // Simple search - get by id
            search:
            {
                workItemIds: [id]
            },

            // Enrich with fields from data composer - use data composer
            // screen in modeller to browse around the data graph and find
            // the fields you might need
            enrich:
            [
                // Some basic details
                { path: "title" },
                { path: "reference" },
                { path: "createdDate" },
                { path: "updatedDate" },

                // The name of the current primary and matter owner if there is one
                { path: "roles.matter-owner.ods.name" },
                { path: "roles.primary-owner.ods.name" },

                // The client name if there is one
                { path: "roles.client.ods.name" }
            ]
        };

        $ajax.post("/api/v1/public/workItem/findByQuery", request).then(function(data)
        {
            if (!data || data.totalCount < 1 || data.results.length < 1)
            {
                promise.reject("Not found");
            }
            else
            {
                promise.resolve(
                    {
                        title: data.results[0].data.title,
                        reference: data.results[0].data.reference,
                        createdDate: data.results[0].data.createdDate,
                        updatedDate: data.results[0].data.updatedDate,
                        owner: data.results[0].data["roles.matter-owner.ods.name"] || data.results[0].data["roles.primary-owner.ods.name"] || "No owner",
                        client: data.results[0].data["roles.client.ods.name"] || "No client specified"
                    });
            }
        });

        return promise;
    }

    /**
     * Example of using an external API to get additional data not held in sharedo.
     * Note - this is using https://dummyapi.io - you'll need to sign up (it's free)
     * and get an app id for this call to work - set the app id below;
     */
    var getExternalData = function()
    {
        var appId = "[[YOUR-APP-ID]]";

        // Return the jQuery AJAX promise directly as we're not going to mutate the data here
        return $.ajax(
            {
                url: "https://dummyapi.io/data/api/user?limit=3",
                headers: { "app-id": appId }
            }
        );
    }
    
    return {
        loadWorkItem: loadWorkItem,
        getExternalData: getExternalData
    };
}();