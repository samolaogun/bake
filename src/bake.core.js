/*eslint no-unused-vars: ["error", { "vars": "local" }]*/
/*eslint-env node*/

/**
 * bake.core
 * 
 * @author  Sam Olaogun
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
    DOTFILE: '.bakerc' // UNIX standard
};

/** @mixin DEFAULTS */
const DEFAULTS = {
    parent: {
        name: '',
        attr: {}
    },
    attributeIdentifier: CONSTANTS.ATTRIBUTE_IDENTIFIER,
    contentIdentifier: CONSTANTS.CONTENT_IDENTIFIER,
    strict: false,
    attr: false,
    format: true,
    prolog: CONSTANTS.PROLOG,
};

/*global ERRORS.throwContentErr contentIdentifier:true*/
const ERRORS = {
    throwContentErr: () => {
        throw new Error(`bake-core: "Strict Mode: Content Identifier "${contentIdentifier}" required"`);
    },
    throwConfigErr: () => {
        throw new Error('bake-core: "Invalid configuration object"');
    },
    throwIOErr: () => {
        throw new Error('bake-core: "IOError, unable to write to or read file"');
    },
    throwInputErr: () => {
        throw new Error('bake-core: "Invalid input"');
    }
};

/**
 * @param {Object}    opts    config object
 * @returns {Function}
 */
const BakeCore = (opts = {}) => {
    /**
     * @mixin config
     * 
     * @property {Object}    parent                          topmost wrapper
     * @property {String}    [parent.name='']                topmost wrapper tag type
     * @property {String}    [parent.attr={}]                topmost wrapper attribute obj
     * @property {String}    [attributeIdentifier='attr']    attribute/content syntax attribute
     * @property {String}    [contentIdentifier='content']   attribute/content syntax content
     * @property {Boolean}   [strict=false]                  omit content in attribute/content syntax
     * @property {Boolean}   [attr=false]                    parse JSON according to attr/content syntax
     * @property {Boolean}   [format=true]                   format the transformed document
     * @property {String}    [prolog=CONSTANTS.PROLOG]       prepend each transform with a specified prolog
     */
    const {
        parent,
        attr: hasAttributes,
        attributeIdentifier,
        contentIdentifier,
        format,
        strict,
        prolog
    } =  { 
        ...DEFAULTS, 
        ...JSON.parse(fs.readFileSync(CONSTANTS.DOTFILE) || {})
        ...opts
    };

    const recursivePropertyCheck = (key, val) => {
        let attr = {},
            content = val;

        if (hasAttributes) {
            if (!val[attributeIdentifier])
                strict ?
                    content = val[contentIdentifier] || ERRORS.throwContentErr() :
                    content = val[contentIdentifier] || val;
            else
                [attr, content] = [val[attributeIdentifier], val[contentIdentifier]];
        }

        if (Array.isArray(content)) 
            return parseArray(key, content);
        else if (typeof content === 'object') 
            return parseXML(key, content, attr);
        else 
            return tagFactory(key, content, attr);
    };

    const parseXML = (name = '', obj = {}, attrs = {}) =>
        tagFactory(name,
            Object.keys(obj).reduce((acc, key) => 
                acc += recursivePropertyCheck(key, obj[key]), ''),
            attrs);

    const parseArray = (name = '', arr, attrs) =>
        arr.reduce((acc, val) =>
            acc += recursivePropertyCheck(name, val, attrs), '');

    const tagFactory = (name, content, attrs) => {
        Object.keys(attrs).length > 0 ?
            attrs = keys.reduce((acc, attr) => 
                acc += ` ${attr}="${attrs[attr]}"`
            , '') : attrs = '';

        if (!content)
            return `<${name}${attrs}/>`;

        return name ?
            `<${name}${attrs}>${content}</${name}>` :
            content;
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
            let out = parseXML(name, load, attr);
            out = format ? pd.xml(out) : out;
            return (prolog ? `${prolog}\n` : '') + out;
        };

        /** @protected */
        const handleObjectInput = (load, fileOutput) => {
            try {
                return fileOutput ?
                    fs.writeFileSync(fileOutput, getParsedXML(load)) :
                    getParsedXML(load);
            } catch (e) {
                ERRORS.throwIOError();
            }
        };

        /** @protected */
        const handleFileInput = (path, fileOutput) => {
            const load = JSON.parse(fs.readFileSync(path).toString());
            return handleObjectInput(load, fileOutput);
        };

        return (input = 'in.json', output = false) => {
            if (typeof input === 'string')
                return handleFileInput(input, output);
            else if (typeof input === 'object')
                return handleObjectInput(input, output);
            else
                ERRORS.throwInputErr();
        };
    })();
};

module.exports = BakeCore;
