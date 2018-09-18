import { MdBlockNode, MdBodyNode, MdInlineNode, MdFootnoteNode } from "./modelmarkdown";
import { InlineRunNode } from "./modelgoogledocs";
import { Attributes, emptyAttributes } from "./docstypes";
import { link } from "fs";

export function markdownToString(body: MdBodyNode): string {
    const footnoteBuilder: FootnoteBuilder = {
        next: 1,
        notes: [],
    }
    const bodyString = blockNodesToString(body.children, "", footnoteBuilder)
    const footnotesString = footnotesToString(footnoteBuilder)
    return bodyString + footnotesString

}
function blockNodesToString(nodes: MdBlockNode[], indent: string, footnoteBuilder: FootnoteBuilder): string {
    let s = ""
    for (let i = 0; i < nodes.length; i++) {
        const child = nodes[i]
        switch (child.type) {
            case "hr":
                s += indent + "***\n"
                break
            case "mdblockquote":
                s += blockNodesToString(child.children, indent + ">", footnoteBuilder)
                break
            case "mdparagraph":
                if (child.children.length == 0) {
                    // ignore blank lines
                } else {
                    let headingMarker: string
                    switch (child.heading) {
                        case DocumentApp.ParagraphHeading.HEADING1:
                        headingMarker = "# "
                        break
                        case DocumentApp.ParagraphHeading.HEADING2:
                        headingMarker = "## "
                        break
                        case DocumentApp.ParagraphHeading.HEADING3:
                        headingMarker = "### "
                        break
                        case DocumentApp.ParagraphHeading.HEADING4:
                        headingMarker = "#### "
                        break
                        case DocumentApp.ParagraphHeading.HEADING5:
                        headingMarker = "##### "
                        break
                        case DocumentApp.ParagraphHeading.HEADING6:
                        headingMarker = "###### "
                        break
                        case DocumentApp.ParagraphHeading.NORMAL:
                        default:
                        headingMarker = ""

                    }
                    s += indent + headingMarker + runsToString(cleanInlineNodes(child.children), footnoteBuilder) + `\n${indent}\n`
                }
                break
            case "mdlistitem":
                s += indent + "1." + runsToString(cleanInlineNodes(child.children), footnoteBuilder) + "\n\n"
                break
            case "mdtable":
                s += indent + "TODO: table\n\n"
                break
        }
    }
    return s
}

export function cleanInlineNodes(nodes: MdInlineNode[]): MdInlineNode[] {
    nodes = shiftAttributesToWordBoundaries(nodes)
    nodes = removeEmptyRuns(nodes)
    nodes = coalesceEquivalentAdjacentRuns(nodes)
    return nodes
}
const SPACE_CHAR_REGEX_STR = "[\\t\\r\\n\\f \\u00a0\\u1680\\u2000-\\u200A\\u202f\\u205f\\u3000]" // /(?:\t|\r|\n|\f|\p{Zs})/u
const SPACE_AT_BEGINNING_REGEX = new RegExp("^" + SPACE_CHAR_REGEX_STR + "+")
const SPACE_AT_END_REGEX = new RegExp(SPACE_CHAR_REGEX_STR + "+$")
function shiftAttributesToWordBoundaries(nodes: MdInlineNode[]): MdInlineNode[] {
    let leftTrimmed: MdInlineNode[] = []
    let prevAttributes: Attributes = emptyAttributes()
    // TODO: follow the punctuation rules more closely
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        switch (node.type) {
            case "run":
            const startBold = node.attributes.BOLD && !prevAttributes.BOLD
            const startItalic = node.attributes.ITALIC && !prevAttributes.ITALIC
            const startLink = node.attributes.LINK_URL != null &&
                prevAttributes.LINK_URL !== node.attributes.LINK_URL
            if (startBold || startItalic || startLink) {
                // https://spec.commonmark.org/0.28/#left-flanking-delimiter-run
                // unicode whitespace according to https://spec.commonmark.org/0.28/#unicode-whitespace-character
                const m = node.text.match(SPACE_AT_BEGINNING_REGEX)
                if (m != null) {
                    const whitePrefix = m[0]
                    if (!(whitePrefix.length > 0)) throw Error(`regex error: expected nonzero match, got ${m[0]}`)
                    leftTrimmed.push({
                        ...node,
                        text: whitePrefix,
                        attributes: {...node.attributes,
                            BOLD: startBold ? prevAttributes.BOLD : node.attributes.BOLD,
                            ITALIC: startItalic ? prevAttributes.ITALIC : node.attributes.ITALIC,
                            LINK_URL: startLink ? null : node.attributes.LINK_URL,
                        },
                    })
                    leftTrimmed.push({
                        ...node,
                        text: node.text.substr(whitePrefix.length),
                    })
                } else {
                    leftTrimmed.push(node)
                }
            } else {
                leftTrimmed.push(node)
            }
            prevAttributes = node.attributes
            break
            case "mdfootnote":
            leftTrimmed.push(node)
            break
        }
    }
    const rightTrimmed: MdInlineNode[] = []
    prevAttributes = emptyAttributes()
    for (let i = leftTrimmed.length; i --> 0;) {
        const node = leftTrimmed[i]
        switch (node.type) {
            case "run":
            const endBold = node.attributes.BOLD && !prevAttributes.BOLD
            const endItalic = node.attributes.ITALIC && !prevAttributes.ITALIC
            const endLink = node.attributes.LINK_URL != null &&
                prevAttributes.LINK_URL !== node.attributes.LINK_URL
            if (endBold || endItalic || endLink) {
                // https://spec.commonmark.org/0.28/#left-flanking-delimiter-run
                // unicode whitespace according to https://spec.commonmark.org/0.28/#unicode-whitespace-character
                const m = node.text.match(SPACE_AT_END_REGEX)
                if (m != null) {
                    const whiteSuffix = m[0]
                    if (!(whiteSuffix.length > 0)) throw Error(`regex error: expected nonzero match, got ${m[0]}`)
                    rightTrimmed.push({
                        ...node,
                        text: whiteSuffix,
                        attributes: {...node.attributes,
                            BOLD: endBold ? prevAttributes.BOLD : node.attributes.BOLD,
                            ITALIC: endItalic ? prevAttributes.ITALIC : node.attributes.ITALIC,
                            LINK_URL: endLink ? null : node.attributes.LINK_URL,
                        },
                    })
                    rightTrimmed.push({
                        ...node,
                        text: node.text.substr(0, node.text.length - whiteSuffix.length),
                    })
                } else {
                    rightTrimmed.push(node)
                }
            } else {
                rightTrimmed.push(node)
            }
            prevAttributes = node.attributes
            break
            case "mdfootnote":
            rightTrimmed.push(node)
            break
        }
    }
    rightTrimmed.reverse()
    return rightTrimmed
}
function removeEmptyRuns(nodes: MdInlineNode[]): MdInlineNode[] {
    return nodes.filter(node => {
        switch (node.type) {
            case "run":
            return node.text.length > 0
            case "mdfootnote":
            return true
        }
    })
}
function coalesceEquivalentAdjacentRuns(nodes: MdInlineNode[]): MdInlineNode[] {
    let r: MdInlineNode[] = []
    let prevNode: InlineRunNode|null = null
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        switch (node.type) {
            case "run":
            if (prevNode != null &&
                !!prevNode.attributes.BOLD == !!node.attributes.BOLD &&
                !!prevNode.attributes.ITALIC == !!node.attributes.ITALIC &&
                prevNode.attributes.LINK_URL == node.attributes.LINK_URL
                ) {
                const replacement: InlineRunNode = {
                    ...prevNode,
                    text: prevNode.text + node.text
                }
                prevNode = replacement
            } else {
                if (prevNode != null) {
                    r.push(prevNode)
                }
                prevNode = node
            }
            break
            case "mdfootnote":
            if (prevNode != null) {
                r.push(prevNode)
            }
            prevNode = null
            r.push(node)
            break
        }
    }
    if (prevNode != null) {
        r.push(prevNode)
    }
    return r
}

interface FootnoteBuilder {
    next: number
    notes: Array<[number, MdFootnoteNode]>
}

function runsToString(nodes: MdInlineNode[], footnoteBuilder: FootnoteBuilder): string {
    let out = ""
    const stack: RunTransition[] = []
    function current(type: "LINK" | "BOLD" | "ITALIC") {
        let runTransition: RunTransition|null = null
        // runTransition = stack.find(runTransition => runTransition.type == type)
        for (let i = 0; i < stack.length; i++) {
            if (stack[i].type == type) {
                runTransition = stack[i]
                break
            }
        }
        if (runTransition != null) {
            switch (runTransition.type) {
                case "LINK": return runTransition.url
                default: return true
            }
        } return null
    }
    function push(runTransition: RunTransition) {
        stack.push(runTransition)
        switch (runTransition.type) {
            case "BOLD":
            out += "**"
            break
            case "ITALIC":
            out += "*"
            break
            case "LINK":
            out += "["
            break
        }
    }
    function pop(type: "LINK" | "BOLD" | "ITALIC") {
        while (true) {
            const runTransition = stack.pop()
            if (runTransition == null) throw Error("Should be called only when already on stack (current(type))")
            switch (runTransition.type) {
                case "BOLD":
                out += "**"
                break
                case "ITALIC":
                out += "*"
                break
                case "LINK":
                out += `](${runTransition.url})`
                break
            }
            if (runTransition.type == type)
                return
        }
    }
    
    for (let i = 0; i < nodes.length; i++) {
        const child = nodes[i]
        switch (child.type) {
            case "run":
            if (current("LINK") != null && current("LINK") !== child.attributes.LINK_URL) {
                pop("LINK")
            }
            if (current("BOLD") && !child.attributes.BOLD) {
                pop("BOLD")
            }
            if (current("ITALIC") && !child.attributes.ITALIC) {
                pop("ITALIC")
            }
    
            let transitionAndCounts: TransitionAndCount[] = []
            if (current("LINK") !== child.attributes.LINK_URL && child.attributes.LINK_URL != null) {
                const url = child.attributes.LINK_URL
                transitionAndCounts.push({transition: {type: "LINK", url}, runCount: runCount(nodes, run => run.attributes.LINK_URL === url, i)})
            }
            if (!current("BOLD") && child.attributes.BOLD) {
                transitionAndCounts.push({transition: {type: "BOLD"}, runCount: runCount(nodes, run => !!run.attributes.BOLD, i)})
            }
            if (!current("ITALIC") && child.attributes.ITALIC) {
                transitionAndCounts.push({transition: {type: "ITALIC"}, runCount: runCount(nodes, run => !!run.attributes.ITALIC, i)})
            }
            transitionAndCounts.sort((x, y) => y.runCount - x.runCount)
            transitionAndCounts.forEach(transitionAndCount => {
                push(transitionAndCount.transition)
            })
            out += child.text
            break
            case "mdfootnote":
            const footnoteId = footnoteBuilder.next++
            out += `[^${footnoteId}]`
            footnoteBuilder.notes.push([footnoteId, child])
            break
        }
    }
    while (stack.length > 0) {
        pop(stack[0].type)
    }
    return out
}
interface TransitionAndCount {
    transition: RunTransition
    runCount: number
}

function runCount(runs: MdInlineNode[], f: (run: InlineRunNode) => boolean, offset: number): number {
    let i = offset
    for (; i < runs.length; i++) {
        const node = runs[i]
        if (node.type !== "run" || !f(node))
            break
    }
    return i - offset
}
interface LinkRunTransition {
    type: "LINK"
    url: string
}
interface EmphTransition {
    type: "BOLD" | "ITALIC"
}
type RunTransition = LinkRunTransition | EmphTransition

function footnotesToString(footnoteBuilder: FootnoteBuilder): string {
    let r = ""
    let ignoredFootnoteBuilder: FootnoteBuilder = {next: 0, notes: []}
    for (const [n, footnote] of footnoteBuilder.notes) {
        r += `[^${n}]:${blockNodesToString(footnote.children, "  ", ignoredFootnoteBuilder)}`
    }
    return r
}