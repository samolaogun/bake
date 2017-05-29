# bake-core

## Basic Usage

bake-core is a JSON to XML converter, not to be confused with bake-cli which provides a the command line tool derived from bake-core. When required, bake-core returns a function. Using it requires input information and optionally, a configuration object containing information describing how Bake should transform JSON.

```javascript
var bake = require('bake-core');

// bake with options
bake({/*...opts */})('path/to/input', 'path/to/output');

// bake without options
bake()('path/to/input', 'path/to/output');
```

The bake-core function—that is, the function that is returned when bake is required—returns a function which takes an input (`in.json` by default) and optionally, an output path. If no output path is specified, the resulting XML is returned.

```javascript
// transforms and formats 'in.json' into 'out.xml'
bake({ format: true })('in.json', 'out.xml');

// formats, and returns 'in.json' transformed
var xml = bake({ format: true })('in.json');

// transforms the supplied JSON Object and returns it
var xml = bake({ format: true })({
    "parent": [
        "child": "some content"
    ]
});
```

The reason why the bake-core function is curried is fairly simple. This architecure allows you to reuse the same configuration settings on multiple different transforms. Alternatively, you may specify your configuration settings in a `.bakeconfig` file using JSON notation. Inline configuration takes precedence over `.bakeconfig` settings.	

```javascript
var customBake = bake({
    format: true,
    prolog: true,
});

var xml = customBake('sample.json');
customBake('info.json', 'info.xml');
customBake('more.json', 'more.xml');
customBake({
    "parent": [
        "child": "some content"
    ]
}, 'file.xml');
// ...
```
## Options

Aforementioned, you may configure the bake-core to work as you like by passing a configuration object to the function. Here is the list of options:

```javascript
const options = {
    parent: {
        name: '',
        attr: {}
    },
    attr: false,
    format: true,
    prolog:'<?xml version="1.0" encoding="UTF-8"?>'
};
```

- parent `{Object} [parent={ name: '', attr: {} }] `
  - wrap the transformed document (by specification, a JSON Object does not have an identifier for its topmost parent), no parent by default
  - name `{string} [parent.name='']`
    - the name of the wrapping tag—an empty string by default
  - attr `{Object} [parent.attr={}]`
    - property value pairs for the parent object
- attr `{Boolean} [attr=false]`
  - use attribute-content syntax, false by default
- format `{Boolean} [format=false]`
  - return format XML, false by default
- prolog `{String} [prolog='<?xml version="1.0" encoding="UTF-8"?>']`
  - include XML prolog, standard xml prolog by default

## Attribute-Content Syntax

JSON doesn't natively support an feature that directly mimics XML attributes. While it might seem intelligent to completely disregard this fact, most of the time, JSON meant to be parsed into XML will require attributes.

```xml
<!-- what would the JSON representation of a document like this be? -->
<svg viewBox="0 0 60 60">
  <circle r="30" cx="30" cy="30"/>
</svg>
```

A great example of this is SVG (Scalable Vectory Graphic), so it is the example that I will use. Without introucing entirely new and unfamilar syntax, in order to separate attributes and content, we must explicitly demarcate which is which. This fundamentally what we do with attribute-content syntax.

```json
{
    "svg": {
        "attr": {
            "viewBox": "0 0 60 60"
        },
        "content": {
            "circle": {
                "attr": {
                    "r": 30,
                    "cx": 30,
                    "cy": 30
                }
            }
        }
    }
}
```

Here, the attributes of each element are separated from their content. This behavior stays consistent for any type of content (array, number, string, boolean, object). Additionally, this pattern allows us to omit either attributes or content without making an incorrect transformation. Note that if attributes are included, you must use the content property to demarcate your content. Objects with attributes and without a content property will be collapsed, and their other properties will not be evaluated. 

This is fine.
```json
{
  "html": {
    "body": {
      "img": {
        "attr": {
          "src": "path/to/image"
        }
      },
      "p": "Hello World!",
    }
  }
}
````
This is not ok.
```json
{
  "html": {
    "body": {
      "img": {
        "attr": {
          "src": "path/to/image"
        }
      },
      "script": {
        "attr": {
          "defer": "true"
        },
        "src": "path/to/js"
      },
    }
  }
}
```

## Examples

Recommended general bake configuration.
```json
// .bakeconfig
{
  "format": true,
  "attr": "true"
}
```
Bake has many practical applications, for example:
```javascript
/* index.json
{
	"head": {
		"title": "Hello world!"
	},
	"body":  {
    	"p": "Hello world!",
      "img": {
        "attr": {
          "src": "./circle.svg"
        }
      }
    }
} */

bake({
  prolog: '<!doctype html>',
  format: true,
  parent: { 
    name: 'html',
    attr: {
      'lang': 'en'
	  }
  }
})('index.json', 'index.html');

/* circle.json
{
    "circle": {
    	"attr": {
         "r": "30",
         "cx": "30",
         "cy": "30"
       }
    }
} */

bake({
  format: true,
  parent: {
    name: 'svg',
    attr: {
      'xmlns': 'http://www.w3.org/2000/svg',
      'viewBox': '0 0 60 60'
	  }
  }
})('circle.json', 'circle.svg');
```

## License

See it [here](http://github.com/samolaogun/bake-core/blob/master/LICENSE).