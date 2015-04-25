/*
 propjet.js 0.8
 (c) 2015 Artem Avramenko. https://github.com/ArtemAvramenko/propjet.js
 License: MIT
*/
declare module Propjet
{
    export interface IPropjet
    {
        /**
         * Declares uninitialized property.
         */
        <T>(): Propjet.IRequireOrDefaultOrGetOrSetOrWith<T>;
        /**
         * Initializes all declared properties in specified object.
         */
        <TObject>(object: TObject): void;
        /**
         * Declares property and initializes it in specified object.
         */
        <T>(object: Object, propertyName: string): Propjet.IRequireOrDefaultOrGetOrSetOrWith<T>;
        /**
         * Invalidates the object value so all dependent properties will be updated.
         */
        invalidate<T>(value: T): void;
    }

    export interface IRequire<T>
    {
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

    export interface IGetOrDefault<T> extends IDefault<T>
    {
        /**
         * Specifies property getter.
         */
        get(getter: () => T): IDeclareOrSetOrWith<T>;
    }

    export interface IGet1OrDefault<T, TIn1> extends IDefault<T>
    {
        /**
         * Specifies property getter.
         */
        get(getter: (a: TIn1) => T): IDeclareOrSetOrWith<T>;
    }

    export interface IGet2OrDefault<T, TIn1, TIn2> extends IDefault<T>
    {
        /**
         * Specifies property getter.
         */
        get(getter: (a: TIn1, b: TIn2) => T): IDeclareOrSetOrWith<T>;
    }

    export interface IGet3OrDefault<T, TIn1, TIn2, TIn3> extends IDefault<T>
    {
        /**
         * Specifies property getter.
         */
        get(getter: (a: TIn1, b: TIn2, c: TIn3) => T): IDeclareOrSetOrWith<T>;
    }

    export interface IGet4OrDefault<T, TIn1, TIn2, TIn3, TIn4> extends IDefault<T>
    {
        /**
         * Specifies property getter.
         */
        get(getter: (a: TIn1, b: TIn2, c: TIn3, ...d: TIn4[]) => T): IDeclareOrSetOrWith<T>;
    }

    export interface IDefault<T>
    {
        /**
         * Specifies default value.
         */
        default(initialValue: () => T): IDeclareOrWith<T>;
    }

    export interface IDeclare<T>
    {
        /**
         * Declares the property. Works only in browsers with ES5 support (IE9+).
         */
        declare(): T;
        /**
         * Creates get/set function. Works in outdated browsers without ES5 support (IE8 and below).
         */
        declare(functionMode: any): IGetSetFunc<T>;
    }

    export interface IGetSetFunc<T>
    {
        /**
         * Gets the value.
         */
        (): T;
        /**
         * Sets the value.
         */
        (value: T): void;
    }

    export interface ISet<T>
    {
        /**
         * Specifies property setter.
         */
        set(setter: (value: T) => void): IDeclare<T>;
    }

    export interface IWith<T>
    {
        /**
         * Specifies filter that applied to both getter and setter.
         */
        with(filter: (newValue: T, oldValue?: T) => T): IDeclareOrSet<T>;
        /**
         * Just alias for 'with'. Works in outdated browsers without ES5 support (IE8 and below).
         */
        withal(filter: (newValue: T, oldValue?: T) => T): IDeclareOrSet<T>;
    }

    export interface IRequireOrDefaultOrGetOrSetOrWith<T>
        extends IRequire<T>, IDefault<T>, IGetOrDefault<T>, ISet<T>, IWith<T>
    { }

    export interface IDeclareOrSet<T>
        extends IDeclare<T>, ISet<T>
    { }

    export interface IDeclareOrWith<T>
        extends IDeclare<T>, IWith<T>
    { }

    export interface IDeclareOrSetOrWith<T>
        extends IDeclare<T>, ISet<T>, IWith<T>
    { }
}

/* tslint:disable */
declare var propjet: Propjet.IPropjet;