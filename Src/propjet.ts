declare module Propjet
{
    export interface IBuilder<T> extends IPropertyBuilder<T>, IDeclare<T>
    { }

    export interface ISource
    {
        (oldValue?: any): any;
    }

    export interface ISourceValue
    {
        val: any;
        len: number;
        ver: number;
    }

    export interface IVersionObject extends Object
    {
        __prop__ver__: number;
        length: number;
    }

    export interface IPropData<T>
    {
        __prop__unready__: boolean;
        isDeferred: boolean;
        lvl: number;
        src: ISource[];
        vals: ISourceValue[];
        res: T;
        init: () => T;
        get: () => T;
        set: (newValue: T) => void;
        fltr: (newValue: T, oldValue?: T) => T;
    }

    export interface IForEachCallback<T>
    {
        (value: T, index: number): void;
    }

    const enum DeferredStatus { pending, fulfilled, rejected }

    const enum Error { noPropertySupport, readonlyPropertyWrite, circularDependency, recursivePropertyWrite, circularPromises }
}

(<any>this).propjet = (() =>
{
    var propVer = "__prop__ver__";
    var defineProperty = Object.defineProperty;
    var getOwnPropertyNames = Object.getOwnPropertyNames;
    var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    var noProperties = !(defineProperty && getOwnPropertyNames && getOwnPropertyDescriptor);

    function throwError(error: Propjet.Error)
    {
        throw new Error([
            "This browser does not support property creation. Instead, use function mode.",
            "Attempt to write readonly property",
            "Circular dependency detected",
            "Recursive property write",
            "Circular promises detected"
        ][error]);
    }

    function throwReadonlyError()
    {
        throwError(Propjet.Error.readonlyPropertyWrite);
    }

    // enumerates all elements in array
    var forEach: <T>(items: T[], callback: Propjet.IForEachCallback<T>) => void;
    // #region cross-browser implementation
    if ([].forEach)
    {
        forEach = (items: any[], callback: Propjet.IForEachCallback<any>) => items.forEach(callback);
    }
    else
    {
        forEach = (items: any[], callback: Propjet.IForEachCallback<any>) =>
        {
            var itemCount = items.length;
            for (var i = 0; i < itemCount; i++)
            {
                callback(items[i], i);
            }
        };
    }
    // #endregion

    // reads/reads version from non-enumerable property
    var getVersion: (obj: Propjet.IVersionObject) => number;
    var setVersion: (obj: Propjet.IVersionObject, ver: number) => void;
    // #region cross-browser implementation
    if (noProperties)
    {
        // exploit IE bug for creating non-enumerable property:
        // https://developer.mozilla.org/en-US/docs/ECMAScript_DontEnum_attribute#JScript_DontEnum_Bug
        // choose propertyIsEnumerable method to store hidden property,
        // but it could be any other method from Object prototype
        var propertyIsEnumerable = "propertyIsEnumerable";
        var testIE = {};
        testIE[propertyIsEnumerable] = 0;
        for (var notIE in testIE)
        {
            // IE 6..8 do not set notIE variable in this case
        }

        if (!notIE)
        {
            getVersion = obj =>
            {
                var p = obj[propertyIsEnumerable];
                return p && p[propVer];
            };
            setVersion = (obj, ver) =>
            {
                if (!ver)
                {
                    var p = obj[propertyIsEnumerable];
                    obj[propertyIsEnumerable] = name => p(name);
                }
                obj[propertyIsEnumerable][propVer] = ver;
            };
        }
    }
    else
    {
        setVersion = (obj, ver) =>
        {
            if (!ver)
            {
                defineProperty(obj, propVer, {
                    value: 0,
                    configurable: false,
                    writable: true
                });
            }
            else
            {
                obj.__prop__ver__ = ver;
            }
        };
    }
    if (!getVersion)
    {
        getVersion = obj => obj.__prop__ver__;
    }
    if (!setVersion)
    {
        setVersion = (obj, ver) => obj.__prop__ver__ = ver;
    }
    // #endregion

    var undef;

    function defProperty(object: any, propertyName: string, getter: () => any, setter: (_: any) => void)
    {
        defineProperty(object, propertyName, {
            configurable: true,
            enumerable: true,
            get: getter,
            set: setter
        });
    }

    function defReadonlyProperty(proxyObject: any, propertyName: string, object: any)
    {
        defProperty(proxyObject, propertyName, () => object[propertyName], throwReadonlyError);
    }

    function incrementVersion(value: Propjet.IVersionObject): number
    {
        if (value == null)
        {
            return;
        }

        // value types can not be invalidated
        var valueType = typeof value;
        if (valueType !== "object" && valueType !== "function")
        {
            return;
        }

        var ver = getVersion(value);
        var newVer = 0;
        if (ver != null)
        {
            newVer = ver + 1;
            if (newVer === ver)
            {
                // reset to one when it overflows
                newVer = 1;
            }
        }
        setVersion(value, newVer);
        return newVer;
    };

    var nestingLevel = 0;

    var propjet = <Propjet.IPropjet>(<T>(object?: Object, propertyName?: string) =>
    {
        var data: Propjet.IPropData<T>;

        // create properties for all IPropData fields in object
        if (object && !propertyName)
        {
            if (noProperties)
            {
                throwError(Propjet.Error.noPropertySupport);
            }

            // enumerate all own fields
            forEach(getOwnPropertyNames(object), propertyName =>
            {
                // do not call getters
                var descriptor = getOwnPropertyDescriptor(object, propertyName);
                if (!descriptor || !descriptor.get)
                {
                    data = object[propertyName];
                    if (isUnreadyProperty(data))
                    {
                        createProperty(data)(propertyName, data);
                    }
                }
            });
            return;
        }

        // create and return property builder
        data = <Propjet.IPropData<T>>{};

        var builder = <Propjet.IBuilder<T>>{
            "from": () =>
            {
                data.isDeferred = true;
                data.src = [];
                return builder;
            },
            "require": (...args: any[]) =>
            {
                data.src = args;
                return builder;
            },
            "get": arg =>
            {
                data.get = arg;
                return builder;
            },
            "set": arg =>
            {
                data.set = arg;
                return builder;
            },
            "declare": (functionMode?: boolean) =>
            {
                if (functionMode)
                {
                    return <any>createProperty(data)(propertyName, data, true);
                }
                if (propertyName)
                {
                    createProperty(data)(propertyName, data);
                }
                else
                {
                    data.__prop__unready__ = true;
                    return <any>data;
                }
            }
        };

        /* tslint:disable */
        builder["with"] =
        /* tslint:enable */
        (<Propjet.IBuilder<T>>builder).withal = arg =>
        {
            data.fltr = arg;
            return builder;
        };

        /* tslint:disable */
        builder["default"] =
        /* tslint:enable */
        (<Propjet.IBuilder<T>>builder).defaults = arg =>
        {
            data.init = arg;
            return builder;
        };

        return builder;

        function isUnreadyProperty(data: Propjet.IPropData<T>)
        {
            var result = data != null && data.__prop__unready__;
            if (result)
            {
                delete data.__prop__unready__;
            }
            return result;
        }

        function emptyValue(value: any): number
        {
            if (value === undef)
            {
                return 1;
            }
            if (value == null)
            {
                return 2;
            }
            if (value.length === 0 && getVersion(value) == null)
            {
                /* tslint:disable */
                for (var i in value)
                /* tslint:enable */
                {
                    return 0;
                }
                return 3;
            }
            if (typeof value === "number" && isNaN(value))
            {
                return 4;
            }
            return 0;
        }

        function getArgs(data: Propjet.IPropData<T>, args: Propjet.IVersionObject[]): boolean
        {
            if (!data.src)
            {
                return false;
            }

            // check requirements' changes
            var same = data.vals && data.vals.length === data.src.length;
            var ignoreOldValues = !same;

            forEach(data.src, (source, i) =>
            {
                var old = ignoreOldValues ? undef : data.vals[i];
                var arg = <Propjet.IVersionObject>source.call(object, old != null ? old.val : undef);
                args[i] = arg;
                if (same)
                {
                    var oldEmpty = emptyValue(old.val);
                    var newEmpty = emptyValue(arg);
                    if (oldEmpty)
                    {
                        same = oldEmpty === newEmpty;
                    }
                    else
                    {
                        same = !newEmpty && old.val === arg && old.ver === getVersion(arg) && old.len === arg.length;
                    }
                }
            });

            return same;
        }

        function saveArgs(data: Propjet.IPropData<T>, args: Propjet.IVersionObject[])
        {
            var sourceValues: Propjet.ISourceValue[] = [];
            forEach(args, (arg, i) =>
            {
                sourceValues[i] = {
                    val: arg,
                    ver: arg != null ? getVersion(arg) : undef,
                    len: arg != null ? arg.length : undef
                };
            });
            data.vals = sourceValues;
        }

        function createProperty(data: Propjet.IPropData<T>)
        {
            return data.isDeferred ? createDeferredProperty : createRegularProperty;
        }

        function createRegularProperty(propertyName: string, data: Propjet.IPropData<T>, functionMode?: boolean): any
        {
            if (functionMode)
            {
                function func(value: T)
                {
                    if (arguments.length === 0)
                    {
                        return getter();
                    }
                    setter(value);
                }

                if (propertyName)
                {
                    object[propertyName] = func;
                }
                return func;
            }

            if (noProperties)
            {
                throwError(Propjet.Error.noPropertySupport);
            }

            defProperty(object, propertyName, getter, setter);

            function getter(): T
            {
                var oldLevel = data.lvl;
                if (oldLevel > 0)
                {
                    if (oldLevel === nestingLevel)
                    {
                        return data.res;
                    }
                    throwError(Propjet.Error.circularDependency);
                }

                nestingLevel++;
                try
                {
                    data.lvl = nestingLevel;

                    var args: Propjet.IVersionObject[] = [];
                    var same = getArgs(data, args);

                    // property without getter
                    if (!data.get)
                    {
                        // has initializer
                        if (data.init)
                        {
                            if (data.src)
                            {
                                // has requirements - reinitialize on change
                                if (!same)
                                {
                                    data.res = data.init.call(object);
                                    saveArgs(data, args);
                                }
                            }
                            else
                            {
                                // no requirement - call init once
                                data.res = data.init.call(object);
                                data.init = undef;
                            }
                        }
                    }
                    else if (!same)
                    {
                        // call getter
                        var newResult = data.get.apply(object, args);

                        // filter new result
                        if (data.fltr)
                        {
                            newResult = data.fltr.call(object, newResult, data.res);
                        }

                        // store last arguments and result
                        if (data.src)
                        {
                            saveArgs(data, args);
                        }
                        data.res = newResult;
                    }

                    return data.res;
                }
                finally
                {
                    nestingLevel--;
                    data.lvl = oldLevel;
                }
            }

            function setter(value: T)
            {
                if (data.lvl)
                {
                    throwError(Propjet.Error.recursivePropertyWrite);
                }

                nestingLevel++;
                try
                {
                    data.lvl = -1;

                    // override property
                    if (isUnreadyProperty(<any>value))
                    {
                        data = <any>value;
                        return;
                    }

                    // filter new value
                    if (data.fltr)
                    {
                        value = data.fltr.call(object, value, data.res);
                    }

                    if (data.get)
                    {
                        if (!data.set)
                        {
                            throwReadonlyError();
                        }
                    }
                    else
                    {
                        // property without getter
                        if (data.src)
                        {
                            var args: Propjet.IVersionObject[] = [];
                            getArgs(data, args);
                            saveArgs(data, args);
                        }
                        else
                        {
                            data.init = undef;
                        }
                        data.res = value;
                    }

                    // call setter
                    if (data.set)
                    {
                        data.set.call(object, value);
                    }
                }
                finally
                {
                    nestingLevel--;
                    data.lvl = 0;
                }
            }
        }

        function createDeferredProperty(propertyName: string, data: Propjet.IPropData<T>, functionMode?: boolean): any
        {
            var promise: Propjet.IPromise<T>;
            var deferred = <Propjet.IDeferred<T, Propjet.IPromise<T>>>{};
            var isInPromiseMethod: boolean;

            deferred.get = (forceUpdate?: boolean) =>
            {
                if (isInPromiseMethod)
                {
                    throwError(Propjet.Error.circularPromises);
                }
                isInPromiseMethod = true;
                try
                {
                    if (forceUpdate && !deferred.pending)
                    {
                        checkUpdate(forceUpdate);
                    }
                    return promise;
                }
                finally
                {
                    isInPromiseMethod = false;
                }
            };

            deferred.set = (newValue: T, isDeferred?: boolean) =>
            {
                if (isInPromiseMethod)
                {
                    throwError(Propjet.Error.circularPromises);
                }
                isInPromiseMethod = true;
                try
                {
                    if (!data.set)
                    {
                        throwReadonlyError();
                    }
                    incrementVersion(<any>deferred);
                    var args = [];
                    getArgs(data, args);
                    args.unshift(newValue);

                    var promise: Propjet.IPromise<T> = data.set.apply(object, args);
                    if (!isDeferred)
                    {
                        deferred.last = newValue;
                    }
                    waitPromise(promise);
                    return promise;
                }
                finally
                {
                    isInPromiseMethod = false;
                }
            };

            function setStatus(newStatus: Propjet.DeferredStatus)
            {
                deferred.pending = newStatus === Propjet.DeferredStatus.pending;
                deferred.fulfilled = newStatus === Propjet.DeferredStatus.fulfilled;
                deferred.rejected = newStatus === Propjet.DeferredStatus.rejected;
                deferred.settled = newStatus !== Propjet.DeferredStatus.pending;
            }

            function setValue(value: any, isRejection?: boolean)
            {
                incrementVersion(<any>deferred);
                if (!isRejection)
                {
                    deferred.last = value;
                }
                deferred.rejectReason = isRejection ? value : undef;
                setStatus(isRejection ? Propjet.DeferredStatus.fulfilled : Propjet.DeferredStatus.rejected);
            }

            function waitPromise(promise: Propjet.IPromise<T>)
            {
                var version = incrementVersion(<any>data);

                if (!promise)
                {
                    setValue(undefined);
                    return;
                }

                forEach(["then", "catch"], (methodName, isRejection) =>
                {
                    promise[methodName](value =>
                    {
                        // ignore callbacks if newer promise is active
                        if (getVersion(<any>data) === version)
                        {
                            setValue(value, <any>isRejection);
                        }
                    });
                });
            }

            setValue(undef);

            function checkUpdate(forceUpdate?: boolean)
            {
                if (isInPromiseMethod)
                {
                    return;
                }
                var args: Propjet.IVersionObject[] = [];
                var same = getArgs(data, args);
                if (!same || forceUpdate)
                {
                    incrementVersion(<any>deferred);
                    saveArgs(data, args);
                    promise = data.get.apply(object, args);
                    setStatus(Propjet.DeferredStatus.pending);
                    waitPromise(promise);
                }
            }

            if (functionMode)
            {
                var func = () =>
                {
                    checkUpdate();
                    return deferred;
                };
                if (propertyName)
                {
                    object[propertyName] = func;
                }
                return func;
            }

            if (noProperties)
            {
                throwError(Propjet.Error.noPropertySupport);
            }

            // create readonly property
            var readonlyProxy = {};
            for (var prop in deferred)
            {
                defReadonlyProperty(readonlyProxy, prop, deferred);
            }
            defProperty(object, propertyName,
                () =>
                {
                    checkUpdate();
                    return readonlyProxy;
                },
                (newData: Propjet.IPropData<T>) =>
                {
                    // override property
                    if (isUnreadyProperty(newData))
                    {
                        data = newData;
                        setValue(undef);
                    }
                    else
                    {
                        throwReadonlyError();
                    }
                });
        }
    });

    propjet.invalidate = incrementVersion;
    return propjet;
})();