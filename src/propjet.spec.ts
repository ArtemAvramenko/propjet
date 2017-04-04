class TestClass {

    constructor() {
        propjet(this);
    }

    callCount = 0;

    backingValue = 0;

    backingFunction: (value?: number, oldValue?: number) => number;

    backingObject: TestClass;

    simpleGet = propjet<number>()
        .get(() => this.backingValue)
        .declare();

    cacheGet = propjet<number>()
        .require(() => this.backingValue)
        .get(
        () => {
            this.callCount++;
            return this.backingValue;
        })
        .declare();

    fibonacciNumbers = propjet<number[]>()
        .require()
        .get(
        () => {
            this.callCount++;
            var a = [0, 1];
            for (var i = 0; i < 100; i++) {
                a.push(a[i] + a[i + 1]);
            }
            return a;
        })
        .declare();

    objectValue = propjet<number>()
        .require(() => this.backingObject)
        .get(nested => {
            this.callCount++;
            return nested ? nested.backingValue : NaN;
        })
        .declare();

    functionValue = propjet<number>()
        .require(() => this.backingFunction)
        .get(func => {
            this.callCount++;
            return func();
        })
        .set(x => this.backingFunction(x))
        .declare();

    array = propjet<number[]>()
        .default(() => [])
        .with(a => a || [])
        .declare();

    readonlyArray = propjet<number[]>()
        .get(() => this.readonlyArray || [])
        .declare();

    defaultOption = propjet<string>().
        default(() => 'on').
        declare();

    arrayLength = propjet<number>()
        .require(() => this.array)
        .get(a => {
            this.callCount++;
            return a.length;
        })
        .declare();

    filterValue = propjet<number>()
        .with((newValue, oldValue) => newValue || oldValue)
        .declare();

    setterOnly = propjet<number>()
        .default(() => 0)
        .set(value => this.backingFunction(value))
        .declare();

    initializableValue = propjet<number>()
        .require(() => this.backingValue)
        .default(() => 0)
        .declare();

    simple = propjet<number>()
        .default(() => 0)
        .declare();

    deferred = propjet<number>()
        .from<TestPromise<number>>()
        .get(() => (this.callCount++ , new TestPromise<number>()))
        .declare();

    deferredLast = propjet<number>()
        .require(() => this.deferred)
        .get(def => def.last)
        .declare()

    deferredStatus = propjet<string>()
        .require(() => this.deferred)
        .get(def => def.pending ? 'pending' : (def.rejected ? 'rejected' : 'fulfilled'))
        .declare()
}

class TestPromise<T>
{
    private _thenCallbacks: ((value: T) => void)[] = [];

    private _catchCallbacks: ((reason: any) => void)[] = [];

    then(resolve: (value: T) => void, reject?: (reason: any) => void) {
        this._thenCallbacks.push(resolve);
        if (reject) {
            this._catchCallbacks.push(reject);
        }
    }

    resolve(value: T) {
        while (this._thenCallbacks.length) {
            this._thenCallbacks.shift()(value);
        }
    }

    reject(reason: any) {
        while (this._catchCallbacks.length) {
            this._catchCallbacks.shift()(reason);
        }
    }
}

describe('Regular propjet property', () => {
    var obj: TestClass;

    beforeEach(() => {
        obj = new TestClass();
    });

    it('supports simple getters', () => {
        obj.backingValue = 1;
        expect(obj.simpleGet).toBe(1);
        obj.backingValue = 2;
        expect(obj.simpleGet).toBe(2);
    });

    it('supports lazy loading via empty requirements ', () => {
        expect(obj.callCount).toBe(0);
        expect(obj.fibonacciNumbers).toBe(obj.fibonacciNumbers);
        expect(obj.callCount).toBe(1);
    });

    it('expects explicit invalidation on complex requirement change', () => {
        obj.backingObject = new TestClass();
        obj.backingObject.backingValue = 1;
        expect(obj.objectValue).toBe(1);
        obj.backingObject.backingValue = 2;
        expect(obj.objectValue).toBe(1);
        propjet.invalidate(obj.backingObject);
        expect(obj.objectValue).toBe(2);
        obj.backingObject.backingValue = 3;
        propjet.invalidate(obj.backingObject);
        expect(obj.objectValue).toBe(3);
    });

    it('expects explicit invalidation on function requirement change', () => {
        var i = 1;
        obj.backingFunction = () => i;
        expect(obj.functionValue).toBe(1);
        i = 2;
        expect(obj.functionValue).toBe(1);
        propjet.invalidate(obj.backingFunction);
        expect(obj.functionValue).toBe(2);
    });

    it('does not need invalidation on requirement length change', () => {
        expect(obj.arrayLength).toBe(0);
        obj.array.push(0);
        expect(obj.arrayLength).toBe(1);
    });

    it('allows getting last read value in getter', () => {
        expect(obj.readonlyArray).toBe(obj.readonlyArray);
    });

    it('allows change default value', () => {
        expect(obj.defaultOption).toBe('on');
        obj.defaultOption = null;
        expect(obj.defaultOption).toBeNull();
    });

    it('filters written values', () => {
        expect(obj.filterValue).toBeUndefined();
        obj.filterValue = 1;
        expect(obj.filterValue).toBe(1);
        obj.filterValue = null;
        expect(obj.filterValue).toBe(1);
        obj.filterValue = 2;
        expect(obj.filterValue).toBe(2);
    });

    it('allows overriding', () => {
        var a = [];
        expect(obj.readonlyArray).toBeDefined();
        obj.readonlyArray = propjet<number[]>().default(() => []).declare();
        obj.readonlyArray = a;
        expect(obj.readonlyArray).toBe(a);
    });

    it('throws error on writing readonly property', () => {
        expect(() => obj.readonlyArray = []).toThrowError('Attempt to write readonly property');
    });

    it('throws error on circular dependency', () => {
        var v;
        propjet<number>(obj, 'x').get(() => obj.functionValue).declare();
        obj.backingFunction = () => (<any>obj).x;
        expect(() => v = obj.functionValue).toThrowError('Circular dependency detected');
    });

    it('throws error on recursive write', () => {
        obj.backingFunction = (x: number) => obj.functionValue = x;
        expect(() => obj.functionValue = 1).toThrowError('Recursive property write');
    });

    it('has alias for "with" method', () => {
        var p = propjet<any>();
        expect(p.with).toBeDefined();
        expect(p.with).toBe(p.withal);
    });

    it('has alias for "default" method', () => {
        var p = propjet<any>();
        expect(p.default).toBeDefined();
        expect(p.defaults).toBe(p.default);
    });

    it('treats NaN values as equal', () => {
        obj.backingValue = NaN;
        expect(obj.cacheGet).toBeNaN();
        expect(obj.callCount).toBe(1);
        obj.backingValue = 0 / 0;
        expect(obj.cacheGet).toBeNaN();
        expect(obj.callCount).toBe(1);
    });

    it('treats undefined and null as different values', () => {
        obj.backingValue = null;
        expect(obj.cacheGet).toBeNull();
        obj.backingValue = undefined;
        expect(obj.cacheGet).toBeUndefined();
    });

    it('treats empty arrays as equal', () => {
        obj.array = [];
        expect(obj.arrayLength).toBe(0);
        obj.array = [];
        expect(obj.arrayLength).toBe(0);
        expect(obj.callCount).toBe(1);
        propjet.invalidate(obj.array);
        expect(obj.arrayLength).toBe(0);
        expect(obj.callCount).toBe(2);
        obj.array = [1];
        expect(obj.arrayLength).toBe(1);
        expect(obj.callCount).toBe(3);
    });

    it('reinitializes on requirement change', () => {
        expect(obj.initializableValue).toBe(0);
        obj.initializableValue = 2;
        expect(obj.initializableValue).toBe(2);
        obj.backingValue = 1;
        expect(obj.initializableValue).toBe(0);
    });

    it('does not initialize after implicit setting', () => {
        obj.backingValue = 1;
        obj.initializableValue = 2;
        expect(obj.initializableValue).toBe(2);
        obj.backingValue = 2;
        expect(obj.initializableValue).toBe(0);
    });

    it('supports function mode', () => {
        var test = propjet<number>().default(() => 0).declare(true);
        expect(test()).toBe(0);
        test(1);
        expect(test()).toBe(1);
        test = propjet<number>(obj, 'test').default(() => 0).declare(true);
        expect(test).toBe((<any>obj).test);
        (<any>obj).test(1);
        expect((<any>obj).test()).toBe(1);
    });

    it('supports properties without getter', () => {
        var value: number;
        obj.backingFunction = newValue => value = newValue;
        expect(obj.setterOnly).toBe(0);
        obj.setterOnly = 1;
        expect(obj.setterOnly).toBe(1);
        expect(value).toBe(1);
    });

    it('supports read in setter when getter is not defined', () => {
        var lastValue: number;
        obj.backingFunction = value => {
            expect(obj.setterOnly).toBe(lastValue);
            lastValue = value;
            return undefined;
        };
        obj.setterOnly = 1;
        obj.setterOnly = 2;
    });

    it('supports read in setter when getter is defined', () => {
        var lastValue: number;
        obj.simple = propjet<number>().
            get(() => lastValue).
            set(value => (expect(obj.simple).toBe(lastValue), lastValue = value)).
            declare();
        obj.simple = 1;
        obj.simple = 2;
    });

    it('supports read in setter when getter is defined', () => {
        var lastValue: number;
        obj.simple = propjet<number>()
            .get(() => lastValue)
            .set(value => (expect(obj.simple).toBe(lastValue), lastValue = value))
            .declare();
        obj.simple = 1;
        obj.simple = 2;
    });

    it('detects item removing when array become an empty', () => {
        var array = [1];
        var obj = {
            arrayLength: propjet<number>()
                .require(() => array)
                .get(a => a.length)
                .declare()
        };
        propjet(obj);
        expect(obj.arrayLength).toBe(1);
        array.splice(0, 1);
        expect(obj.arrayLength).toBe(0);
    });

    it('detects item adding to empty array', () => {
        var array: number[] = [];
        var obj = {
            arrayLength: propjet<number>()
                .require(() => array)
                .get(a => a.length)
                .declare()
        };
        propjet(obj);
        expect(obj.arrayLength).toBe(0);
        array.push(1);
        expect(obj.arrayLength).toBe(1);
    });

    it('does not recall getter on empty string', () => {
        var callCount = 0;
        var x = "";
        var obj = {
            y: propjet<string>()
                .require(() => x)
                .get(x => {
                    callCount++;
                    return x;
                }
                )
                .declare()
        };
        propjet(obj);
        expect(obj.y).toBe("");
        expect(callCount).toBe(1);
        expect(obj.y).toBe("");
        expect(callCount).toBe(1);
    });

    it('does not recall getter on empty array', () => {
        var callCount = 0;
        var x: number[] = [];
        var obj = {
            y: propjet<number[]>()
                .require(() => x)
                .get(x => {
                    callCount++;
                    return x;
                }
                )
                .declare()
        };
        propjet(obj);
        expect(obj.y).toEqual([]);
        expect(callCount).toBe(1);
        expect(obj.y).toEqual([]);
        expect(callCount).toBe(1);
    });
});

describe('Deferred propjet property', () => {
    var obj: TestClass;

    beforeEach(() => {
        obj = new TestClass();
    });

    it('is pending after first access and before promise resolving', () => {
        expect(obj.callCount).toBe(0);
        expect(obj.deferred.pending).toBeTruthy();
        expect(obj.deferred.last).toBeUndefined();
        expect(obj.callCount).toBe(1);
        obj.deferred.get().resolve(10);
        expect(obj.deferred.settled).toBeTruthy();
        expect(obj.deferred.last).toBe(10);
        expect(obj.callCount).toBe(1);
    });

    it('stores last value from getter promise', () => {
        var promise = obj.deferred.get();
        expect(obj.deferred.last).toBeUndefined();
        obj.deferred.get().then(value => expect(value).toBe(1));
        promise.resolve(1);
        expect(obj.deferred.last).toBe(1);
    });

    it('resets last value to default on requirement change', () => {
        var source = 0;
        obj.deferred = propjet<number>()
            .from<TestPromise<number>>()
            .require(() => source)
            .default(() => 0)
            .get(() => new TestPromise<number>())
            .declare();
        var promise = new TestPromise<number>();
        expect(obj.deferred.last).toBe(0);
        obj.deferred.get().resolve(1);
        expect(obj.deferred.last).toBe(1);
        source++;
        expect(obj.deferred.last).toBe(0);
    });

    it('updates value of dependent properties', () => {
        expect(obj.deferredLast).toBeUndefined();
        expect(obj.deferredStatus).toBe('pending');
        obj.deferred.get().resolve(1);
        expect(obj.deferredStatus).toBe('fulfilled');
        expect(obj.deferredLast).toBe(1);
        obj.deferred.get(true).resolve(2);
        expect(obj.deferredLast).toBe(2);
    });

    it('can accept last value from required clause', () => {
        var lastSource: number;
        var callCount = 0;
        obj.deferred = propjet<number>()
            .from<TestPromise<number>>()
            .require(() => obj.deferred.last)
            .get((last) => (callCount++ , lastSource = last, new TestPromise<number>()))
            .declare();
        expect(obj.deferred.last).toBeUndefined();
        obj.deferred.get().resolve(1);
        expect(obj.deferred.last).toBe(1);
        expect(obj.deferred.pending).toBeTruthy();
        expect(lastSource).toBe(1);
        obj.deferred.get().resolve(1);
        expect(callCount).toBe(2);
        expect(obj.deferred.fulfilled).toBeTruthy();
    });

    it('supports forced update', () => {
        expect(obj.deferred.last).toBeUndefined();
        expect(obj.callCount).toBe(1);
        obj.deferred.get().resolve(1);
        expect(obj.callCount).toBe(1);
        obj.deferred.get(true);
        expect(obj.callCount).toBe(2);
        obj.deferred.get().resolve(2);
        expect(obj.callCount).toBe(2);
    });

    it('supports filtering', () => {
        var expectedValue: number;
        obj.deferred = propjet<number>()
            .from<TestPromise<number>>()
            .get(() => new TestPromise<number>())
            .with((value, oldValue) => value + (oldValue || 0))
            .set(value => (expect(value).toBe(expectedValue), new TestPromise<number>()))
            .declare();
        var promise = obj.deferred.get();
        promise.resolve(1);
        expect(obj.deferred.last).toBe(1);
        expectedValue = 21;
        promise = obj.deferred.set(20);
        promise.resolve(300);
        expect(obj.deferred.last).toBe(321);
        expectedValue = 4321;
        promise = obj.deferred.set(4000, true);
        promise.resolve(5000);
        expect(obj.deferred.last).toBe(5321);
    });

    it('does not reset value on forced update', () => {
        obj.deferred = propjet<number>()
            .from<TestPromise<number>>()
            .require(() => 'const')
            .default(() => 0)
            .get(() => new TestPromise<number>())
            .declare();
        obj.deferred.get().resolve(1);
        expect(obj.deferred.last).toBe(1);
        obj.deferred.get(true);
        expect(obj.deferred.last).toBe(1);
        obj.deferred.get().resolve(2);
        expect(obj.deferred.last).toBe(2);
    });
});