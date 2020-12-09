import { isInteger } from './util'
import { Node, NodeProcesser } from './node'

class TokenType {
    label = ''
    conf = {}
    constructor(label: string, conf = {}) {
        this.label = label
        this.conf = conf
    }
}

const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const HexDigits = '0123456789ABCDEFabcdef'.split('')

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
}

const keyCodes = '\\^$|*+?.{['

export class Parser extends NodeProcesser {
    input = ''
    loc = 0
    pos = 0
    end = 0
    groups: Node[] = []
    node: Node = this.startNode('RegularExpressions')
    groupCount = 0
    constructor(str: string) {
        super()
        this.input = str
        this.end = str.length
        this.parse()
    }
    isRangeNode(node: Node) {
        if (node.type === 'CharacterClassEscape' || node.type === 'CharacterRange' || node.type === 'assertionEscape' || node.type === 'CharacterClassAnti') {
            return true
        }
        return false
    }
    parse() {
        this.pos = 0
        this.parseStart()
    }
    parseStart() {
        const node = this.node
        while (this.end > this.pos) {
            this.next(node);
        }
    }
    parseWord(w: string, node: Node) {
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
                const nn = this.startNode('QuantifierPrefix', w)
                this.addQuantifierPrefixNode(node, nn)
                this.next(node);
                break;
            case types.dot.label:
                node.children.push(this.startNode('Atom', w))
                this.next(node);
                break;
            case types.parenL.label:
                this.processParenL(node);
                break;
            case types.parenR.label:
                const lastg = this.groups[this.groups.length - 1];
                if (lastg && !lastg.closed) {
                    lastg.closed = true
                    this.groups.splice(-1, 1)
                    if (lastg.parent) {
                        this.next(lastg.parent)
                    }
                } else {
                    this.raise(`Unmatched ')'`)
                }
                break;
            case types.bracesL.label:
                this.processBracesL(node);
                break;
            case types.bracesR.label:
                this.processBracesR(node);
                break;
            case types.bracketL.label:
                this.processBracket(node)
                break;
            case types.end.label:
                node.children.push(this.startNode('Assertion', w))
                this.next(node);
                break;
            case types.or.label:
                this.processOr(node);
                break;
            default:
                node.children.push(this.startNode('PatternCharacter', w))
                this.next(node);
                break;
        }
    }
    // ?
    processGreedy(node: Node) {
        const last = node.children[node.children.length - 1]
        if (last) {
            if (last.type === 'QuantifierPrefix') {
                if (last.greedy) {
                    last.greedy = false
                    return true
                } else {
                    this.raise('Nothing to repeat')
                }
            }
        }
    }
    // \
    processBackSlash(node: Node, inBracket = false) {
        while (true) {
            const w = this.readWord();
            if (!w) {
                return
            }
            if (w[1] === '\\') {
                node.children.push(this.startNode('PatternCharacter', w[1]))
                break;
            }
            if (w[1] === '^') {
                node.children.push(this.startNode('PatternCharacter', w[1]))
                break;
            }
            if (keyCodes.indexOf(w[1]) > -1) {
                if (inBracket) {
                    node.children.push(this.startNode('PatternCharacter', '\\'))
                }
                node.children.push(this.startNode('PatternCharacter', w[1]))
                break
            }
            if (this.processEscape(node, w)) {
                break;
            }
            if (!isInteger(w.slice(-1))) {
                const value = w.substr(1, w.length - 2)
                if (isInteger(value)) {
                    node.children.push(this.startNode('DecimalEscape', value))
                } else {
                    node.children.push(this.startNode('PatternCharacter', w.substr(1)))
                }
                this.pos--;
                break;
            }
            if (this.pos >= this.end) {
                const value = w.substr(1)
                if (isInteger(value)) {
                    node.children.push(this.startNode('DecimalEscape', value))
                } else {
                    node.children.push(this.startNode('PatternCharacter', w.substr(1)))
                }
                return;
            }
        }
    }
    // \
    processEscape(node: Node, w: string) {
        // TODO
        if (w === types.controlLetter.label) {
            const n = this.startNode('ControlLetter')
            node.children.push(n)
            if (this.end <= this.pos) {
                this.raise('\\ at end of pattern')
                return;
            }
            const word = this.eatWord()
            if (letters.includes(word)) {
                n.value = word
            } else {
                this.parseWord(word, node)
            }
            return true
        }
        if (w === types.hexadecimal.label) {
            const n = this.startNode('HexEscapeSequence')
            node.children.push(n)
            const word = [this.eatWord(), this.eatWord()];
            if (HexDigits.includes(word[0]) && HexDigits.includes(word[1])) {
                n.value = word.join('')
                return true
            }
            this.pos -= 2
            this.loc = this.pos
            return true
        }
        if (w === types.unicode.label) {
            const n = this.startNode('UnicodeEscapeSequence')
            node.children.push(n)
            const word = [this.eatWord(), this.eatWord(), this.eatWord(), this.eatWord()];
            if (HexDigits.includes(word[0]) && HexDigits.includes(word[1]) && HexDigits.includes(word[2]) && HexDigits.includes(word[3])) {
                n.value = w + word.join('')
                return true
            }
            this.pos -= 4
            this.loc = this.pos
            return true
        }
        const each = (list: TokenType[], type: string) => {
            for (let i = 0, len = list.length; i < len; i++) {
                const kws = list[i];
                if (kws.label === w) {
                    node.children.push(this.startNode(type, w));
                    return true
                }
            }
            return false
        }
        return each(types.kws, 'CharacterKey') || each(types.controllerEscape, 'ControllerEscape') || each(types.characterClassEscape, 'CharacterClassEscape') || each(types.assertionEscape, 'AssertionEscape')
    }
    // [
    processBracket(node: Node) {
        const w = this.input.slice(this.loc, this.loc + 4);
        if (w === types.backspace.label) {
            const nn = this.startNode('ClassEscape', types.backspace.label)
            node.children.push(nn)
            this.loc = this.loc + 4
            this.pos = this.loc
            this.next(node)
            return
        }
        const nn = this.startNode('CharacterClass')
        while (true) {
            if (this.end <= this.pos) {
                this.raise('missing /')
                return;
            }
            const word = this.eatWord();
            if (word === types.bracketR.label) {
                nn.closed = true;
                break
            }
            switch (word) {
                case types.anti.label:
                    if (nn.children.length === 0) {
                        nn.children.push(this.startNode('CharacterClassAnti'))
                    } else {
                        nn.children.push(this.startNode('SourceCharacter', word))
                    }
                    break;
                case types.bracketL.label:
                    this.raise('missing /')
                    return;
                case types.backslash.label:
                    this.processBackSlash(nn, true);
                    break;
                case types.range.label:
                    const lastChild = nn.children[nn.children.length - 1]
                    if (!lastChild || this.isRangeNode(lastChild)) {
                        nn.children.push(this.startNode('SourceCharacter', word))
                    } else {
                        const range = this.startNode('CharacterRange', word)
                        range.children.push(lastChild)
                        if (this.processRange(range)) {
                            return;
                        }
                        if (range.closed) {
                            nn.children[nn.children.length - 1] = range
                        } else {
                            range.value = types.range.label
                            const children = range.children
                            range.children = []
                            nn.children.push(range, ...children.slice(1))
                        }
                    }
                    break;
                default:
                    nn.children.push(this.startNode('SourceCharacter', word))
                    break;
            }
        }
        node.children.push(nn)
        this.next(node)
    }

    processRange(node: Node) {
        if (this.end <= this.pos) {
            this.raise('missing /')
            return;
        }
        const word = this.eatWord();
        switch (word) {
            case types.bracketR.label:
                this.finishNode(node, 'SourceCharacter')
                return;
            case types.bracketL.label:
                this.raise('Range out of order in character class')
                return true;
            case types.backslash.label:
                this.processBackSlash(node, true);
                if (this.isRangeNode(node.children[node.children.length - 1])) {
                    this.finishNode(node, 'SourceCharacter')
                    return;
                }
                node.closed = true
                return;
            case types.range.label:
                const lastChild = node.children[node.children.length - 1]
                if (lastChild && lastChild.type === 'CharacterRange' && !lastChild.closed) {
                    this.raise('Range out of order in character class')
                    return true;
                }
                return;
            default:
                node.closed = true
                node.children.push(this.startNode('SourceCharacter', word))
                return
        }
    }
    // |
    processOr(node: Node) {
        const an = this.startNode('AlternationExpression', types.or.label)
        const cn1 = this.startNode('ConcatenationExpression')
        const children = node.children
        cn1.children = children
        const cn2 = this.startNode('ConcatenationExpression')
        an.children.push(cn1, cn2)
        node.children = [an]
        this.next(cn2)
    }
    raise(e: string) {
        throw new SyntaxError(e)
    }
    // (
    processParenL(node: Node) {
        const subNode = this.startNode('SubExpression')
        this.groups.push(subNode);
        node.children.push(subNode)
        if (this.end <= this.pos) {
            this.raise('Unterminated group')
            return
        }
        subNode.parent = node
        const w = this.eatWord() + this.eatWord();
        if (w === types.groupIs.label) {
            subNode.value = types.groupIs.label
            this.next(subNode);
            return
        }
        if (w === types.groupElse.label) {
            subNode.value = types.groupElse.label
            this.next(subNode);
            return
        }
        if (w === types.groupAtom.label) {
            subNode.value = types.groupAtom.label
            this.next(subNode);
            return;
        }
        subNode.groupIndex = this.groupCount
        this.groupCount = subNode.groupIndex + 1
        this.pos -= 2
        this.loc = this.pos;
        while (!subNode.closed) {
            if (this.end > this.pos) {
                this.next(subNode);
            } else {
                this.raise('Unterminated group')
            }
        }
    }
    addQuantifierPrefixNode(node: Node, q: Node) {
        const last = node.children[node.children.length - 1]
        if (last) {
            if (last.type === 'QuantifierPrefix') {
                this.raise('Nothing to repeat')
                return
            }
            q.children.push(last)
            node.children[node.children.length - 1] = q
        } else {
            if (node.type === 'SubExpression') {
                this.raise('Invalid group')
            } else {
                this.raise('Nothing to repeat')
            }
        }
    }
    // {
    processBracesL(node: Node) {
        const nn = this.startNode('QuantifierPrefix', '{')
        while (this.end > this.pos && nn.type === 'QuantifierPrefix' && !nn.closed) {
            this.next(nn)
        }
        if (nn.type !== 'QuantifierPrefix' || !nn.closed) {
            this.finishNode(nn, 'PatternCharacter')
            nn.value = '{'
            const children = nn.children
            nn.children = []
            node.children.push(nn, ...children)
        } else {
            this.addQuantifierPrefixNode(node, nn)
        }
        this.next(node)
    }
    // }
    processBracesR(node: Node) {
        if (node.type === 'QuantifierPrefix') {
            const hasComma = false
            let value = ''
            for (let i = 0, len = node.children.length; i < len; i++) {
                const item = node.children[i]
                if (i === 0) {
                    if (item.type === 'PatternCharacter' && isInteger(item.value)) {
                        value += item.value;
                    } else {
                        this.finishNode(node, 'PatternCharacter')
                        return;
                    }
                } else {
                    if (!hasComma) {
                        if (item.type === 'PatternCharacter' && item.value === ',') {
                            value += item.value;
                            continue
                        }
                        if (item.type === 'PatternCharacter' && isInteger(item.value)) {
                            value += item.value;
                            continue
                        } else {
                            this.finishNode(node, 'PatternCharacter')
                            return;
                        }
                    }
                    if (item.type === 'PatternCharacter' && isInteger(item.value)) {
                        value += item.value;
                    } else {
                        this.finishNode(node, 'PatternCharacter')
                        return;
                    }
                }
            }
            node.children = []
            node.closed = true
            node.value = value
        } else {
            node.children.push(this.startNode('PatternCharacter', '}'))
            this.next(node)
        }
    }
    next(node: Node) {
        const w = this.eatWord()
        if (w) {
            this.parseWord(w, node)
        }
    }
    eatWord() {
        this.loc = this.pos
        return this.readWord()
    }
    readWord() {
        this.pos++
        return this.input.slice(this.loc, this.pos)
    }
}
