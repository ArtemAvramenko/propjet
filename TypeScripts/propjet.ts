declare module Propjet
{
    export const enum Stage { getting = 1, setting = 2 }

    export interface IAllOperators<T>
        extends IRequireOperator<T>, IDefaultOperator<T>, IGetOperator<T>, IDeclareOperator<T>, ISetOperator<T>, IWithOperator<T>
    { }

    export interface IVersionValue
    {
        __dep__ver__: number;
        length: number;
        value: any;
    }

    export interface IPropData<T>
    {
        __dep__unready__: boolean;
        stage: Propjet.Stage;
        lastResult: T;
        lastArgs: IVersionValue[];

        initialResult: () => T;
        requirements: ((oldValue?: any) => any)[];
        getter: () => T;
        setter: (newValue: T, oldValue?: T) => void;
        filter: (newValue: T, oldValue?: T) => T;
    }
}

propjet = <any>(<T>(object?: Object, propertyName?: string) =>
{
    if (object && !propertyName)
    {
        for (propertyName in object)
        {
            var descriptor = Object.getOwnPropertyDescriptor(object, propertyName);
            if (descriptor != null && descriptor.get != null)
            {
                continue;
            }
            data = object[propertyName];
            if (data != null && data.__dep__unready__)
            {
                delete data.__dep__unready__;
                createProperty(propertyName, data);
            }
        }
        return;
    }

    var builder = <Propjet.IAllOperators<T>>{};
    var data = <Propjet.IPropData<T>>{};
    data.__dep__unready__ = true;

    builder.require = (...args) =>
    {
        data.requirements = args;
        return builder;
    };
    builder.default = arg =>
    {
        data.initialResult = arg;
        return builder;
    };
    builder.get = arg =>
    {
        data.getter = arg;
        return builder;
    };
    builder.set = arg =>
    {
        data.setter = arg;
        return builder;
    };
    builder.with = arg =>
    {
        data.filter = arg;
        return builder;
    };
    builder.declare = () =>
    {
        if (propertyName)
        {
            createProperty(propertyName, data);
        }
        else
        {
            return <any>data;
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

        function getter()
        {
            if (data.stage === Propjet.Stage.setting)
            {
                return data.lastResult;
            }
            if (data.stage === Propjet.Stage.getting)
            {
                throw new Error('Recursive property read');
            }
            data.stage = Propjet.Stage.getting;
            try {
                if (!data.getter)
                {
                    if (data.initialResult)
                    {
                        data.lastResult = data.initialResult();
                        data.initialResult = undefined;
                    }
                    return data.lastResult;
                }
                var same = data.lastArgs && data.lastArgs.length === data.requirements.length;
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
                        var func = data.requirements[i];
                        var oldArg = data.lastArgs != null ? data.lastArgs[i] : undefined;
                        var newArg = <Propjet.IVersionValue>func(oldArg != null ? oldArg.value : undefined);
                        args.push(newArg);
                        if (same)
                        {
                            same = oldArg.value === newArg && oldArg.__dep__ver__ === newArg.__dep__ver__ && oldArg.length === newArg.length;
                        }
                    }
                }
                if (!same)
                {
                    var newArgs: Propjet.IVersionValue[];
                    if (args)
                    {
                        newArgs = [];
                        (<Propjet.IVersionValue[]>args).forEach(arg => newArgs.push({
                            value: arg,
                            __dep__ver__: arg.__dep__ver__,
                            length: arg.length
                        }));
                    }
                    var newResult = data.getter.apply(undefined, args);
                    if (data.filter)
                    {
                        newResult = data.filter(newResult, data.lastResult);
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
                throw new Error('Recursive property write');
            }
            data.stage = Propjet.Stage.setting;
            try {
                if (newResult != null && (<Propjet.IPropData<any>>newResult).__dep__unready__)
                {
                    data = newResult;
                    delete data.__dep__unready__;
                    return;
                }
                if (data.filter)
                {
                    newResult = data.filter(newResult, data.lastResult);
                }
                if (!data.getter)
                {
                    data.lastResult = newResult;
                    data.initialResult = undefined;
                }
                if (data.setter)
                {
                    data.setter(newResult, data.lastResult);
                }
                else if (data.getter)
                {
                    throw new Error('Attempt to write readonly property');
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
    if (value == null || typeof value !== 'object')
    {
        return;
    }
    var ver = (<Propjet.IVersionValue>value).__dep__ver__;
    if (ver != null)
    {
        var newVer = ver + 1;
        (<Propjet.IVersionValue>value).__dep__ver__ = newVer !== ver ? newVer : 0;
        return;
    }
    var obj = <Propjet.IVersionValue>{ __dep__ver__: 0 };
    Object.defineProperty(value, Object.getOwnPropertyNames(obj)[0], {
        value: 1,
        configurable: true,
        writable: true
    });
};