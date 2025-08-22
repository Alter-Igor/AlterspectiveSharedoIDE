let anyWindow = window;
anyWindow.PortalWidgets = anyWindow.PortalWidgets || {};
anyWindow.PortalWidgets.SharedoEventSync = RefreshWatcher;
function RefreshWatcher(element, configuration, baseModel) {
  return new RefreshWatcherClass(element, configuration, baseModel);
}
function strToClass(className, base) {
  const classParts = className.split(".");
  let classReference = base;
  for (const part of classParts) {
    if (!classReference[part]) {
      return undefined;
    }
    classReference = classReference[part];
  }
  return classReference;
}
//addEventToFormBuilderCounter used to counter number of time we call function to prevent more than one call.
let addEventToFormBuilderCounter = 0;
/**
 * This function proxies the formbuilder save so we can add an event, //TODO remove once formbuilder has event on saved.
 * @returns
 */
function addEventToFormBuilder() {
  if (addEventToFormBuilderCounter > 0) {
    return;
  }
  addEventToFormBuilderCounter++;

  if (Sharedo?.Core?.Case?.FormBuilder?.Widgets?.Standard?.prototype?.save) {
    //@ts-ignore
    let p = Sharedo.Core.Case.FormBuilder.Widgets.Standard.prototype.save;
    //@ts-ignore
    Sharedo.Core.Case.FormBuilder.Widgets.Standard.prototype.save = function (
      ...args
    ) {
      // setTimeout(() => {
      //   $ui.events.broadcast("custom.sharedo.event.sync.formbuilder.updated", this);
      // }, 1500);

      let retValue = p.call(this, ...args);

      retValue.then(() => {
        $ui.events.broadcast(
          "custom.sharedo.event.sync.formbuilder.updated",
          this
        );
      });

      return retValue;
    };
  }

  if ($ajax?.rawPost) {
    //override uploadPickerFiles as it doesnt throw event.
    let aj = $ajax.rawPost;

    $ajax.rawPost = function (...args) {
      let retValue = aj.call(this, ...args);

      // if (!retValue) { //If it returns a promise then we can wait for it to finish
      //   setTimeout(() => {
      //     $ui.events.broadcast(
      //         "custom.sharedo.event.sync.formbuilder.updated",
      //         this
      //       );
      //   }, 3000);

      // }

      retValue.then(() => {
        $ui.events.broadcast(
          "custom.sharedo.event.sync.formbuilder.updated",
          this
        );
      });

      return retValue;
    };
  }
}
class RefreshWatcherClass {
  constructor(element, configuration, baseModel) {
    this.defaults = {
      widgets: [],
      useIntervalRefreshEveryXSeconds: false,
      refreshOnEvents: false,
      eventsToListenTo: [],
      intervalSeconds: 0,
      disabled: false,
    };
    this.element = element;
    this.lastRefresh = new Date();
    this.refreshLog = [];
    this.originalConfiguration = configuration;
    this.configuration = $.extend(true, {}, this.defaults, configuration);
    let x = ko.observable(this.configuration.configuration);
    this.model = x;
    addEventToFormBuilder();
  }
  onDestroy() {
    $ui.util.dispose(this.disposables);
  }
  loadAndBind() {
    if (this.model().disabled === true) {
      console.log("I am disabled");
      return;
    }

    this.setupIndicator();

    //run here so we get the initial data before we start the interval check
    this.checkIfPathHasChanged();

    this.disposables = [];
    console.log("this.model().eventsToListenTo", this.model().eventsToListenTo);
    this.model().eventsToListenTo?.forEach((event) => {
      console.log("Subscribing to event", event);
      this.disposables.push(
        $ui.events.subscribe(event.eventName, (e) => {
          this.refreshComponents(event.eventName);
        })
      );
    });
    if (
      this.model().useIntervalRefreshEveryXSeconds &&
      this.model().intervalSeconds &&
      this.model().intervalSeconds > 0
    ) {
      if (this.interval) {
        clearInterval(this.interval);
      }

      this.interval = setInterval(() => {
        //ma

        if (!this.model().optionalPathsToMonitor) {
          //If we have no optional paths to monitor then just refresh
          this.refreshComponents("interval");
        }

        //do a call to the server to see if the path has changed
        this.checkIfPathHasChanged();
      }, this.model().intervalSeconds * 1000);

      this.disposables.push(this.interval);
    }
  }

  checkIfPathHasChanged() {
    //make sure we dont run more than one of there at a time
    if (this.isCheckingIfPathHasChanged) {
      return;
    }
    this.isCheckingIfPathHasChanged = true;

    let pathToMonitor = this.model().optionalPathsToMonitor;

    if (!pathToMonitor) {
      return;
    }

    //Check if the path has changed
    //If it has then refresh
    //If it has not then do nothing
    //If the path has changed then we need to refresh the components
    //If the path has not changed then we do not need to refresh the components

    let payload = {
      search: {
        workItemIds: [$ui.pageContext.sharedoId()],
      },
      enrich: [],
    };

    //remove any empty paths
    let pathsArray = pathToMonitor.filter((item) => {
      return item.pathToMonitor;
    });

    payload.enrich = pathsArray.map((item) => {
      return {
        path: item.pathToMonitor,
      };
    });

    let getData = $ajax.post("/api/v1/public/workItem/findByQuery", payload);

    getData.then((response) => {
      this.data = response.results[0].data;
      let pathHasChanged = false;

      //sets the initial data if it is not set
      if (!this.lastData) {
        this.lastData = this.data;
      }

      let pathsThatHaveChanged = [];

      pathToMonitor.forEach((item) => {
        if (
          this.data[item.pathToMonitor] !== this.lastData[item.pathToMonitor]
        ) {
          pathsThatHaveChanged.push({
            path: item.pathToMonitor,
            oldValue: this.lastData[item.pathToMonitor],
            newValue: this.data[item.pathToMonitor],
          });
          pathHasChanged = true;
        }
      });
      if (pathHasChanged) {
        this.showUpdateIndicator();
        console.log("Path has changed", pathsThatHaveChanged);
        this.refreshComponents(
          "pathHaveChanged: " +
            pathsThatHaveChanged
              .map((item) => {
                return item.path;
              })
              .join(", ")
        );
      }
      this.lastData = this.data;
    });

    getData.always(() => {
      this.isCheckingIfPathHasChanged = false;
    });

    getData.catch((error) => {
      console.error("Failed to check if path has changed", error);
    });
  }

  showUpdateIndicator() {
    if (!this.model().showUpdateIndicator) {
      return;
    }

    //get the update indicator by class name and show it
    let indicator = this.element.querySelector(".update-indicator");

    if (!indicator) {
      console.error("Could not find update indicator");
      return;
    }

window.indi = indicator;
    
    //check if the indicator is already showing
    //if (!indicator.classList.contains("hide")) {
    //  this.addDelayedHideClass(indicator);
    //  return;
    //}

    indicator.classList.remove("hide");

    // Remove the indicator after 3 seconds
    this.addDelayedHideClass(indicator);
  }

  addDelayedHideClass(indicator, delay = 3000) {
    setTimeout(() => {

      //check if indicator is still showing
      if (indicator.classList.contains("hide")) {
        return;
      }
      
      indicator.classList.add("hide");
    }, delay);
  }

  setupIndicator() {

    
    // if (!this.model().showUpdateIndicator) {
    //   return;
    // }

    let indicator = this.element.querySelector(".update-indicator");
    this.indicatorSetup = this.indicatorSetup || false;

    let indicatorText = this.model().indicatorText ||
      "Things have changed, refreshing screen components";
    
    if (!this.indicatorSetup) {
      indicator.innerHTML = `<span class='spinner'></span><span>${indicatorText}</span>`;
      this.addDelayedHideClass(indicator,0);
      this.indicatorSetup = true;
    }
  }

  reloadPage() {
    if (this.checkIfAPanelIsOpen()) {
      console.log("Panel is open so dont refresh whole page");
      return;
    }
    window.location.reload();
  }
  refreshComponents(eventName) {
    let lock = $ui.widgets.lock;
    $ui.widgets.lock = function () {};
    try {
      this.runRefreshComponents(eventName);
    } catch (e) {
      console.error("Failed to refresh components", e);
    } finally {
      $ui.widgets.lock = lock;
    }
  }
  runRefreshComponents(eventName) {
    this.refreshLog = this.refreshLog || [];
    let skipRefresh = false;
    console.log("%c " + eventName + " fired", " color: green");
    this.refreshLog = this.refreshLog || [];
    if (this.lastRefresh) {
      //TODO: change this so we collect all refreshes and do them in one go
      let secondsSinceLastRefresh =
        (new Date().getTime() - this.lastRefresh.getTime()) / 100;
      console.log("Seconds since last refresh", secondsSinceLastRefresh);
      if (secondsSinceLastRefresh < 10) {
        skipRefresh = true;
      }
    }
    this.lastRefresh = new Date();
    console.log("Refreshing components");
    let widgetsToRefresh = this.model().widgets;
    console.log("Widgets to refresh: ", widgetsToRefresh.length);
    widgetsToRefresh?.forEach((widgetToRefresh) => {
      let logItem = {
        eventName: eventName,
        widgets: widgetToRefresh,
        time: new Date(),
        success: false,
      };
      try {
        let widgetInstances = $ui.widgets.instances().filter((x) => {
          let classReference = strToClass(widgetToRefresh.typeName, window);
          if (!classReference) {
            console.warn(
              `Could not find classReference for ${widgetToRefresh.typeName} `
            );
            return false;
          }
          return x instanceof strToClass(widgetToRefresh.typeName, window);
        });
        for (let i = 0; i < widgetInstances.length; i++) {
          let widgetInstance = widgetInstances[i];
          let title = widgetInstance.base.title() || "No Title";
          console.log(`Component to refresh  [${title} - ${i}]`);
          if (
            !widgetInstance &&
            !widgetInstance[widgetToRefresh.methodToExecute]
          ) {
            console.log("Could not find component to refresh");
            continue;
          }
          // let params = widgets.parameters;
          // if (checkIfWidgetIsActiveElement(widgetToRefresh) == true) {
          //   return;
          // }
          if (
            this.checkIfWidgetInstanceIsActiveElement(widgetInstance) == true
          ) {
            return;
          }
          if (skipRefresh === true) {
            console.log(
              `%c Skipping [${widgetToRefresh.typeName}] event ${eventName} as its too soon `,
              " color: red"
            );
            return;
          }
          try {
            console.log(
              `%c Execute [${widgetToRefresh.methodToExecute}] on  [${widgetToRefresh.typeName}] - because [${eventName}]`,
              " color: red"
            );
            this.refreshWidget(widgetInstance, widgetToRefresh); //todo: parameters
          } catch (e) {
            console.log("Failed to refresh widget", e);
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        logItem.success = true;
        this.refreshLog.push(logItem);
      }
    });
  }
  //Set as a Async so we can run all refresh in parallel
  async refreshWidget(widgetInstance, widgetToRefresh) {
    try {
      widgetInstance[widgetToRefresh.methodToExecute]();
    } catch (error) {
      console.warn(
        `Failed to refresh widget ${widgetToRefresh.typeName} using method ${widgetToRefresh.methodToExecute} `
      );
    }
  }

  checkIfAPanelIsOpen() {
    //@ts-ignore
    if ($ui?.stacks?.stacks) {
      //@ts-ignore
      return $ui?.stacks?.stacks.length > 0;
    }
    return false;
  }
  checkIfWidgetInstanceIsActiveElement(widgetInstance) {
    let activeElement = document.activeElement;
    let isWithinKO = false; // Flag to track if the active element is within a KO container
    // Traverse up the DOM tree
    while (activeElement && activeElement.tagName !== "BODY") {
      if (activeElement.classList.contains("widget")) {
        // Change 'ko-container' to your container's identifier
        isWithinKO = true;
        break;
      }
      activeElement = activeElement.parentElement;
    }
    if (activeElement === widgetInstance.element) {
      console.log(
        "Active element is within the widget being refreshed, skipping refresh"
      );
      return true;
    }
    return false;
  }
}

//So the ShareDo widget loader can find the class
anyWindow.RefreshWatcherClass = RefreshWatcherClass;
// export {};
//Make sure Javascript does not have a export {}; below
