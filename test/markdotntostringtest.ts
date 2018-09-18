import { expect } from "chai"
import {} from "mocha"  // describe, it
import {foo} from "./constants"
import { cleanInlineNodes, markdownToString } from "../src/markdowntostring"
import { emptyAttributes, Attributes } from "../src/docstypes";
import { MdInlineNode, MdBodyNode } from "../src/modelmarkdown";

foo()
describe('cleanInlineNodes', () => {
    it('should move bold to be left/right flanking', function() {
        const element = null as any as GoogleAppsScript.Document.Text
        const elementText = "ab  cd ef"
        const boldAttributes: Attributes = {...emptyAttributes(), BOLD: true}
        const shifted = cleanInlineNodes([
            {type: "run", text: "ab  ", attributes: boldAttributes, element},
            {type: "run", text: "cd", attributes: emptyAttributes(), element},
            {type: "run", text: " ef", attributes: boldAttributes, element},
        ])
        expect(shifted).to.deep.equal([
            {type: "run", text: "ab", attributes: boldAttributes, element},
            {type: "run", text: "  cd ", attributes: emptyAttributes(), element},
            {type: "run", text: "ef", attributes: boldAttributes, element},
        ])
    })
})

function toInlineNode(obj: {s: string, attributes: Attributes}): MdInlineNode {
    return {
        type: "run",
        attributes: obj.attributes,
        element: null as any as GoogleAppsScript.Document.Text,
        text: obj.s,
    }
}
function makeRuns(objs: Array<{s: string, attributes: Attributes}>): MdInlineNode[] {
    const r: MdInlineNode[] = objs.map(toInlineNode)
    return r
}
describe("makeRuns", () => {
    it("should create runs", () => {
        const elementText = "one two thr"
        expect(makeRuns([
            {s: "one", attributes: {...emptyAttributes(), BOLD: true, LINK_URL: "x"}},
            {s: " two ", attributes: {...emptyAttributes(), LINK_URL: "x"}},
            {s: "thr", attributes: {...emptyAttributes(), BOLD: true, LINK_URL: "x"}},
        ])).to.deep.equal(
            [
                {
                    type: "run",
                    attributes: {...emptyAttributes(), BOLD: true, LINK_URL: "x"},
                    text: "one",
                    element: null as any as GoogleAppsScript.Document.Text,
                },
                {
                    type: "run",
                    attributes: {...emptyAttributes(), LINK_URL: "x"},
                    text: " two ",
                    element: null as any as GoogleAppsScript.Document.Text,
                },
                {
                    type: "run",
                    attributes: {...emptyAttributes(), BOLD: true, LINK_URL: "x"},
                    text: "thr",
                    element: null as any as GoogleAppsScript.Document.Text,
                },
            ]
        )
    })
})
function makeSingleParagraphBody(runs: MdInlineNode[]): MdBodyNode {
    return {
        type: "mdbody",
        element: null as any as GoogleAppsScript.Document.Body,
        children: [
            {
                type: "mdparagraph",
                heading: DocumentApp.ParagraphHeading.NORMAL,
                element: null as any as GoogleAppsScript.Document.Paragraph,
                children: runs,
            }
        ],
    }
}

describe('markdownToString', () => {
    it('should order inline runs to avoid unnecessary close tags', function() {
        const s = markdownToString(makeSingleParagraphBody(makeRuns([
            {s: "one", attributes: {...emptyAttributes(), BOLD: true, LINK_URL: "x"}},
            {s: " two ", attributes: {...emptyAttributes(), LINK_URL: "x"}},
            {s: "thr", attributes: {...emptyAttributes(), BOLD: true, LINK_URL: "x"}},
        ])))
        expect(s).to.equal("[**one** two **thr**](x)\n\n")
    })
    it('should order inline runs to avoid unnecessary close tags 2', function() {
        const s = markdownToString(makeSingleParagraphBody(makeRuns([
            {s: "one", attributes: {...emptyAttributes(), BOLD: true, LINK_URL: "x"}},
            {s: " two ", attributes: {...emptyAttributes(), BOLD: true}},
            {s: "thr", attributes: {...emptyAttributes(), BOLD: true, LINK_URL: "x"}},
        ])))
        expect(s).to.equal("**[one](x) two [thr](x)**\n\n")
    })
    it('should move bold to be left/right flanking', function() {
        const s = markdownToString(makeSingleParagraphBody(makeRuns([
            {s: "one ", attributes: {...emptyAttributes(), BOLD: true}},
        ])))
        expect(s).to.equal("**one** \n\n")
    })
    it('should create footnotes', function() {
        const s = markdownToString(makeSingleParagraphBody([
            toInlineNode({s: "abc", attributes: {...emptyAttributes()}}),
            {
                type: "mdfootnote",
                element: null as any as GoogleAppsScript.Document.Footnote,
                children: [{
                    type: "mdparagraph",
                    heading: DocumentApp.ParagraphHeading.NORMAL,
                    element: null as any as GoogleAppsScript.Document.Paragraph,
                    children: makeRuns([{s: "hi", attributes: emptyAttributes()}]),
                }],
            },
            toInlineNode({s: "def", attributes: {...emptyAttributes()}}),
        ]))
        expect(s).to.equal("abc[^1]def\n\n[^1]:  hi\n  \n")
    })
})
