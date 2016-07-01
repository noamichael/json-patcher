import {JsonPatcher} from '../src/json-patcher';

let account = {
    policies: [
        {
            insured: {
                entity: {
                    name1: 'Michael'
                }
            },
            setting: 4
        },
        {
            insured: {
                entity: {
                    name1: 'John'
                }
            },
            setting: 4
        }
    ],
    company: "ABC Company",
    line: {
        id: 'HO'
    }
};


let proxied = JsonPatcher.watch(account);

proxied.policies[0].insured.entity.name1 = "Joe";
proxied.line.id = 'WC';
proxied.policies[1].setting = 5;

console.log(proxied);