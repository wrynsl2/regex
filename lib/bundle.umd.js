(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.RegExp2 = factory());
}(this, (function () { 'use strict';

    const words = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'.split('');
    const toCharCode = function (escapeString) {
        if (escapeString.indexOf('\\') === 0 && escapeString.length > 1) {
            return eval(`"${escapeString}"`).charCodeAt(0);
        }
        return escapeString.charCodeAt(0);
    };
    const toCode = function (escapeString) {
        if (escapeString.indexOf('\\') === 0 && escapeString.length > 1) {
            return eval(`"${escapeString}"`);
        }
        return escapeString;
    };
    const integers = '0123456789'.split('');
    const isInteger = (s) => {
        if (typeof s === 'string') {
            for (let i = 0; i < integers.length; i++) {
                if (integers[i] === s) {
                    return true;
                }
            }
        }
        return false;
    };
    const isWordChar = (e, input) => {
        if (e === -1 || e === input.length) {
            return false;
        }
        const c = input[e];
        return isWordChar2(c);
    };
    const isWordChar2 = (c) => {
        return words.indexOf(c) > -1;
    };
    const f = '\u000C', n = '\u000A', r = '\u000D', t = '\u0009', v = '\u000B', o = '\u0000';
    const s = f + n + r + t + v + '\u0020\u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff';
    const SPECIAL_CODES = {
        '\\f': f,
        '\\n': n,
        '\\r': r,
        '\\t': t,
        '\\v': v,
        '\\0': o
    };
    const isSpace = (code) => {
        return s.indexOf(code) > -1;
    };
    const LineTerminator = ['\u000A', '\u000D', '\u2028', '\u2029'];
    const isLineTerminator = (code) => {
        return LineTerminator.indexOf(code) > -1;
    };
    const evaluateQuantifierValue = (node) => {
        const greedy = node.greedy;
        const value = node.value || '';
        let min = 0;
        let max = 0;
        if (value === '*') {
            max = Infinity;
            return {
                min,
                max,
                greedy
            };
        }
        if (value === '+') {
            min = 1;
            max = Infinity;
            return {
                min,
                max,
                greedy
            };
        }
        if (value === '?') {
            min = 0;
            max = 1;
            return {
                min,
                max,
                greedy
            };
        }
        const input = value.split(',');
        min = +input[0];
        max = input[1] ? +input[1] : Infinity;
        return {
            min,
            max,
            greedy
        };
    };
    const getParenCountByAtom = (node) => {
        if (node.children.length) {
            return +(node.type === 'SubExpression' && Number.isFinite(node.groupIndex)) + node.children.reduce((accumulator, item) => {
                return getParenCountByAtom(item) + accumulator;
            }, 0);
        }
        return +(node.type === 'SubExpression' && Number.isFinite(node.groupIndex));
    };
    const getParenIndexByNode = (node, nodes, index = 0) => {
        const getIndex = (nodes) => {
            for (let i = 0, len = nodes.length; i < len; i++) {
                const n = nodes[i];
                if (Number.isFinite(n.groupIndex) && typeof n.groupIndex !== 'undefined') {
                    index++;
                }
                if (node === n) {
                    return true;
                }
                if (n.children.length) {
                    if (getIndex(n.children)) {
                        return true;
                    }
                }
            }
            return false;
        };
        getIndex(nodes);
        return index;
    };
    const canonicalize = (ch, ignoreCase = false) => {
        if (!ignoreCase) {
            return ch;
        }
        const u = ch.toUpperCase();
        if (u.length !== 1) {
            return ch;
        }
        const cu = u;
        if (ch.charCodeAt(0) >= 128 && cu.charCodeAt(0) < 128) {
            return ch;
        }
        return cu;
    };

    class Node {
        constructor(type, value) {
            this.type = '';
            this.children = [];
            this.greedy = true;
            this.type = type;
            this.value = value;
        }
    }
    class NodeProcesser {
        startNode(type = '', value = '') {
            return new Node(type, value);
        }
        closeNode(node) {
            node.closed = true;
        }
        finishNode(node, type) {
            node.type = type;
        }
    }

    class TokenType {
        constructor(label, conf = {}) {
            this.label = '';
            this.conf = {};
            this.label = label;
            this.conf = conf;
        }
    }
    const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const HexDigits = '0123456789ABCDEFabcdef'.split('');
    const types = {
        backslash: new TokenType('\\'),
        start: new TokenType('^'),
        end: new TokenType('$'),
        or: new TokenType('|'),
        anti: new TokenType('^'),
        oneMore: new TokenType('*'),
        add: new TokenType('+'),
        question: new TokenType('?'),
        dot: new TokenType('.'),
        parenL: new TokenType('('),
        parenR: new TokenType(")"),
        bracketL: new TokenType('['),
        bracketR: new TokenType("]"),
        bracesL: new TokenType('{'),
        bracesR: new TokenType('}'),
        backspace: new TokenType('[\\b]'),
        range: new TokenType('-'),
        groupIs: new TokenType('?='),
        groupElse: new TokenType('?!'),
        groupAtom: new TokenType('?:'),
        controlLetter: new TokenType('\\c'),
        hexadecimal: new TokenType('\\x'),
        unicode: new TokenType('\\u'),
        controllerEscape: [
            new TokenType('\\f'),
            new TokenType('\\n'),
            new TokenType('\\r'),
            new TokenType('\\t'),
            new TokenType('\\v'),
        ],
        characterClassEscape: [
            new TokenType('\\d'),
            new TokenType('\\D'),
            new TokenType('\\s'),
            new TokenType('\\S'),
            new TokenType('\\w'),
            new TokenType('\\W'),
        ],
        assertionEscape: [
            new TokenType('\\b'),
            new TokenType('\\B')
        ],
        kws: [
            new TokenType('\\0')
        ]
    };
    const keyCodes = '\\^$|*+?.{[';
    class Parser extends NodeProcesser {
        constructor(str) {
            super();
            this.input = '';
            this.loc = 0;
            this.pos = 0;
            this.end = 0;
            this.groups = [];
            this.node = this.startNode('RegularExpressions');
            this.groupCount = 0;
            this.input = str;
            this.end = str.length;
            this.parse();
        }
        isRangeNode(node) {
            if (node.type === 'CharacterClassEscape' || node.type === 'CharacterRange' || node.type === 'assertionEscape' || node.type === 'CharacterClassAnti') {
                return true;
            }
            return false;
        }
        parse() {
            this.pos = 0;
            this.parseStart();
        }
        parseStart() {
            const node = this.node;
            while (this.end > this.pos) {
                this.next(node);
            }
        }
        parseWord(w, node) {
            switch (w) {
                case types.start.label:
                    node.children.push(this.startNode('Assertion', w));
                    this.next(node);
                    break;
                case types.backslash.label:
                    this.processBackSlash(node);
                    this.next(node);
                    break;
                case types.question.label:
                    if (this.processGreedy(node)) {
                        break;
                    }
                case types.add.label:
                case types.oneMore.label:
                    const nn = this.startNode('QuantifierPrefix', w);
                    this.addQuantifierPrefixNode(node, nn);
                    this.next(node);
                    break;
                case types.dot.label:
                    node.children.push(this.startNode('Atom', w));
                    this.next(node);
                    break;
                case types.parenL.label:
                    this.processParenL(node);
                    break;
                case types.parenR.label:
                    const lastg = this.groups[this.groups.length - 1];
                    if (lastg && !lastg.closed) {
                        lastg.closed = true;
                        this.groups.splice(-1, 1);
                        if (lastg.parent) {
                            this.next(lastg.parent);
                        }
                    }
                    else {
                        this.raise(`Unmatched ')'`);
                    }
                    break;
                case types.bracesL.label:
                    this.processBracesL(node);
                    break;
                case types.bracesR.label:
                    this.processBracesR(node);
                    break;
                case types.bracketL.label:
                    this.processBracket(node);
                    break;
                case types.end.label:
                    node.children.push(this.startNode('Assertion', w));
                    this.next(node);
                    break;
                case types.or.label:
                    this.processOr(node);
                    break;
                default:
                    node.children.push(this.startNode('PatternCharacter', w));
                    this.next(node);
                    break;
            }
        }
        // ?
        processGreedy(node) {
            const last = node.children[node.children.length - 1];
            if (last) {
                if (last.type === 'QuantifierPrefix') {
                    if (last.greedy) {
                        last.greedy = false;
                        return true;
                    }
                    else {
                        this.raise('Nothing to repeat');
                    }
                }
            }
        }
        // \
        processBackSlash(node, inBracket = false) {
            while (true) {
                const w = this.readWord();
                if (!w) {
                    return;
                }
                if (w[1] === '\\') {
                    node.children.push(this.startNode('PatternCharacter', w[1]));
                    break;
                }
                if (w[1] === '^') {
                    node.children.push(this.startNode('PatternCharacter', w[1]));
                    break;
                }
                if (keyCodes.indexOf(w[1]) > -1) {
                    if (inBracket) {
                        node.children.push(this.startNode('PatternCharacter', '\\'));
                    }
                    node.children.push(this.startNode('PatternCharacter', w[1]));
                    break;
                }
                if (this.processEscape(node, w)) {
                    break;
                }
                if (!isInteger(w.slice(-1))) {
                    const value = w.substr(1, w.length - 2);
                    if (isInteger(value)) {
                        node.children.push(this.startNode('DecimalEscape', value));
                    }
                    else {
                        node.children.push(this.startNode('PatternCharacter', w.substr(1)));
                    }
                    this.pos--;
                    break;
                }
                if (this.pos >= this.end) {
                    const value = w.substr(1);
                    if (isInteger(value)) {
                        node.children.push(this.startNode('DecimalEscape', value));
                    }
                    else {
                        node.children.push(this.startNode('PatternCharacter', w.substr(1)));
                    }
                    return;
                }
            }
        }
        // \
        processEscape(node, w) {
            // TODO
            if (w === types.controlLetter.label) {
                const n = this.startNode('ControlLetter');
                node.children.push(n);
                if (this.end <= this.pos) {
                    this.raise('\\ at end of pattern');
                    return;
                }
                const word = this.eatWord();
                if (letters.includes(word)) {
                    n.value = word;
                }
                else {
                    this.parseWord(word, node);
                }
                return true;
            }
            if (w === types.hexadecimal.label) {
                const n = this.startNode('HexEscapeSequence');
                node.children.push(n);
                const word = [this.eatWord(), this.eatWord()];
                if (HexDigits.includes(word[0]) && HexDigits.includes(word[1])) {
                    n.value = word.join('');
                    return true;
                }
                this.pos -= 2;
                this.loc = this.pos;
                return true;
            }
            if (w === types.unicode.label) {
                const n = this.startNode('UnicodeEscapeSequence');
                node.children.push(n);
                const word = [this.eatWord(), this.eatWord(), this.eatWord(), this.eatWord()];
                if (HexDigits.includes(word[0]) && HexDigits.includes(word[1]) && HexDigits.includes(word[2]) && HexDigits.includes(word[3])) {
                    n.value = w + word.join('');
                    return true;
                }
                this.pos -= 4;
                this.loc = this.pos;
                return true;
            }
            const each = (list, type) => {
                for (let i = 0, len = list.length; i < len; i++) {
                    const kws = list[i];
                    if (kws.label === w) {
                        node.children.push(this.startNode(type, w));
                        return true;
                    }
                }
                return false;
            };
            return each(types.kws, 'CharacterKey') || each(types.controllerEscape, 'ControllerEscape') || each(types.characterClassEscape, 'CharacterClassEscape') || each(types.assertionEscape, 'AssertionEscape');
        }
        // [
        processBracket(node) {
            const w = this.input.slice(this.loc, this.loc + 4);
            if (w === types.backspace.label) {
                const nn = this.startNode('ClassEscape', types.backspace.label);
                node.children.push(nn);
                this.loc = this.loc + 4;
                this.pos = this.loc;
                this.next(node);
                return;
            }
            const nn = this.startNode('CharacterClass');
            while (true) {
                if (this.end <= this.pos) {
                    this.raise('missing /');
                    return;
                }
                const word = this.eatWord();
                if (word === types.bracketR.label) {
                    nn.closed = true;
                    break;
                }
                switch (word) {
                    case types.anti.label:
                        if (nn.children.length === 0) {
                            nn.children.push(this.startNode('CharacterClassAnti'));
                        }
                        else {
                            nn.children.push(this.startNode('SourceCharacter', word));
                        }
                        break;
                    case types.bracketL.label:
                        this.raise('missing /');
                        return;
                    case types.backslash.label:
                        this.processBackSlash(nn, true);
                        break;
                    case types.range.label:
                        const lastChild = nn.children[nn.children.length - 1];
                        if (!lastChild || this.isRangeNode(lastChild)) {
                            nn.children.push(this.startNode('SourceCharacter', word));
                        }
                        else {
                            const range = this.startNode('CharacterRange', word);
                            range.children.push(lastChild);
                            if (this.processRange(range)) {
                                return;
                            }
                            if (range.closed) {
                                nn.children[nn.children.length - 1] = range;
                            }
                            else {
                                range.value = types.range.label;
                                const children = range.children;
                                range.children = [];
                                nn.children.push(range, ...children.slice(1));
                            }
                        }
                        break;
                    default:
                        nn.children.push(this.startNode('SourceCharacter', word));
                        break;
                }
            }
            node.children.push(nn);
            this.next(node);
        }
        processRange(node) {
            if (this.end <= this.pos) {
                this.raise('missing /');
                return;
            }
            const word = this.eatWord();
            switch (word) {
                case types.bracketR.label:
                    this.finishNode(node, 'SourceCharacter');
                    return;
                case types.bracketL.label:
                    this.raise('Range out of order in character class');
                    return true;
                case types.backslash.label:
                    this.processBackSlash(node, true);
                    if (this.isRangeNode(node.children[node.children.length - 1])) {
                        this.finishNode(node, 'SourceCharacter');
                        return;
                    }
                    node.closed = true;
                    return;
                case types.range.label:
                    const lastChild = node.children[node.children.length - 1];
                    if (lastChild && lastChild.type === 'CharacterRange' && !lastChild.closed) {
                        this.raise('Range out of order in character class');
                        return true;
                    }
                    return;
                default:
                    node.closed = true;
                    node.children.push(this.startNode('SourceCharacter', word));
                    return;
            }
        }
        // |
        processOr(node) {
            const an = this.startNode('AlternationExpression', types.or.label);
            const cn1 = this.startNode('ConcatenationExpression');
            const children = node.children;
            cn1.children = children;
            const cn2 = this.startNode('ConcatenationExpression');
            an.children.push(cn1, cn2);
            node.children = [an];
            this.next(cn2);
        }
        raise(e) {
            throw new SyntaxError(e);
        }
        // (
        processParenL(node) {
            const subNode = this.startNode('SubExpression');
            this.groups.push(subNode);
            node.children.push(subNode);
            if (this.end <= this.pos) {
                this.raise('Unterminated group');
                return;
            }
            subNode.parent = node;
            const w = this.eatWord() + this.eatWord();
            if (w === types.groupIs.label) {
                subNode.value = types.groupIs.label;
                this.next(subNode);
                return;
            }
            if (w === types.groupElse.label) {
                subNode.value = types.groupElse.label;
                this.next(subNode);
                return;
            }
            if (w === types.groupAtom.label) {
                subNode.value = types.groupAtom.label;
                this.next(subNode);
                return;
            }
            subNode.groupIndex = this.groupCount;
            this.groupCount = subNode.groupIndex + 1;
            this.pos -= 2;
            this.loc = this.pos;
            while (!subNode.closed) {
                if (this.end > this.pos) {
                    this.next(subNode);
                }
                else {
                    this.raise('Unterminated group');
                }
            }
        }
        addQuantifierPrefixNode(node, q) {
            const last = node.children[node.children.length - 1];
            if (last) {
                if (last.type === 'QuantifierPrefix') {
                    this.raise('Nothing to repeat');
                    return;
                }
                q.children.push(last);
                node.children[node.children.length - 1] = q;
            }
            else {
                if (node.type === 'SubExpression') {
                    this.raise('Invalid group');
                }
                else {
                    this.raise('Nothing to repeat');
                }
            }
        }
        // {
        processBracesL(node) {
            const nn = this.startNode('QuantifierPrefix', '{');
            while (this.end > this.pos && nn.type === 'QuantifierPrefix' && !nn.closed) {
                this.next(nn);
            }
            if (nn.type !== 'QuantifierPrefix' || !nn.closed) {
                this.finishNode(nn, 'PatternCharacter');
                nn.value = '{';
                const children = nn.children;
                nn.children = [];
                node.children.push(nn, ...children);
            }
            else {
                this.addQuantifierPrefixNode(node, nn);
            }
            this.next(node);
        }
        // }
        processBracesR(node) {
            if (node.type === 'QuantifierPrefix') {
                let value = '';
                for (let i = 0, len = node.children.length; i < len; i++) {
                    const item = node.children[i];
                    if (i === 0) {
                        if (item.type === 'PatternCharacter' && isInteger(item.value)) {
                            value += item.value;
                        }
                        else {
                            this.finishNode(node, 'PatternCharacter');
                            return;
                        }
                    }
                    else {
                        {
                            if (item.type === 'PatternCharacter' && item.value === ',') {
                                value += item.value;
                                continue;
                            }
                            if (item.type === 'PatternCharacter' && isInteger(item.value)) {
                                value += item.value;
                                continue;
                            }
                            else {
                                this.finishNode(node, 'PatternCharacter');
                                return;
                            }
                        }
                    }
                }
                node.children = [];
                node.closed = true;
                node.value = value;
            }
            else {
                node.children.push(this.startNode('PatternCharacter', '}'));
                this.next(node);
            }
        }
        next(node) {
            const w = this.eatWord();
            if (w) {
                this.parseWord(w, node);
            }
        }
        eatWord() {
            this.loc = this.pos;
            return this.readWord();
        }
        readWord() {
            this.pos++;
            return this.input.slice(this.loc, this.pos);
        }
    }

    const continuation = (x) => x;
    const baseMatcher = (m, anti = false) => {
        return (state, next) => {
            const { endIndex, input } = state;
            const code = canonicalize(input[endIndex + 1], state.option.ignoreCase);
            const i = m(code);
            const isTrue = anti ? !i : i;
            if (!isTrue) {
                return null;
            }
            state.endIndex = endIndex + 1;
            return next(state);
        };
    };
    const combineOrMatchers = (nodes, ctr, anti) => {
        const matchers = nodes.map(ctr);
        return function (state, next = continuation) {
            const { endIndex } = state;
            if (endIndex >= state.input.length - 1) {
                return null;
            }
            for (let i = 0; i < matchers.length; i++) {
                state.endIndex = endIndex;
                const m = matchers[i];
                if (anti) {
                    const r = m(state, continuation);
                    if (r) {
                        return null;
                    }
                }
                else {
                    const r = m(state, next);
                    if (r) {
                        return r;
                    }
                }
            }
            if (anti) {
                state.endIndex = endIndex + 1;
                return next(state);
            }
            return null;
        };
    };
    const combineSerialMatchers = (nodes, ctr, c = continuation) => {
        const ns = nodes.slice().reverse();
        let matcher = c;
        for (let i = 0; i < ns.length; i++) {
            const m = ctr(ns[i]);
            if (i === 0) {
                matcher = function (x) {
                    return m(x, c);
                };
                continue;
            }
            const n = matcher;
            matcher = function (x) {
                return m(x, n);
            };
        }
        return function (x, next) {
            c = next ? next : c;
            return matcher(x);
        };
    };
    const characterSetMatcher = (s, invert = false) => {
        return function (state, next) {
            const { endIndex } = state;
            if (endIndex === state.input.length - 1) {
                return null;
            }
            const ch = state.input[endIndex + 1];
            const cc = canonicalize(ch, state.option.ignoreCase);
            if (invert === false) {
                if (canonicalize(s, state.option.ignoreCase) !== cc) {
                    return null;
                }
            }
            else {
                if (canonicalize(s, state.option.ignoreCase) === cc) {
                    return null;
                }
            }
            const cap = state.captures;
            const y = { ...state, endIndex: endIndex + 1, captures: cap };
            return next(y);
        };
    };
    const repeatMatcher = (m, min, max, greedy, x, c, parenIndex, parenCount) => {
        if (max === 0) {
            return c(x);
        }
        const d = function (y) {
            if (min === 0 && y.endIndex === x.endIndex) {
                return null;
            }
            const min2 = min === 0 ? 0 : min - 1;
            const max2 = max === Infinity ? Infinity : max - 1;
            return repeatMatcher(m, min2, max2, greedy, y, c, parenIndex, parenCount);
        };
        const cap = [...x.captures];
        for (let k = parenIndex + 1; k <= parenIndex + parenCount; k++) {
            cap[k] = undefined;
        }
        const e = x.endIndex;
        const xr = {
            ...x,
            endIndex: e,
            captures: cap
        };
        if (min !== 0) {
            return m(xr, d);
        }
        if (greedy === false) {
            const z = c(x);
            if (z) {
                return z;
            }
            return m(xr, d);
        }
        const z = m(xr, d);
        if (z) {
            return z;
        }
        return c(x);
    };

    const beginningMatcher = () => {
        return function (state, next) {
            const { endIndex } = state;
            if ((endIndex + 1) !== 0) {
                if (state.option.multiline) {
                    if (isLineTerminator(state.input[endIndex])) {
                        return next(state);
                    }
                }
                return null;
            }
            return next(state);
        };
    };
    const endMatcher = () => {
        return function (state, next) {
            const { endIndex, input } = state;
            if (endIndex !== input.length - 1) {
                if (state.option.multiline) {
                    if (isLineTerminator(state.input[endIndex + 1])) {
                        return state;
                    }
                }
                return null;
            }
            return state;
        };
    };
    const getRangeMatcher = (nodes) => {
        return function (state, next) {
            const { endIndex } = state;
            const code = canonicalize(state.input[endIndex + 1], state.option.ignoreCase).charCodeAt(0);
            const [start, end] = nodes;
            let startValue = start.value || '';
            let endValue = end.value || '';
            if (start.type === 'ControllerEscape' || start.type === 'CharacterKey') {
                startValue = canonicalize(SPECIAL_CODES[startValue], state.option.ignoreCase);
            }
            const s = toCharCode(startValue);
            if (end.type === 'ControllerEscape' || end.type === 'CharacterKey') {
                endValue = canonicalize(SPECIAL_CODES[endValue], state.option.ignoreCase);
            }
            const e = toCharCode(endValue);
            const result = s <= code && e >= code;
            if (!result) {
                return null;
            }
            state.endIndex = endIndex + 1;
            return next(state);
        };
    };
    const getCharacterClassEscapeMatcher = (pattern) => {
        if (pattern === '\\d') {
            return baseMatcher(isInteger);
        }
        if (pattern === '\\D') {
            return baseMatcher(isInteger, true);
        }
        if (pattern === '\\s') {
            return baseMatcher(isSpace);
        }
        if (pattern === '\\S') {
            return baseMatcher(isSpace, true);
        }
        if (pattern === '\\w') {
            return baseMatcher(isWordChar2);
        }
        if (pattern === '\\W') {
            return baseMatcher(isWordChar2, true);
        }
    };
    const getWordCharMatch = (anti = false) => {
        return function (state, next) {
            const { endIndex: e, input } = state;
            const a = +isWordChar(e, input);
            const b = +isWordChar(e + 1, input);
            let result = !!(a ^ b);
            if (anti) {
                result = !result;
            }
            if (!result) {
                return null;
            }
            return next(state);
        };
    };
    const getDecimalEscapeMatcher = (node) => {
        let value = 0;
        if (node.value) {
            value = +node.value;
        }
        return function (state, next) {
            const { endIndex } = state;
            const cap = state.captures[value];
            if (typeof cap !== 'string') {
                return next(state);
            }
            const s = state.input.slice(endIndex + 1, cap.length + endIndex + 1);
            if (cap.length !== s.length) {
                return null;
            }
            for (let i = 0; i < cap.length; i++) {
                if (canonicalize(cap[i], state.option.ignoreCase) !== canonicalize(s[i], state.option.ignoreCase)) {
                    return null;
                }
            }
            state.endIndex = endIndex + cap.length;
            return next(state);
        };
    };
    const getCharacterClassMatcher = (node) => {
        let isAnti = false;
        let children = [];
        if (node.children[0].type === 'CharacterClassAnti') {
            isAnti = true;
            children = node.children.slice(1);
        }
        else {
            children = node.children;
        }
        return combineOrMatchers(children, getBaseMatcher, isAnti);
    };
    // |
    const getAlternationExpressionMatcher = (node) => {
        const m1 = combineSerialMatchers(node.children[0].children, getBaseMatcher);
        const m2 = combineSerialMatchers(node.children[1].children, getBaseMatcher);
        return function (state, next) {
            return m1(state, next) || m2(state, next);
        };
    };
    // ()
    const getSubExpressionMatcher = (node) => {
        const m = combineSerialMatchers(node.children, getBaseMatcher);
        if (node.value === '?=') {
            return function (state, next) {
                const { endIndex } = state;
                const r = m(state);
                if (!r) {
                    return r;
                }
                const cap = r.captures;
                const xe = endIndex;
                const z = { ...state, endIndex: xe, captures: cap };
                return next(z);
            };
        }
        if (node.value === '?!') {
            return function (state, next) {
                const x = { ...state };
                const r = m(state, continuation);
                if (r) {
                    return null;
                }
                return next(x);
            };
        }
        if (node.value === '?:') {
            return m;
        }
        return function (state, next) {
            const xe = state.endIndex;
            const d = function (y) {
                const cap = [...y.captures];
                const ye = y.endIndex;
                const s = state.input.slice(xe + 1, ye + 1);
                cap[(node.groupIndex || 0) + 1] = s;
                const z = {
                    ...state,
                    endIndex: ye,
                    captures: cap
                };
                return next(z);
            };
            return m(state, d);
        };
    };
    const getQuantifierPrefixMatcher = (node) => {
        const m = getBaseMatcher(node.children[0]);
        const { min, max, greedy } = evaluateQuantifierValue(node);
        if (max < min) {
            throw new SyntaxError('');
        }
        const parenCount = getParenCountByAtom(node);
        return function (state, next) {
            const parenIndex = getParenIndexByNode(node, state.option.nodes);
            return repeatMatcher(m, min, max, !!greedy, state, next, parenIndex, parenCount);
        };
    };
    const getClassEscapeMatcher = (node) => {
        if (node.value === '[\\b]') {
            return characterSetMatcher('\u0008');
        }
    };
    const getCharacterKeyMatcher = (node) => {
        if (node.value === '\\0') {
            return characterSetMatcher(canonicalize(SPECIAL_CODES[node.value]));
        }
    };
    const getBaseMatcher = (node) => {
        if (node.type === 'PatternCharacter' || node.type === 'SourceCharacter') {
            return characterSetMatcher(node.value || '');
        }
        if (node.type === 'Atom' && node.value === '.') {
            return characterSetMatcher(SPECIAL_CODES['\\n'], true);
        }
        if (node.type === 'Assertion') {
            if (node.value == '^') {
                return beginningMatcher();
            }
            return endMatcher();
        }
        if (node.type === 'HexEscapeSequence') {
            return characterSetMatcher(toCode(node.value || ''));
        }
        if (node.type === 'UnicodeEscapeSequence') {
            return characterSetMatcher(toCode(node.value || ''));
        }
        if (node.type === 'CharacterRange') {
            return getRangeMatcher(node.children);
        }
        if (node.type === 'ControllerEscape') {
            return characterSetMatcher(SPECIAL_CODES[node.value || '']);
        }
        if (node.type === 'CharacterClassEscape') {
            return getCharacterClassEscapeMatcher(node.value || '');
        }
        if (node.type === 'AssertionEscape') {
            return getWordCharMatch(node.value === '\\B');
        }
        if (node.type === 'CharacterClass') {
            return getCharacterClassMatcher(node);
        }
        if (node.type === 'AlternationExpression') {
            return getAlternationExpressionMatcher(node);
        }
        if (node.type === 'SubExpression') {
            return getSubExpressionMatcher(node);
        }
        if (node.type === 'QuantifierPrefix') {
            return getQuantifierPrefixMatcher(node);
        }
        if (node.type === 'DecimalEscape') {
            return getDecimalEscapeMatcher(node);
        }
        if (node.type === 'ClassEscape') {
            return getClassEscapeMatcher(node);
        }
        if (node.type === 'CharacterKey') {
            return getCharacterKeyMatcher(node);
        }
    };
    const getMatcher = (node, option = {}) => {
        const m = combineSerialMatchers(node.children, getBaseMatcher);
        return function (input, i) {
            return m({ endIndex: i - 1, input, captures: [], option: { ...option, nodes: node.children } });
        };
    };

    class RegExp2 {
        constructor(reg, flag) {
            this.source = '';
            this.global = false;
            this.ignoreCase = false;
            this.multiline = false;
            this.lastIndex = 0;
            this.source = reg;
            if (flag) {
                this.global = flag.indexOf('g') > -1;
                this.ignoreCase = flag.indexOf('i') > -1;
                this.multiline = flag.indexOf('m') > -1;
            }
            const parse = new Parser(reg);
            this.matcher = getMatcher(parse.node, {
                global: this.global,
                ignoreCase: this.ignoreCase,
                multiline: this.multiline,
            });
        }
        exec(s) {
            const len = s.length;
            let i = this.lastIndex;
            if (this.global === false) {
                i = 0;
            }
            let matchSucceeded = false;
            let r = null;
            while (matchSucceeded === false) {
                if (i < 0 || i > len) {
                    this.lastIndex = 0;
                    return null;
                }
                r = this.matcher(s, i);
                if (r) {
                    matchSucceeded = true;
                }
                else {
                    i = i + 1;
                }
            }
            if (!r) {
                return null;
            }
            const e = r.endIndex;
            if (this.global) {
                this.lastIndex = e;
            }
            const n = r.captures.length;
            const a = [];
            const matchIndex = i;
            a.index = matchIndex;
            a.input = s;
            a.length = n;
            const matchedSubstr = s.slice(i, e + 1);
            a[0] = matchedSubstr;
            for (let j = 1; j < n; j++) {
                a[j] = r.captures[j];
            }
            return a;
        }
    }

    return RegExp2;

})));
//# sourceMappingURL=bundle.umd.js.map
