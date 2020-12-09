import { Node } from './node';
import { canonicalize } from './util'

export interface State {
    endIndex: number
    captures: (string | undefined)[]
    input: string
    option: {
        ignoreCase?: boolean
        multiline?: boolean
        nodes: Node[]
    }
}

export type Matcher = (x: State, m?: Next) => State | null

export type Next = (x: State) => State | null

export const continuation = (x: State) => x

export const baseMatcher = (m: (x: string) => boolean, anti = false) => {
    return (state: State, next: Next) => {
        const { endIndex, input } = state;
        const code = canonicalize(input[endIndex + 1], state.option.ignoreCase)
        const i = m(code);
        const isTrue = anti ? !i : i
        if (!isTrue) {
            return null
        }
        state.endIndex = endIndex + 1
        return next(state)
    }
}

export const combineOrMatchers = (nodes: Node[], ctr: (node: Node) => any, anti?: boolean) => {
    const matchers = nodes.map(ctr)
    return function (state: State, next: Next = continuation) {
        const { endIndex } = state
        if (endIndex >= state.input.length - 1) {
            return null
        }
        for (let i = 0; i < matchers.length; i++) {
            state.endIndex = endIndex
            const m = matchers[i]
            if (anti) {
                const r = m(state, continuation)
                if (r) {
                    return null
                }
            } else {
                const r = m(state, next)
                if (r) {
                    return r
                }
            }
        }
        if (anti) {
            state.endIndex = endIndex + 1
            return next(state)
        }
        return null
    }
}

export const combineSerialMatchers = (nodes: Node[], ctr: (node: Node) => any, c: Next = continuation) => {
    const ns = nodes.slice().reverse();
    let matcher = c
    for (let i = 0; i < ns.length; i++) {
        const m = ctr(ns[i])
        if (i === 0) {
            matcher = function (x) {
                return m(x, c)
            }
            continue
        }
        const n = matcher
        matcher = function (x) {
            return m(x, n)
        }
    }
    return function (x: State, next?: Next) {
        c = next ? next : c
        return matcher(x)
    }
}

export const characterSetMatcher = (s: string, invert = false) => {
    return function (state: State, next: Next) {
        const { endIndex } = state
        if (endIndex === state.input.length - 1) {
            return null
        }
        const ch = state.input[endIndex + 1]
        const cc = canonicalize(ch, state.option.ignoreCase)
        if (invert === false) {
            if (canonicalize(s, state.option.ignoreCase) !== cc) {
                return null
            }
        } else {
            if (canonicalize(s, state.option.ignoreCase) === cc) {
                return null
            }
        }
        const cap = state.captures
        const y = { ...state, endIndex: endIndex + 1, captures: cap }
        return next(y)
    }
}

export const repeatMatcher = (m: Matcher, min: number, max: number, greedy: boolean, x: State, c: Next, parenIndex: number, parenCount: number) => {
    if (max === 0) {
        return c(x)
    }
    const d: Next = function (y: State) {
        if (min === 0 && y.endIndex === x.endIndex) {
            return null
        }
        const min2 = min === 0 ? 0 : min - 1;
        const max2 = max === Infinity ? Infinity : max - 1
        return repeatMatcher(m, min2, max2, greedy, y, c, parenIndex, parenCount)
    }
    const cap = [...x.captures]
    for (let k = parenIndex + 1; k <= parenIndex + parenCount; k++) {
        cap[k] = undefined
    }
    const e = x.endIndex
    const xr = {
        ...x,
        endIndex: e,
        captures: cap
    }
    if (min !== 0) {
        return m(xr, d)
    }
    if (greedy === false) {
        const z = c(x)
        if (z) {
            return z
        }
        return m(xr, d)
    }
    const z = m(xr, d)
    if (z) {
        return z
    }
    return c(x)
}
