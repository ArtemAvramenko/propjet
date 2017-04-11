/*!
 propjet.js v1.3.4
 (c) 2015 Artem Avramenko. https://github.com/ArtemAvramenko/propjet.js
 License: MIT
*/
this.propjet = (function () {
    var propVer = '__prop__ver__';
    var defineProperty = Object.defineProperty;
    var getOwnPropertyNames = Object.getOwnPropertyNames;
    var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    var noProperties = !(defineProperty && getOwnPropertyNames && getOwnPropertyDescriptor);
    function throwError(error) {
        throw new Error([
            'This browser does not support property creation. Instead, use function mode.',
            'Attempt to write readonly property',
            'Circular dependency detected',
            'Recursive property write',
            'Circular promises detected'
        ][error]);
    }
    function throwReadonlyError() {
        throwError(1 /* readonlyPropertyWrite */);
    }
    function versionFuncDefault(obj, ver) {
        if (ver == null) {
            return obj.__prop__ver__;
        }
        obj.__prop__ver__ = ver;
    }
    // enumerates all elements in array
    var forEach;
    // #region cross-browser implementation
    if ([].forEach) {
        forEach = function (items, callback) { return items.forEach(callback); };
    }
    else {
        forEach = function (items, callback) {
            var itemCount = items.length;
            for (var i = 0; i < itemCount; i++) {
                callback(items[i], i);
            }
        };
    }
    // #endregion
    // reads/reads version from non-enumerable property
    var getVersion;
    var setVersion;
    // #region cross-browser implementation
    if (noProperties) {
        // exploit IE bug for creating non-enumerable property:
        // https://developer.mozilla.org/en-US/docs/ECMAScript_DontEnum_attribute#JScript_DontEnum_Bug
        // choose propertyIsEnumerable method to store hidden property,
        // but it could be any other method from Object prototype
        var propertyIsEnumerable = 'propertyIsEnumerable';
        var testIE = {};
        testIE[propertyIsEnumerable] = 0;
        for (var notIE in testIE) {
        }
        if (!notIE) {
            getVersion = function (obj) {
                var p = obj[propertyIsEnumerable];
                return p && p[propVer];
            };
            setVersion = function (obj, ver) {
                if (!ver) {
                    var p = obj[propertyIsEnumerable];
                    obj[propertyIsEnumerable] = function (name) { return p(name); };
                }
                obj[propertyIsEnumerable][propVer] = ver;
            };
        }
    }
    else {
        setVersion = function (obj, ver) {
            if (ver < 2) {
                defineProperty(obj, propVer, {
                    value: ver,
                    configurable: false,
                    writable: true
                });
            }
            else {
                versionFuncDefault(obj, ver);
            }
        };
    }
    if (!getVersion) {
        getVersion = versionFuncDefault;
    }
    if (!setVersion) {
        setVersion = versionFuncDefault;
    }
    // #endregion
    var undef;
    function defProperty(object, propertyName, getter, setter) {
        defineProperty(object, propertyName, {
            configurable: true,
            enumerable: true,
            get: getter,
            set: setter
        });
    }
    function incrementVersion(value) {
        if (value != null) {
            // value types can not be invalidated
            var valueType = typeof value;
            if (valueType === 'object' || valueType === 'function') {
                // reset version to one when it is not specified or it is overflowed
                var newVer = 1;
                var ver = getVersion(value);
                if (ver != null && ver < 0x7FFFFFFF) {
                    newVer += ver;
                }
                setVersion(value, newVer);
                return newVer;
            }
        }
    }
    ;
    var nestingLevel = 0;
    var propjet = (function (object, propertyName) {
        var data;
        // create properties for all IPropData fields in object
        if (object && !propertyName) {
            if (noProperties) {
                throwError(0 /* noPropertySupport */);
            }
            // enumerate all own fields
            forEach(getOwnPropertyNames(object), function (propertyName) {
                // do not call getters
                var descriptor = getOwnPropertyDescriptor(object, propertyName);
                if (!descriptor || !descriptor.get) {
                    data = object[propertyName];
                    if (isUnreadyProperty(data)) {
                        createProperty(propertyName, data);
                    }
                }
            });
            return;
        }
        // create and return property builder
        data = {};
        var builder = {
            'from': function () {
                data.isDeferred = true;
                data.src = [];
                return builder;
            },
            'require': function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i - 0] = arguments[_i];
                }
                data.src = args;
                return builder;
            },
            'get': function (arg) {
                data.get = arg;
                return builder;
            },
            'set': function (arg) {
                data.set = arg;
                return builder;
            },
            'declare': function (functionMode) {
                if (functionMode) {
                    return createProperty(propertyName, data, true);
                }
                if (propertyName) {
                    createProperty(propertyName, data);
                }
                else {
                    data.__prop__unready__ = true;
                    return data;
                }
            }
        };
        /* tslint:disable */
        builder['with'] =
            /* tslint:enable */
            builder.withal = function (arg) {
                data.fltr = arg;
                return builder;
            };
        /* tslint:disable */
        builder['default'] =
            /* tslint:enable */
            builder.defaults = function (arg) {
                data.init = arg;
                return builder;
            };
        return builder;
        function isUnreadyProperty(data) {
            var result = data != null && data.__prop__unready__;
            if (result) {
                delete data.__prop__unready__;
            }
            return result;
        }
        function createProperty(propertyName, data, functionMode) {
            return data.isDeferred ? createDeferredProperty() : createRegularProperty();
            function emptyValue(value, len, ver) {
                if (value === undef) {
                    return 1;
                }
                if (value == null) {
                    return 2;
                }
                if (len === 0 && ver == null) {
                    /* tslint:disable */
                    for (var i in value) 
                    /* tslint:enable */ {
                        return 0;
                    }
                    return 3;
                }
                if (typeof value === 'number' && isNaN(value)) {
                    return 4;
                }
                return 0;
            }
            function getArgs(args, caller) {
                if (!data.src) {
                    return false;
                }
                // check requirements' changes
                var same = data.vals && data.vals.length === data.src.length;
                var ignoreOldValues = !same;
                forEach(data.src, function (source, i) {
                    var old = ignoreOldValues ? undef : data.vals[i];
                    var arg;
                    if (caller) {
                        arg = caller(source, [old != null ? old.val : undef]);
                    }
                    else {
                        arg = source.call(object, old != null ? old.val : undef);
                    }
                    args[i] = arg;
                    if (same) {
                        var oldEmpty = emptyValue(old.val, old.len, old.ver);
                        var newEmpty = emptyValue(arg, arg != null ? arg.length : undef, arg ? getVersion(arg) : undef);
                        if (oldEmpty) {
                            same = oldEmpty === newEmpty && !old.len;
                        }
                        else {
                            same = !newEmpty && old.val === arg && old.ver === getVersion(arg) && old.len === arg.length;
                        }
                    }
                });
                return same;
            }
            function saveArgs(args) {
                var sourceValues = [];
                forEach(args, function (arg, i) {
                    sourceValues[i] = {
                        val: arg,
                        ver: arg != null ? getVersion(arg) : undef,
                        len: arg != null ? arg.length : undef
                    };
                });
                data.vals = sourceValues;
            }
            function createRegularProperty() {
                if (functionMode) {
                    function func(value) {
                        if (arguments.length === 0) {
                            return getter();
                        }
                        setter(value);
                    }
                    if (propertyName) {
                        object[propertyName] = func;
                    }
                    return func;
                }
                if (noProperties) {
                    throwError(0 /* noPropertySupport */);
                }
                defProperty(object, propertyName, getter, setter);
                function filter(value) {
                    if (data.fltr) {
                        return data.fltr.call(object, value, data.res);
                    }
                    return value;
                }
                function getter() {
                    var oldLevel = data.lvl;
                    if (oldLevel > 0) {
                        if (oldLevel === nestingLevel) {
                            return data.res;
                        }
                        throwError(2 /* circularDependency */);
                    }
                    nestingLevel++;
                    try {
                        data.lvl = nestingLevel;
                        var args = [];
                        var same = getArgs(args);
                        // property without getter
                        if (!data.get) {
                            // has initializer
                            if (data.init) {
                                // has requirements - reinitialize on change
                                if (!data.src || !same) {
                                    data.res = data.init.apply(object, args);
                                }
                                if (data.src) {
                                    saveArgs(args);
                                }
                                else {
                                    // no requirement - call init once
                                    data.init = undef;
                                }
                            }
                        }
                        else if (!same) {
                            // call getter
                            var newResult = data.get.apply(object, args);
                            // filter new result
                            newResult = filter(newResult);
                            // store last arguments and result
                            if (data.src) {
                                saveArgs(args);
                            }
                            data.res = newResult;
                        }
                        return data.res;
                    }
                    finally {
                        nestingLevel--;
                        data.lvl = oldLevel;
                    }
                }
                function setter(value) {
                    if (data.lvl) {
                        throwError(3 /* recursivePropertyWrite */);
                    }
                    nestingLevel++;
                    try {
                        data.lvl = -1;
                        // override property
                        if (isUnreadyProperty(value)) {
                            data = value;
                            return;
                        }
                        // filter new value
                        value = filter(value);
                        if (data.get) {
                            if (!data.set) {
                                throwReadonlyError();
                            }
                        }
                        else {
                            // property without getter
                            if (data.src) {
                                var args = [];
                                getArgs(args);
                                saveArgs(args);
                            }
                            else {
                                data.init = undef;
                            }
                        }
                        // call setter
                        if (data.set) {
                            data.set.call(object, value);
                        }
                        if (!data.get) {
                            data.res = value;
                        }
                    }
                    finally {
                        nestingLevel--;
                        data.lvl = 0;
                    }
                }
            }
            function createDeferredProperty() {
                var promise;
                var deferred = {};
                var isInCallback;
                var readonlyProxy;
                deferred.get = function (forceUpdate) {
                    if (forceUpdate && !deferred.pending) {
                        checkUpdate(forceUpdate);
                    }
                    return promise;
                };
                function filter(value) {
                    if (data.fltr) {
                        return wrapCall(data.fltr, [value, deferred.last]);
                    }
                    return value;
                }
                function defReadonlyProperty(propertyName) {
                    defProperty(readonlyProxy, propertyName, function () { return deferred[propertyName]; }, throwReadonlyError);
                }
                deferred.set = function (newValue, isDeferred) {
                    if (!data.set) {
                        throwReadonlyError();
                    }
                    newValue = filter(newValue);
                    incrementVersion(readonlyProxy || deferred);
                    var args = [];
                    getArgs(args, wrapCall);
                    saveArgs(args);
                    args.unshift(newValue);
                    var promise = wrapCall(data.set, args);
                    if (!isDeferred) {
                        deferred.last = newValue;
                    }
                    waitPromise(promise);
                    return promise;
                };
                setValue(undef, 1 /* reset */);
                if (functionMode) {
                    var func = function () {
                        checkUpdate();
                        return deferred;
                    };
                    if (propertyName) {
                        object[propertyName] = func;
                    }
                    return func;
                }
                if (noProperties) {
                    throwError(0 /* noPropertySupport */);
                }
                // create readonly property
                readonlyProxy = {};
                for (var prop in deferred) {
                    defReadonlyProperty(prop);
                }
                defProperty(object, propertyName, function () {
                    checkUpdate();
                    return readonlyProxy;
                }, function (newData) {
                    // override property
                    if (isUnreadyProperty(newData)) {
                        data = newData;
                        setValue(undef, 1 /* reset */);
                    }
                    else {
                        throwReadonlyError();
                    }
                });
                function wrapCall(func, args) {
                    if (isInCallback) {
                        throwError(4 /* circularPromises */);
                    }
                    isInCallback = true;
                    try {
                        return func.apply(object, args || []);
                    }
                    finally {
                        isInCallback = false;
                    }
                }
                function setStatus(newStatus) {
                    deferred.pending = !newStatus;
                    deferred.fulfilled = newStatus === 1 /* fulfilled */;
                    deferred.rejected = newStatus === 2 /* rejected */;
                    deferred.settled = !!newStatus;
                }
                function setValue(value, mode) {
                    incrementVersion(readonlyProxy || deferred);
                    var notRejection = mode !== 2 /* rejection */;
                    if (notRejection) {
                        if (!mode) {
                            value = filter(value);
                        }
                        deferred.last = value;
                    }
                    deferred.rejectReason = notRejection ? undef : value;
                    setStatus(notRejection ? 1 /* fulfilled */ : 2 /* rejected */);
                }
                function waitPromise(promise) {
                    var version = incrementVersion(data);
                    if (!promise) {
                        setValue(undef, 0 /* normal */);
                        return;
                    }
                    promise.then(function (value) {
                        // ignore callbacks if newer promise is active
                        if (getVersion(data) === version) {
                            setValue(value, 0 /* normal */);
                        }
                    }, function (reason) {
                        // ignore callbacks if newer promise is active
                        if (getVersion(data) === version) {
                            setValue(reason, 2 /* rejection */);
                        }
                    });
                }
                function checkUpdate(forceUpdate) {
                    if (!isInCallback) {
                        var args = [];
                        var same = getArgs(args, wrapCall);
                        if (!same) {
                            forceUpdate = true;
                            if (data.init) {
                                deferred.last = wrapCall(data.init, args);
                            }
                        }
                        if (forceUpdate) {
                            incrementVersion(readonlyProxy || deferred);
                            saveArgs(args);
                            promise = wrapCall(data.get, args);
                            setStatus(0 /* pending */);
                            waitPromise(promise);
                        }
                    }
                }
            }
        }
    });
    propjet.invalidate = incrementVersion;
    return propjet;
})();
