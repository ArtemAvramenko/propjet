declare module Propjet
{
    export const enum Stage { Getting = 1, Setting = 2 }

    export interface IAllOperators<T>
        extends IRequireOperator<T>, IDefaultOperator<T>, IGetOperator<T>, IDeclareOperator<T>, ISetOperator<T>, IWithOperator<T>
    { }

    export interface IRequirement
    {
        (oldValue?: any): any;
    }

    export interface IVersionValue
    {
        __prop__ver__: number;
        length: number;
        value: any;
    }

    export interface IPropData<T>
    {
        __prop__unready__: boolean;
        stage: Propjet.Stage;
        lastResult: T;
        lastArgs: IVersionValue[];
        initialResult: () => T;
        requirements: IRequirement[];
        getter: () => T;
        setter: (newValue: T, oldValue?: T) => void;
        filter: (newValue: T, oldValue?: T) => T;
    }
}

(<any>this).propjet = (() =>
{
    var propjet = <Propjet.IPropjet>(<T>(object?: Object, propertyName?: string) =>
    {
        var data: Propjet.IPropData<T>;

        // Create properties for all IPropData fields in object
        if (object && !propertyName)
        {
            // Enumerate all own fields skipping properties
            for (propertyName in Object.getOwnPropertyNames(object))
            {
                if (!Object.getOwnPropertyDescriptor(object, propertyName))
                {
                    data = object[propertyName];
                    if (data != null && data.__prop__unready__)
                    {
                        delete data.__prop__unready__;
                        createProperty(propertyName, data);
                    }
                }
            }
            return;
        }

        // Create and return property builder
        data = <Propjet.IPropData<T>>{};
        data.__prop__unready__ = true;
        var builder = <Propjet.IAllOperators<any>>{
            "require": (...args: any[]) =>
            {
                data.requirements = args;
                return builder;
            },
            "default": arg =>
            {
                data.initialResult = arg;
                return builder;
            },
            "get": arg =>
            {
                data.getter = arg;
                return builder;
            },
            "set": arg =>
            {
                data.setter = arg;
                return builder;
            },
            "with": arg =>
            {
                data.filter = arg;
                return builder;
            },
            "declare": () =>
            {
                if (propertyName)
                {
                    createProperty(propertyName, data);
                }
                else
                {
                    return <any>data;
                }
            }
        };
        return builder;

        function createProperty(propertyName: string, data: Propjet.IPropData<any>)
        {
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
                if (typeof value === 'number' && isNaN(value))
                {
                    return 3;
                }
                return 0;
            }

            function getter()
            {
                if (data.stage === Propjet.Stage.Setting)
                {
                    return data.lastResult;
                }
                if (data.stage === Propjet.Stage.Getting)
                {
                    throw new Error("Recursive property read");
                }
                data.stage = Propjet.Stage.Getting;
                try {
                    // Property without getter
                    if (!data.getter)
                    {
                        if (data.initialResult)
                        {
                            data.lastResult = data.initialResult.call(object);
                            data.initialResult = undefined;
                        }
                        return data.lastResult;
                    }

                    // Check requirements' changes
                    var same = data.lastArgs && data.requirements && data.lastArgs.length === data.requirements.length;
                    if (!same)
                    {
                        data.lastArgs = undefined;
                    }
                    var args: any[];
                    if (data.requirements)
                    {
                        args = [];
                        for (var i in data.requirements)
                        {
                            var requirement = data.requirements[i];
                            var oldArg = data.lastArgs != null ? data.lastArgs[i] : undefined;
                            var newArg = <Propjet.IVersionValue>requirement(oldArg != null ? oldArg.value : undefined);
                            args.push(newArg);
                            if (same)
                            {
                                var oldEmpty = emptyValue(oldArg.value);
                                var newEmpty = emptyValue(newArg);
                                if (oldEmpty !== newEmpty)
                                {
                                    same =
                                    !oldEmpty &&
                                    !newEmpty &&
                                    oldArg.value === newArg &&
                                    oldArg.__prop__ver__ === newArg.__prop__ver__ &&
                                    oldArg.length === newArg.length;
                                }
                            }
                        }
                    }

                    // Store last arguments and result
                    if (!same)
                    {
                        var newArgs: Propjet.IVersionValue[];
                        if (args)
                        {
                            newArgs = [];
                            (<Propjet.IVersionValue[]>args).forEach(arg => newArgs.push({
                                value: arg,
                                __prop__ver__: arg != null ? arg.__prop__ver__ : undefined,
                                length: arg != null ? arg.length : undefined
                            }));
                        }
                        var newResult = data.getter.apply(object, args);

                        // Filter new result
                        if (data.filter)
                        {
                            newResult = data.filter.call(object, newResult, data.lastResult);
                        }
                        data.lastArgs = newArgs;
                        data.lastResult = newResult;
                    }

                    return data.lastResult;
                }
                finally
                {
                    data.stage = undefined;
                }
            }

            function setter(newResult: any)
            {
                if (data.stage)
                {
                    throw new Error("Recursive property write");
                }
                data.stage = Propjet.Stage.Setting;
                try {
                    // Override property
                    if (newResult != null && (<Propjet.IPropData<any>>newResult).__prop__unready__)
                    {
                        data = newResult;
                        delete data.__prop__unready__;
                        return;
                    }

                    // Filter new value
                    if (data.filter)
                    {
                        newResult = data.filter.call(object, newResult, data.lastResult);
                    }

                    // Property without getter
                    if (!data.getter)
                    {
                        data.lastResult = newResult;
                        data.initialResult = undefined;
                    }

                    // Call setter
                    if (data.setter)
                    {
                        data.setter.call(object, newResult, data.lastResult);
                    }
                    else if (data.getter)
                    {
                        throw new Error("Attempt to write readonly property");
                    }
                }
                finally
                {
                    data.stage = undefined;
                }
            }
        }
    });

    propjet.invalidate = value =>
    {
        // Value types can not be invalidated
        var valueType = typeof value;
        if (valueType !== "object" && valueType !== "function")
        {
            return;
        }

        // Object already contains version
        var ver = (<Propjet.IVersionValue>value).__prop__ver__;
        if (ver != null)
        {
            // Reset to zero when it overflows
            var newVer = ver + 1;
            (<Propjet.IVersionValue>value).__prop__ver__ = newVer !== ver ? newVer : 0;
            return;
        }

        // Create non-enumerable version property
        var obj = <Propjet.IVersionValue>{ __prop__ver__: 0 };
        Object.defineProperty(value, Object.getOwnPropertyNames(obj)[0], {
            value: 1,
            configurable: true,
            writable: true
        });
    };

    return propjet;
})();