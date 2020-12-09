import { Node } from "./node";

const words = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'.split('')

export const toUnicode = function (theString: string) {
    let unicodeString = '';
    for (let i = 0; i < theString.length; i++) {
        let theUnicode = theString.charCodeAt(i).toString(16).toUpperCase();
        while (theUnicode.length < 4) {
            theUnicode = '0' + theUnicode;
        }
        theUnicode = '\\u' + theUnicode;
        unicodeString += theUnicode;
    }
    return unicodeString;
}

export const toHex = function (theString: string) {
    let unicodeString = '';
    for (let i = 0; i < theString.length; i++) {
        let theUnicode = theString.charCodeAt(i).toString(16).toUpperCase();
        while (theUnicode.length < 2) {
            theUnicode = '0' + theUnicode;
        }
        theUnicode = '\\x' + theUnicode;
        unicodeString += theUnicode;
    }
    return unicodeString;
}


export const toCharCode = function (escapeString: string) {
    if (escapeString.indexOf('\\') === 0 && escapeString.length > 1) {
        return eval(`"${escapeString}"`).charCodeAt(0)
    }
    return escapeString.charCodeAt(0)
}

export const toCode = function (escapeString: string) {
    if (escapeString.indexOf('\\') === 0 && escapeString.length > 1) {
        return eval(`"${escapeString}"`)
    }
    return escapeString
}

const integers = '0123456789'.split('')

export const isInteger = (s: string | undefined) => {
    if (typeof s === 'string') {
        for (let i = 0; i < integers.length; i++) {
            if (integers[i] === s) {
                return true
            }
        }
    }

    return false;
}

export const isWordChar = (e: number, input: string) => {
    if (e === -1 || e === input.length) {
        return false
    }
    const c = input[e]
    return isWordChar2(c)
}

export const isWordChar2 = (c: string) => {
    return words.indexOf(c) > -1
}


const f = '\u000C', n = '\u000A', r = '\u000D', t = '\u0009', v = '\u000B', o = '\u0000', d = '0123456789';
const s = f + n + r + t + v + '\u0020\u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff'

export const SPECIAL_CODES: { [k: string]: string } = {
    '\\f': f,
    '\\n': n,
    '\\r': r,
    '\\t': t,
    '\\v': v,
    '\\0': o
}

export const isSpace = (code: string) => {
    return s.indexOf(code) > -1;
}

const LineTerminator = ['\u000A', '\u000D', '\u2028', '\u2029']

export const isLineTerminator = (code: string) => {
    return LineTerminator.indexOf(code) > -1;
}

export const evaluateQuantifierValue = (node: Node) => {
    const greedy = node.greedy;
    const value = node.value || '';
    let min = 0;
    let max = 0;
    if (value === '*') {
        max = Infinity
        return {
            min,
            max,
            greedy
        }
    }
    if (value === '+') {
        min = 1
        max = Infinity
        return {
            min,
            max,
            greedy
        }
    }
    if (value === '?') {
        min = 0
        max = 1
        return {
            min,
            max,
            greedy
        }
    }
    const input = value.split(',')
    min = +input[0]
    max = input[1] ? +input[1] : Infinity
    return {
        min,
        max,
        greedy
    }
}

export const getParenCountByAtom = (node: Node): number => {
    if (node.children.length) {
        return +(node.type === 'SubExpression' && Number.isFinite(node.groupIndex)) + node.children.reduce((accumulator, item) => {
            return getParenCountByAtom(item) + accumulator
        }, 0)
    }
    return +(node.type === 'SubExpression' && Number.isFinite(node.groupIndex))
}

export const getParenIndexByNode = (node: Node, nodes: Node[], index = 0): number => {
    const getIndex = (nodes: Node[]) => {
        for (let i = 0, len = nodes.length; i < len; i++) {
            const n = nodes[i]
            if (Number.isFinite(n.groupIndex) && typeof n.groupIndex !== 'undefined') {
                index++
            }
            if (node === n) {
                return true
            }
            if (n.children.length) {
                if (getIndex(n.children)) {
                    return true
                }
            }
        }
        return false
    }
    getIndex(nodes)
    return index
}

export const canonicalize = (ch: string, ignoreCase = false) => {
    if (!ignoreCase) {
        return ch
    }
    const u = ch.toUpperCase();
    if (u.length !== 1) {
        return ch
    }
    const cu = u
    if (ch.charCodeAt(0) >= 128 && cu.charCodeAt(0) < 128) {
        return ch
    }
    return cu
}
