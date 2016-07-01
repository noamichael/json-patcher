var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Proxy = window['Proxy'];
var privateChangesKey = '___$$$changes';
var PatchOperation = (function () {
    function PatchOperation() {
    }
    PatchOperation.REPLACE = 'replace';
    PatchOperation.ADD = 'add';
    PatchOperation.REMOVE = 'remove';
    PatchOperation.MOVE = 'move';
    PatchOperation.COPY = 'copy';
    return PatchOperation;
}());
var JsonPatcher = (function () {
    function JsonPatcher() {
    }
    JsonPatcher.watch = function (obj) {
        return createUnknownProxy(obj);
    };
    JsonPatcher.getChanges = function (obj) {
        var internalChanges = obj[privateChangesKey];
        var exposedChanges = [];
        internalChanges.forEach(function (change) {
            exposedChanges.push({
                op: change.op,
                path: change.pathStack.join('/'),
                value: change.value
            });
        });
        return exposedChanges;
    };
    return JsonPatcher;
}());
JsonPatcher = JsonPatcher;
var BaseProxyHandler = (function () {
    function BaseProxyHandler() {
        this.childProxies = {};
        this.valueHolder = {};
        this.changes = {};
    }
    BaseProxyHandler.prototype.isPrimative = function (obj) {
        return typeof obj !== 'function' && typeof obj !== 'object';
    };
    BaseProxyHandler.prototype.get = function (target, key) {
        if (key === privateChangesKey) {
            return this.getPrivateChangeSet();
        }
        return this.valueHolder[key] || target[key];
    };
    BaseProxyHandler.prototype.set = function (target, key, value) {
        if (this.valueHolder[key]) {
            this.markChanges(key, this.getReplaceOrRemove(value), value);
            this.valueHolder[key] = value;
        }
        else {
            this.registerProperty(key, value);
            this.markChanges(key, 'add', value);
        }
        target[key] = value;
        return true;
    };
    BaseProxyHandler.prototype.deleteProperty = function (target, key) {
        delete target[key];
        delete this.valueHolder[key];
        delete this.childProxies[key];
        this.markChanges(key, 'remove');
        return true;
    };
    BaseProxyHandler.prototype.markChanges = function (key, operation, value) {
        console.log("Mark that " + key + " in now " + value + ". Operation: " + operation);
        this.changes[key] = {
            op: operation,
            pathStack: ['', key],
            value: value
        };
    };
    BaseProxyHandler.prototype.getPrivateChangeSet = function () {
        var changeSet = [];
        for (var key in this.changes) {
            var change = this.changes[key];
            changeSet.push({
                op: change.op,
                pathStack: change.pathStack.slice(),
                value: change.value
            });
        }
        var _loop_1 = function(key) {
            var childChanges = this_1.childProxies[key][privateChangesKey];
            childChanges.forEach(function (change) {
                change.pathStack.unshift(key);
            });
            changeSet = changeSet.concat(childChanges);
        };
        var this_1 = this;
        for (var key in this.childProxies) {
            _loop_1(key);
        }
        return changeSet;
    };
    BaseProxyHandler.prototype.registerProperty = function (key, value) {
        if (!this.isPrimative(value)) {
            this.valueHolder[key] = createUnknownProxy(value);
            this.childProxies[key] = this.valueHolder[key];
        }
        else {
            this.valueHolder[key] = value;
        }
    };
    BaseProxyHandler.prototype.getReplaceOrRemove = function (val) {
        return val ? 'replace' : 'remove';
    };
    return BaseProxyHandler;
}());
var ProxyObjectHandler = (function (_super) {
    __extends(ProxyObjectHandler, _super);
    function ProxyObjectHandler(obj) {
        _super.call(this);
        for (var key in obj) {
            this.registerProperty(key, obj[key]);
        }
    }
    return ProxyObjectHandler;
}(BaseProxyHandler));
var ProxyArrayHandler = (function (_super) {
    __extends(ProxyArrayHandler, _super);
    function ProxyArrayHandler(obj) {
        var _this = this;
        _super.call(this);
        obj.forEach(function (child, index) {
            _this.registerProperty(index, child);
        });
    }
    ProxyArrayHandler.prototype.markChanges = function (key, operation, value) {
        if (key === 'length') {
            return;
        }
        _super.prototype.markChanges.call(this, key, operation, value);
    };
    return ProxyArrayHandler;
}(BaseProxyHandler));
function createUnknownProxy(obj) {
    var typeOfObject = typeof obj;
    var handler;
    if (Array.isArray(obj)) {
        handler = new ProxyArrayHandler(obj);
    }
    else if (typeOfObject === 'object') {
        handler = new ProxyObjectHandler(obj);
    }
    return new Proxy(obj, handler || {});
}
