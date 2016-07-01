# json-patcher #

A project for automatically detecting changes in a Javascript Object using ES6 Proxies and outputing them into a json-patch request.

### Example ###

```typescript
import {JsonPatcher} from '../src/json-patcher';
//some object we want to watch for changes
var objectToWatch = {

    someProp: "Some Prop Value",
    someSubObject: {
        id: 'someId'
    },
    someArray: []
};

//watch a given object. Only changes made to the returned 'proxied' will be tracked
var proxied = JsonPatcher.watch(objectToWatch);

//modify some properties
proxied.someProp = 'Hello';
delete proxied.someSubObject.id
proxied.someArray.push('!');

console.log(JsonPatcher.getChanges(proxied));
//will output
//[
//    { op: 'replace', path: '/someProp', value: 'hello' },
//    { op: 'remove', path: '/someSubObject/id' },
//    { op: 'add', path: '/someArray/-', value: '!' }
//]
```