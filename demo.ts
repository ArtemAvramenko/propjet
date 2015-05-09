class DemoController
{
    constructor()
    {
        propjet(this);
        this.resetName();
    }

    /* tslint:disable */
    private _items = propjet<number[]>().
    /* tslint:enable*/
        default(() => []).
        with(value => value || []).
        declare();

    allItems = propjet<string>().
        require(() => this._items).
        get(items => items.join(", ")).
        declare();

    now = propjet<Date>().
        require(
        (oldDate: Date) =>
        {
            var date = new Date();
            date.setSeconds(0, 0);
            return oldDate && oldDate.getTime() === date.getTime() ? oldDate : date;
        }).
        get(date => date).
        declare();

    nowText = propjet<string>().
        require(() => this.now).
        get(date => ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2)).
        declare();

    firstName = propjet<string>().
        default(() => "").
        with(value => value.substring(0, 1).toUpperCase() + value.substring(1).toLowerCase()).
        declare();

    lastName = propjet<string>().
        default(() => "").
        with(value => value.substring(0, 1).toUpperCase() + value.substring(1).toLowerCase()).
        declare();

    fullName = propjet<string>().
        require(() => this.firstName, () => this.lastName).
        get((firstName, lastName) => firstName + " " + lastName).
        declare();

    fullNameCaps = propjet<string>().
        require(() => this.fullName).
        get(fullName => fullName.toUpperCase()).
        declare();

    allNames = propjet<string>().
        require(() => this.firstName, () => this.lastName, () => this.fullName, () => this.fullNameCaps).
        get((...names: string[]) => names.join(", ")).
        declare();

    resetName()
    {
        this.firstName = "john";
        this.lastName = "doe";
        this._items = null;
    }

    inc()
    {
        if (this._items.length)
        {
            this._items[0]++;
            propjet.invalidate(this._items);
        }
        else
        {
            this._items.push(1);
        }
    }
}

angular.module("DemoApp", []).controller("DemoController", DemoController);