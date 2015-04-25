/*
 propjet.js 0.8
 (c) 2015 Artem Avramenko. https://github.com/ArtemAvramenko/propjet.js
 License: MIT
*/
this.propjet = (function () {
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
    // throws error for outdated browsers, otherwise undefined
    var failProperties;
    // #region cross-browser implementation
    if (!(Object.defineProperty && Object.getOwnPropertyNames && Object.getOwnPropertyDescriptor)) {
        failProperties = function () {
            throw new Error("This browser does not support property creation. Instead, use function mode.");
        };
    }
    // #endregion
    // reads/reads version from non-enumerable property
    var getVersion;
    var setVersion;
    // #region cross-browser implementation
    if (failProperties) {
        if (!(function () {
            for (var notIE in { propertyIsEnumerable: null }) {
                return notIE;
            }
        })()) {
            // exploit IE bug for creating non-enumerable property:
            // https://developer.mozilla.org/en-US/docs/ECMAScript_DontEnum_attribute#JScript_DontEnum_Bug
            getVersion = function (obj) {
                // choose propertyIsEnumerable method to store hidden property,
                // but it could be any other method from Object prototype
                var p = obj.propertyIsEnumerable;
                return p && p.__prop__ver__;
            };
            setVersion = function (obj, ver) {
                if (!ver) {
                    var p = obj.propertyIsEnumerable;
                    obj.propertyIsEnumerable = function (name) { return p(name); };
                }
                obj.propertyIsEnumerable.__prop__ver__ = ver;
            };
        }
    }
    else {
        setVersion = function (obj, ver) {
            if (!ver) {
                Object.defineProperty(obj, "__prop__ver__", {
                    value: 0,
                    configurable: true,
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
    var nestingLevel = 0;
    var propjet = (function (object, propertyName) {
        var data;
        // create properties for all IPropData fields in object
        if (object && !propertyName) {
            if (failProperties) {
                failProperties();
            }
            // enumerate all own fields
            forEach(Object.getOwnPropertyNames(object), function (propertyName) {
                // do not call getters
                var descriptor = Object.getOwnPropertyDescriptor(object, propertyName);
                if (!descriptor || !descriptor.get) {
                    data = object[propertyName];
                    if (data != null && data.__prop__unready__) {
                        createProperty(propertyName, data);
                    }
                }
            });
            return;
        }
        // create and return property builder
        data = {};
        data.__prop__unready__ = true;
        var builder = {
            "require": function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i - 0] = arguments[_i];
                }
                data.src = args;
                return builder;
            },
            "default": function (arg) {
                data.init = arg;
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
                    return createProperty(propertyName, data, true);
                }
                if (propertyName) {
                    createProperty(propertyName, data);
                }
                else {
                    return data;
                }
            }
        };
        /* tslint:disable */
        builder["withal"] = builder["with"] = function (arg) {
            data.fltr = arg;
            return builder;
        };
        return builder;
        function createProperty(propertyName, data, functionMode) {
            delete data.__prop__unready__;
            if (functionMode) {
                var func = function (value) {
                    if (arguments.length === 0) {
                        return getter();
                    }
                    setter(value);
                };
                if (propertyName) {
                    object[propertyName] = func;
                }
                return func;
            }
            if (failProperties) {
                failProperties();
            }
            Object.defineProperty(object, propertyName, {
                configurable: true,
                enumerable: true,
                get: getter,
                set: setter
            });
            function emptyValue(value) {
                if (value === undefined) {
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
            function getArgs(args) {
                if (!data.src) {
                    return false;
                }
                // check requirements' changes
                var same = data.vals && data.vals.length === data.src.length;
                var ignoreOldValues = !same;
                forEach(data.src, function (source, i) {
                    var old = ignoreOldValues ? undefined : data.vals[i];
                    var arg = source.call(object, old != null ? old.val : undefined);
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
            function saveArgs(args) {
                var sourceValues;
                if (data.src) {
                    sourceValues = [];
                    forEach(args, function (arg, i) {
                        sourceValues[i] = {
                            val: arg,
                            ver: arg != null ? getVersion(arg) : undefined,
                            len: arg != null ? arg.length : undefined
                        };
                    });
                }
                data.vals = sourceValues;
            }
            function getter() {
                if (data.lvl) {
                    if (data.lvl === nestingLevel) {
                        return data.res;
                    }
                    throw new Error("Circular dependency detected");
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
                            if (data.src) {
                                // has requirements - reinitialize on change
                                if (!same) {
                                    data.res = data.init.call(object);
                                    saveArgs(args);
                                }
                            }
                            else {
                                // no requirement - call init once
                                data.res = data.init.call(object);
                                data.init = undefined;
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
                        saveArgs(args);
                        data.res = newResult;
                    }
                    return data.res;
                }
                finally {
                    nestingLevel--;
                    delete data.lvl;
                }
            }
            function setter(value) {
                if (data.lvl) {
                    throw new Error("Recursive property write");
                }
                nestingLevel++;
                try {
                    data.lvl = -1;
                    // override property
                    if (value != null && value.__prop__unready__) {
                        data = value;
                        delete data.__prop__unready__;
                        return;
                    }
                    // filter new value
                    if (data.fltr) {
                        value = data.fltr.call(object, value, data.res);
                    }
                    // call setter
                    if (data.set) {
                        data.set.call(object, value);
                    }
                    else if (data.get) {
                        throw new Error("Attempt to write readonly property");
                    }
                    if (!data.get) {
                        // property without getter
                        if (data.src) {
                            var args = [];
                            getArgs(args);
                            saveArgs(args);
                        }
                        else {
                            data.init = undefined;
                        }
                        data.res = value;
                    }
                }
                finally {
                    nestingLevel--;
                    delete data.lvl;
                }
            }
        }
    });
    propjet.invalidate = function (value) {
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
    };
    return propjet;
})();
