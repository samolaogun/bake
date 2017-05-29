/**
 * bake-core
 * 
 * @author  Sam Olaogun
 * @version 1.0
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
var DEFAULTS = {
    parent: {
        name: '',
        attr: {}
    },
    attr: false,
    format: true,
    prolog: CONSTANTS.PROLOG
};

/**
 * @param {Object}        opts    config object
 * @returns {Function}
 */
var BakeCore = function BakeCore() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    /** @mixin */
    var config = _fs2.default.existsSync(CONSTANTS.DOTFILE);

    if (config) {
        config = _fs2.default.readFileSync(CONSTANTS.DOTFILE);
        try {
            opts = Object.assign({}, DEFAULTS, JSON.parse(config), opts);
        } catch (e) {
            throw new Error('bake-core: Invalid configuration object.');
        }
    } else {
        opts = Object.assign({}, DEFAULTS, opts);
    }

    var ATTRIBUTE_IDENTIFIER = CONSTANTS.ATTRIBUTE_IDENTIFIER,
        CONTENT_IDENTIFIER = CONSTANTS.CONTENT_IDENTIFIER,
        PROLOG = CONSTANTS.PROLOG;
    var _opts = opts,
        parent = _opts.parent,
        attr = _opts.attr,
        format = _opts.format,
        prolog = _opts.prolog;


    var recursivePropertyCheck = function recursivePropertyCheck(key, val) {
        var tagAttr = {},
            content = val;

        if (attr) if (!val[ATTRIBUTE_IDENTIFIER]) content = val[CONTENT_IDENTIFIER] || val;else {
            ;

            var _ref = [val[ATTRIBUTE_IDENTIFIER], val[CONTENT_IDENTIFIER]];
            tagAttr = _ref[0];
            content = _ref[1];
        }if (Array.isArray(content)) return parseArray(key, content);else if ((typeof content === 'undefined' ? 'undefined' : _typeof(content)) == 'object') return parseXML(key, content, tagAttr);else return tagFactory(key, content, tagAttr);
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

    var tagFactory = function tagFactory(tagName, content, attrs) {
        var keys = Object.keys(attrs);

        keys.length > 0 ? attrs = keys.reduce(function (acc, attr) {
            return acc += ' ' + attr + '="' + attrs[attr] + '"';
        }, '') : attrs = '';

        if (!content) return '<' + tagName + attrs + '/>';

        if (tagName) return '<' + tagName + attrs + '>' + content + '</' + tagName + '>';else return content;
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
            return fileOutput ? _fs2.default.writeFileSync(fileOutput, getParsedXML(load)) : getParsedXML(load);
        };

        /** @protected */
        var handleFileInput = function handleFileInput(path, fileOutput) {
            var load = JSON.parse(_fs2.default.readFileSync(path).toString());
            return fileOutput ? _fs2.default.writeFileSync(fileOutput, getParsedXML(load)) : getParsedXML(load);
        };

        return function () {
            var input = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'in.json';
            var output = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            if (typeof input === 'string') return handleFileInput(input, output);else if ((typeof input === 'undefined' ? 'undefined' : _typeof(input)) === 'object') return handleObjectInput(input, output);else throw new Error('bake-core: Invalid JSON input.');
        };
    }();
};

module.exports = BakeCore;

