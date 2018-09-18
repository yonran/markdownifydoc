import {Attributes} from "./docstypes"
import {InlineNode, InlineRunNode, HorizontalRuleNode, ParagraphNode, BlockNode, BodyNode, ListItemNode, TableNode, TableRowNode, TableCellNode, FootnoteChild, FootnoteNode} from "./modelgoogledocs"
import { transformDocsToMarkdown } from "./docstomarkdown";
import { markdownToString } from "./markdowntostring";

function toMarkdown() {
    const doc = DocumentApp.getActiveDocument()
    // TODO: doc can be null when in the script editor
    const body = doc.getBody()
    const ast = walkBody(body)
    const withHrRemoved = transformDocsToMarkdown(ast)
    const markdownString = markdownToString(withHrRemoved)
    return markdownString
}

function getChildrenOfBlockContainer(element: GoogleAppsScript.Document.Body | GoogleAppsScript.Document.TableCell): BlockNode[] {
    const childrenAst: BlockNode[] = []
    for (let i = 0; i < element.getNumChildren(); i++) {
        const child: GoogleAppsScript.Document.Element = element.getChild(i)
        switch (child.getType()) {
            case DocumentApp.ElementType.LIST_ITEM:
            const listChild = child as any as GoogleAppsScript.Document.ListItem
            childrenAst.push(walkListItem(listChild))
            break
            case DocumentApp.ElementType.PARAGRAPH:
            const paragraphChild = child as any as GoogleAppsScript.Document.Paragraph
            const childAst: ParagraphNode = walkParagraph(paragraphChild)
            childrenAst.push(childAst)
            break
            case DocumentApp.ElementType.TABLE:
            const tableChild = child as any as GoogleAppsScript.Document.Table
            childrenAst.push(walkTable(tableChild))
            break
            case DocumentApp.ElementType.TABLE_OF_CONTENTS:
            const tocChild = child as any as GoogleAppsScript.Document.TableOfContents
            break
            default:
            throw Error(`Unexpected element ${child.getType()} under a Body or TableCell; not listed in https://developers.google.com/apps-script/reference/document/body`)
        }
    }
    return childrenAst
}
function getChildrenOfFootnote(element: GoogleAppsScript.Document.FootnoteSection): FootnoteChild[] {
    const childrenAst: FootnoteChild[] = []
    for (let i = 0; i < element.getNumChildren(); i++) {
        const child: GoogleAppsScript.Document.Element = element.getChild(i)
        switch (child.getType()) {
            case DocumentApp.ElementType.LIST_ITEM:
            const listChild = child as any as GoogleAppsScript.Document.ListItem
            childrenAst.push(walkListItem(listChild))
            break
            case DocumentApp.ElementType.PARAGRAPH:
            const paragraphChild = child as any as GoogleAppsScript.Document.Paragraph
            const childAst: ParagraphNode = walkParagraph(paragraphChild)
            childrenAst.push(childAst)
            break
            default:
            throw Error(`Unexpected element ${child.getType()} under a FootnoteSection; not listed in https://developers.google.com/apps-script/reference/document/footnote-section`)
        }
    }
    return childrenAst
}

function walkBody(body: GoogleAppsScript.Document.Body): BodyNode {
    const children = getChildrenOfBlockContainer(body)
    return {
        type: "body",
        element: body,
        children,
    }
}

function walkTable(element: GoogleAppsScript.Document.Table): TableNode {
    const children: TableRowNode[] = []
    for (let i = 0; i < element.getNumChildren(); i++) {
        const child = element.getChild(i)
        if (child.getType() != DocumentApp.ElementType.TABLE_ROW) {
            throw Error(`Unexpected element ${child.getType()} under a Table; expected tableRow https://developers.google.com/apps-script/reference/document/table`)
        }
        const row = child as any as GoogleAppsScript.Document.TableRow
        children.push(walkTableRow(row))
    }
    return {
        type: "table",
        element,
        children,
    }
}
function walkTableRow(element: GoogleAppsScript.Document.TableRow): TableRowNode {
    const children: TableCellNode[] = []
    for (let i = 0; i < element.getNumChildren(); i++) {
        const child = element.getChild(i)
        if (child.getType() != DocumentApp.ElementType.TABLE_CELL) {
            throw Error(`Unexpected element ${child.getType()} under a Table; expected tableRow https://developers.google.com/apps-script/reference/document/table-row`)
        }
        const cell = child as any as GoogleAppsScript.Document.TableCell
        children.push(walkTableCell(cell))
    }
    return {
        type: "tablerow",
        element,
        children,
    }
}
function walkTableCell(element: GoogleAppsScript.Document.TableCell): TableCellNode {
    const children = getChildrenOfBlockContainer(element)
    return {
        type: "tablecell",
        element,
        children,
    }
}

function getChildrenOfInlineContainer(element: GoogleAppsScript.Document.Paragraph | GoogleAppsScript.Document.ListItem): InlineNode[] {
    const children: InlineNode[] = []
    for (let i = 0; i < element.getNumChildren(); i++) {
        const child: GoogleAppsScript.Document.Element = element.getChild(i)
        switch (child.getType()) {
        case DocumentApp.ElementType.EQUATION:
            const equation = child as any as GoogleAppsScript.Document.Equation
            walkEquation(equation)
            break
        case DocumentApp.ElementType.FOOTNOTE:
            const footnote = child as any as GoogleAppsScript.Document.Footnote
            children.push(walkFootnote(footnote))
            break
        case DocumentApp.ElementType.HORIZONTAL_RULE:
            const horizontalRule = child as any as GoogleAppsScript.Document.HorizontalRule
            children.push(walkHorizontalRule(horizontalRule))
            break
        case DocumentApp.ElementType.INLINE_DRAWING:
            const inlineDrawing = child as any as GoogleAppsScript.Document.InlineDrawing
            walkInlineDrawing(inlineDrawing)
            break
        case DocumentApp.ElementType.INLINE_IMAGE:
            const inlineImage = child as any as GoogleAppsScript.Document.InlineImage
            walkInlineImage(inlineImage)
            break
        case DocumentApp.ElementType.PAGE_BREAK:
            const pageBreak = child as any as GoogleAppsScript.Document.PageBreak
            walkPageBreak(pageBreak)
            break
        case DocumentApp.ElementType.TEXT:
            const text = child as any as GoogleAppsScript.Document.Text
            Array.prototype.push.apply(children, walkText(text))
            break
        default:
            throw Error(`Unexpected element ${child.getType} under a Body; not listed in https://developers.google.com/apps-script/reference/document/body`)
        }
    }
    return children
}
// https://developers.google.com/apps-script/reference/document/paragraph
function walkParagraph(element: GoogleAppsScript.Document.Paragraph): ParagraphNode {
    const indentStart = element.getIndentStart() as number
    const children = getChildrenOfInlineContainer(element)
    const heading = element.getHeading()
    return {
        type: "paragraph",
        element,
        heading,
        children,
        indentStart,
    }
}


// https://developers.google.com/apps-script/reference/document/list-item
function walkListItem(listItem: GoogleAppsScript.Document.ListItem): ListItemNode {
    const indentStart = listItem.getIndentStart() as number
    const nestingLevel = listItem.getNestingLevel()
    const listId = listItem.getListId()
    const glyphType = listItem.getGlyphType()
    const children = getChildrenOfInlineContainer(listItem)
    return {
        type: "listitem",
        element: listItem,
        children,
        listId,
        glyphType,
        nestingLevel,
        indentStart,
    }
}

// Inline children (children of Paragraph)
function walkEquation(element: GoogleAppsScript.Document.Equation) {
}
function walkFootnote(element: GoogleAppsScript.Document.Footnote): FootnoteNode {
    return {
        type: "footnote",
        element,
        children: getChildrenOfFootnote(element.getFootnoteContents()),
    }
}
function walkHorizontalRule(element: GoogleAppsScript.Document.HorizontalRule): HorizontalRuleNode {
    return {
        type: "hr",
        element,
    }
}
function walkInlineDrawing(element: GoogleAppsScript.Document.InlineDrawing) {
}
function walkInlineImage(element: GoogleAppsScript.Document.InlineImage) {
}
function walkPageBreak(element: GoogleAppsScript.Document.PageBreak)  {
}

// https://developers.google.com/apps-script/reference/document/text
// See also:
// https://stackoverflow.com/questions/18727341/get-all-links-in-a-document
//   - naive (one char at a time) https://gist.github.com/mogsdad/6518632#file-getalllinks-js
function walkText(element: GoogleAppsScript.Document.Text): InlineRunNode[] {
    // The start of each run. Always starts with 0. Only the start of runs; does not end with the length.
    const indices = element.getTextAttributeIndices()
    const spans: InlineRunNode[] = []
    const elementText: string = element.getText()
    for (let i = 0; i < indices.length; i ++) {
        const attributes: Attributes = element.getAttributes(indices[i]) as Attributes
        const offset = indices[i]
        const endOffet = i + 1 < indices.length ? indices[i + 1] : elementText.length
        const length = endOffet - offset
        const text: string = elementText.substr(offset, length)
        if (!(length > 0)) throw Error(`Expected length to be greater than 0, got ${length}`)
        const node: InlineRunNode = {
            type: "run",
            element,
            text,
            attributes,
        }
        spans.push(node)
    }
    return spans
}

function showSidebar() {
    const html = HtmlService.createHtmlOutputFromFile("src/Sidebar.html")
    .setTitle("sidebar")
    .setWidth(300)
    DocumentApp.getUi().showSidebar(html)
}
function createDialog() {
    // https://developers.google.com/apps-script/guides/dialogs
    const html = HtmlService.createHtmlOutputFromFile("src/Sidebar.html")
    .setTitle("sidebar")
    .setWidth(300)
    DocumentApp.getUi().showDialog(html)
}

type Event = {authMode: GoogleAppsScript.Script.AuthMode}

// Triggers on add-ons and "bound scripts" (unpublished add-ons)
// https://developers.google.com/apps-script/guides/bound
// https://developers.google.com/apps-script/guides/triggers/
// entry point
function onOpen(e: Event) {
    if (e) {
        Logger.log(`onOpen called. authMode=${e.authMode}`)
    } else {
        Logger.log(`onOpen called but without an event (called from script editor)`)
    }

    DocumentApp.getUi().createAddonMenu()
    .addItem('Start', 'showSidebar')
    .addItem('Dialog', 'createDialog')
    .addToUi();
    // toMarkdown()
}
function onInstall(e: Event) {
    onOpen(e)
}