/**
 * Unit tests for AdviceStatusController workflow action
 */
describe('AdviceStatusController', function() {
    var controller;
    var mockContext;
    var mockConfig;
    var mockCallback;
    var mockService;
    
    beforeEach(function() {
        // Setup mock context
        mockContext = {
            workItemId: 'WI-12345',
            inputs: {
                workItemId: 'WI-12345'
            },
            user: 'test.user@example.com',
            workflow: {
                id: 'WF-001',
                name: 'Test Workflow'
            }
        };
        
        // Setup mock configuration
        mockConfig = {
            defaultAction: 'checkOnly',
            conditions: [
                { when: 'active', then: 'pause' },
                { when: 'paused', then: 'resume' }
            ],
            pauseReason: 'Test pause reason',
            requireConfirmation: false,
            enableLogging: true,
            retryOnFailure: true,
            maxRetries: 3,
            retryDelay: 100,
            timeout: 5000
        };
        
        // Setup mock callback
        mockCallback = jasmine.createSpy('callback');
        
        // Setup mock service
        mockService = {
            getAdviceStatus: jasmine.createSpy('getAdviceStatus'),
            pauseAdvice: jasmine.createSpy('pauseAdvice'),
            resumeAdvice: jasmine.createSpy('resumeAdvice')
        };
        
        // Mock the AdviceService
        spyOn(Alt.AdviceManagement, 'AdviceService').and.returnValue(mockService);
    });
    
    describe('Initialization', function() {
        it('should initialize with default configuration', function() {
            controller = new Alt.AdviceManagement.AdviceStatusController(
                mockContext, 
                {}, 
                mockCallback
            );
            
            expect(controller.config.defaultAction).toBe('checkOnly');
            expect(controller.config.enableLogging).toBe(true);
            expect(controller.config.maxRetries).toBe(3);
        });
        
        it('should merge custom configuration', function() {
            controller = new Alt.AdviceManagement.AdviceStatusController(
                mockContext, 
                mockConfig, 
                mockCallback
            );
            
            expect(controller.config.conditions.length).toBe(2);
            expect(controller.config.pauseReason).toBe('Test pause reason');
        });
        
        it('should validate work item ID is required', function() {
            mockContext.workItemId = null;
            mockContext.inputs.workItemId = null;
            
            controller = new Alt.AdviceManagement.AdviceStatusController(
                mockContext, 
                mockConfig, 
                mockCallback
            );
            
            expect(mockCallback).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    branch: 'error',
                    outputs: jasmine.objectContaining({
                        success: false,
                        message: 'Invalid input parameters'
                    })
                })
            );
        });
    });
    
    describe('Status Checking', function() {
        beforeEach(function() {
            controller = new Alt.AdviceManagement.AdviceStatusController(
                mockContext, 
                mockConfig, 
                mockCallback
            );
        });
        
        it('should check advice status successfully', function(done) {
            mockService.getAdviceStatus.and.callFake(function(workItemId, callback) {
                callback(true, { status: 'active' });
            });
            
            controller.checkAdviceStatus(function(success, status) {
                expect(success).toBe(true);
                expect(status).toEqual({ status: 'active' });
                expect(mockService.getAdviceStatus).toHaveBeenCalledWith(
                    'WI-12345', 
                    jasmine.any(Function)
                );
                done();
            });
        });
        
        it('should handle status check failure', function(done) {
            mockService.getAdviceStatus.and.callFake(function(workItemId, callback) {
                callback(false, 'Network error');
            });
            
            controller.checkAdviceStatus(function(success, status) {
                expect(success).toBe(false);
                expect(status).toBeNull();
                done();
            });
        });
    });
    
    describe('Action Determination', function() {
        beforeEach(function() {
            controller = new Alt.AdviceManagement.AdviceStatusController(
                mockContext, 
                mockConfig, 
                mockCallback
            );
        });
        
        it('should determine action based on conditions', function() {
            var action = controller.determineAction('active');
            expect(action).toBe('pause');
            
            action = controller.determineAction('paused');
            expect(action).toBe('resume');
        });
        
        it('should use default action when no condition matches', function() {
            var action = controller.determineAction('unknown');
            expect(action).toBe('checkOnly');
        });
        
        it('should handle wildcard conditions', function() {
            controller.config.conditions = [
                { when: '*', then: 'toggle' }
            ];
            
            var action = controller.determineAction('any-status');
            expect(action).toBe('toggle');
        });
    });
    
    describe('Action Execution', function() {
        beforeEach(function() {
            controller = new Alt.AdviceManagement.AdviceStatusController(
                mockContext, 
                mockConfig, 
                mockCallback
            );
        });
        
        it('should pause advice when action is pause', function(done) {
            mockService.pauseAdvice.and.callFake(function(workItemId, reason, callback) {
                callback(true, {});
            });
            
            controller.pauseAdvice(function(success, message) {
                expect(success).toBe(true);
                expect(mockService.pauseAdvice).toHaveBeenCalledWith(
                    'WI-12345',
                    'Test pause reason',
                    jasmine.any(Function)
                );
                expect(controller.state.actionTaken).toBe('paused');
                done();
            });
        });
        
        it('should resume advice when action is resume', function(done) {
            mockService.resumeAdvice.and.callFake(function(workItemId, callback) {
                callback(true, {});
            });
            
            controller.resumeAdvice(function(success, message) {
                expect(success).toBe(true);
                expect(mockService.resumeAdvice).toHaveBeenCalledWith(
                    'WI-12345',
                    jasmine.any(Function)
                );
                expect(controller.state.actionTaken).toBe('resumed');
                done();
            });
        });
        
        it('should not pause if already paused', function(done) {
            controller.state.previousStatus = 'paused';
            
            controller.pauseAdvice(function(success, message) {
                expect(success).toBe(true);
                expect(message).toBe('Advice was already paused');
                expect(mockService.pauseAdvice).not.toHaveBeenCalled();
                done();
            });
        });
        
        it('should toggle status correctly', function(done) {
            controller.state.previousStatus = 'active';
            
            spyOn(controller, 'pauseAdvice').and.callFake(function(callback) {
                callback(true, 'Paused');
            });
            
            controller.toggleAdvice(function(success, message) {
                expect(controller.pauseAdvice).toHaveBeenCalled();
                done();
            });
        });
    });
    
    describe('Retry Logic', function() {
        beforeEach(function() {
            jasmine.clock().install();
            controller = new Alt.AdviceManagement.AdviceStatusController(
                mockContext, 
                mockConfig, 
                mockCallback
            );
        });
        
        afterEach(function() {
            jasmine.clock().uninstall();
        });
        
        it('should retry on failure', function() {
            var attempts = 0;
            mockService.getAdviceStatus.and.callFake(function(workItemId, callback) {
                attempts++;
                if (attempts < 3) {
                    callback(false, 'Network error');
                } else {
                    callback(true, { status: 'active' });
                }
            });
            
            controller.executeWithRetry(function() {});
            
            jasmine.clock().tick(100);
            expect(attempts).toBe(2);
            
            jasmine.clock().tick(200);
            expect(attempts).toBe(3);
        });
        
        it('should stop retrying after max attempts', function() {
            mockService.getAdviceStatus.and.callFake(function(workItemId, callback) {
                callback(false, 'Network error');
            });
            
            controller.executeWithRetry(function(success, message) {
                expect(success).toBe(false);
                expect(message).toContain('Failed to check advice status after 3 attempts');
            });
            
            jasmine.clock().tick(10000);
            expect(mockService.getAdviceStatus.calls.count()).toBe(3);
        });
    });
    
    describe('Completion and Output', function() {
        beforeEach(function() {
            controller = new Alt.AdviceManagement.AdviceStatusController(
                mockContext, 
                mockConfig, 
                mockCallback
            );
        });
        
        it('should complete with success branch', function() {
            controller.state.actionTaken = 'none';
            controller.complete(true, 'Success');
            
            expect(mockCallback).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    branch: 'success',
                    outputs: jasmine.objectContaining({
                        success: true,
                        message: 'Success',
                        actionTaken: 'none'
                    })
                })
            );
        });
        
        it('should complete with paused branch', function() {
            controller.state.actionTaken = 'paused';
            controller.complete(true, 'Paused');
            
            expect(mockCallback).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    branch: 'paused'
                })
            );
        });
        
        it('should complete with error branch on failure', function() {
            controller.errors = ['Error 1', 'Error 2'];
            controller.complete(false, 'Failed');
            
            expect(mockCallback).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    branch: 'error',
                    outputs: jasmine.objectContaining({
                        success: false,
                        errors: ['Error 1', 'Error 2']
                    })
                })
            );
        });
        
        it('should include logs in output', function() {
            controller.state.logs = [
                { level: 'info', message: 'Test log' }
            ];
            controller.complete(true, 'Success');
            
            expect(mockCallback).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    outputs: jasmine.objectContaining({
                        logs: [{ level: 'info', message: 'Test log' }]
                    })
                })
            );
        });
    });
    
    describe('Static Methods', function() {
        it('should return metadata', function() {
            var metadata = Alt.AdviceManagement.AdviceStatusController.getMetadata();
            
            expect(metadata.name).toBe('Advice Status Controller');
            expect(metadata.icon).toBe('fa-code-fork');
            expect(metadata.color).toBe('#17a2b8');
        });
    });
});