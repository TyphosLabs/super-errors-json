"use strict";

module.exports = exportFn;

function exportFn(SuperErrors){
    SuperErrors.json = errorToJSON;
    return SuperErrors;
}

/**
 * Map the error to a json stringifiable object. By default, use the `client_safe_message` as the message.
 * @param {Error} err - The error to convert to json
 * @param {Object} map - How to map the error values
 * @param {Object} exclude - Error properties to always exclude
 * @returns {Object}
 */
function errorToJSON(err, map, exclude){
    /* jshint validthis:true */
    var json = {};
    var mapped, i, a, submap, subfield;
    
    if(!exclude || typeof exclude !== 'object'){
        exclude = {};
    }
    
    if(map === 'all'){
        map = {
            message: 'message',
            client_safe_message: 'client_safe_message',
            errors: 'errors',
            field: 'field',
            fields: 'fields',
            from: 'from',
            name: 'name',
            stack: 'stack',
            status_code: 'status_code'
        };
    }
    
    else if(!map || typeof map !== 'object'){
        map = {
            "client_safe_message": 'message',
            "errors.client_safe_message": 'errors',
            "field": 'field',
            "fields.client_safe_message": 'fields',
            "name": 'name',
            "status_code": 'status_code'
        };
    }
    
    if(Array.isArray(err)){
        // grab the first and convert the others to additional errors
        a = err.slice(1);
        err = err[0];
        if(err && typeof err === 'object'){
            if(Array.isArray(err)){
                err = { name:'UnknownError', message: '[array of arrays]' };
            }
            for(i = 0; i < a.length; i++){
                err = this.add(err, a[i]);
            }
        }
    }
    
    if(!err || typeof err !== 'object'){
        if(typeof err === 'function'){
            err = '[function]';
        }
        err = { 
            type: 'UnknownError',
            message: err
        };
    }
    
    for(var field in map){
        mapped = map[field];
        i = field.indexOf('.');
        
        if(~i){
            subfield = field.substr(i + 1);
            field = field.substr(0, i);
        } else {
            subfield = undefined;
        }
        
        if(field in exclude && exclude[field] === true){
            continue;
        }
        
        if(field === 'stack'){
            json[mapped] = this.stack(err, false);
            continue;
        }
        
        if(field in err){
            switch(field){
                case 'from':
                    if(subfield){
                        submap = {};
                        submap[subfield] = subfield;
                        json[mapped] = this.json(err.from, submap)[subfield];    
                    } else {
                        json[mapped] = this.json(err.from, map, merge(exclude, ('from' in exclude ? exclude.from : { fields:true, errors:true, status_code:true })));
                    }
                    break;
                case 'errors':
                    if(subfield){
                        submap = {};
                        submap[subfield] = subfield; 
                    }
                    if(err.errors.length > 0){
                        a = [];
                        for(i = 0; i < err.errors.length; i++){
                            if(subfield){
                                a[i] = this.json(err.errors[i], submap)[subfield];  
                            } else {
                                a[i] = this.json(err.errors[i], map, merge(exclude, ('errors' in exclude ? exclude.errors : { fields:true, errors:true, status_code:true })));
                            }
                        }
                        json[mapped] = a;
                    }
                    break;
                case 'fields':
                    if(subfield){
                        submap = {};
                        submap[subfield] = subfield;
                    }
                    a = {};
                    for(i in err.fields){
                        if(subfield){
                            a[i] = this.json(err.fields[i], submap)[subfield];  
                        } else {
                            a[i] = this.json(err.fields[i], map, merge(exclude, ('fields' in exclude ? exclude.fields : { fields:true, status_code:true })));
                        }
                    }
                    json[mapped] = a;
                    break;
                default:
                    json[mapped] = err[field];
            }
        } else {
            switch(field){
                case 'client_safe_message':
                case 'message':
                    json[mapped] = 'There was an error.';
                    break;
                case 'name':
                    json[mapped] = 'UnknownError';
                    break;
                case 'status_code':
                    json[mapped] = 500;
                    break;
            }
        }
    }
    return json;
}

/**
 * Simply merge one object into another
 * @param {Object} a - Object to copy
 * @param {Object} b - Object params will override a's params
 * @returns {Object}
 */
function merge(a, b){
    var r = {}, f;
    for(f in a) r[f] = a[f];
    for(f in b) r[f] = b[f];
    return r;
}