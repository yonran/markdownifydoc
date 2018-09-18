import { Attributes } from "./docstypes";
import { InlineRunNode, HorizontalRuleNode, TableNode, ListItemNode, FootnoteNode } from "./modelgoogledocs";

// Considerations:
// replace \r with hard line break https://spec.commonmark.org/0.28/#hard-line-break
// replace spaces with nbsp?
// Q: invalid utf-16?
// Q: are paragraph/list item Attributes inherited by text children?

// Differences between Google Docs model and Markdown:
// * Markdown horizontal rule is block level, while Google Docs is inline
// * Google Docs allows list to be "interrupted" by table, while markdown does not
//   On the other hand, Google Docs does not allow arbitrary start, while Markdown does
// * Google Docs list item cannot contain other lists or paragraphs

export interface MdBodyNode {
    type: "mdbody"
    element: GoogleAppsScript.Document.Body
    children: MdBlockNode[]
}

export interface MdBlockquote {
    type: "mdblockquote"
    children: MdBlockNode[]
}

export interface MdParagraphNode {
    type: "mdparagraph"
    heading: GoogleAppsScript.Document.ParagraphHeading
    element: GoogleAppsScript.Document.Paragraph
    children: MdInlineNode[]
}
// export interface MdList {
//     type: "mdlist"
//     start: number
//     children: MdListItemNode[]
// }
export interface MdTableNode {
    type: "mdtable"
    element: GoogleAppsScript.Document.Table
    children: MdTableRowNode[]
}
export interface MdTableRowNode {
    type: "mdtablerow"
    element: GoogleAppsScript.Document.TableRow
    children: MdTableCellNode[]
}
export interface MdTableCellNode {
    type: "mdtablecell"
    element: GoogleAppsScript.Document.TableCell
    children: MdBlockNode[]
}
export interface MdListItemNode {
    type: "mdlistitem"
    element: GoogleAppsScript.Document.ListItem
    children: MdInlineNode[]
    listId: string
    glyphType: GoogleAppsScript.Document.GlyphType
    // TODO: support flow content, or inline / block content?
}

export interface MdFootnoteNode {
    type: "mdfootnote"
    element: GoogleAppsScript.Document.Footnote
    children: MdBlockNode[]
}
export type MdBlockNode = MdParagraphNode | MdListItemNode | MdTableNode | MdBlockquote | HorizontalRuleNode

export type MdInlineNode = InlineRunNode | MdFootnoteNode

// TODO: add list spacer https://meta.stackexchange.com/a/34325
