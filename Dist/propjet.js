/*!
 propjet.js v1.0.0
 (c) 2015 Artem Avramenko. https://github.com/ArtemAvramenko/propjet.js
 License: MIT
*/
this.propjet = (function () {
    var propVer = "__prop__ver__";
    var defineProperty = Object.defineProperty;
    var getOwnPropertyNames = Object.getOwnPropertyNames;
    var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    var noProperties = !(defineProperty && getOwnPropertyNames && getOwnPropertyDescriptor);
    function throwError(error) {
        throw new Error([
            "This browser does not support property creation. Instead, use function mode.",
            "Attempt to write readonly property",
            "Circular dependency detected",
            "Recursive property write",
            "Circular promises detected"
        ][error]);
    }
    function throwReadonlyError() {
        throwError(1 /* readonlyPropertyWrite */);
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
        var propertyIsEnumerable = "propertyIsEnumerable";
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
            if (!ver) {
                defineProperty(obj, propVer, {
                    value: 0,
                    configurable: false,
                    writable: true
                });
            }
            else {
                obj.__prop__ver__ = ver;
            }
        };
    }
    if (!getVersion) {
        getVersion = function (obj) { return obj.__prop__ver__; };
    }
    if (!setVersion) {
        setVersion = function (obj, ver) { return obj.__prop__ver__ = ver; };
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
    function defReadonlyProperty(proxyObject, propertyName, object) {
        defProperty(proxyObject, propertyName, function () { return object[propertyName]; }, throwReadonlyError);
    }
    function incrementVersion(value) {
        if (value == null) {
            return;
        }
        // value types can not be invalidated
        var valueType = typeof value;
        if (valueType !== "object" && valueType !== "function") {
            return;
        }
        var ver = getVersion(value);
        var newVer = 0;
        if (ver != null) {
            newVer = ver + 1;
            if (newVer === ver) {
                // reset to one when it overflows
                newVer = 1;
            }
        }
        setVersion(value, newVer);
        return newVer;
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
                        createProperty(data)(propertyName, data);
                    }
                }
            });
            return;
        }
        // create and return property builder
        data = {};
        var builder = {
            "from": function () {
                data.isDeferred = true;
                data.src = [];
                return builder;
            },
            "require": function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i - 0] = arguments[_i];
                }
                data.src = args;
                return builder;
            },
            "get": function (arg) {
                data.get = arg;
                return builder;
            },
            "set": function (arg) {
                data.set = arg;
                return builder;
            },
            "declare": function (functionMode) {
                if (functionMode) {
                    return createProperty(data)(propertyName, data, true);
                }
                if (propertyName) {
                    createProperty(data)(propertyName, data);
                }
                else {
                    data.__prop__unready__ = true;
                    return data;
                }
            }
        };
        /* tslint:disable */
        builder["with"] = builder.withal = function (arg) {
            data.fltr = arg;
            return builder;
        };
        /* tslint:disable */
        builder["default"] = builder.defaults = function (arg) {
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
        function emptyValue(value) {
            if (value === undef) {
                return 1;
            }
            if (value == null) {
                return 2;
            }
            if (value.length === 0 && getVersion(value) == null) {
                for (var i in value) {
                    return 0;
                }
                return 3;
            }
            if (typeof value === "number" && isNaN(value)) {
                return 4;
            }
            return 0;
        }
        function getArgs(data, args) {
            if (!data.src) {
                return false;
            }
            // check requirements' changes
            var same = data.vals && data.vals.length === data.src.length;
            var ignoreOldValues = !same;
            forEach(data.src, function (source, i) {
                var old = ignoreOldValues ? undef : data.vals[i];
                var arg = source.call(object, old != null ? old.val : undef);
                args[i] = arg;
                if (same) {
                    var oldEmpty = emptyValue(old.val);
                    var newEmpty = emptyValue(arg);
                    if (oldEmpty) {
                        same = oldEmpty === newEmpty;
                    }
                    else {
                        same = !newEmpty && old.val === arg && old.ver === getVersion(arg) && old.len === arg.length;
                    }
                }
            });
            return same;
        }
        function saveArgs(data, args) {
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
        function createProperty(data) {
            return data.isDeferred ? createDeferredProperty : createRegularProperty;
        }
        function createRegularProperty(propertyName, data, functionMode) {
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
                    var same = getArgs(data, args);
                    // property without getter
                    if (!data.get) {
                        // has initializer
                        if (data.init) {
                            if (data.src) {
                                // has requirements - reinitialize on change
                                if (!same) {
                                    data.res = data.init.call(object);
                                    saveArgs(data, args);
                                }
                            }
                            else {
                                // no requirement - call init once
                                data.res = data.init.call(object);
                                data.init = undef;
                            }
                        }
                    }
                    else if (!same) {
                        // call getter
                        var newResult = data.get.apply(object, args);
                        // filter new result
                        if (data.fltr) {
                            newResult = data.fltr.call(object, newResult, data.res);
                        }
                        // store last arguments and result
                        if (data.src) {
                            saveArgs(data, args);
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
                    if (data.fltr) {
                        value = data.fltr.call(object, value, data.res);
                    }
                    if (data.get) {
                        if (!data.set) {
                            throwReadonlyError();
                        }
                    }
                    else {
                        // property without getter
                        if (data.src) {
                            var args = [];
                            getArgs(data, args);
                            saveArgs(data, args);
                        }
                        else {
                            data.init = undef;
                        }
                        data.res = value;
                    }
                    // call setter
                    if (data.set) {
                        data.set.call(object, value);
                    }
                }
                finally {
                    nestingLevel--;
                    data.lvl = 0;
                }
            }
        }
        function createDeferredProperty(propertyName, data, functionMode) {
            var promise;
            var deferred = {};
            var isInPromiseMethod;
            deferred.get = function (forceUpdate) {
                if (isInPromiseMethod) {
                    throwError(4 /* circularPromises */);
                }
                isInPromiseMethod = true;
                try {
                    if (forceUpdate && !deferred.pending) {
                        checkUpdate(forceUpdate);
                    }
                    return promise;
                }
                finally {
                    isInPromiseMethod = false;
                }
            };
            deferred.set = function (newValue, isDeferred) {
                if (isInPromiseMethod) {
                    throwError(4 /* circularPromises */);
                }
                isInPromiseMethod = true;
                try {
                    if (!data.set) {
                        throwReadonlyError();
                    }
                    incrementVersion(deferred);
                    var args = [];
                    getArgs(data, args);
                    args.unshift(newValue);
                    var promise = data.set.apply(object, args);
                    if (!isDeferred) {
                        deferred.last = newValue;
                    }
                    waitPromise(promise);
                    return promise;
                }
                finally {
                    isInPromiseMethod = false;
                }
            };
            function setStatus(newStatus) {
                deferred.pending = newStatus === 0 /* pending */;
                deferred.fulfilled = newStatus === 1 /* fulfilled */;
                deferred.rejected = newStatus === 2 /* rejected */;
                deferred.settled = newStatus !== 0 /* pending */;
            }
            function setValue(value, isRejection) {
                incrementVersion(deferred);
                if (!isRejection) {
                    deferred.last = value;
                }
                deferred.rejectReason = isRejection ? value : undef;
                setStatus(isRejection ? 1 /* fulfilled */ : 2 /* rejected */);
            }
            function waitPromise(promise) {
                var version = incrementVersion(data);
                if (!promise) {
                    setValue(undefined);
                    return;
                }
                forEach(["then", "catch"], function (methodName, isRejection) {
                    promise[methodName](function (value) {
                        // ignore callbacks if newer promise is active
                        if (getVersion(data) === version) {
                            setValue(value, isRejection);
                        }
                    });
                });
            }
            setValue(undef);
            function checkUpdate(forceUpdate) {
                if (isInPromiseMethod) {
                    return;
                }
                var args = [];
                var same = getArgs(data, args);
                if (!same || forceUpdate) {
                    incrementVersion(deferred);
                    saveArgs(data, args);
                    promise = data.get.apply(object, args);
                    setStatus(0 /* pending */);
                    waitPromise(promise);
                }
            }
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
            var readonlyProxy = {};
            for (var prop in deferred) {
                defReadonlyProperty(readonlyProxy, prop, deferred);
            }
            defProperty(object, propertyName, function () {
                checkUpdate();
                return readonlyProxy;
            }, function (newData) {
                // override property
                if (isUnreadyProperty(newData)) {
                    data = newData;
                    setValue(undef);
                }
                else {
                    throwReadonlyError();
                }
            });
        }
    });
    propjet.invalidate = incrementVersion;
    return propjet;
})();
