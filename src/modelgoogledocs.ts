import { Attributes } from "./docstypes";

export interface BodyNode {
    type: "body"
    element: GoogleAppsScript.Document.Body
    children: BlockNode[]
}

export interface ParagraphNode {
    type: "paragraph"
    element: GoogleAppsScript.Document.Paragraph
    heading: GoogleAppsScript.Document.ParagraphHeading
    children: InlineNode[]
    indentStart: number
}
export interface ListItemNode {
    type: "listitem"
    element: GoogleAppsScript.Document.ListItem
    children: InlineNode[]
    listId: string
    glyphType: GoogleAppsScript.Document.GlyphType
    nestingLevel: number  // starts with 0
    indentStart: number
}
export interface TableNode {
    type: "table"
    element: GoogleAppsScript.Document.Table
    children: TableRowNode[]
}
export interface TableRowNode {
    type: "tablerow"
    element: GoogleAppsScript.Document.TableRow
    children: TableCellNode[]
}
export interface TableCellNode {
    type: "tablecell"
    element: GoogleAppsScript.Document.TableCell
    children: BlockNode[]
}

export type BlockNode = ParagraphNode | ListItemNode | TableNode
export type FootnoteChild = ParagraphNode | ListItemNode

export interface InlineRunNode {
    type: "run"
    element: GoogleAppsScript.Document.Text
    text: string
    attributes: Attributes
}
export interface HorizontalRuleNode {
    type: "hr"
    element: GoogleAppsScript.Document.HorizontalRule
}

export interface FootnoteNode {
    type: "footnote"
    element: GoogleAppsScript.Document.Footnote
    children: FootnoteChild[]
}

export type InlineNode = InlineRunNode | HorizontalRuleNode | FootnoteNode
