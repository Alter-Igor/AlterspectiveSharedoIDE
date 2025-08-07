(function()
{
    var enrich = function(rows)
    {
        // Enrich rows or attach behaviour
        // rows.forEach(row => {
        //     row.title = row.title + " [ENRICHED]";
        // });
    };

    var dispose = function(rows)
    {
        // Any disposal logic
        // console.log("My disposal logic", rows);
    };

    return {
        enrich: enrich,
        dispose: dispose
    };
})();