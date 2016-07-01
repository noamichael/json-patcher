var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Proxy = window['Proxy'];
var JsonPatcher = (function () {
    function JsonPatcher() {
    }
    JsonPatcher.watch = function (obj) {
        return createUnknownProxy(obj);
    };
    return JsonPatcher;
}());
JsonPatcher = JsonPatcher;
var BaseProxyHandler = (function () {
    function BaseProxyHandler() {
        this.childProxies = [];
        this.valueHolder = {};
        this.changes = {};
    }
    BaseProxyHandler.prototype.isPrimative = function (obj) {
        return typeof obj !== 'function' && typeof obj !== 'object';
    };
    BaseProxyHandler.prototype.get = function (target, key) {
        return this.valueHolder[key] || target[key];
    };
    BaseProxyHandler.prototype.set = function (target, key, value) {
        if (this.valueHolder[key]) {
            this.markChanges(key, value, this.getReplaceOrRemove(value));
            this.valueHolder[key] = value;
        }
        else {
            this.registerProperty(key, value);
            this.markChanges(key, value, 'add');
        }
        target[key] = value;
        return true;
    };
    BaseProxyHandler.prototype.markChanges = function (key, value, operation) {
        console.log("Mark that " + key + " in now " + value + ". Operation: " + operation);
    };
    BaseProxyHandler.prototype.getChangeSet = function () {
        return [];
    };
    BaseProxyHandler.prototype.registerProperty = function (key, value) {
        if (!this.isPrimative(value)) {
            this.valueHolder[key] = createUnknownProxy(value);
            this.childProxies.push(this.valueHolder[key]);
        }
        else {
            this.valueHolder[key] = value;
        }
    };
    BaseProxyHandler.prototype.getReplaceOrRemove = function (val) {
        val ? 'replace' : 'remove';
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
    window['__handler'] = handler;
    return new Proxy(obj, handler || {});
}
