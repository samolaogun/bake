# bake-core

### Basic Usage

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

The reason why the bake-core function is curried is fairly simple. This architecure allows you to reuse the same configuration settings on multiple different transforms.

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
Attribute support coming soon.

### Options

Aforementioned, you may configure the bake-core to work as you like by passing a configuration object to the function. Here is the list of options:

- format `boolean [format=false]`
  - Return format XML, false by default.
- prolog `string [prolog='<?xml version="1.0" encoding="UTF-8"?>']`
  - Include XML prolog, false by default.
- parent `{Object} [parent={ name: '', attr: {} }] `
  - Wrap the transformed document. By specification, a JSON Object does not have an identifier for its topmost parent.  No parent by default.
  - name `@property {string} [parent.name='']`
    - The name of the wrapping tag—an empty string by default.
  - attr `@Property {Object} [parent.attr={}]`	
    - Property value pairs for the parent object.

### Examples

```javascript
/* index.json
{
	"head": {
		"title": "Hello world!"
	},
	"body":  {
    	"p": "Hello world!"
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
       "r": "30",
       "cx": "30",
       "cy": "30"
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

### License

See it [here](http://github.com/samolaogun/bake-core/blob/master/LICENSE).