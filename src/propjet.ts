declare module Propjet {

    export interface IBuilder<T> extends IPropertyBuilder<T>, IDeclare<T>
    { }

    export interface ISource {
        (oldValue?: any): any;
    }

    export interface ISourceValue {
        val: any;
        len: number;
        ver: number;
    }

    export interface IVersionObject extends Object {
        __prop__ver__: number;
        length: number;
    }

    export interface IPropData<T> {
        __prop__unready__: boolean;
        isDeferred: boolean;
        lvl: number;
        src: ISource[];
        vals: ISourceValue[];
        res: T;
        init: () => T;
        get: () => T | IPromise<T>;
        set: (newValue: T) => void | IPromise<T>;
        fltr: (newValue: T, oldValue?: T) => T;
    }

    export interface IForEachCallback<T> {
        (value: T, index: number): void;
    }

    export interface IFunctionCaller {
        (func: (arg?: any) => any, args: any[]): any;
    }

    const enum DeferredStatus { pending, fulfilled, rejected }

    const enum SetMode { normal, reset, rejection }

    const enum Error { noPropertySupport, readonlyPropertyWrite, circularDependency, recursivePropertyWrite, circularPromises }
}

(<any>this).propjet = (() => {

    var propVer = '__prop__ver__';
    var defineProperty = Object.defineProperty;
    var getOwnPropertyNames = Object.getOwnPropertyNames;
    var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    var noProperties = !(defineProperty && getOwnPropertyNames && getOwnPropertyDescriptor);

    function throwError(error: Propjet.Error) {
        throw new Error([
            'This browser does not support property creation. Instead, use function mode.',
            'Attempt to write readonly property',
            'Circular dependency detected',
            'Recursive property write',
            'Circular promises detected'
        ][error]);
    }

    function throwReadonlyError() {
        throwError(Propjet.Error.readonlyPropertyWrite);
    }

    function versionFuncDefault(obj: Propjet.IVersionObject, ver?: number): number {
        if (ver == null) {
            return obj.__prop__ver__;
        }
        obj.__prop__ver__ = ver;
    }

    // enumerates all elements in array
    var forEach: <T>(items: T[], callback: Propjet.IForEachCallback<T>) => void;
    // #region cross-browser implementation
    if ([].forEach) {
        forEach = (items: any[], callback: Propjet.IForEachCallback<any>) => items.forEach(callback);
    }
    else {
        forEach = (items: any[], callback: Propjet.IForEachCallback<any>) => {
            var itemCount = items.length;
            for (var i = 0; i < itemCount; i++) {
                callback(items[i], i);
            }
        };
    }
    // #endregion

    // reads/reads version from non-enumerable property
    var getVersion: (obj: Propjet.IVersionObject) => number;
    var setVersion: (obj: Propjet.IVersionObject, ver: number) => void;
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
            // old IE (6,7,8) does not set notIE variable in this case
        }

        if (!notIE) {
            getVersion = obj => {
                var p = obj[propertyIsEnumerable];
                return p && p[propVer];
            };
            setVersion = (obj, ver) => {
                if (!ver) {
                    var p = obj[propertyIsEnumerable];
                    obj[propertyIsEnumerable] = name => p(name);
                }
                obj[propertyIsEnumerable][propVer] = ver;
            };
        }
    }
    else {
        setVersion = (obj, ver) => {
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

    function defProperty(object: any, propertyName: string, getter: () => any, setter: (_: any) => void) {
        defineProperty(object, propertyName, {
            configurable: true,
            enumerable: true,
            get: getter,
            set: setter
        });
    }

    function incrementVersion(value: Propjet.IVersionObject): number {

        if (value != null) {

            // value types can not be invalidated
            var valueType = typeof value;
            if (valueType === 'object' || valueType === 'function') {

                var ver = getVersion(value);
                var newVer = 1;
                if (ver != null) {
                    newVer += ver;
                    if (newVer === ver) {
                        // reset to one when it overflows
                        newVer = 1;
                    }
                }
                setVersion(value, newVer);
                return newVer;
            }
        }
    };

    var nestingLevel = 0;

    var propjet = <Propjet.IPropjet>(<T>(object?: Object, propertyName?: string) => {
        var data: Propjet.IPropData<T>;

        // create properties for all IPropData fields in object
        if (object && !propertyName) {
            if (noProperties) {
                throwError(Propjet.Error.noPropertySupport);
            }

            // enumerate all own fields
            forEach(getOwnPropertyNames(object), propertyName => {
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
        data = <Propjet.IPropData<T>>{};

        var builder = <Propjet.IBuilder<T>>{
            'from': () => {
                data.isDeferred = true;
                data.src = [];
                return builder;
            },
            'require': (...args: any[]) => {
                data.src = args;
                return builder;
            },
            'get': arg => {
                data.get = arg;
                return builder;
            },
            'set': arg => {
                data.set = arg;
                return builder;
            },
            'declare': (functionMode?: boolean) => {
                if (functionMode) {
                    return <any>createProperty(propertyName, data, true);
                }
                if (propertyName) {
                    createProperty(propertyName, data);
                }
                else {
                    data.__prop__unready__ = true;
                    return <any>data;
                }
            }
        };

        /* tslint:disable */
        builder['with'] =
            /* tslint:enable */
            (<Propjet.IBuilder<T>>builder).withal = arg => {
                data.fltr = arg;
                return builder;
            };

        /* tslint:disable */
        builder['default'] =
            /* tslint:enable */
            (<Propjet.IBuilder<T>>builder).defaults = arg => {
                data.init = arg;
                return builder;
            };

        return builder;

        function isUnreadyProperty(data: Propjet.IPropData<T>) {
            var result = data != null && data.__prop__unready__;
            if (result) {
                delete data.__prop__unready__;
            }
            return result;
        }

        function createProperty(propertyName: string, data: Propjet.IPropData<T>, functionMode?: boolean): any {
            return data.isDeferred ? createDeferredProperty() : createRegularProperty();

            function emptyValue(value: any, len: number, ver: number): number {
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

            function getArgs(args: Propjet.IVersionObject[], caller?: Propjet.IFunctionCaller): boolean {
                if (!data.src) {
                    return false;
                }

                // check requirements' changes
                var same = data.vals && data.vals.length === data.src.length;
                var ignoreOldValues = !same;

                forEach(data.src, (source, i) => {
                    var old = ignoreOldValues ? <Propjet.ISourceValue>undef : data.vals[i];
                    var arg: Propjet.IVersionObject;
                    if (caller) {
                        arg = caller(source, [old != null ? old.val : undef]);
                    }
                    else {
                        arg = source.call(object, old != null ? old.val : undef);
                    }
                    args[i] = arg;
                    if (same) {
                        var oldEmpty = emptyValue(old.val, old.len, old.ver);
                        var newEmpty = emptyValue(arg, arg && arg.length, arg && getVersion(arg));
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

            function saveArgs(args: Propjet.IVersionObject[]) {
                var sourceValues: Propjet.ISourceValue[] = [];
                forEach(args, (arg, i) => {
                    sourceValues[i] = {
                        val: arg,
                        ver: arg != null ? getVersion(arg) : undef,
                        len: arg != null ? arg.length : undef
                    };
                });
                data.vals = sourceValues;
            }

            function createRegularProperty(): any {
                if (functionMode) {
                    function func(value: T) {
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
                    throwError(Propjet.Error.noPropertySupport);
                }

                defProperty(object, propertyName, getter, setter);

                function filter(value: T): T {
                    if (data.fltr) {
                        return data.fltr.call(object, value, data.res);
                    }
                    return value;
                }

                function getter(): T {
                    var oldLevel = data.lvl;
                    if (oldLevel > 0) {
                        if (oldLevel === nestingLevel) {
                            return data.res;
                        }
                        throwError(Propjet.Error.circularDependency);
                    }

                    nestingLevel++;
                    try {
                        data.lvl = nestingLevel;

                        var args: Propjet.IVersionObject[] = [];
                        var same = getArgs(args);

                        // property without getter
                        if (!data.get) {
                            // has initializer
                            if (data.init) {
                                // has requirements - reinitialize on change
                                if (!data.src || !same) {
                                    data.res = data.init.call(object);
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

                function setter(value: T) {
                    if (data.lvl) {
                        throwError(Propjet.Error.recursivePropertyWrite);
                    }

                    nestingLevel++;
                    try {
                        data.lvl = -1;

                        // override property
                        if (isUnreadyProperty(<any>value)) {
                            data = <any>value;
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
                                var args: Propjet.IVersionObject[] = [];
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

            function createDeferredProperty(): any {
                var promise: Propjet.IPromise<T>;
                var deferred = <Propjet.IDeferred<T, Propjet.IPromise<T>>>{};
                var isInCallback: boolean;
                var readonlyProxy: Propjet.IDeferred<T, Propjet.IPromise<T>>;

                deferred.get = (forceUpdate?: boolean) => {
                    if (forceUpdate && !deferred.pending) {
                        checkUpdate(forceUpdate);
                    }
                    return promise;
                };

                function filter(value: T): T {
                    if (data.fltr) {
                        return wrapCall(data.fltr, [value, deferred.last]);
                    }
                    return value;
                }

                function defReadonlyProperty(propertyName: string) {
                    defProperty(readonlyProxy, propertyName, () => deferred[propertyName], throwReadonlyError);
                }

                deferred.set = (newValue: T, isDeferred?: boolean) => {
                    if (!data.set) {
                        throwReadonlyError();
                    }

                    newValue = filter(newValue);

                    incrementVersion(<any>readonlyProxy || deferred);
                    var args = [];
                    getArgs(args, wrapCall);
                    saveArgs(args);
                    args.unshift(newValue);

                    var promise = <Propjet.IPromise<T>>wrapCall(data.set, args);
                    if (!isDeferred) {
                        deferred.last = newValue;
                    }
                    waitPromise(promise);
                    return promise;
                };

                setValue(undef, Propjet.SetMode.reset);

                if (functionMode) {
                    var func = () => {
                        checkUpdate();
                        return deferred;
                    };
                    if (propertyName) {
                        object[propertyName] = func;
                    }
                    return func;
                }

                if (noProperties) {
                    throwError(Propjet.Error.noPropertySupport);
                }

                // create readonly property
                readonlyProxy = <Propjet.IDeferred<T, Propjet.IPromise<T>>>{};
                for (var prop in deferred) {
                    defReadonlyProperty(prop);
                }
                defProperty(object, propertyName,
                    () => {
                        checkUpdate();
                        return readonlyProxy;
                    },
                    (newData: Propjet.IPropData<T>) => {
                        // override property
                        if (isUnreadyProperty(newData)) {
                            data = newData;
                            setValue(undef, Propjet.SetMode.reset);
                        }
                        else {
                            throwReadonlyError();
                        }
                    });

                function wrapCall(func: (arg?: any) => any, args?: any[]): any {
                    if (isInCallback) {
                        throwError(Propjet.Error.circularPromises);
                    }
                    isInCallback = true;
                    try {
                        return func.apply(object, args || []);
                    }
                    finally {
                        isInCallback = false;
                    }
                }

                function setStatus(newStatus: Propjet.DeferredStatus) {
                    deferred.pending = !newStatus;
                    deferred.fulfilled = newStatus === Propjet.DeferredStatus.fulfilled;
                    deferred.rejected = newStatus === Propjet.DeferredStatus.rejected;
                    deferred.settled = !!newStatus;
                }

                function setValue(value: any, mode: Propjet.SetMode) {
                    incrementVersion(<any>readonlyProxy || deferred);
                    var notRejection = mode !== Propjet.SetMode.rejection;
                    if (notRejection) {
                        if (!mode) {
                            value = filter(value);
                        }
                        deferred.last = value;
                    }
                    deferred.rejectReason = notRejection ? undef : value;
                    setStatus(notRejection ? Propjet.DeferredStatus.fulfilled : Propjet.DeferredStatus.rejected);
                }

                function waitPromise(promise: Propjet.IPromise<T>) {
                    var version = incrementVersion(<any>data);

                    if (!promise) {
                        setValue(undef, Propjet.SetMode.normal);
                        return;
                    }

                    promise.then(
                        value => {
                            // ignore callbacks if newer promise is active
                            if (getVersion(<any>data) === version) {
                                setValue(value, Propjet.SetMode.normal);
                            }
                        },
                        reason => {
                            // ignore callbacks if newer promise is active
                            if (getVersion(<any>data) === version) {
                                setValue(reason, Propjet.SetMode.rejection);
                            }
                        });
                }

                function checkUpdate(forceUpdate?: boolean) {

                    if (!isInCallback) {

                        var args: Propjet.IVersionObject[] = [];
                        var same = getArgs(args, wrapCall);

                        if (!same) {
                            forceUpdate = true;
                            if (data.init) {
                                deferred.last = wrapCall(data.init);
                            }
                        }

                        if (forceUpdate) {
                            incrementVersion(<any>readonlyProxy || deferred);
                            saveArgs(args);
                            promise = wrapCall(data.get, args);
                            setStatus(Propjet.DeferredStatus.pending);
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