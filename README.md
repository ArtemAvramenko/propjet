#propjet.js
JavaScript/TypeScript library for declaring reactive properties.

Supports function mode for outdated browsers (IE8 and below).

Code licensed under [MIT License](LICENSE).

#Installing
Via [NuGet](https://www.nuget.org/packages/propjet.js/): `$ Install-Package propjet.js`
Via [Bower](http://bower.io/): `$ bower install propjet.js`
Manually: extract files from [PropjetJS.zip](PropjetJS.zip?raw=true)

#Example
```C++
class Person
{
    constructor()
    {
        propjet(this);
    }

    firstName = propjet<string>().
        default(() => "Unknown").
        declare();

    lastName = "";

    fullName = propjet<string>().
        require(() => this.firstName, () => this.lastName).
        get((firstName, lastName) => (firstName + " " + lastName).trim()).
        declare();

    propIE8 = propjet<string>().
        default(() => "Hello, IE!").
        declare(true); // function mode: get - propIE8(), set - propIE8(newValue)
}
```
more - [AngularJS demo](demo.ts), [Jasmine specs](Src/propjet.spec.ts)
