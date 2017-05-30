'use strict';

const bake = require('bake');
const path = require('path');

const inputPath = path.resolve(__dirname + 'circle.json');
const outputPath = path.resolve(__dirname + 'circle.svg');

bake({
    attr: true,
    parent: {
        name: 'svg',
        attr: {
            'xmlns': 'http://www.w3.org/2000/svg',
            'viewBox': '0 0 60 60'
        }
    }
})(inputPath, outputPath);