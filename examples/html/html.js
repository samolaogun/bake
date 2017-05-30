'use strict';

const bake = require('bake');
const path = require('path');

const inputPath = path.resolve(__dirname + 'index.json');
const outputPath = path.resolve(__dirname + 'index.html');

bake({
    attr: true,
    attributeIdentifier: 'attribute',
    contentIdentifier: 'innerHTML',
    prolog: '<!doctype html>',
    parent: {
        name: 'html',
        attr: {
            "lang": "en"
        }
    }
})(inputPath, outputPath);

// equivalent to 
// bake -e -a 'attribute' -c 'innerHTML' -l '<!doctype html>' -p '{ "name": "html", "attr": { "lang": "en" }}' examples/html/index.json
