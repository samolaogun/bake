/**
 * bake-core
 * 
 * @author  Sam Olaogun
 * @version 1.0
 * @license MIT
 */
'use strict';

import { pd } from 'pretty-data';
import fs from 'fs';

/**
 * @property {String}    ATTRIBUTE_IDENTIFIER    attribute identifier for attr/content syntax
 * @property {String}    CONTENT_IDENTIFIER      content identifier for attr/content syntax
 * @property {String}    PROLOG                  standard xml prolog
 * @property {String}    DOTFILE                 config object filename
 */
const CONSTANTS = {
    ATTRIBUTE_IDENTIFIER: 'attr',
    CONTENT_IDENTIFIER: 'content',
    PROLOG: '<?xml version="1.0" encoding="UTF-8"?>',
    DOTFILE: '.bakeconfig'
};

/**
 * @mixin
 * 
 * @property {Object}    parent         topmost wrapper
 * @property {Object}    parent.name    topmost wrapper tag type
 * @property {Object}    parent.attr    topmost wrapper attribute obj
 * @property {Boolean}   attr           parse JSON according to attr/content syntax
 * @property {String}    prolog         prepend each transform with a specified prolog
 */
const DEFAULTS = {
    parent: {
        name: '',
        attr: {}
    },
    attr: false,
    format: true,
    prolog: CONSTANTS.PROLOG,
};

/**
 * @param {Object}        opts    config object
 * @returns {Function}
 */
const BakeCore = (opts = {}) => {
    /** @mixin */
    let config = fs.existsSync(CONSTANTS.DOTFILE);

    if (config) {
        config = fs.readFileSync(CONSTANTS.DOTFILE);
        try {
            opts = Object.assign({}, DEFAULTS, JSON.parse(config), opts);
        } catch (e) {
            throw new Error('bake-core: Invalid configuration object.');
        }
    } else {
        opts = Object.assign({}, DEFAULTS, opts);
    }

    const { ATTRIBUTE_IDENTIFIER, CONTENT_IDENTIFIER, PROLOG } = CONSTANTS;
    const { parent, attr, format, prolog } = opts;

    const recursivePropertyCheck = (key, val) => {
        let tagAttr = {},
            content = val;

        if (attr)
            if (!val[ATTRIBUTE_IDENTIFIER])
                content = val[CONTENT_IDENTIFIER] || val;
            else
                [tagAttr, content] = [val[ATTRIBUTE_IDENTIFIER], val[CONTENT_IDENTIFIER]];

        if (Array.isArray(content)) return parseArray(key, content);
        else if (typeof content == 'object') return parseXML(key, content, tagAttr);
        else return tagFactory(key, content, tagAttr);
    };

    const parseXML = (name, obj, attrs) =>
        tagFactory(name,
            Object.keys(obj).reduce((acc, key) => acc += recursivePropertyCheck(key, obj[key]), ''),
            attrs);

    const parseArray = (name, arr, attrs) =>
        arr.reduce((acc, val) =>
            acc += recursivePropertyCheck(name, val, attrs), '');

    const tagFactory = (tagName, content, attrs) => {
        let keys = Object.keys(attrs);

        keys.length > 0 ?
            attrs = keys.reduce((acc, attr) => acc += ` ${attr}="${attrs[attr]}"`, '') :
            attrs = '';

        if (!content) return `<${tagName}${attrs}/>`;

        if (tagName) return `<${tagName}${attrs}>${content}</${tagName}>`;
        else return content;
    };

    /**
     * @description    set up parsing environment
     * @returns        {Function}
     */
    return (() => {
        /** @protected */
        const { name, attr } = parent;

        /** @protected */
        const getParsedXML = load => {
            const out = (prolog ? prolog : '') + parseXML(name, load, attr);
            return format ? pd.xml(out) : out;
        };

        /** @protected */
        const handleObjectInput = (load, fileOutput) =>
            fileOutput ? fs.writeFileSync(fileOutput, getParsedXML(load)) : getParsedXML(load);

        /** @protected */
        const handleFileInput = (path, fileOutput) => {
            const load = JSON.parse(fs.readFileSync(path).toString());
            return fileOutput ? fs.writeFileSync(fileOutput, getParsedXML(load)) : getParsedXML(load);
        };

        return (input = 'in.json', output = false) => {
            if (typeof input === 'string') return handleFileInput(input, output);
            else if (typeof input === 'object') return handleObjectInput(input, output);
            else throw new Error('bake-core: Invalid JSON input.');
        };
    })();
}

module.exports = BakeCore;