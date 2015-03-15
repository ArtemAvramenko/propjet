#propjet.js
JavaScript/TypeScript library for reactive properties declaration.

Code licensed under [MIT License](LICENSE).

#Installing via [NuGet](https://www.nuget.org/packages/propjet.js/)
```
$ Install-Package propjet.js
```

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