declare module Propjet
{
    export interface IPropertyBuilder<T>
        extends IRequire<T>, IDefault<T>, IGet<T>, IDeclare<T>, ISet<T>, IWith<T>
    { }

    export interface ISource
    {
        (oldValue?: any): any;
    }

    export interface IVersionObject extends Object
    {
        __prop__ver__: number;
        length: number;
    }

    export interface ISourceValue
    {
        val: any;
        len: number;
        ver: number;
    }

    export interface IPropData<T>
    {
        __prop__unready__: boolean;
        lvl: number;
        src: ISource[];
        vals: ISourceValue[];
        res: T;
        init: () => T;
        get: () => T;
        set: (newValue: T) => void;
        fltr: (newValue: T, oldValue?: T) => T;
    }
}

(<any>this).propjet = (() =>
{
    // enumerates all elements in array
    var forEach: <T>(items: T[], callback: (value: T, index: number) => void) => void;
    // #region cross-browser implementation
    if ([].forEach)
    {
        forEach = (items: any[], callback) => items.forEach(callback);
    }
    else
    {
        forEach = (items: any[], callback) =>
        {
            var itemCount = items.length;
            for (var i = 0; i < itemCount; i++)
            {
                callback(items[i], i);
            }
        };
    }
    // #endregion

    // throws error for outdated browsers, otherwise undefined
    var failProperties: () => void;
    // #region cross-browser implementation
    if (!(Object.defineProperty && Object.getOwnPropertyNames && Object.getOwnPropertyDescriptor))
    {
        failProperties = () =>
        {
            throw new Error("This browser does not support property creation. Instead, use function mode.");
        };
    }
    // #endregion

    // reads/reads version from non-enumerable property
    var getVersion: (obj: Propjet.IVersionObject) => number;
    var setVersion: (obj: Propjet.IVersionObject, ver: number) => void;
    // #region cross-browser implementation
    if (failProperties)
    {
        if (!(function ()
        {
            for (var notIE in <Error>{ propertyIsEnumerable: null })
            {
                return notIE;
            }
        })())
        {
            // exploit IE bug for creating non-enumerable property:
            // https://developer.mozilla.org/en-US/docs/ECMAScript_DontEnum_attribute#JScript_DontEnum_Bug
            getVersion = obj =>
            {
                // choose propertyIsEnumerable method to store hidden property,
                // but it could be any other method from Object prototype
                var p = <Propjet.IVersionObject><any>obj.propertyIsEnumerable;
                return p && p.__prop__ver__;
            };
            setVersion = (obj, ver) =>
            {
                if (!ver)
                {
                    var p = obj.propertyIsEnumerable;
                    obj.propertyIsEnumerable = name => p(name);
                }
                (<Propjet.IVersionObject><any>obj.propertyIsEnumerable).__prop__ver__ = ver;
            };
        }
    }
    else
    {
        setVersion = (obj, ver) =>
        {
            if (!ver)
            {
                Object.defineProperty(obj, "__prop__ver__", {
                    value: 0,
                    configurable: true,
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

    var nestingLevel = 0;

    var propjet = <Propjet.IPropjet>(<T>(object?: Object, propertyName?: string) =>
    {
        var data: Propjet.IPropData<T>;

        // create properties for all IPropData fields in object
        if (object && !propertyName)
        {
            if (failProperties)
            {
                failProperties();
            }

            // enumerate all own fields
            forEach(Object.getOwnPropertyNames(object), propertyName =>
            {
                // do not call getters
                var descriptor = Object.getOwnPropertyDescriptor(object, propertyName);
                if (!descriptor || !descriptor.get)
                {
                    data = object[propertyName];
                    if (data != null && data.__prop__unready__)
                    {
                        createProperty(propertyName, data);
                    }
                }
            });
            return;
        }

        // create and return property builder
        data = <Propjet.IPropData<T>>{};
        data.__prop__unready__ = true;

        var builder = <Propjet.IPropertyBuilder<T>>{
            "require": (...args: any[]) =>
            {
                data.src = args;
                return builder;
            },
            "default": arg =>
            {
                data.init = arg;
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
                    return createProperty(propertyName, data, true);
                }
                else if (propertyName)
                {
                    createProperty(propertyName, data);
                }
                else
                {
                    return <any>data;
                }
            }
        };

        /* tslint:disable */
        builder["withal"] = builder["with"] = arg =>
        /* tslint:enable */
        {
            data.fltr = arg;
            return builder;
        };

        return builder;

        function createProperty(propertyName: string, data: Propjet.IPropData<T>, functionMode?: boolean)
        {
            delete data.__prop__unready__;

            if (functionMode)
            {
                var func = (value: T) =>
                {
                    if (arguments.length === 0)
                    {
                        return getter();
                    }
                    setter(value);
                };
                if (propertyName)
                {
                    object[propertyName] = func;
                }
                return func;
            }

            if (failProperties)
            {
                failProperties();
            }

            Object.defineProperty(object, propertyName, {
                configurable: true,
                enumerable: true,
                get: getter,
                set: setter
            });

            function emptyValue(value: any): number
            {
                if (value === undefined)
                {
                    return 1;
                }
                if (value == null)
                {
                    return 2;
                }
                if (typeof value === "number" && isNaN(value))
                {
                    return 3;
                }
                return 0;
            }

            function getter(): T
            {
                if (data.lvl)
                {
                    if (data.lvl === nestingLevel)
                    {
                        return data.res;
                    }
                    throw new Error("Circular dependency detected");
                }
                nestingLevel++;
                try {
                    data.lvl = nestingLevel;

                    // property without getter
                    if (!data.get)
                    {
                        if (data.init)
                        {
                            data.res = data.init.call(object);
                            delete data.init;
                        }
                        return data.res;
                    }

                    // check requirements' changes
                    var same = data.vals && data.src && data.vals.length === data.src.length;
                    if (!same)
                    {
                        data.vals = undefined;
                    }
                    var args: Propjet.IVersionObject[];

                    if (data.src)
                    {
                        args = [];
                        forEach(data.src,(source, i) =>
                        {
                            var old = data.vals != null ? data.vals[i] : undefined;
                            var arg = <Propjet.IVersionObject>source.call(object, old != null ? old.val : undefined);
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
                    }

                    // store last arguments and result
                    if (!same)
                    {
                        var sourceValues: Propjet.ISourceValue[];
                        if (args)
                        {
                            sourceValues = [];
                            forEach(args,(arg, i) =>
                            {
                                sourceValues[i] = {
                                    val: arg,
                                    ver: arg != null ? getVersion(arg) : undefined,
                                    len: arg != null ? arg.length : undefined
                                };
                            });
                        }
                        else
                        {
                            args = [];
                        }
                        var newResult = data.get.apply(object, args);

                        // filter new result
                        if (data.fltr)
                        {
                            newResult = data.fltr.call(object, newResult, data.res);
                        }
                        data.vals = sourceValues;
                        data.res = newResult;
                    }

                    return data.res;
                }
                finally
                {
                    nestingLevel--;
                    delete data.lvl;
                }
            }

            function setter(value: T)
            {
                if (data.lvl)
                {
                    throw new Error("Recursive property write");
                }

                nestingLevel++;
                try {
                    data.lvl = -1;

                    // override property
                    if (value != null && (<Propjet.IPropData<T>><any>value).__prop__unready__)
                    {
                        data = <any>value;
                        delete data.__prop__unready__;
                        return;
                    }

                    // filter new value
                    if (data.fltr)
                    {
                        value = data.fltr.call(object, value, data.res);
                    }

                    // call setter
                    if (data.set)
                    {
                        data.set.call(object, value);
                    }
                    else if (data.get)
                    {
                        throw new Error("Attempt to write readonly property");
                    }

                    if (!data.get)
                    {
                        // property without getter
                        data.res = value;
                        data.init = undefined;
                    }
                }
                finally
                {
                    nestingLevel--;
                    delete data.lvl;
                }
            }
        }
    });

    propjet.invalidate = (value: Propjet.IVersionObject) =>
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
                // reset to zero when it overflows
                newVer = 1;
            }
        }
        setVersion(value, newVer);
    };

    return propjet;
})();