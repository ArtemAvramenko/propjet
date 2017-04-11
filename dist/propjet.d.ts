/*!
 propjet.js v1.3.4
 (c) 2015 Artem Avramenko. https://github.com/ArtemAvramenko/propjet.js
 License: MIT
*/
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

    export interface IPropertyBuilder<T> extends
        IRequire<T>, IGetOrDefault<T>, ISet<T>, IWith<T> {
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
            a: (oldIn?: TIn1) => TIn1): IGetOrDefault1<T, TIn1>;
        /**
         * Specifies two data sources.
         */
        require<TIn1, TIn2>(
            a: (oldIn?: TIn1) => TIn1,
            b: (oldIn?: TIn2) => TIn2): IGetOrDefault2<T, TIn1, TIn2>;
        /**
         * Specifies three data sources.
         */
        require<TIn1, TIn2, TIn3>(
            a: (oldIn?: TIn1) => TIn1,
            b: (oldIn?: TIn2) => TIn2,
            c: (oldIn?: TIn3) => TIn3): IGetOrDefault3<T, TIn1, TIn2, TIn3>;
        /**
         * Specifies four or more data sources.
         */
        require<TIn1, TIn2, TIn3, TIn4>(
            a: (oldIn?: TIn1) => TIn1,
            b: (oldIn?: TIn2) => TIn2,
            c: (oldIn?: TIn3) => TIn3,
            ...d: ((oldIn?: TIn4) => TIn4)[]): IGetOrDefault4<T, TIn1, TIn2, TIn3, TIn4>;
    }

    export interface IGetOrDefault<T> {
        /**
         * Specifies property getter.
         */
        get(getter: () => T): IDeclareOrSetOrWith<T>;
        /**
         * Specifies default value.
         */
        default(initialValue: () => T): IDeclareOrSetOrWith<T>;
        /**
         * Just alias for 'default'. Works in outdated browsers without ES5 support (IE8 and below).
         */
        defaults(initialValue: () => T): IDeclareOrSetOrWith<T>;
    }

    export interface IGetOrDefault1<T, TIn1> {
        /**
         * Specifies property getter.
         */
        get(getter: (a: TIn1) => T): IDeclareOrSetOrWith<T>;
        /**
         * Specifies default value.
         */
        default(initialValue: (a: TIn1) => T): IDeclareOrSetOrWith<T>;
        /**
         * Just alias for 'default'. Works in outdated browsers without ES5 support (IE8 and below).
         */
        defaults(initialValue: (a: TIn1) => T): IDeclareOrSetOrWith<T>;
    }

    export interface IGetOrDefault2<T, TIn1, TIn2> {
        /**
         * Specifies property getter.
         */
        get(getter: (a: TIn1, b: TIn2) => T): IDeclareOrSetOrWith<T>;
        /**
         * Specifies default value.
         */
        default(initialValue: (a: TIn1, b: TIn2) => T): IDeclareOrSetOrWith<T>;
        /**
         * Just alias for 'default'. Works in outdated browsers without ES5 support (IE8 and below).
         */
        defaults(initialValue: (a: TIn1, b: TIn2) => T): IDeclareOrSetOrWith<T>;
    }

    export interface IGetOrDefault3<T, TIn1, TIn2, TIn3> {
        /**
         * Specifies property getter.
         */
        get(getter: (a: TIn1, b: TIn2, c: TIn3) => T): IDeclareOrSetOrWith<T>;
        /**
         * Specifies default value.
         */
        default(initialValue: (a: TIn1, b: TIn2, c: TIn3) => T): IDeclareOrSetOrWith<T>;
        /**
         * Just alias for 'default'. Works in outdated browsers without ES5 support (IE8 and below).
         */
        defaults(initialValue: (a: TIn1, b: TIn2, c: TIn3) => T): IDeclareOrSetOrWith<T>;
    }

    export interface IGetOrDefault4<T, TIn1, TIn2, TIn3, TIn4> {
        /**
         * Specifies property getter.
         */
        get(getter: (a: TIn1, b: TIn2, c: TIn3, ...d: TIn4[]) => T): IDeclareOrSetOrWith<T>;
        /**
         * Specifies default value.
         */
        default(initialValue: (a: TIn1, b: TIn2, c: TIn3, ...d: TIn4[]) => T): IDeclareOrSetOrWith<T>;
        /**
         * Just alias for 'default'. Works in outdated browsers without ES5 support (IE8 and below).
         */
        defaults(initialValue: (a: TIn1, b: TIn2, c: TIn3, ...d: TIn4[]) => T): IDeclareOrSetOrWith<T>;
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

    export interface IDeclareOrSet<T> extends
        IDeclare<T>, ISet<T> { }

    export interface IDeclareOrSetOrWith<T> extends
        IDeclare<T>, ISet<T>, IWith<T> { }

    export interface IDeferredRequire<T, TPromise> {
        /**
         * Specifies that no data source is required. It is useful for lazy initialization.
         */
        require(): IDeferredGetOrDefault<T, TPromise>;
        /**
         * Specifies one data source.
         */
        require<TIn1>(
            a: (oldIn?: TIn1) => TIn1): IDeferredGetOrDefault1<T, TPromise, TIn1>;
        /**
         * Specifies two data sources.
         */
        require<TIn1, TIn2>(
            a: (oldIn?: TIn1) => TIn1,
            b: (oldIn?: TIn2) => TIn2): IDeferredGetOrDefault2<T, TPromise, TIn1, TIn2>;
        /**
         * Specifies three data sources.
         */
        require<TIn1, TIn2, TIn3>(
            a: (oldIn?: TIn1) => TIn1,
            b: (oldIn?: TIn2) => TIn2,
            c: (oldIn?: TIn3) => TIn3): IDeferredGetOrDefault3<T, TPromise, TIn1, TIn2, TIn3>;
        /**
         * Specifies four or more data sources.
         */
        require<TIn1, TIn2, TIn3, TIn4>(
            a: (oldIn?: TIn1) => TIn1,
            b: (oldIn?: TIn2) => TIn2,
            c: (oldIn?: TIn3) => TIn3,
            ...d: ((oldIn?: TIn4) => TIn4)[]): IDeferredGetOrDefault4<T, TPromise, TIn1, TIn2, TIn3, TIn4>;
    }

    export interface IDeferredGetOrDefault<T, TPromise> extends
        IDeferredGet<T, TPromise> {
        /**
         * Specifies default value.
         */
        default(initialValue: () => T): IDeferredGet<T, TPromise>;
        /**
         * Just alias for 'default'. Works in outdated browsers without ES5 support (IE8 and below).
         */
        defaults(initialValue: () => T): IDeferredGet<T, TPromise>;
    }

    export interface IDeferredGetOrDefault1<T, TPromise, TIn1> extends
        IDeferredGet1<T, TPromise, TIn1> {
        /**
         * Specifies default value.
         */
        default(initialValue: (a: TIn1) => T): IDeferredGet1<T, TPromise, TIn1>;
        /**
         * Just alias for 'default'. Works in outdated browsers without ES5 support (IE8 and below).
         */
        defaults(initialValue: (a: TIn1) => T): IDeferredGet1<T, TPromise, TIn1>;
    }

    export interface IDeferredGetOrDefault2<T, TPromise, TIn1, TIn2> extends
        IDeferredGet2<T, TPromise, TIn1, TIn2> {
        /**
         * Specifies default value.
         */
        default(initialValue: (a: TIn1, b: TIn2) => T): IDeferredGet2<T, TPromise, TIn1, TIn2>;
        /**
         * Just alias for 'default'. Works in outdated browsers without ES5 support (IE8 and below).
         */
        defaults(initialValue: (a: TIn1, b: TIn2) => T): IDeferredGet2<T, TPromise, TIn1, TIn2>;
    }

    export interface IDeferredGetOrDefault3<T, TPromise, TIn1, TIn2, TIn3> extends
        IDeferredGet3<T, TPromise, TIn1, TIn2, TIn3> {
        /**
         * Specifies default value.
         */
        default(initialValue: (a: TIn1, b: TIn2, c: TIn3) => T): IDeferredGet3<T, TPromise, TIn1, TIn2, TIn3>;
        /**
         * Just alias for 'default'. Works in outdated browsers without ES5 support (IE8 and below).
         */
        defaults(initialValue: (a: TIn1, b: TIn2, c: TIn3) => T): IDeferredGet3<T, TPromise, TIn1, TIn2, TIn3>;
    }

    export interface IDeferredGetOrDefault4<T, TPromise, TIn1, TIn2, TIn3, TIn4> extends
        IDeferredGet4<T, TPromise, TIn1, TIn2, TIn3, TIn4> {
        /**
         * Specifies default value.
         */
        default(initialValue: (a: TIn1, b: TIn2, c: TIn3, ...d: TIn4[]) => T): IDeferredGet4<T, TPromise, TIn1, TIn2, TIn3, TIn4>;
        /**
         * Just alias for 'default'. Works in outdated browsers without ES5 support (IE8 and below).
         */
        defaults(initialValue: (a: TIn1, b: TIn2, c: TIn3, ...d: TIn4[]) => T): IDeferredGet4<T, TPromise, TIn1, TIn2, TIn3, TIn4>;
    }

    export interface IDeferredGet<T, TPromise> {
        /**
         * Specifies function that returns getter promise.
         */
        get(getter: () => TPromise):
            IDeferredWithOrSetOrDeclare<T, TPromise>;
    }

    export interface IDeferredGet1<T, TPromise, TIn1> {
        /**
         * Specifies function that returns getter promise.
         */
        get(getter: (a: TIn1) => TPromise):
            IDeferredWithOrSetOrDeclare1<T, TPromise, TIn1>;
    }

    export interface IDeferredGet2<T, TPromise, TIn1, TIn2> {
        /**
         * Specifies function that returns getter promise.
         */
        get(getter: (a: TIn1, b: TIn2) => TPromise):
            IDeferredWithOrSetOrDeclare2<T, TPromise, TIn1, TIn2>;
    }

    export interface IDeferredGet3<T, TPromise, TIn1, TIn2, TIn3> {
        /**
         * Specifies function that returns getter promise.
         */
        get(getter: (a: TIn1, b: TIn2, c: TIn3) => TPromise):
            IDeferredWithOrSetOrDeclare3<T, TPromise, TIn1, TIn2, TIn3>;
    }

    export interface IDeferredGet4<T, TPromise, TIn1, TIn2, TIn3, TIn4> {
        /**
         * Specifies function that returns getter promise.
         */
        get(getter: (a: TIn1, b: TIn2, c: TIn3, ...d: TIn4[]) => TPromise):
            IDeferredWithOrSetOrDeclare4<T, TPromise, TIn1, TIn2, TIn3, TIn4>;
    }

    export interface IDeferredRequireOrGet<T, TPromise> extends
        IDeferredRequire<T, TPromise>, IDeferredGet<T, TPromise> { }

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

    export interface IDeferredWith<T, TPromise> {
        /**
         * Specifies filter that applied to both getter and setter.
         */
        with(filter: (newValue: T, oldValue?: T) => T): IDeferredSetOrDeclare<T, TPromise>;
        /**
         * Just alias for 'with'. Works in outdated browsers without ES5 support (IE8 and below).
         */
        withal(filter: (newValue: T, oldValue?: T) => T): IDeferredSetOrDeclare<T, TPromise>;
    }

    export interface IDeferredWith1<T, TPromise, TIn1> {
        /**
         * Specifies filter that applied to both getter and setter.
         */
        with(filter: (newValue: T, oldValue?: T) => T): IDeferredSetOrDeclare1<T, TPromise, TIn1>;
        /**
         * Just alias for 'with'. Works in outdated browsers without ES5 support (IE8 and below).
         */
        withal(filter: (newValue: T, oldValue?: T) => T): IDeferredSetOrDeclare1<T, TPromise, TIn1>;
    }

    export interface IDeferredWith2<T, TPromise, TIn1, TIn2> {
        /**
         * Specifies filter that applied to both getter and setter.
         */
        with(filter: (newValue: T, oldValue?: T) => T): IDeferredSetOrDeclare2<T, TPromise, TIn1, TIn2>;
        /**
         * Just alias for 'with'. Works in outdated browsers without ES5 support (IE8 and below).
         */
        withal(filter: (newValue: T, oldValue?: T) => T): IDeferredSetOrDeclare2<T, TPromise, TIn1, TIn2>;
    }

    export interface IDeferredWith3<T, TPromise, TIn1, TIn2, TIn3> {
        /**
         * Specifies filter that applied to both getter and setter.
         */
        with(filter: (newValue: T, oldValue?: T) => T): IDeferredSetOrDeclare3<T, TPromise, TIn1, TIn2, TIn3>;
        /**
         * Just alias for 'with'. Works in outdated browsers without ES5 support (IE8 and below).
         */
        withal(filter: (newValue: T, oldValue?: T) => T): IDeferredSetOrDeclare3<T, TPromise, TIn1, TIn2, TIn3>;
    }

    export interface IDeferredWith4<T, TPromise, TIn1, TIn2, TIn3, TIn4> {
        /**
         * Specifies filter that applied to both getter and setter.
         */
        with(filter: (newValue: T, oldValue?: T) => T): IDeferredSetOrDeclare4<T, TPromise, TIn1, TIn2, TIn3, TIn4>;
        /**
         * Just alias for 'with'. Works in outdated browsers without ES5 support (IE8 and below).
         */
        withal(filter: (newValue: T, oldValue?: T) => T): IDeferredSetOrDeclare4<T, TPromise, TIn1, TIn2, TIn3, TIn4>;
    }

    export interface IDeferredWithOrSetOrDeclare<T, TPromise> extends
        IDeferredWith<T, TPromise>,
        IDeferredSetOrDeclare<T, TPromise> { }

    export interface IDeferredWithOrSetOrDeclare1<T, TPromise, TIn1> extends
        IDeferredWith1<T, TPromise, TIn1>,
        IDeferredSetOrDeclare1<T, TPromise, TIn1> { }

    export interface IDeferredWithOrSetOrDeclare2<T, TPromise, TIn1, TIn2> extends
        IDeferredWith2<T, TPromise, TIn1, TIn2>,
        IDeferredSetOrDeclare2<T, TPromise, TIn1, TIn2> { }

    export interface IDeferredWithOrSetOrDeclare3<T, TPromise, TIn1, TIn2, TIn3> extends
        IDeferredWith3<T, TPromise, TIn1, TIn2, TIn3>,
        IDeferredSetOrDeclare3<T, TPromise, TIn1, TIn2, TIn3> { }

    export interface IDeferredWithOrSetOrDeclare4<T, TPromise, TIn1, TIn2, TIn3, TIn4> extends
        IDeferredWith4<T, TPromise, TIn1, TIn2, TIn3, TIn4>,
        IDeferredSetOrDeclare4<T, TPromise, TIn1, TIn2, TIn3, TIn4> { }

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
        then(resolve: (value: T) => any, reject?: (reason?: any) => any): any;
    }
}

/* tslint:disable */
declare var propjet: Propjet.IPropjet;