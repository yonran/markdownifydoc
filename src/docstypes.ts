// More types that should have been in google docs
// https://developers.google.com/apps-script/reference/document/attribute
export interface Attributes {
    BOLD: boolean|null
    ITALIC: boolean|null
    FONT_SIZE: number|null
    STRIKETHROUGH: boolean|null
    FOREGROUND_COLOR: string|null
    LINK_URL: string|null
    UNDERLINE: boolean|null
    FONT_FAMILY: string|null
    BACKGROUND_COLOR: string|null
}
export function emptyAttributes(): Attributes {
    return {
        BOLD: null,
        ITALIC: null,
        FONT_SIZE: null,
        STRIKETHROUGH: null,
        FOREGROUND_COLOR: null,
        LINK_URL: null,
        UNDERLINE: null,
        FONT_FAMILY: null,
        BACKGROUND_COLOR: null,    
    }
}
