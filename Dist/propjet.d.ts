/*
 propjet.js 0.3
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
        <T>(): Propjet.IRequireDefaultGetOperator<T>;
        /**
         * Initializes all declared properties in specified object.
         */
        <TObject>(object: TObject): void;
        /**
         * Declares property and initializes it in specified object.
         */
        <T>(object: Object, propertyName: string): Propjet.IRequireDefaultGetOperator<T>;
        /**
         * Invalidates the object value so all dependent properties will be updated.
         */
        invalidate<T>(value: T): void;
    }

    export interface IRequireOperator<T>
    {
        require(): IGetOperator<T>;
        require<TIn1>(
            a: (oldIn?: TIn1) => TIn1): IGetOperator1<T, TIn1>;
        require<TIn1, TIn2>(
            a: (oldIn?: TIn1) => TIn1,
            b: (oldIn?: TIn2) => TIn2): IGetOperator2<T, TIn1, TIn2>;
        require<TIn1, TIn2, TIn3>(
            a: (oldIn?: TIn1) => TIn1,
            b: (oldIn?: TIn2) => TIn2,
            c: (oldIn?: TIn3) => TIn3): IGetOperator3<T, TIn1, TIn2, TIn3>;
        require<TIn1, TIn2, TIn3, TIn4>(
            a: (oldIn?: TIn1) => TIn1,
            b: (oldIn?: TIn2) => TIn2,
            c: (oldIn?: TIn3) => TIn3,
            ...d: ((oldIn?: TIn4) => TIn4)[]): IGetOperator4<T, TIn1, TIn2, TIn3, TIn4>;
    }

    export interface IGetOperator<T>
    {
        get(getter: () => T): IDeclareSetWithOperator<T>;
    }

    export interface IGetOperator1<T, TIn1>
    {
        get(getter: (a: TIn1) => T): IDeclareSetWithOperator<T>;
    }

    export interface IGetOperator2<T, TIn1, TIn2>
    {
        get(getter: (a: TIn1, b: TIn2) => T): IDeclareSetWithOperator<T>;
    }

    export interface IGetOperator3<T, TIn1, TIn2, TIn3>
    {
        get(getter: (a: TIn1, b: TIn2, c: TIn3) => T): IDeclareSetWithOperator<T>;
    }

    export interface IGetOperator4<T, TIn1, TIn2, TIn3, TIn4>
    {
        get(getter: (a: TIn1, b: TIn2, c: TIn3, ...d: TIn4[]) => T): IDeclareSetWithOperator<T>;
    }

    export interface IDefaultOperator<T>
    {
        default(initialValue: () => T): IDeclareSetWithOperator<T>;
    }

    export interface IDeclareOperator<T>
    {
        declare(): T;
    }

    export interface ISetOperator<T>
    {
        set(setter: (newValue: T, oldValue?: T) => void): IDeclareOperator<T>;
    }

    export interface IWithOperator<T>
    {
        with(filter: (newValue: T, oldValue?: T) => T): IDeclareSetOperator<T>;
    }

    export interface IRequireDefaultGetOperator<T>
        extends IRequireOperator<T>, IDefaultOperator<T>, IGetOperator<T>
    { }

    export interface IDeclareSetOperator<T>
        extends IDeclareOperator<T>, ISetOperator<T>
    { }

    export interface IDeclareSetWithOperator<T>
        extends IDeclareOperator<T>, ISetOperator<T>, IWithOperator<T>
    { }
}

/* tslint:disable */
declare var propjet: Propjet.IPropjet;