/**
 * Smart Cache Manager for Advice Management
 * Provides intelligent caching with TTL, LRU eviction, and localStorage persistence
 */
namespace("Alt.AdviceManagement.Common");

Alt.AdviceManagement.Common.CacheManager = (function() {
    'use strict';
    
    var Constants = Alt.AdviceManagement.Common.Constants;
    var EventBus = Alt.AdviceManagement.Common.EventBus;
    
    // Cache configuration
    var config = {
        maxSize: 100, // Maximum number of cached items
        defaultTTL: Constants.API.CACHE_TTL || 5000, // Default TTL in ms
        persistToStorage: true, // Save to localStorage
        storagePrefix: Constants.STORAGE.CACHE_PREFIX || 'advice_cache_'
    };
    
    // Cache storage
    var cache = {};
    var accessOrder = []; // For LRU tracking
    var stats = {
        hits: 0,
        misses: 0,
        evictions: 0,
        stores: 0
    };
    
    /**
     * Generate cache key
     * @param {string} type - Cache type (e.g., 'workItem', 'attributes')
     * @param {string} id - Unique identifier
     * @returns {string} Cache key
     */
    function generateKey(type, id) {
        return type + '_' + id;
    }
    
    /**
     * Get item from cache
     * @param {string} type - Cache type
     * @param {string} id - Item ID
     * @returns {*} Cached value or null
     */
    function get(type, id) {
        var key = generateKey(type, id);
        var entry = cache[key];
        
        // Check if exists and not expired
        if (entry) {
            if (isExpired(entry)) {
                remove(type, id);
                stats.misses++;
                return null;
            }
            
            // Update access order for LRU
            updateAccessOrder(key);
            stats.hits++;
            
            if (EventBus) {
                EventBus.publish('cache:hit', { type: type, id: id });
            }
            
            return entry.value;
        }
        
        // Try to load from localStorage if enabled
        if (config.persistToStorage) {
            var stored = loadFromStorage(key);
            if (stored && !isExpired(stored)) {
                cache[key] = stored;
                updateAccessOrder(key);
                stats.hits++;
                return stored.value;
            }
        }
        
        stats.misses++;
        return null;
    }
    
    /**
     * Set item in cache
     * @param {string} type - Cache type
     * @param {string} id - Item ID
     * @param {*} value - Value to cache
     * @param {number} ttl - Optional TTL in ms
     */
    function set(type, id, value, ttl) {
        var key = generateKey(type, id);
        
        // Check cache size and evict if necessary
        if (Object.keys(cache).length >= config.maxSize && !cache[key]) {
            evictLRU();
        }
        
        var entry = {
            value: value,
            timestamp: Date.now(),
            ttl: ttl || config.defaultTTL,
            type: type,
            id: id
        };
        
        cache[key] = entry;
        updateAccessOrder(key);
        stats.stores++;
        
        // Persist to localStorage if enabled
        if (config.persistToStorage) {
            saveToStorage(key, entry);
        }
        
        if (EventBus) {
            EventBus.publish('cache:set', { type: type, id: id });
        }
    }
    
    /**
     * Remove item from cache
     * @param {string} type - Cache type
     * @param {string} id - Item ID
     */
    function remove(type, id) {
        var key = generateKey(type, id);
        
        if (cache[key]) {
            delete cache[key];
            removeFromAccessOrder(key);
            
            if (config.persistToStorage) {
                removeFromStorage(key);
            }
            
            if (EventBus) {
                EventBus.publish('cache:remove', { type: type, id: id });
            }
        }
    }
    
    /**
     * Clear cache
     * @param {string} type - Optional type to clear specific type only
     */
    function clear(type) {
        if (type) {
            // Clear specific type
            var keysToRemove = [];
            for (var key in cache) {
                if (cache.hasOwnProperty(key) && cache[key].type === type) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(function(key) {
                delete cache[key];
                removeFromAccessOrder(key);
                if (config.persistToStorage) {
                    removeFromStorage(key);
                }
            });
        } else {
            // Clear all
            cache = {};
            accessOrder = [];
            
            if (config.persistToStorage) {
                clearStorage();
            }
        }
        
        if (EventBus) {
            EventBus.publish(Constants.EVENTS.CACHE_CLEARED, { type: type });
        }
    }
    
    /**
     * Check if entry is expired
     * @param {object} entry - Cache entry
     * @returns {boolean} True if expired
     */
    function isExpired(entry) {
        if (!entry.ttl || entry.ttl === -1) {
            return false; // No expiration
        }
        return Date.now() - entry.timestamp > entry.ttl;
    }
    
    /**
     * Update access order for LRU
     * @param {string} key - Cache key
     */
    function updateAccessOrder(key) {
        removeFromAccessOrder(key);
        accessOrder.push(key);
    }
    
    /**
     * Remove from access order
     * @param {string} key - Cache key
     */
    function removeFromAccessOrder(key) {
        var index = accessOrder.indexOf(key);
        if (index > -1) {
            accessOrder.splice(index, 1);
        }
    }
    
    /**
     * Evict least recently used item
     */
    function evictLRU() {
        if (accessOrder.length > 0) {
            var keyToEvict = accessOrder[0];
            var entry = cache[keyToEvict];
            
            delete cache[keyToEvict];
            accessOrder.shift();
            stats.evictions++;
            
            if (config.persistToStorage) {
                removeFromStorage(keyToEvict);
            }
            
            if (EventBus) {
                EventBus.publish('cache:evicted', { 
                    type: entry.type, 
                    id: entry.id 
                });
            }
        }
    }
    
    /**
     * Save to localStorage
     * @param {string} key - Cache key
     * @param {object} entry - Cache entry
     */
    function saveToStorage(key, entry) {
        try {
            if (window.localStorage) {
                localStorage.setItem(
                    config.storagePrefix + key,
                    JSON.stringify(entry)
                );
            }
        } catch (e) {
            console.warn('CacheManager: Failed to save to localStorage', e);
        }
    }
    
    /**
     * Load from localStorage
     * @param {string} key - Cache key
     * @returns {object} Cache entry or null
     */
    function loadFromStorage(key) {
        try {
            if (window.localStorage) {
                var stored = localStorage.getItem(config.storagePrefix + key);
                if (stored) {
                    return JSON.parse(stored);
                }
            }
        } catch (e) {
            console.warn('CacheManager: Failed to load from localStorage', e);
        }
        return null;
    }
    
    /**
     * Remove from localStorage
     * @param {string} key - Cache key
     */
    function removeFromStorage(key) {
        try {
            if (window.localStorage) {
                localStorage.removeItem(config.storagePrefix + key);
            }
        } catch (e) {
            console.warn('CacheManager: Failed to remove from localStorage', e);
        }
    }
    
    /**
     * Clear localStorage cache
     */
    function clearStorage() {
        try {
            if (window.localStorage) {
                var keysToRemove = [];
                for (var i = 0; i < localStorage.length; i++) {
                    var key = localStorage.key(i);
                    if (key && key.indexOf(config.storagePrefix) === 0) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(function(key) {
                    localStorage.removeItem(key);
                });
            }
        } catch (e) {
            console.warn('CacheManager: Failed to clear localStorage', e);
        }
    }
    
    /**
     * Get cache statistics
     * @returns {object} Cache statistics
     */
    function getStats() {
        var hitRate = stats.hits + stats.misses > 0 
            ? (stats.hits / (stats.hits + stats.misses) * 100).toFixed(2) + '%'
            : '0%';
            
        return {
            hits: stats.hits,
            misses: stats.misses,
            hitRate: hitRate,
            evictions: stats.evictions,
            stores: stats.stores,
            size: Object.keys(cache).length,
            maxSize: config.maxSize
        };
    }
    
    /**
     * Reset statistics
     */
    function resetStats() {
        stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            stores: 0
        };
    }
    
    /**
     * Configure cache manager
     * @param {object} options - Configuration options
     */
    function configure(options) {
        config = $.extend(true, {}, config, options);
    }
    
    /**
     * Preload cache with data
     * @param {string} type - Cache type
     * @param {array} items - Items to cache
     * @param {function} idExtractor - Function to extract ID from item
     */
    function preload(type, items, idExtractor) {
        if (!Array.isArray(items)) {
            return;
        }
        
        items.forEach(function(item) {
            var id = idExtractor ? idExtractor(item) : item.id;
            if (id) {
                set(type, id, item);
            }
        });
    }
    
    /**
     * Clean expired entries
     */
    function cleanExpired() {
        var keysToRemove = [];
        var now = Date.now();
        
        for (var key in cache) {
            if (cache.hasOwnProperty(key)) {
                var entry = cache[key];
                if (isExpired(entry)) {
                    keysToRemove.push(key);
                }
            }
        }
        
        keysToRemove.forEach(function(key) {
            var entry = cache[key];
            remove(entry.type, entry.id);
        });
        
        return keysToRemove.length;
    }
    
    // Auto-clean expired entries periodically
    setInterval(cleanExpired, 60000); // Every minute
    
    // Public API
    return {
        get: get,
        set: set,
        remove: remove,
        clear: clear,
        getStats: getStats,
        resetStats: resetStats,
        configure: configure,
        preload: preload,
        cleanExpired: cleanExpired,
        
        // Utility methods
        has: function(type, id) {
            return get(type, id) !== null;
        },
        
        size: function() {
            return Object.keys(cache).length;
        },
        
        isEmpty: function() {
            return Object.keys(cache).length === 0;
        }
    };
})();

// Create global instance for easy access
window.AdviceCache = Alt.AdviceManagement.Common.CacheManager;