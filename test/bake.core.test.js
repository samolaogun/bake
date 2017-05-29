/**
 * bake.core
 * 
 * @author  Sam Olaogun
 * @version 1.0.10
 * @license MIT
 */
'use strict';

const bake = require('../dist/bake.core');
const assert = require('assert');
const fs = require('fs');
const prolog = '<?xml version="1.0" encoding="UTF-8"?>';
const bakeNoFormat = bake({ format: false });

describe('Parsing Validity', () => {
    it('parses nested arrays', () => {
        bakeNoFormat('test/arrays.json', 'test/arrays.xml');
        let xml = fs.readFileSync('test/arrays.xml').toString();
        assert(xml === `${prolog}<test>1</test><test>2</test><test>3</test>`);

        xml = bakeNoFormat('test/arrays.json');
        assert(xml === `${prolog}<test>1</test><test>2</test><test>3</test>`);
    });

    it('parses nested objects', () => {
        bakeNoFormat('test/objects.json', 'test/objects.xml');
        let xml = fs.readFileSync('test/objects.xml').toString();
        assert(xml === `${prolog}<test><id>1</id><test><id>1</id></test></test>`);

        xml = bakeNoFormat('test/objects.json');
        assert(xml === `${prolog}<test><id>1</id><test><id>1</id></test></test>`);
    });
});

describe('Options', () => {
    it('formats xml properly', () => {
        bake({ format: true })('test/arrays.json', 'test/format.xml');
        const xml = fs.readFileSync('test/format.xml').toString();
        const formattedXML = `${prolog}\n<test>1</test>\n<test>2</test>\n<test>3</test>`;
        assert(xml === formattedXML);
    });

    it('correctly removes prolog', () => {
        bake({ prolog: '', format: true })('test/arrays.json', 'test/prolog.xml');
        const xml = fs.readFileSync('test/prolog.xml').toString();
        const formattedXML = '<test>1</test>\n<test>2</test>\n<test>3</test>';
        assert(xml === formattedXML);
    });

    it('correctly applies parent attributes', () => {
        bake({
            parent: {
                name: "test",
                attr: {
                    test: "true"
                }
            },
            format: true
        })('test/arrays.json', 'test/attr.xml');
        const xml = fs.readFileSync('test/attr.xml').toString();
        const formattedXML = `${prolog}\n<test test="true">\n  <test>1</test>\n  <test>2</test>\n  <test>3</test>\n</test>`;
        assert(xml === formattedXML);
    });
});