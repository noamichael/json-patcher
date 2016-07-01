const Proxy = window['Proxy'];

export class JsonPatcher {
    static watch<T>(obj: T): T {
        return createUnknownProxy(obj);
    }
}

class BaseProxyHandler {
    protected childProxies = []
    protected valueHolder = {}
    protected changes = {}

    isPrimative(obj: any) {
        return typeof obj !== 'function' && typeof obj !== 'object';
    }
    get(target: any, key: string) {
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
        this.markChanges(key, 'remove');
        return true;
    }

    markChanges(key: string, operation: string, value?: any) {
        console.log(`Mark that ${key} in now ${value}. Operation: ${operation}`);
        this.changes[key] = {
            op: operation,
            value: value
        }
    }

    getChangeSet() {
        return [];
    }

    registerProperty(key, value) {
        if (!this.isPrimative(value)) {
            this.valueHolder[key] = createUnknownProxy(value);
            this.childProxies.push(this.valueHolder[key]);
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
}

function createUnknownProxy(obj) {
    let typeOfObject = typeof obj;
    let handler;
    if (Array.isArray(obj)) {
        handler = new ProxyArrayHandler(obj);
    } else if (typeOfObject === 'object') {
        handler = new ProxyObjectHandler(obj);
    }
    window['__handler'] = handler;
    return new Proxy(obj, handler || {});

}
