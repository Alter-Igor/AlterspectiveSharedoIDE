namespace("Alt.AdviceManagement.Services");

/**
 * Service for resolving user information from UUIDs
 * Caches user data to minimize API calls
 */
Alt.AdviceManagement.Services.UserService = function() {
    var self = this;
    
    // Cache for user data
    self.userCache = {};
    
    // Cache TTL (5 minutes)
    self.cacheTTL = 5 * 60 * 1000;
    
    // Track cache timestamps
    self.cacheTimestamps = {};
};

/**
 * Get user display name from UUID or ODS ID
 * @param {string} userId - The user UUID or ODS ID
 * @returns {Promise<string>} - Promise resolving to display name
 */
Alt.AdviceManagement.Services.UserService.prototype.getUserDisplayName = function(userId) {
    var self = this;
    
    if (!userId) {
        return $.Deferred().resolve('Unknown User').promise();
    }
    
    // First check if this is the current user's ODS ID
    if (window.$ui && window.$ui.pageContext && window.$ui.pageContext.user) {
        var currentUser = window.$ui.pageContext.user;
        
        // Check various user ID fields
        var currentOdsId = currentUser.odsid ? (typeof currentUser.odsid === 'function' ? currentUser.odsid() : currentUser.odsid) : null;
        var currentUserId = currentUser.userid ? (typeof currentUser.userid === 'function' ? currentUser.userid() : currentUser.userid) : null;
        var currentId = currentUser.id ? (typeof currentUser.id === 'function' ? currentUser.id() : currentUser.id) : null;
        
        // Log for debugging
        console.log('Checking if user matches current user:', {
            checkingId: userId,
            currentOdsId: currentOdsId,
            currentUserId: currentUserId,
            currentId: currentId
        });
        
        if (userId === currentOdsId || userId === currentUserId || userId === currentId) {
            // This is the current user
            var firstName = typeof currentUser.firstname === 'function' ? currentUser.firstname() : currentUser.firstname || '';
            var lastName = typeof currentUser.lastname === 'function' ? currentUser.lastname() : currentUser.lastname || '';
            var displayName = (firstName + ' ' + lastName).trim() || 'Current User';
            
            console.log('Matched current user, returning:', displayName);
            return $.Deferred().resolve(displayName).promise();
        }
    }
    
    // Also check immersiontheme if available (ShareDo often stores user info here)
    if (window.immersiontheme && window.immersiontheme.currentUserOdsId) {
        console.log('Checking immersiontheme:', window.immersiontheme.currentUserOdsId);
        if (userId === window.immersiontheme.currentUserOdsId) {
            // Get user name from immersiontheme or page context
            var userName = 'Current User';
            if (window.immersiontheme.currentUserName) {
                userName = window.immersiontheme.currentUserName;
            } else if (window.$ui && window.$ui.pageContext && window.$ui.pageContext.user) {
                var user = window.$ui.pageContext.user;
                var firstName = typeof user.firstname === 'function' ? user.firstname() : user.firstname || '';
                var lastName = typeof user.lastname === 'function' ? user.lastname() : user.lastname || '';
                userName = (firstName + ' ' + lastName).trim() || 'Current User';
            }
            console.log('Matched via immersiontheme, returning:', userName);
            return $.Deferred().resolve(userName).promise();
        }
    }
    
    // Check if cached and still valid
    if (self.userCache[userId] && self.isCacheValid(userId)) {
        return $.Deferred().resolve(self.userCache[userId].displayName).promise();
    }
    
    // Try ODS API first (if available)
    if (window.$ajax && window.$ajax.api && window.$ajax.api.ods) {
        return self.getUserFromODS(userId)
            .catch(function() {
                // If ODS fails, try users API
                return self.getUserFromAPI(userId);
            });
    }
    
    // Default to users API
    return self.getUserFromAPI(userId);
};

/**
 * Get user from the Users API
 * @private
 */
Alt.AdviceManagement.Services.UserService.prototype.getUserFromAPI = function(userId) {
    var self = this;
    
    return $ajax.api.get('/api/public/v2/users/' + userId)
        .then(function(user) {
            // Cache the user data
            self.cacheUser(userId, user);
            
            // Build display name
            var displayName = self.buildDisplayName(user);
            return displayName;
        })
        .catch(function(error) {
            console.warn('Failed to fetch user from API ' + userId + ':', error);
            
            // Try alternative: check if it's stored in attributes or local data
            return self.getUserFromLocalData(userId);
        });
};

/**
 * Get user from ODS API
 * @private
 */
Alt.AdviceManagement.Services.UserService.prototype.getUserFromODS = function(odsId) {
    var self = this;
    
    // Try ODS entity API if available
    return $ajax.api.get('/api/v1/public/ods/entity/' + odsId)
        .then(function(entity) {
            if (entity && entity.displayName) {
                // Cache with display name
                self.userCache[odsId] = {
                    displayName: entity.displayName,
                    firstName: entity.firstName || '',
                    suname: entity.lastName || entity.surname || ''
                };
                self.cacheTimestamps[odsId] = new Date().getTime();
                
                return entity.displayName;
            }
            throw new Error('No display name in ODS entity');
        })
        .catch(function(error) {
            console.warn('Failed to fetch from ODS:', error);
            throw error;
        });
};

/**
 * Try to get user from local data sources
 * @private
 */
Alt.AdviceManagement.Services.UserService.prototype.getUserFromLocalData = function(userId) {
    var self = this;
    
    // Check if we have any user mappings in session storage
    if (window.sessionStorage) {
        var cachedName = sessionStorage.getItem('user_' + userId);
        if (cachedName) {
            return $.Deferred().resolve(cachedName).promise();
        }
    }
    
    // Check if it's in any global user list
    if (window.ShareDo && window.ShareDo.users) {
        var user = window.ShareDo.users[userId];
        if (user) {
            return $.Deferred().resolve(user.displayName || user.name || userId).promise();
        }
    }
    
    // Last resort: return a shortened version of the ID
    // If it looks like a UUID, just show first 8 characters
    if (userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-/i)) {
        return $.Deferred().resolve('User-' + userId.substring(0, 8)).promise();
    }
    
    return $.Deferred().resolve(userId).promise();
};

/**
 * Get full user information
 * @param {string} userId - The user UUID
 * @returns {Promise<Object>} - Promise resolving to user object
 */
Alt.AdviceManagement.Services.UserService.prototype.getUser = function(userId) {
    var self = this;
    
    if (!userId) {
        return $.Deferred().reject('No user ID provided').promise();
    }
    
    // Check if cached and still valid
    if (self.userCache[userId] && self.isCacheValid(userId)) {
        return $.Deferred().resolve(self.userCache[userId]).promise();
    }
    
    // Fetch from API
    return $ajax.api.get('/api/public/v2/users/' + userId)
        .then(function(user) {
            // Cache the user data
            self.cacheUser(userId, user);
            return user;
        })
        .catch(function(error) {
            console.error('Failed to fetch user ' + userId + ':', error);
            throw error;
        });
};

/**
 * Get multiple users at once
 * @param {Array<string>} userIds - Array of user UUIDs
 * @returns {Promise<Object>} - Promise resolving to object mapping userId to displayName
 */
Alt.AdviceManagement.Services.UserService.prototype.getMultipleUsers = function(userIds) {
    var self = this;
    
    if (!userIds || userIds.length === 0) {
        return $.Deferred().resolve({}).promise();
    }
    
    var promises = [];
    var results = {};
    
    userIds.forEach(function(userId) {
        var promise = self.getUserDisplayName(userId)
            .then(function(displayName) {
                results[userId] = displayName;
            });
        promises.push(promise);
    });
    
    return $.when.apply($, promises).then(function() {
        return results;
    });
};

/**
 * Build display name from user object
 * @param {Object} user - User object from API
 * @returns {string} - Display name
 */
Alt.AdviceManagement.Services.UserService.prototype.buildDisplayName = function(user) {
    if (!user) return 'Unknown User';
    
    // Priority: shortName > firstName + surname > firstName > reference > id
    if (user.shortName) {
        return user.shortName;
    }
    
    var firstName = user.firstName || '';
    var surname = user.suname || user.surname || ''; // Handle API typo
    
    if (firstName && surname) {
        return firstName + ' ' + surname;
    }
    
    if (firstName) {
        return firstName;
    }
    
    if (user.reference) {
        return user.reference;
    }
    
    return user.id || 'Unknown User';
};

/**
 * Cache user data
 * @param {string} userId - User UUID
 * @param {Object} user - User object from API
 */
Alt.AdviceManagement.Services.UserService.prototype.cacheUser = function(userId, user) {
    var self = this;
    
    // Add computed display name
    user.displayName = self.buildDisplayName(user);
    
    // Cache the user
    self.userCache[userId] = user;
    self.cacheTimestamps[userId] = new Date().getTime();
};

/**
 * Check if cache entry is still valid
 * @param {string} userId - User UUID
 * @returns {boolean} - True if cache is valid
 */
Alt.AdviceManagement.Services.UserService.prototype.isCacheValid = function(userId) {
    var self = this;
    
    if (!self.cacheTimestamps[userId]) {
        return false;
    }
    
    var now = new Date().getTime();
    var cacheTime = self.cacheTimestamps[userId];
    
    return (now - cacheTime) < self.cacheTTL;
};

/**
 * Clear cache for a specific user
 * @param {string} userId - User UUID
 */
Alt.AdviceManagement.Services.UserService.prototype.clearUserCache = function(userId) {
    var self = this;
    delete self.userCache[userId];
    delete self.cacheTimestamps[userId];
};

/**
 * Clear entire cache
 */
Alt.AdviceManagement.Services.UserService.prototype.clearCache = function() {
    var self = this;
    self.userCache = {};
    self.cacheTimestamps = {};
};

/**
 * Get user avatar
 * @param {string} userId - User UUID
 * @returns {Promise<string>} - Promise resolving to data URL of avatar
 */
Alt.AdviceManagement.Services.UserService.prototype.getUserAvatar = function(userId) {
    if (!userId) {
        return $.Deferred().resolve(null).promise();
    }
    
    return $ajax.api.get('/api/public/v2/users/' + userId + '/avatar')
        .then(function(avatar) {
            if (avatar && avatar.content) {
                return 'data:' + avatar.mimeType + ';base64,' + avatar.content;
            }
            return null;
        })
        .catch(function(error) {
            console.error('Failed to fetch avatar for user ' + userId + ':', error);
            return null;
        });
};

// Create singleton instance
Alt.AdviceManagement.Services.userService = new Alt.AdviceManagement.Services.UserService();