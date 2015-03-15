#propjet.js
JavaScript/TypeScript library for reactive properties declaration.

Code licensed under [MIT License](LICENSE).

#Installing
Via [NuGet](https://www.nuget.org/packages/propjet.js/): `$ Install-Package propjet.js`

Manually: copy files from [Dist](Dist)

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
}
```
more - [AngularJS demo](demo.ts)
