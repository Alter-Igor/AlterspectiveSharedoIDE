/**
 * Event Bus for Widget Communication
 * Provides pub/sub pattern for decoupled communication between components
 */
namespace("Alt.AdviceManagement.Common");

Alt.AdviceManagement.Common.EventBus = (function() {
    'use strict';
    
    var events = {};
    var eventHistory = [];
    var maxHistorySize = 100;
    var debugMode = false;
    
    /**
     * Subscribe to an event
     * @param {string} eventName - Name of the event
     * @param {function} callback - Function to call when event fires
     * @param {object} context - Optional context for callback
     * @returns {object} Subscription object with unsubscribe method
     */
    function subscribe(eventName, callback, context) {
        if (!eventName || typeof callback !== 'function') {
            console.error('EventBus: Invalid subscription parameters');
            return null;
        }
        
        if (!events[eventName]) {
            events[eventName] = [];
        }
        
        var subscription = {
            callback: callback,
            context: context || null,
            id: generateId()
        };
        
        events[eventName].push(subscription);
        
        if (debugMode) {
            console.log('EventBus: Subscribed to', eventName, subscription.id);
        }
        
        // Return unsubscribe function
        return {
            unsubscribe: function() {
                unsubscribe(eventName, subscription.id);
            },
            id: subscription.id
        };
    }
    
    /**
     * Publish an event
     * @param {string} eventName - Name of the event
     * @param {*} data - Data to pass to subscribers
     */
    function publish(eventName, data) {
        if (!eventName) {
            console.error('EventBus: Event name required');
            return;
        }
        
        // Record in history
        recordEvent(eventName, data);
        
        if (debugMode) {
            console.log('EventBus: Publishing', eventName, data);
        }
        
        // Get subscribers
        var subscribers = events[eventName];
        if (!subscribers || subscribers.length === 0) {
            if (debugMode) {
                console.log('EventBus: No subscribers for', eventName);
            }
            return;
        }
        
        // Clone array to prevent modification during iteration
        subscribers = subscribers.slice();
        
        // Call each subscriber
        subscribers.forEach(function(subscription) {
            try {
                subscription.callback.call(subscription.context, data);
            } catch (error) {
                console.error('EventBus: Error in subscriber for', eventName, error);
            }
        });
    }
    
    /**
     * Unsubscribe from an event
     * @param {string} eventName - Name of the event
     * @param {string} subscriptionId - ID of the subscription
     */
    function unsubscribe(eventName, subscriptionId) {
        if (!events[eventName]) {
            return;
        }
        
        events[eventName] = events[eventName].filter(function(subscription) {
            return subscription.id !== subscriptionId;
        });
        
        if (debugMode) {
            console.log('EventBus: Unsubscribed from', eventName, subscriptionId);
        }
        
        // Clean up empty event arrays
        if (events[eventName].length === 0) {
            delete events[eventName];
        }
    }
    
    /**
     * Subscribe to an event once
     * @param {string} eventName - Name of the event
     * @param {function} callback - Function to call when event fires
     * @param {object} context - Optional context for callback
     */
    function once(eventName, callback, context) {
        var subscription;
        
        var wrappedCallback = function(data) {
            callback.call(context || null, data);
            if (subscription) {
                subscription.unsubscribe();
            }
        };
        
        subscription = subscribe(eventName, wrappedCallback, context);
        return subscription;
    }
    
    /**
     * Clear all subscriptions for an event
     * @param {string} eventName - Name of the event (optional, clears all if not provided)
     */
    function clear(eventName) {
        if (eventName) {
            delete events[eventName];
            if (debugMode) {
                console.log('EventBus: Cleared event', eventName);
            }
        } else {
            events = {};
            if (debugMode) {
                console.log('EventBus: Cleared all events');
            }
        }
    }
    
    /**
     * Get count of subscribers for an event
     * @param {string} eventName - Name of the event
     * @returns {number} Number of subscribers
     */
    function getSubscriberCount(eventName) {
        if (!events[eventName]) {
            return 0;
        }
        return events[eventName].length;
    }
    
    /**
     * Check if event has subscribers
     * @param {string} eventName - Name of the event
     * @returns {boolean} True if has subscribers
     */
    function hasSubscribers(eventName) {
        return getSubscriberCount(eventName) > 0;
    }
    
    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    function generateId() {
        return 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Record event in history
     * @param {string} eventName - Name of the event
     * @param {*} data - Event data
     */
    function recordEvent(eventName, data) {
        eventHistory.push({
            name: eventName,
            data: data,
            timestamp: new Date().toISOString(),
            subscriberCount: getSubscriberCount(eventName)
        });
        
        // Trim history if too large
        if (eventHistory.length > maxHistorySize) {
            eventHistory.shift();
        }
    }
    
    /**
     * Get event history
     * @param {string} eventName - Optional filter by event name
     * @returns {array} Event history
     */
    function getHistory(eventName) {
        if (eventName) {
            return eventHistory.filter(function(event) {
                return event.name === eventName;
            });
        }
        return eventHistory.slice();
    }
    
    /**
     * Clear event history
     */
    function clearHistory() {
        eventHistory = [];
    }
    
    /**
     * Enable/disable debug mode
     * @param {boolean} enabled - Enable debug mode
     */
    function setDebugMode(enabled) {
        debugMode = !!enabled;
        if (debugMode) {
            console.log('EventBus: Debug mode enabled');
        }
    }
    
    /**
     * Get debug info
     * @returns {object} Debug information
     */
    function getDebugInfo() {
        var info = {
            eventCount: Object.keys(events).length,
            events: {},
            historySize: eventHistory.length,
            debugMode: debugMode
        };
        
        for (var eventName in events) {
            if (events.hasOwnProperty(eventName)) {
                info.events[eventName] = events[eventName].length;
            }
        }
        
        return info;
    }
    
    // Predefined events from Constants
    var EVENTS = Alt.AdviceManagement.Common.Constants.EVENTS;
    
    /**
     * Emit predefined event
     * @param {string} eventType - Event type from Constants.EVENTS
     * @param {*} data - Event data
     */
    function emit(eventType, data) {
        if (EVENTS[eventType]) {
            publish(EVENTS[eventType], data);
        } else {
            console.warn('EventBus: Unknown event type', eventType);
        }
    }
    
    // Public API
    return {
        subscribe: subscribe,
        publish: publish,
        unsubscribe: unsubscribe,
        once: once,
        clear: clear,
        getSubscriberCount: getSubscriberCount,
        hasSubscribers: hasSubscribers,
        getHistory: getHistory,
        clearHistory: clearHistory,
        setDebugMode: setDebugMode,
        getDebugInfo: getDebugInfo,
        emit: emit,
        
        // Shortcuts
        on: subscribe,
        off: unsubscribe,
        trigger: publish
    };
})();

// Create global instance for easy access
window.AdviceEventBus = Alt.AdviceManagement.Common.EventBus;