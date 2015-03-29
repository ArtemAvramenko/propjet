class TestClass
{
    constructor()
    {
        propjet(this);
    }

    backingValue = 0;

    backingFunction: () => number;

    complex: TestClass;

    simpleGet = propjet<number>().
        get(() => this.backingValue).
        declare();

    functionGet = propjet<number>().
        require(() => this.backingFunction).
        get(f => f()).
        declare();

    onceCall = propjet<number>().
        require().
        get(() => this.backingValue).
        declare();

    complexValue = propjet<number>().
        require(() => this.complex).
        get(nested => nested ? nested.backingValue : NaN).
        declare();

    array = propjet<number[]>().
        default(() => []).
        declare();

    arrayLength = propjet<number>().
        require(() => this.array).
        get(a => a.length).
        declare();
}

describe("propjet",() =>
{
    var o: TestClass;

    beforeEach(() =>
    {
        o = new TestClass();
    });

    it("supports simple getters",() =>
    {
        o.backingValue = 1;
        expect(o.simpleGet).toBe(1);
        o.backingValue = 2;
        expect(o.simpleGet).toBe(2);
    });

    it("calls getter only once when requirements are empty",() =>
    {
        o.backingValue = 1;
        expect(o.onceCall).toBe(1);
        o.backingValue = 2;
        expect(o.onceCall).toBe(1);
    });

    it("expects explicit invalidation on complex requirement change",() =>
    {
        o.complex = new TestClass();
        o.complex.backingValue = 1;
        expect(o.complexValue).toBe(1);
        o.complex.backingValue = 2;
        expect(o.complexValue).toBe(1);
        propjet.invalidate(o.complex);
        expect(o.complexValue).toBe(2);
    });

    it("expects explicit invalidation on function requirement change",() =>
    {
        var i = 1;
        o.backingFunction = () => i;
        expect(o.functionGet).toBe(1);
        i = 2;
        expect(o.functionGet).toBe(1);
        propjet.invalidate(o.backingFunction);
        expect(o.functionGet).toBe(2);
    });

    it("does not need invalidation on requirement length change",() =>
    {
        expect(o.arrayLength).toBe(0);
        o.array.push(0);
        expect(o.arrayLength).toBe(1);
    });
});