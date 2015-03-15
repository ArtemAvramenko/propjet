/*
 propjet.js 0.2
 (c) 2015 Artem Avramenko. https://github.com/ArtemAvramenko/propjet.js
 License: MIT
*/
this.propjet = (function () {
    var propjet = (function (object, propertyName) {
        var data;
        if (object && !propertyName) {
            for (propertyName in object) {
                var descriptor = Object.getOwnPropertyDescriptor(object, propertyName);
                if (descriptor != null && descriptor.get != null) {
                    continue;
                }
                data = object[propertyName];
                if (data != null && data.__prop__unready__) {
                    delete data.__prop__unready__;
                    createProperty(propertyName, data);
                }
            }
            return;
        }
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
            function getter() {
                if (data.stage === 2 /* setting */) {
                    return data.lastResult;
                }
                if (data.stage === 1 /* getting */) {
                    throw new Error("Recursive property read");
                }
                data.stage = 1 /* getting */;
                try {
                    if (!data.getter) {
                        if (data.initialResult) {
                            data.lastResult = data.initialResult();
                            data.initialResult = undefined;
                        }
                        return data.lastResult;
                    }
                    var same = data.lastArgs && data.lastArgs.length === data.requirements.length;
                    if (!same) {
                        data.lastArgs = undefined;
                    }
                    var args;
                    if (data.requirements) {
                        args = [];
                        for (var i in data.requirements) {
                            var func = data.requirements[i];
                            var oldArg = data.lastArgs != null ? data.lastArgs[i] : undefined;
                            var newArg = func(oldArg != null ? oldArg.value : undefined);
                            args.push(newArg);
                            if (same) {
                                same = oldArg.value === newArg && oldArg.__prop__ver__ === newArg.__prop__ver__ && oldArg.length === newArg.length;
                            }
                        }
                    }
                    if (!same) {
                        var newArgs;
                        if (args) {
                            newArgs = [];
                            args.forEach(function (arg) { return newArgs.push({
                                value: arg,
                                __prop__ver__: arg.__prop__ver__,
                                length: arg.length
                            }); });
                        }
                        var newResult = data.getter.apply(undefined, args);
                        if (data.filter) {
                            newResult = data.filter(newResult, data.lastResult);
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
                data.stage = 2 /* setting */;
                try {
                    if (newResult != null && newResult.__prop__unready__) {
                        data = newResult;
                        delete data.__prop__unready__;
                        return;
                    }
                    if (data.filter) {
                        newResult = data.filter(newResult, data.lastResult);
                    }
                    if (!data.getter) {
                        data.lastResult = newResult;
                        data.initialResult = undefined;
                    }
                    if (data.setter) {
                        data.setter(newResult, data.lastResult);
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
        if (value == null || typeof value !== "object") {
            return;
        }
        var ver = value.__prop__ver__;
        if (ver != null) {
            var newVer = ver + 1;
            value.__prop__ver__ = newVer !== ver ? newVer : 0;
            return;
        }
        var obj = { __prop__ver__: 0 };
        Object.defineProperty(value, Object.getOwnPropertyNames(obj)[0], {
            value: 1,
            configurable: true,
            writable: true
        });
    };
    return propjet;
})();
