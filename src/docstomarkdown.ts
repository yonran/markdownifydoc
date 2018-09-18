import { BodyNode, BlockNode, ListItemNode, TableRowNode, TableCellNode, InlineNode } from "./modelgoogledocs";
import { MdBodyNode, MdBlockNode, MdInlineNode, MdParagraphNode, MdListItemNode, MdTableRowNode, MdTableCellNode, MdBlockquote } from "./modelmarkdown";

export function transformDocsToMarkdown(body: BodyNode): MdBodyNode {
    return {
        type: "mdbody",
        element: body.element,
        children: transformBlockContainer(body.children),
    }
}
interface IndentStackItem {
    indentStart: number
    blockquote: MdBlockquote
}
// Take the hr out of paragraphs and put them as block nodes
function transformBlockContainer(nodes: BlockNode[]): MdBlockNode[] {
    const r: MdBlockNode[] = []
    let indentStack: IndentStackItem[] = []
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        switch (node.type) {
        case "paragraph":
        case "listitem":
            while (indentStack.length > 0 && node.indentStart < indentStack[indentStack.length-1].indentStart) {
                const blockquoteStackItem = indentStack.pop()!
                r.push(blockquoteStackItem.blockquote)
            }
            if (node.indentStart > 0 && (indentStack.length === 0 || indentStack[indentStack.length-1].indentStart != node.indentStart)) {
                indentStack.push({
                    indentStart: node.indentStart,
                    blockquote: {
                        type: "mdblockquote",
                        children: []
                    }
                })
            }
            const parentList = indentStack.length > 0
                ? indentStack[indentStack.length-1].blockquote.children
                : r
            const children: MdInlineNode[] = transformInlineContainer(node.children)
            let newnode: MdBlockNode
            switch (node.type) {
            case "paragraph":
                const p: MdParagraphNode = {
                    type: "mdparagraph",
                    element: node.element,
                    heading: node.heading,
                    children,
                }
                newnode = p
                break
            case "listitem":
                const nodeaslistitem: ListItemNode = node
                const li: MdListItemNode = {
                    type: "mdlistitem",
                    element: nodeaslistitem.element,
                    children,
                    glyphType: nodeaslistitem.glyphType,
                    listId: nodeaslistitem.listId,
                }
                newnode = li
                break
            default: throw Error("impossible")
            }
            parentList.push(newnode)
            break
        case "table":
            while (indentStack.length > 0) {
                r.push(indentStack.pop()!.blockquote)
            }
            r.push({
                type: "mdtable",
                element: node.element,
                children: node.children.map(docRowToMdRow),
            })
        }
    }
    while (indentStack.length > 0) {
        r.push(indentStack.pop()!.blockquote)
    }
    return r
}
function docRowToMdRow(row: TableRowNode): MdTableRowNode {
    return {
        type: "mdtablerow",
        element: row.element,
        children: row.children.map(docCellToMdCell),
    }
}
function docCellToMdCell(cell: TableCellNode): MdTableCellNode {
    return {
        type: "mdtablecell",
        element: cell.element,
        children: transformBlockContainer(cell.children)
    }
}
function transformInlineContainer(nodes: InlineNode[]): MdInlineNode[] {
    const children: MdInlineNode[] = []
    for (let i = 0; i < nodes.length; i++) {
        const child = nodes[i]
        switch (child.type) {
        case "hr":
            // TODO
            break
        case "run":
            children.push(child)
            break
        case "footnote":
            children.push({
                type: "mdfootnote",
                element: child.element,
                children: transformBlockContainer(child.children)
            })
        }
    }
    return children
}