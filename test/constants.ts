
const fakeDocumentApp = {} as any as GoogleAppsScript.Document.DocumentApp
const DocumentApp: GoogleAppsScript.Document.DocumentApp = {
    ...fakeDocumentApp,
    ParagraphHeading: {
        NORMAL: 0, HEADING1: 1, HEADING2: 2, HEADING3: 3, HEADING4: 4, HEADING5: 5, HEADING6: 6, TITLE: 7, SUBTITLE: 8
    },
}
const Logger: GoogleAppsScript.Base.Logger = {
    clear: () => {},
    getLog: () => "",
    log: (o: any, ...varargs: Object[]) => {console.log(o); return Logger},
}
;(global as any).DocumentApp = DocumentApp
;(global as any).Logger = Logger
export function foo(){}
export {}
