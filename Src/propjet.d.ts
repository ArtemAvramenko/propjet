declare module Propjet {
    export interface IPropjet {
        /**
         * Declares uninitialized property.
         */
        <T>(): Propjet.IPropertyBuilder<T>;
        /**
         * Initializes all declared properties in specified object.
         */
        <TObject>(object: TObject): void;
        /**
         * Declares property and initializes it in specified object.
         */
        <T>(object: Object, propertyName: string): Propjet.IPropertyBuilder<T>;
        /**
         * Invalidates the object value so all dependent properties will be updated.
         */
        invalidate<T>(value: T): void;
    }

    export interface IDeferred<T, TPromise> {
        /**
         * Initial state (not fulfilled or rejected).
         */
        pending: boolean;
        /**
         * Successful operation.
         */
        fulfilled: boolean;
        /**
         * Failed operation.
         */
        rejected: boolean;
        /**
         * Completed (fulfilled or rejected).
         */
        settled: boolean;
        /**
         * Value from last fulfilled state.
         */
        last: T;
        /**
         * Rejection from last rejected state.
         */
        rejectReason: any;
        /**
         * Returns a promise that triggered when state is settled.
         * @param forceUpdate - forces pending of new value.
         */
        get(forceUpdate?: boolean): TPromise;
        /**
         * Returns a promise that triggered when new value is saved or rejected.
         * @param newValue - new value.
         * @param deferred - specifies that last value should be set only after successful save.
         */
        set(newValue: T, deferred?: boolean): TPromise;
    }

    export interface IPropertyBuilder<T>
        extends IRequire<T>, IDefault<T>, IGetOrDefault<T>, ISet<T>, IWith<T> {
        /**
         * Marks that property returns deferred object.
         * @see IDeferred
         */
        from<TPromise extends IPromise<T>>(): IDeferredRequireOrGet<T, TPromise>;
    }

    export interface IRequire<T> {
        /**
         * Specifies that no data source is required. It is useful for lazy initialization.
         */
        require(): IGetOrDefault<T>;
        /**
         * Specifies one data source.
         */
        require<TIn1>(
            a: (oldIn?: TIn1) => TIn1): IGet1OrDefault<T, TIn1>;
        /**
         * Specifies two data sources.
         */
        require<TIn1, TIn2>(
            a: (oldIn?: TIn1) => TIn1,
            b: (oldIn?: TIn2) => TIn2): IGet2OrDefault<T, TIn1, TIn2>;
        /**
         * Specifies three data sources.
         */
        require<TIn1, TIn2, TIn3>(
            a: (oldIn?: TIn1) => TIn1,
            b: (oldIn?: TIn2) => TIn2,
            c: (oldIn?: TIn3) => TIn3): IGet3OrDefault<T, TIn1, TIn2, TIn3>;
        /**
         * Specifies four or more data sources.
         */
        require<TIn1, TIn2, TIn3, TIn4>(
            a: (oldIn?: TIn1) => TIn1,
            b: (oldIn?: TIn2) => TIn2,
            c: (oldIn?: TIn3) => TIn3,
            ...d: ((oldIn?: TIn4) => TIn4)[]): IGet4OrDefault<T, TIn1, TIn2, TIn3, TIn4>;
    }

    export interface IGetOrDefault<T> extends IDefault<T> {
        /**
         * Specifies property getter.
         */
        get(getter: () => T): IDeclareOrSetOrWith<T>;
    }

    export interface IGet1OrDefault<T, TIn1> extends IDefault<T> {
        /**
         * Specifies property getter.
         */
        get(getter: (a: TIn1) => T): IDeclareOrSetOrWith<T>;
    }

    export interface IGet2OrDefault<T, TIn1, TIn2> extends IDefault<T> {
        /**
         * Specifies property getter.
         */
        get(getter: (a: TIn1, b: TIn2) => T): IDeclareOrSetOrWith<T>;
    }

    export interface IGet3OrDefault<T, TIn1, TIn2, TIn3> extends IDefault<T> {
        /**
         * Specifies property getter.
         */
        get(getter: (a: TIn1, b: TIn2, c: TIn3) => T): IDeclareOrSetOrWith<T>;
    }

    export interface IGet4OrDefault<T, TIn1, TIn2, TIn3, TIn4> extends IDefault<T> {
        /**
         * Specifies property getter.
         */
        get(getter: (a: TIn1, b: TIn2, c: TIn3, ...d: TIn4[]) => T): IDeclareOrSetOrWith<T>;
    }

    export interface IDefault<T> {
        /**
         * Specifies default value.
         */
        default(initialValue: () => T): IDeclareOrSetOrWith<T>;
        /**
         * Just alias for 'default'. Works in outdated browsers without ES5 support (IE8 and below).
         */
        defaults(initialValue: () => T): IDeclareOrSetOrWith<T>;
    }

    export interface IDeclare<T> {
        /**
         * Declares the property. Works only in browsers with ES5 support (IE9+).
         */
        declare(): T;
        /**
         * Creates get/set function. Works in outdated browsers without ES5 support (IE8 and below).
         */
        declare(functionMode: any): IGetSetFunc<T>;
    }

    export interface IGetSetFunc<T> {
        /**
         * Gets the value.
         */
        (): T;
        /**
         * Sets the value.
         */
        (value: T): void;
    }

    export interface ISet<T> {
        /**
         * Specifies property setter.
         */
        set(setter: (value: T) => void): IDeclare<T>;
    }

    export interface IWith<T> {
        /**
         * Specifies filter that applied to both getter and setter.
         */
        with(filter: (newValue: T, oldValue?: T) => T): IDeclareOrSet<T>;
        /**
         * Just alias for 'with'. Works in outdated browsers without ES5 support (IE8 and below).
         */
        withal(filter: (newValue: T, oldValue?: T) => T): IDeclareOrSet<T>;
    }

    export interface IDeclareOrSet<T>
        extends IDeclare<T>, ISet<T>
    { }

    export interface IDeclareOrSetOrWith<T>
        extends IDeclare<T>, ISet<T>, IWith<T>
    { }

    export interface IDeferredRequire<T, TPromise> {
        /**
         * Specifies that no data source is required. It is useful for lazy initialization.
         */
        require(): IDeferredGet<T, TPromise>;
        /**
         * Specifies one data source.
         */
        require<TIn1>(
            a: (oldIn?: TIn1) => TIn1): IDeferredGet1<T, TPromise, TIn1>;
        /**
         * Specifies two data sources.
         */
        require<TIn1, TIn2>(
            a: (oldIn?: TIn1) => TIn1,
            b: (oldIn?: TIn2) => TIn2): IDeferredGet2<T, TPromise, TIn1, TIn2>;
        /**
         * Specifies three data sources.
         */
        require<TIn1, TIn2, TIn3>(
            a: (oldIn?: TIn1) => TIn1,
            b: (oldIn?: TIn2) => TIn2,
            c: (oldIn?: TIn3) => TIn3): IDeferredGet3<T, TPromise, TIn1, TIn2, TIn3>;
        /**
         * Specifies four or more data sources.
         */
        require<TIn1, TIn2, TIn3, TIn4>(
            a: (oldIn?: TIn1) => TIn1,
            b: (oldIn?: TIn2) => TIn2,
            c: (oldIn?: TIn3) => TIn3,
            ...d: ((oldIn?: TIn4) => TIn4)[]): IDeferredGet4<T, TPromise, TIn1, TIn2, TIn3, TIn4>;
    }

    export interface IDeferredGet<T, TPromise> {
        /**
         * Specifies function that returns getter promise.
         */
        get(getter: () => TPromise): IDeferredSetOrDeclare<T, TPromise>;
    }

    export interface IDeferredGet1<T, TPromise, TIn1> {
        /**
         * Specifies function that returns getter promise.
         */
        get(getter: (a: TIn1) => TPromise): IDeferredSetOrDeclare1<T, TPromise, TIn1>;
    }

    export interface IDeferredGet2<T, TPromise, TIn1, TIn2> {
        /**
         * Specifies function that returns getter promise.
         */
        get(getter: (a: TIn1, b: TIn2) => TPromise): IDeferredSetOrDeclare2<T, TPromise, TIn1, TIn2>;
    }

    export interface IDeferredGet3<T, TPromise, TIn1, TIn2, TIn3> {
        /**
         * Specifies function that returns getter promise.
         */
        get(getter: (a: TIn1, b: TIn2, c: TIn3) => TPromise): IDeferredSetOrDeclare3<T, TPromise, TIn1, TIn2, TIn3>;
    }

    export interface IDeferredGet4<T, TPromise, TIn1, TIn2, TIn3, TIn4> {
        /**
         * Specifies function that returns getter promise.
         */
        get(getter: (a: TIn1, b: TIn2, c: TIn3, ...d: TIn4[]) => TPromise): IDeferredSetOrDeclare4<T, TPromise, TIn1, TIn2, TIn3, TIn4>;
    }

    export interface IDeferredRequireOrGet<T, TPromise>
        extends IDeferredRequire<T, TPromise>, IDeferredGet<T, TPromise>
    { }

    export interface IDeferredSetOrDeclare<T, TPromise> extends IDeferredDeclare<T, TPromise> {
        /**
         * Specifies function that returns setter promise.
         */
        set(setter: (value: T) => TPromise): IDeferredDeclare<T, TPromise>;
    }

    export interface IDeferredSetOrDeclare1<T, TPromise, TIn1> extends IDeferredDeclare<T, TPromise> {
        /**
         * Specifies function that returns setter promise.
         */
        set(setter: (value: T, a: TIn1) => TPromise): IDeferredDeclare<T, TPromise>;
    }

    export interface IDeferredSetOrDeclare2<T, TPromise, TIn1, TIn2> extends IDeferredDeclare<T, TPromise> {
        /**
         * Specifies function that returns setter promise.
         */
        set(setter: (value: T, a: TIn1, b: TIn2) => TPromise): IDeferredDeclare<T, TPromise>;
    }

    export interface IDeferredSetOrDeclare3<T, TPromise, TIn1, TIn2, TIn3> extends IDeferredDeclare<T, TPromise> {
        /**
         * Specifies function that returns setter promise.
         */
        set(setter: (value: T, a: TIn1, b: TIn2, c: TIn3) => TPromise): IDeferredDeclare<T, TPromise>;
    }

    export interface IDeferredSetOrDeclare4<T, TPromise, TIn1, TIn2, TIn3, TIn4> extends IDeferredDeclare<T, TPromise> {
        /**
         * Specifies function that returns setter promise.
         */
        set(setter: (value: T, a: TIn1, b: TIn2, c: TIn3, ...d: TIn4[]) => TPromise): IDeferredDeclare<T, TPromise>;
    }

    export interface IDeferredDeclare<T, TPromise> {
        /**
         * Declares the property that returns deferred object. Works only in browsers with ES5 support (IE9+).
         * @see IDeferred
         */
        declare(): IDeferred<T, TPromise>;
        /**
         * Creates get function that returns deferred object. Works in outdated browsers without ES5 support (IE8 and below).
         * @see IDeferred
         */
        declare(functionMode: any): () => IDeferred<T, TPromise>;
    }

    export interface IPromise<T> {
        then<TResult>(callback: (value: T) => any): any;
        catch<TResult>(callback: (reason: any) => any): any;
    }
}

/* tslint:disable */
declare var propjet: Propjet.IPropjet;