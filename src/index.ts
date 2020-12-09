import { Parser } from './parser';
import { getMatcher } from './match';
import { State } from './m'

export default class RegExp2 {
    source = ''
    global = false
    ignoreCase = false
    multiline = false
    lastIndex = 0
    private matcher: (s: string, i: number) => State | null
    constructor(reg: string, flag?: string) {
        this.source = reg
        if (flag) {
            this.global = flag.indexOf('g') > -1
            this.ignoreCase = flag.indexOf('i') > -1
            this.multiline = flag.indexOf('m') > -1
        }
        const parse = new Parser(reg)
        this.matcher = getMatcher(parse.node, {
            global: this.global,
            ignoreCase: this.ignoreCase,
            multiline: this.multiline,
        })
    }
    exec(s: string) {
        const len = s.length
        let i = this.lastIndex
        if (this.global === false) {
            i = 0
        }
        let matchSucceeded = false
        let r: State | null = null
        while (matchSucceeded === false) {
            if (i < 0 || i > len) {
                this.lastIndex = 0
                return null
            }
            r = this.matcher(s, i)
            if (r) {
                matchSucceeded = true
            } else {
                i = i + 1
            }
        }
        if (!r) {
            return null
        }
        const e = r.endIndex
        if (this.global) {
            this.lastIndex = e
        }
        const n = r.captures.length
        const a: any = []
        const matchIndex = i
        a.index = matchIndex
        a.input = s;
        a.length = n
        const matchedSubstr = s.slice(i, e + 1)
        a[0] = matchedSubstr
        for (let j = 1; j < n; j++) {
            a[j] = r.captures[j]
        }
        return a
    }
}