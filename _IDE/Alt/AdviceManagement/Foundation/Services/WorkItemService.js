
// Namespacing (ensure helper is loaded before this file)
namespace("Alt.AdviceManagement.Services");

/**
 * Work Item Service
 * Service for managing work items using ShareDo's $ajax API wrapper.
 *
 * Notes:
 * - Auth is handled by $ajax, do not pass tokens here.
 * - Endpoints align with /api/v1/public/workItem/ swagger.
 */

/**
 * Work Item Participants represent role assignments to the new work item.
 * Either userId (UUID) or odsId (numeric/string identifier) can be used depending on environment.
 * @typedef {Object} WorkItemParticipant
 * @property {string} roleSystemName - Role to assign (e.g., "primary-owner").
 * @property {string} [userId] - User UUID (preferred when available in your tenant).
 * @property {string|number} [odsId] - ODS identifier (preferred in ODS-centric configurations).
 */

/**
 * Core work item details for creation.
 * @typedef {Object} WorkItemCreateWorkItem
 * @property {string} sharedoTypeSystemName - The work type system name to create (e.g., 'alt-matter-advice-status-change-worktype-v1').
 * @property {string} title - Title of the work item.
 * @property {boolean} [titleIsUserProvided] - Set true if title is user-provided to avoid auto-overwrite.
 * @property {string} [description] - Description/body text.
 * @property {string} [reference] - External reference string if applicable.
 * @property {boolean} [referenceIsUserProvided] - Set true if reference is user-provided.
 */

/**
 * Optional Task aspect settings.
 * @typedef {Object} WorkItemCreateAspectTask
 * @property {string} [dueDateTime] - Due date/time. Accepts ISO-8601 or 'yyyy-MM-dd HH:mm' depending on tenant configuration.
 */

/**
 * Optional aspect data bag. Supply only aspects you need.
 * @typedef {Object} WorkItemCreateAspectData
 * @property {WorkItemCreateAspectTask} [task]
 * @property {Object.<string, any>} [other] - Any other aspect payloads by convention.
 */

/**
 * Payload for creating a Work Item via POST /api/v1/public/workItem/.
 * This mirrors the WorkItemCreateRequestResponse shape in swagger.
 * @typedef {Object} WorkItemCreate
 * @property {string} [parentSharedoId] - If provided, sets the parent work item.
 * @property {WorkItemCreateWorkItem} workItem - Core work item fields (type, title, description, ...).
 * @property {WorkItemParticipant[]} [participants] - Initial participants to assign.
 * @property {WorkItemCreateAspectData} [aspectData] - Aspect payloads (e.g., task).
 * @property {Object.<string, any>} [attributes] - Initial attributes to set (if enabled for your tenant).
 */

Alt.AdviceManagement.Services.WorkItemService = function(baseUrl) {
    var self = this;
    // Optional prefix for endpoints; keep empty to use absolute API paths.
    self.baseUrl = (baseUrl || '').replace(/\/$/, ''); // Remove trailing slash

    // Swagger-derived metadata to guide development
    var SWAGGER_META = {
        host: 'mccabes-vnext.sharedo.tech',
        basePath: '/api/v1/public/workItem/',
        consumes: ['application/json'],
        produces: ['application/json'],
        operations: {
            createWorkItem: {
                method: 'POST',
                path: '/',
                operationId: 'createWorkItem',
                description: "Creates a new Work Item and its associated data. Requires 'Create' permission on the Work Type.",
                responses: { 200: 'WorkItemCreate', 400: 'Bad Request', 403: 'Forbidden', 500: 'Error' },
                schemaRef: '//mccabes-vnext.sharedo.tech/api/v1/public/workItem/createModels.swagger.json#/definitions/WorkItemCreateRequestResponse'
            },
            updateWorkItem: {
                method: 'PUT',
                path: '/{workItemId}',
                operationId: 'updateWorkItem',
                description: 'Updates a Work Item and its associated data. Requires correct permission (core.sharedo.update).',
                responses: { 200: 'WorkItemSummary', 400: 'Bad Request', 403: 'Forbidden', 500: 'Error' },
                schemaRef: '//mccabes-vnext.sharedo.tech/api/v1/public/workItem/updateModels.swagger.json#/definitions/WorkItemSummaryRequestResponse'
            },
            getWorkItem: {
                method: 'GET',
                path: '/{workItemId}',
                operationId: 'getWorkItem',
                description: 'Gets a Work Item and its associated data.',
                responses: { 200: 'WorkItemSummary', 404: 'Not Found' },
                schemaRef: '//mccabes-vnext.sharedo.tech/api/v1/public/workItem/updateModels.swagger.json#/definitions/WorkItemSummaryRequestResponse'
            }
    },
    // Local IDE swagger (same-name JSON colocated with this service)
    localSpecPath: '/_ideFiles/Alt/AdviceManagement/Foundation/Services/WorkItemService.json'
    };

    /**
     * Return swagger info for developer reference (no network calls).
     * @returns {{host:string,basePath:string,operations:Object,consumes:string[],produces:string[],localSpecPath:string}}
     */
    self.getSwaggerReference = function() { return SWAGGER_META; };

    /**
     * Make HTTP request
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} API response
     */
    self.makeRequest = async function(method, endpoint, data, params) {
        try {
            // Build URL with optional base and query string
            var url = '' + self.baseUrl + endpoint;
            if (params && typeof params === 'object') {
                var qs = Object.keys(params)
                    .filter(function(k){ return params[k] !== null && params[k] !== undefined; })
                    .map(function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); })
                    .join('&');
                if (qs) url += (url.indexOf('?') === -1 ? '?' : '&') + qs;
            }

            var m = (method || 'GET').toUpperCase();

            if (!window.$ajax || !$ajax.api) {
                throw new Error('$ajax.api is not available in this context');
            }

            if (m === 'GET' && typeof $ajax.api.get === 'function') {
                return await $ajax.api.get(url);
            }
            if (m === 'POST' && typeof $ajax.api.post === 'function') {
                return await $ajax.api.post(url, data || {});
            }
            if (m === 'PUT' && typeof $ajax.api.put === 'function') {
                return await $ajax.api.put(url, data || {});
            }
            if (m === 'DELETE' && typeof $ajax.api.delete === 'function') {
                return await $ajax.api.delete(url);
            }
            if (m === 'PATCH' && typeof $ajax.api.patch === 'function') {
                return await $ajax.api.patch(url, data || {});
            }

            if (typeof $ajax.api.request === 'function') {
                return await $ajax.api.request({ url: url, method: m, data: data || {} });
            }

            throw new Error('$ajax.api does not support HTTP method ' + m + ' in this environment');
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    };

    /**
     * Best-effort validator of create payload based on swagger expectations.
     * Logs warnings for common issues; can throw in strict mode.
     * @param {WorkItemCreate} payload
     * @param {{strict?: boolean}} [options]
     */
    self.validateCreatePayload = function(payload, options) {
        var strict = options && options.strict === true;
        var issues = [];
        if (!payload || typeof payload !== 'object') issues.push('Payload must be an object');
        if (!payload || !payload.workItem) issues.push('workItem is required');
        if (payload && payload.workItem && !payload.workItem.sharedoTypeSystemName) issues.push('workItem.sharedoTypeSystemName is required');
        if (payload && payload.participants && Array.isArray(payload.participants)) {
            payload.participants.forEach(function(p, idx){
                if (!p.roleSystemName) issues.push('participants['+idx+'].roleSystemName is required');
                if (!p.userId && !p.odsId) issues.push('participants['+idx+'] should include userId or odsId');
            });
        }
        if (issues.length) {
            var msg = 'WorkItemCreate payload validation: ' + issues.join('; ');
            if (strict) { throw new Error(msg); }
            // eslint-disable-next-line no-console
            console.warn(msg);
        }
    };

    /**
     * Get all work items
     * @param {Object} filters - Query filters
     * @returns {Promise<Array>} List of work items
     */
    self.getWorkItems = async function(filters) {
        // Not exposed by the public Work Item API; keep stub for compatibility.
        return Promise.reject(new Error('Listing work items is not supported by the public API'));
    };

    /**
     * Get work item by ID
     * @param {string|number} id - Work item ID
     * @returns {Promise<Object>} Work item details
     */
    /**
     * Get a work item by ID
     * @param {string} id - Work item identifier
     * @returns {Promise<Object>} Work item summary (see WorkItemSummary in swagger)
     */
    /**
     * Get a work item by ID
     * @swaggerOperation getWorkItem
     * @see SWAGGER: /api/v1/public/workItem/{workItemId}
     * @see https://mccabes-vnext.sharedo.tech/api/v1/public/workItem/updateModels.swagger.json#/definitions/WorkItemSummaryRequestResponse
     * @param {string} id - Work item identifier
     * @returns {Promise<Object>} Work item summary (see WorkItemSummary in swagger)
     */
    self.getWorkItemById = async function(id) {
        return await self.makeRequest('GET', '/api/v1/public/workItem/' + id);
    };

    /**
     * Create new work item
     * @param {Object} workItem - Work item data
     * @returns {Promise<Object>} Created work item
     */
    /**
     * Create a new work item
     * @swaggerOperation createWorkItem
     * @see SWAGGER: POST /api/v1/public/workItem/
     * @see https://mccabes-vnext.sharedo.tech/api/v1/public/workItem/createModels.swagger.json#/definitions/WorkItemCreateRequestResponse
     * @see LOCAL: /_ideFiles/Alt/AdviceManagement/Foundation/Services/WorkItemService.json
     * @param {WorkItemCreate} workItem - Creation payload (see typedef)
     * @returns {Promise<Object>} 200 OK with created work item (schema: WorkItemCreateRequestResponse)
     * @throws 400 Bad Request | 403 Forbidden | 500 Error
     * @example
     * const svc = new Alt.AdviceManagement.Services.WorkItemService();
     * await svc.createWorkItem({
     *   parentSharedoId: '12345',
     *   workItem: {
     *     sharedoTypeSystemName: 'alt-matter-advice-status-change-worktype-v1',
     *     title: 'Advice Pause',
     *     titleIsUserProvided: true,
     *     description: 'Action: pause | By: Jane Doe | At: 2025-08-18T12:34:56Z | Reason: Awaiting info'
     *   },
     *   participants: [ { roleSystemName: 'primary-owner', odsId: '8675309' } ],
     *   aspectData: { task: { dueDateTime: '2025-09-01 09:00' } }
     * });
     */
    self.createWorkItem = async function(workItem) {
        // Dev-friendly validation (non-strict)
        self.validateCreatePayload(workItem, { strict: false });
        return await self.makeRequest('POST', '/api/v1/public/workItem/', workItem);
    };

    /**
     * Update work item
     * @param {string|number} id - Work item ID
     * @param {Object} workItem - Updated work item data
     * @returns {Promise<Object>} Updated work item
     */
    /**
     * Update an existing work item (PUT)
     * @swaggerOperation updateWorkItem
     * @see SWAGGER: PUT /api/v1/public/workItem/{workItemId}
     * @see https://mccabes-vnext.sharedo.tech/api/v1/public/workItem/updateModels.swagger.json#/definitions/WorkItemSummaryRequestResponse
     * @param {string} id - Work item ID
     * @param {Object} workItem - Payload per WorkItemSummary (swagger)
     * @returns {Promise<Object>} Updated work item summary
     */
    self.updateWorkItem = async function(id, workItem) {
        return await self.makeRequest('PUT', '/api/v1/public/workItem/' + id, workItem);
    };

    /**
     * Partially update work item
     * @param {string|number} id - Work item ID
     * @param {Object} updates - Partial updates
     * @returns {Promise<Object>} Updated work item
     */
    /**
     * Partially update an existing work item (not supported in public API)
     * @deprecated Use updateWorkItem (PUT) with a full payload instead.
     */
    self.patchWorkItem = async function(id, updates) {
        // Not supported by public API; use updateWorkItem (PUT) instead.
        return Promise.reject(new Error('PATCH is not supported by the public API'));
    };

    /**
     * Delete work item
     * @param {string|number} id - Work item ID
     * @returns {Promise<void>}
     */
    /**
     * Delete a work item (not supported in public API)
     */
    self.deleteWorkItem = async function(id) {
        // Not supported by public API.
        return Promise.reject(new Error('DELETE is not supported by the public API'));
    };

    /**
     * Search work items
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Array>} Search results
     */
    /**
     * Search work items (not exposed by the public API here)
     */
    self.searchWorkItems = async function(query, options) {
        // Not documented in swagger; provide stub.
        return Promise.reject(new Error('Search is not exposed via the public API in this context'));
    };

    /**
     * Get work items by status
     * @param {string} status - Work item status
     * @returns {Promise<Array>} Work items with specified status
     */
    /**
     * Get by status (not supported in public API)
     */
    self.getWorkItemsByStatus = async function(status) {
        return Promise.reject(new Error('Filtering by status is not supported by the public API'));
    };

    /**
     * Get work items by assignee
     * @param {string} assigneeId - Assignee ID
     * @returns {Promise<Array>} Work items assigned to user
     */
    /**
     * Get by assignee (not supported in public API)
     */
    self.getWorkItemsByAssignee = async function(assigneeId) {
        return Promise.reject(new Error('Filtering by assignee is not supported by the public API'));
    };

    /**
     * Get work items by priority
     * @param {string} priority - Priority level
     * @returns {Promise<Array>} Work items with specified priority
     */
    /**
     * Get by priority (not supported in public API)
     */
    self.getWorkItemsByPriority = async function(priority) {
        return Promise.reject(new Error('Filtering by priority is not supported by the public API'));
    };

    /**
     * Update work item status
     * @param {string|number} id - Work item ID
     * @param {string} status - New status
     * @returns {Promise<Object>} Updated work item
     */
    /**
     * Update status helper (domain-specific; not provided in public API)
     */
    self.updateWorkItemStatus = async function(id, status) {
        return Promise.reject(new Error('Status updates are domain-specific; use updateWorkItem with appropriate payload'));
    };

    /**
     * Assign work item to user
     * @param {string|number} id - Work item ID
     * @param {string} assigneeId - User ID to assign to
     * @returns {Promise<Object>} Updated work item
     */
    /**
     * Assign helper (not supported in public API)
     */
    self.assignWorkItem = async function(id, assigneeId) {
        return Promise.reject(new Error('Assigning via public API is not supported here'));
    };

    /**
     * Set API key for authentication
     * @param {string} apiKey - API key
     */
    self.setApiKey = function(apiKey) {
        // No-op: $ajax handles auth; kept for backward compatibility.
        self.apiKey = apiKey;
    };

    /**
     * Remove API key
     */
    self.clearApiKey = function() {
        // No-op: $ajax handles auth; kept for backward compatibility.
        self.apiKey = null;
    };
};

// Backwards compatibility (optional global alias)
window.WorkItemService = window.WorkItemService || Alt.AdviceManagement.Services.WorkItemService;