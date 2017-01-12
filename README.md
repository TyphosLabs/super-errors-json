# super-errors-json
Convert a SuperError instance into JSON that is safe for clients.

## Example:
```javascript

var Errors = require('super-errors')();
require('super-errors-json')(Errors);

var json = Errors.json(new Errors.NotifyUser('Test...'));
```
The `json` variable should now be a string that looks like:
```JSON
{"name":"NotifyUser","message":"Test...","status_code":500}
```

## SuperErrors.json(error, [json_obj], map, exclude)
- **error** (_Error_): The error to serialize.
- **json_obj** (_boolean_): Whether to return a JSON string (default) or return a JSON-serializable object (true)
- **map** (_Object_): Map of fields to be included and how they are to be renamed
- **exclude** (_Object_): Fields that should be excluded from the object

The `map` argument can be used to map where fields go and defaults to:

```javascript
{
    "client_safe_message": 'message',
    "errors.client_safe_message": 'errors',
    "field": 'field',
    "fields.client_safe_message": 'fields',
    "name": 'name',
    "status_code": 'status_code'
}
```

This map will give you the name, field, status_code and client_safe_message of the error. All additional errors get converted to strings and placed in an array and fields become an object of fields.

The `exclude` argument can be used to mark fields you don't want included in resulting object.
