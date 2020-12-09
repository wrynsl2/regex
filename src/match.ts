import {
    isWordChar,
    isWordChar2, toCharCode, isInteger, isSpace, SPECIAL_CODES, isLineTerminator, evaluateQuantifierValue,
    getParenCountByAtom,
    canonicalize,
    toCode,
    getParenIndexByNode
} from './util'
import { Node } from './node'
import {
    baseMatcher,
    combineOrMatchers,
    combineSerialMatchers,
    characterSetMatcher,
    repeatMatcher,
    State,
    Next,
    continuation
} from './m'

const beginningMatcher = () => {
    return function (state: State, next: Next) {
        const { endIndex } = state;
        if ((endIndex + 1) !== 0) {
            if (state.option.multiline) {
                if (isLineTerminator(state.input[endIndex])) {
                    return next(state)
                }
            }
            return null
        }
        return next(state)
    }
}

const endMatcher = () => {
    return function (state: State, next: Next) {
        const { endIndex, input } = state;
        if (endIndex !== input.length - 1) {
            if (state.option.multiline) {
                if (isLineTerminator(state.input[endIndex + 1])) {
                    return state
                }
            }
            return null
        }
        return state
    }
}

const getRangeMatcher = (nodes: Node[]) => {
    return function (state: State, next: Next) {
        const { endIndex } = state;
        const code = canonicalize(state.input[endIndex + 1], state.option.ignoreCase).charCodeAt(0);
        const [start, end] = nodes;
        let startValue = start.value || '';
        let endValue = end.value || '';
        if (start.type === 'ControllerEscape' || start.type === 'CharacterKey') {
            startValue = canonicalize(SPECIAL_CODES[startValue], state.option.ignoreCase)
        }
        const s = toCharCode(startValue)
        if (end.type === 'ControllerEscape' || end.type === 'CharacterKey') {
            endValue = canonicalize(SPECIAL_CODES[endValue], state.option.ignoreCase)
        }
        const e = toCharCode(endValue)
        const result = s <= code && e >= code
        if (!result) {
            return null
        }
        state.endIndex = endIndex + 1
        return next(state)
    }
}

const getCharacterClassEscapeMatcher = (pattern: string) => {
    if (pattern === '\\d') {
        return baseMatcher(isInteger)
    }
    if (pattern === '\\D') {
        return baseMatcher(isInteger, true)
    }
    if (pattern === '\\s') {
        return baseMatcher(isSpace)
    }
    if (pattern === '\\S') {
        return baseMatcher(isSpace, true)
    }
    if (pattern === '\\w') {
        return baseMatcher(isWordChar2)
    }
    if (pattern === '\\W') {
        return baseMatcher(isWordChar2, true)
    }
}

const getWordCharMatch = (anti = false) => {
    return function (state: State, next: Next) {
        const { endIndex: e, input } = state
        const a = +isWordChar(e, input)
        const b = +isWordChar(e + 1, input);
        let result = !!(a ^ b)
        if (anti) {
            result = !result
        }
        if (!result) {
            return null
        }
        return next(state)
    }
}

const getDecimalEscapeMatcher = (node: Node) => {
    let value = 0
    if (node.value) {
        value = +node.value
    }
    return function (state: State, next: Next) {
        const { endIndex } = state
        const cap = state.captures[value]
        if (typeof cap !== 'string') {
            return next(state)
        }
        const s = state.input.slice(endIndex + 1, cap.length + endIndex + 1)
        if (cap.length !== s.length) {
            return null
        }
        for (let i = 0; i < cap.length; i++) {
            if (canonicalize(cap[i], state.option.ignoreCase) !== canonicalize(s[i], state.option.ignoreCase)) {
                return null
            }
        }
        state.endIndex = endIndex + cap.length
        return next(state)
    }
}

const getCharacterClassMatcher = (node: Node) => {
    let isAnti = false
    let children = []
    if (node.children[0].type === 'CharacterClassAnti') {
        isAnti = true
        children = node.children.slice(1)
    } else {
        children = node.children
    }
    return combineOrMatchers(children, getBaseMatcher, isAnti)
}

// |
const getAlternationExpressionMatcher = (node: Node) => {
    const m1 = combineSerialMatchers(node.children[0].children, getBaseMatcher)
    const m2 = combineSerialMatchers(node.children[1].children, getBaseMatcher)
    return function (state: State, next: Next) {
        return m1(state, next) || m2(state, next)
    }
}

// ()
const getSubExpressionMatcher = (node: Node) => {
    const m = combineSerialMatchers(node.children, getBaseMatcher);
    if (node.value === '?=') {
        return function (state: State, next: Next) {
            const { endIndex } = state
            const r = m(state)
            if (!r) {
                return r
            }
            const cap = r.captures
            const xe = endIndex
            const z = { ...state, endIndex: xe, captures: cap }
            return next(z)
        }
    }
    if (node.value === '?!') {
        return function (state: State, next: Next) {
            const x = { ...state }
            const r = m(state, continuation)
            if (r) {
                return null
            }
            return next(x)
        }
    }
    if (node.value === '?:') {
        return m
    }
    return function (state: State, next: Next) {
        const xe = state.endIndex;
        const d = function (y: State) {
            const cap = [...y.captures];
            const ye = y.endIndex;
            const s = state.input.slice(xe + 1, ye + 1)
            cap[(node.groupIndex || 0) + 1] = s;
            const z = {
                ...state,
                endIndex: ye,
                captures: cap
            }
            return next(z)
        }
        return m(state, d)
    }
}

const getQuantifierPrefixMatcher = (node: Node) => {
    const m = getBaseMatcher(node.children[0])
    const { min, max, greedy } = evaluateQuantifierValue(node);
    if (max < min) {
        throw new SyntaxError('')
    }
    const parenCount = getParenCountByAtom(node)
    return function (state: State, next: Next) {
        const parenIndex = getParenIndexByNode(node, state.option.nodes)
        return repeatMatcher(m, min, max, !!greedy, state, next, parenIndex, parenCount)
    }
}

const getClassEscapeMatcher = (node: Node) => {
    if (node.value === '[\\b]') {
        return characterSetMatcher('\u0008')
    }
}

const getCharacterKeyMatcher = (node: Node) => {
    if (node.value === '\\0') {
        return characterSetMatcher(canonicalize(SPECIAL_CODES[node.value]))
    }
}


const getBaseMatcher = (node: Node): any => {
    if (node.type === 'PatternCharacter' || node.type === 'SourceCharacter') {
        return characterSetMatcher(node.value || '')
    }
    if (node.type === 'Atom' && node.value === '.') {
        return characterSetMatcher(SPECIAL_CODES['\\n'], true)
    }
    if (node.type === 'Assertion') {
        if (node.value == '^') {
            return beginningMatcher()
        }
        return endMatcher()
    }
    if (node.type === 'HexEscapeSequence') {
        return characterSetMatcher(toCode(node.value || ''))
    }
    if (node.type === 'UnicodeEscapeSequence') {
        return characterSetMatcher(toCode(node.value || ''))
    }
    if (node.type === 'CharacterRange') {
        return getRangeMatcher(node.children)
    }
    if (node.type === 'ControllerEscape') {
        return characterSetMatcher(SPECIAL_CODES[node.value || ''])
    }
    if (node.type === 'CharacterClassEscape') {
        return getCharacterClassEscapeMatcher(node.value || '')
    }
    if (node.type === 'AssertionEscape') {
        return getWordCharMatch(node.value === '\\B')
    }
    if (node.type === 'CharacterClass') {
        return getCharacterClassMatcher(node)
    }
    if (node.type === 'AlternationExpression') {
        return getAlternationExpressionMatcher(node)
    }
    if (node.type === 'SubExpression') {
        return getSubExpressionMatcher(node)
    }
    if (node.type === 'QuantifierPrefix') {
        return getQuantifierPrefixMatcher(node)
    }
    if (node.type === 'DecimalEscape') {
        return getDecimalEscapeMatcher(node)
    }
    if (node.type === 'ClassEscape') {
        return getClassEscapeMatcher(node)
    }
    if (node.type === 'CharacterKey') {
        return getCharacterKeyMatcher(node)
    }
}

export const getMatcher = (node: Node, option: { [k: string]: any } = {}) => {
    const m = combineSerialMatchers(node.children, getBaseMatcher)
    return function (input: string, i: number) {
        return m({ endIndex: i - 1, input, captures: [], option: { ...option, nodes: node.children } })
    }
}
