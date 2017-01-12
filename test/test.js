"use strict";

/*global describe:true, it:true*/

var Chai = require('chai');
var DirtyChai = require('dirty-chai');
var expect = Chai.expect;

Chai.use(DirtyChai);

var Errors = require('super-errors')();
require('../index.js')(Errors);

describe('SuperErrors', function(){
    describe('json()', function(){
        it('should return a client-safe JSON serializable object by default', function(){
            expect(Errors.json({ message:'hi' })).to.deep.equal({ message:'There was an error.', name:'UnknownError', status_code:500 });
            expect(Errors.json({ name:'NotifyUser', client_safe_message:'Bad stuff happened...', stack:'unsafe...', status_code:400 })).to.deep.equal({ name:'NotifyUser', message:'Bad stuff happened...', status_code:400 });
        });
        
        it('should handle primative types', function(){
            var default_json = { message:'There was an error.', name:'UnknownError', status_code:500 };
            expect(Errors.json(true)).to.deep.equal(default_json);
            expect(Errors.json(false)).to.deep.equal(default_json);
            expect(Errors.json('')).to.deep.equal(default_json);
            expect(Errors.json({})).to.deep.equal(default_json);
            expect(Errors.json([])).to.deep.equal(default_json);
            expect(Errors.json([[]])).to.deep.equal(default_json);
            expect(Errors.json([{}])).to.deep.equal(default_json);
            expect(Errors.json([{}, {}])).to.deep.equal({
                errors:["There was an error."],
                message:'There was an error.',
                name:'UnknownError',
                status_code:500
            });
            expect(Errors.json(function(){ return 'hi'; })).to.deep.equal(default_json);
        });
        
        it('should handle all the values', function(){
            var Errors = require('super-errors')();
            require('../index.js')(Errors);
            
            function TestError(message, additional, from_error, field){
                return this.init(TestError, message, additional, from_error, field);
            }
            Errors.create(TestError, 'TestError', 'Test error.', 500, true);
            
            var addl = new Errors.TestError('additional error', 'additional additional', new Errors.TestError('from additional'));
            Errors.add(addl, new Errors.TestError('additional additional error'));
            Errors.add(addl, 'field', new Errors.TestError('additional field error'));
            
            var field = new Errors.TestError('field error', 'field additional', new Errors.TestError('from field'));
            Errors.add(field, new Errors.TestError('field additional error'));
            Errors.add(field, 'field', new Errors.TestError('field field error'));
            
            var err = new Errors.TestError('test error', 'additional info', new Errors.TestError('from'));
            Errors.add(err, addl);
            Errors.add(err, 'field', field);
            
            expect(Errors.json(err)).to.deep.equal({
                errors: [
                    "additional error",
                    "additional additional error"
                ],
                fields: {
                    field: "additional field error",
                    "field.field": "field field error"
                },
                message: "test error",
                name: "TestError",
                status_code: 500
            });
        });
        
        it('should be able to map all', function(){
            var Errors = require('super-errors')();
            
            delete Errors.captureStackTrace;
            
            require('../index.js')(Errors);
            
            function TestError(message, additional, from_error, field){
                return this.init(TestError, message, additional, from_error, field);
            }
            Errors.create(TestError, 'TestError', 'Test error.', 500, true);
            
            var addl = new TestError('additional error', 'additional additional', new TestError('from additional'));
            Errors.add(addl, new TestError('additional additional error'));
            Errors.add(addl, 'field', new TestError('additional field error'));
            
            var field = new TestError('field error', 'field additional', new TestError('from field'));
            Errors.add(field, new TestError('field additional error'));
            Errors.add(field, 'field', new TestError('field field error'));
            
            var err = new TestError('test error', 'additional info', new TestError('from'));
            Errors.add(err, addl);
            Errors.add(err, 'field', field);
            
            expect(Errors.json(err, 'all')).to.deep.equal({
                client_safe_message: "test error",
                errors: [
                    {
                        client_safe_message: "additional error",
                        from: {
                            client_safe_message: "from additional",
                            message: "from additional",
                            name: "TestError",
                            stack: "TestError: from additional"
                        },
                        message: "additional error",
                        name: "TestError",
                        stack: "TestError: additional error"
                    },
                    {
                        client_safe_message: "additional additional error",
                        message: "additional additional error",
                        name: "TestError",
                        stack: "TestError: additional additional error"
                    }
                ],
                fields: {
                    field: {
                        client_safe_message: "additional field error",
                        errors: [
                            {
                                client_safe_message: "field error",
                                from: {
                                    client_safe_message: "from field",
                                    message: "from field",
                                    name: "TestError",
                                    stack: "TestError: from field"
                                },
                                message: "field error",
                                name: "TestError",
                                stack: "TestError: field error"
                            },
                            {
                                client_safe_message: "field additional error",
                                message: "field additional error",
                                name: "TestError",
                                stack: "TestError: field additional error"
                            }
                        ],
                        message: "additional field error",
                        name: "TestError",
                        stack: "TestError: additional field error"
                    },
                    "field.field": {
                        client_safe_message: "field field error",
                        message: "field field error",
                        name: "TestError",
                        stack: "TestError: field field error"
                    }
                },
                from: {
                    client_safe_message: "from",
                    message: "from",
                    name: "TestError",
                    stack: "TestError: from"
                },
                message: "test error",
                name: "TestError",
                stack: "TestError: test error",
                status_code: 500
            });
        });
        
        it('should not include errors if errors is an empty array', function(){
            expect(Errors.json({ errors:[] })).to.deep.equal({
                message: "There was an error.",
                name: "UnknownError",
                status_code: 500
            });
        });
        
        it('should work with a from subfield map', function(){
            expect(Errors.json({ from:{ message:'test' } }, { "from.message":'error_from' })).to.deep.equal({
                error_from: 'test'
            });
        });
        
        it('should allow deep exclusion definitions', function(){
            expect(Errors.json(
                {
                    from:{ message:'test' },
                    errors: [{ message:'test2' }],
                    fields: { test: { message:'test3' } }
                },
                'all',
                {
                    client_safe_message:true,
                    from: { status_code:true, name:true, stack:true },
                    errors: { status_code:true, name:true, stack:true },
                    fields: { status_code:true, name:true, stack:true },
                    stack:true,
                    status_code:true
                }
            )).to.deep.equal({
                from: { message:'test' },
                errors: [{ message:'test2' }],
                fields: {
                    test: { message:'test3' }
                },
                message: 'There was an error.',
                name: 'UnknownError'
            });
        });
    });
});