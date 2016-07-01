# json-patcher #

A project for automatically detecting changes in a Javascript Object using ES6 Proxies and outputing them into a json-patch request.

### Example ###

```
import {JsonPatcher} from '../src/json-patcher';

var objectToWatch = {

    someProp: "Some Prop Value",
    someSubObject: {
        id: 'someId'
    },
    someArray: []
};


var proxied = JsonPatcher.watch(objectToWatch);

proxied.someProp = 'Hello';
delete proxied.someSubObject.id
proxied.someArray.push('!');

console.log(JsonPatcher.getChanges(proxied));
//outputs
//[
//    { op: 'replace', path: '/someProp', value: 'hello' },
//    { op: 'remove', path: '/someSubObject/id' },
//    { op: 'add', path: '/someArray/-', value: '!' }
//]


```