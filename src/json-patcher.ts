const Proxy = window['Proxy'];
const privateChangesKey = '___$$$changes';
class PatchOperation {
    static REPLACE = 'replace'
    static ADD = 'add'
    static REMOVE = 'remove'
    static MOVE = 'move'
    static COPY = 'copy'
}

export class JsonPatcher {
    static watch<T>(obj: T): T {
        return createUnknownProxy(obj);
    }
    static getChanges(obj: any) {
        let internalChanges = obj[privateChangesKey];
        let exposedChanges = [];
        internalChanges.forEach(change => {
            exposedChanges.push({
                op: change.op,
                path: change.pathStack.join('/'),
                value: change.value
            });
        });
        return exposedChanges;
    }
}

class BaseProxyHandler {
    protected childProxies = {}
    protected valueHolder = {}
    protected changes = {}

    isPrimative(obj: any) {
        return typeof obj !== 'function' && typeof obj !== 'object';
    }
    get(target: any, key: string) {
        if (key === privateChangesKey) {
            return this.getPrivateChangeSet();
        }
        return this.valueHolder[key] || target[key];
    }

    set(target: any, key: string, value: any) {
        if (this.valueHolder[key]) {
            this.markChanges(key, this.getReplaceOrRemove(value), value);
            this.valueHolder[key] = value;

        } else {
            this.registerProperty(key, value);
            this.markChanges(key, 'add', value);
        }
        target[key] = value;
        return true;
    }
    deleteProperty(target: any, key: string) {
        delete target[key];
        delete this.valueHolder[key];
        delete this.childProxies[key];
        this.markChanges(key, 'remove');
        return true;
    }

    markChanges(key: string, operation: string, value?: any) {
        console.log(`Mark that ${key} in now ${value}. Operation: ${operation}`);
        this.changes[key] = {
            op: operation,
            pathStack: ['', key],
            value: value
        }
    }


    getPrivateChangeSet() {
        let changeSet = [];
        for (let key in this.changes) {
            let change = this.changes[key];
            changeSet.push({
                op: change.op,
                pathStack: change.pathStack.slice(),
                value: change.value
            });
        }
        for (let key in this.childProxies) {
            let childChanges = this.childProxies[key][privateChangesKey];
            childChanges.forEach(change => {
                change.pathStack.unshift(key);
            });
            changeSet = changeSet.concat(childChanges);

        }
        return changeSet;
    }

    registerProperty(key, value) {
        if (!this.isPrimative(value)) {
            this.valueHolder[key] = createUnknownProxy(value);
            this.childProxies[key] = this.valueHolder[key];
        } else {
            this.valueHolder[key] = value;
        }
    }

    getReplaceOrRemove(val) {
        return val ? 'replace' : 'remove';
    }
}

class ProxyObjectHandler extends BaseProxyHandler {

    constructor(obj: any) {
        super();
        for (let key in obj) {
            this.registerProperty(key, obj[key]);
        }
    }

}

class ProxyArrayHandler extends BaseProxyHandler {
    constructor(obj: any[]) {
        super();
        obj.forEach((child, index) => {
            this.registerProperty(index, child);
        });
    }
    markChanges(key: string, operation: string, value?: any) {
        if (key === 'length') {
            return;
        }
        super.markChanges(key, operation, value);
    }
}

function createUnknownProxy(obj) {
    let typeOfObject = typeof obj;
    let handler;
    if (Array.isArray(obj)) {
        handler = new ProxyArrayHandler(obj);
    } else if (typeOfObject === 'object') {
        handler = new ProxyObjectHandler(obj);
    }
    return new Proxy(obj, handler || {});

}