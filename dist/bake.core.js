/*eslint no-unused-vars: ["error", { "vars": "local" }]*/
/*eslint-env node*/

/**
 * bake.core
 * 
 * @author  Sam Olaogun
 * @version 1.0.11
 * @license MIT
 */
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _prettyData = require('pretty-data');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @property {String}    ATTRIBUTE_IDENTIFIER    attribute identifier for attr/content syntax
 * @property {String}    CONTENT_IDENTIFIER      content identifier for attr/content syntax
 * @property {String}    PROLOG                  standard xml prolog
 * @property {String}    DOTFILE                 config object filename
 */
var CONSTANTS = {
    ATTRIBUTE_IDENTIFIER: 'attr',
    CONTENT_IDENTIFIER: 'content',
    PROLOG: '<?xml version="1.0" encoding="UTF-8"?>',
    DOTFILE: '.bakerc' // UNIX standard
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
var DEFAULTS = {
    parent: {
        name: '',
        attr: {}
    },
    attributeIdentifier: CONSTANTS.ATTRIBUTE_IDENTIFIER,
    contentIdentifier: CONSTANTS.CONTENT_IDENTIFIER,
    strict: false,
    attr: false,
    format: true,
    prolog: CONSTANTS.PROLOG
};

/*global ERRORS.throwContentErr contentIdentifier:true*/
var ERRORS = {
    throwContentErr: function throwContentErr() {
        throw new Error('bake-core: "Strict Mode: Content Identifier "' + contentIdentifier + '" required"');
    },
    throwConfigErr: function throwConfigErr() {
        throw new Error('bake-core: "Invalid configuration object"');
    },
    throwIOErr: function throwIOErr() {
        throw new Error('bake-core: "IOError, unable to write to or read file"');
    },
    throwInputErr: function throwInputErr() {
        throw new Error('bake-core: "Invalid input"');
    }
};

/**
 * @param {Object}        opts    config object
 * @returns {Function}
 */
var BakeCore = function BakeCore() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var config = void 0;
    try {
        config = _fs2.default.existsSync(CONSTANTS.DOTFILE);
    } catch (e) {
        ERRORS.throwConfigErr();
    }

    if (config) {
        /** @mixin */
        try {
            config = _fs2.default.readFileSync(CONSTANTS.DOTFILE);
            opts = Object.assign({}, DEFAULTS, JSON.parse(config), opts);
        } catch (e) {
            ERRORS.throwConfigErr();
        }
    } else {
        opts = Object.assign({}, DEFAULTS, opts);
    }

    var _opts = opts,
        parent = _opts.parent,
        hasAttributes = _opts.attr,
        attributeIdentifier = _opts.attributeIdentifier,
        contentIdentifier = _opts.contentIdentifier,
        format = _opts.format,
        strict = _opts.strict,
        prolog = _opts.prolog;


    var recursivePropertyCheck = function recursivePropertyCheck(key, val) {
        var attr = {},
            content = val;

        if (hasAttributes) {
            if (!val[attributeIdentifier]) strict ? content = val[contentIdentifier] || ERRORS.throwContentErr() : content = val[contentIdentifier] || val;else {
                ;
                var _ref = [val[attributeIdentifier], val[contentIdentifier]];
                attr = _ref[0];
                content = _ref[1];
            }
        }

        if (Array.isArray(content)) return parseArray(key, content);else if ((typeof content === 'undefined' ? 'undefined' : _typeof(content)) === 'object') return parseXML(key, content, attr);else return tagFactory(key, content, attr);
    };

    var parseXML = function parseXML(name, obj, attrs) {
        return tagFactory(name, Object.keys(obj).reduce(function (acc, key) {
            return acc += recursivePropertyCheck(key, obj[key]);
        }, ''), attrs);
    };

    var parseArray = function parseArray(name, arr, attrs) {
        return arr.reduce(function (acc, val) {
            return acc += recursivePropertyCheck(name, val, attrs);
        }, '');
    };

    var tagFactory = function tagFactory(name, content, attrs) {
        var keys = Object.keys(attrs);

        keys.length > 0 ? attrs = keys.reduce(function (acc, attr) {
            return acc += ' ' + attr + '="' + attrs[attr] + '"';
        }, '') : attrs = '';

        if (!content) return '<' + name + attrs + '/>';

        if (name) return '<' + name + attrs + '>' + content + '</' + name + '>';else return content;
    };

    /**
     * @description    set up parsing environment
     * @returns        {Function}
     */
    return function () {
        /** @protected */
        var name = parent.name,
            attr = parent.attr;

        /** @protected */

        var getParsedXML = function getParsedXML(load) {
            var out = (prolog ? prolog : '') + parseXML(name, load, attr);
            return format ? _prettyData.pd.xml(out) : out;
        };

        /** @protected */
        var handleObjectInput = function handleObjectInput(load, fileOutput) {
            try {
                return fileOutput ? _fs2.default.writeFileSync(fileOutput, getParsedXML(load)) : _fs2.default.writeSync(1, getParsedXML(load) + '\n');
            } catch (e) {
                ERRORS.throwIOError();
            }
        };

        /** @protected */
        var handleFileInput = function handleFileInput(path, fileOutput) {
            var load = JSON.parse(_fs2.default.readFileSync(path).toString());
            return handleObjectInput(load, fileOutput);
        };

        return function () {
            var input = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'in.json';
            var output = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            if (typeof input === 'string') return handleFileInput(input, output);else if ((typeof input === 'undefined' ? 'undefined' : _typeof(input)) === 'object') return handleObjectInput(input, output);else ERRORS.throwInputErr();
        };
    }();
};

module.exports = BakeCore;

