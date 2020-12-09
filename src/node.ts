export class Node {
    type = ''
    children: Node[] = []
    value?: string
    closed?: boolean
    parent?: Node
    greedy?: boolean = true
    groupIndex?: number
    constructor(type: string, value: string) {
        this.type = type
        this.value = value
    }
}

export class NodeProcesser {
    startNode(type = '', value = '') {
        return new Node(type, value)
    }
    closeNode(node: Node) {
        node.closed = true
    }
    finishNode(node: Node, type: string) {
        node.type = type
    }
}