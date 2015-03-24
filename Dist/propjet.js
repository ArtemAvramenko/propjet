/*
 propjet.js 0.3
 (c) 2015 Artem Avramenko. https://github.com/ArtemAvramenko/propjet.js
 License: MIT
*/
this.propjet = (function () {
    var propjet = (function (object, propertyName) {
        var data;
        // Create properties for all IPropData fields in object
        if (object && !propertyName) {
            for (propertyName in Object.getOwnPropertyNames(object)) {
                if (!Object.getOwnPropertyDescriptor(object, propertyName)) {
                    data = object[propertyName];
                    if (data != null && data.__prop__unready__) {
                        delete data.__prop__unready__;
                        createProperty(propertyName, data);
                    }
                }
            }
            return;
        }
        // Create and return property builder
        data = {};
        data.__prop__unready__ = true;
        var builder = {
            "require": function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i - 0] = arguments[_i];
                }
                data.requirements = args;
                return builder;
            },
            "default": function (arg) {
                data.initialResult = arg;
                return builder;
            },
            "get": function (arg) {
                data.getter = arg;
                return builder;
            },
            "set": function (arg) {
                data.setter = arg;
                return builder;
            },
            "with": function (arg) {
                data.filter = arg;
                return builder;
            },
            "declare": function () {
                if (propertyName) {
                    createProperty(propertyName, data);
                }
                else {
                    return data;
                }
            }
        };
        return builder;
        function createProperty(propertyName, data) {
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
                if (typeof value === 'number' && isNaN(value)) {
                    return 3;
                }
                return 0;
            }
            function getter() {
                if (data.stage === 2 /* Setting */) {
                    return data.lastResult;
                }
                if (data.stage === 1 /* Getting */) {
                    throw new Error("Recursive property read");
                }
                data.stage = 1 /* Getting */;
                try {
                    // Property without getter
                    if (!data.getter) {
                        if (data.initialResult) {
                            data.lastResult = data.initialResult.call(object);
                            data.initialResult = undefined;
                        }
                        return data.lastResult;
                    }
                    // Check requirements' changes
                    var same = data.lastArgs && data.requirements && data.lastArgs.length === data.requirements.length;
                    if (!same) {
                        data.lastArgs = undefined;
                    }
                    var args;
                    if (data.requirements) {
                        args = [];
                        for (var i in data.requirements) {
                            var requirement = data.requirements[i];
                            var oldArg = data.lastArgs != null ? data.lastArgs[i] : undefined;
                            var newArg = requirement(oldArg != null ? oldArg.value : undefined);
                            args.push(newArg);
                            if (same) {
                                var oldEmpty = emptyValue(oldArg.value);
                                var newEmpty = emptyValue(newArg);
                                if (oldEmpty !== newEmpty) {
                                    same = !oldEmpty && !newEmpty && oldArg.value === newArg && oldArg.__prop__ver__ === newArg.__prop__ver__ && oldArg.length === newArg.length;
                                }
                            }
                        }
                    }
                    // Store last arguments and result
                    if (!same) {
                        var newArgs;
                        if (args) {
                            newArgs = [];
                            args.forEach(function (arg) { return newArgs.push({
                                value: arg,
                                __prop__ver__: arg != null ? arg.__prop__ver__ : undefined,
                                length: arg != null ? arg.length : undefined
                            }); });
                        }
                        var newResult = data.getter.apply(object, args);
                        // Filter new result
                        if (data.filter) {
                            newResult = data.filter.call(object, newResult, data.lastResult);
                        }
                        data.lastArgs = newArgs;
                        data.lastResult = newResult;
                    }
                    return data.lastResult;
                }
                finally {
                    data.stage = undefined;
                }
            }
            function setter(newResult) {
                if (data.stage) {
                    throw new Error("Recursive property write");
                }
                data.stage = 2 /* Setting */;
                try {
                    // Override property
                    if (newResult != null && newResult.__prop__unready__) {
                        data = newResult;
                        delete data.__prop__unready__;
                        return;
                    }
                    // Filter new value
                    if (data.filter) {
                        newResult = data.filter.call(object, newResult, data.lastResult);
                    }
                    // Property without getter
                    if (!data.getter) {
                        data.lastResult = newResult;
                        data.initialResult = undefined;
                    }
                    // Call setter
                    if (data.setter) {
                        data.setter.call(object, newResult, data.lastResult);
                    }
                    else if (data.getter) {
                        throw new Error("Attempt to write readonly property");
                    }
                }
                finally {
                    data.stage = undefined;
                }
            }
        }
    });
    propjet.invalidate = function (value) {
        // Value types can not be invalidated
        var valueType = typeof value;
        if (valueType !== "object" && valueType !== "function") {
            return;
        }
        // Object already contains version
        var ver = value.__prop__ver__;
        if (ver != null) {
            // Reset to zero when it overflows
            var newVer = ver + 1;
            value.__prop__ver__ = newVer !== ver ? newVer : 0;
            return;
        }
        // Create non-enumerable version property
        var obj = { __prop__ver__: 0 };
        Object.defineProperty(value, Object.getOwnPropertyNames(obj)[0], {
            value: 1,
            configurable: true,
            writable: true
        });
    };
    return propjet;
})();
