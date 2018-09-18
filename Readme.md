# markdownifydoc

This is an incomplete Google Apps Script that I use to convert a Google Doc to a markdown document. It supports basically the features I needed to write one blog post

Features:

* Paragraphs, Heading 1-6
* Simple lists (list is contiguous, and single-paragraph per list item)
* Links, strong, emphasis. If they start or end with a space, the span is shortened (because Markdown does not support strong and emphasis on a space boundary). But strong/emphasis *within* a word will result in incorrect markdown, so don’t do emphasis within a word.
* Blockquote
* Footnotes (they all go on the very bottom rather than the bottom of each section)

Not supported

* No escaping of markdown characters within the text yet (`*`, `**`, `#`, etc.)
* No prevention of complicated formatting (emphasis within words, bold and emphasis starting at the same time, etc.)
* Images
* Tables

## How to use as a “bound script” (unpublished add-on) on a Google Doc

Prerequisite: install node.js

```
npm i  # installs clasp
# Open a Doc, open Script editor, copy File → Project Properties → Script ID
npx clasp clone <scriptId>  # sets scriptId in .clasp.json. Warning: overwrites files!
npx clasp push
# In Script Editor, run onStart (which registers the menu item)
# Then, in the document, run the command Add-ons → toMd → Start from the top menu
```


## Running unit tests

Prerequisite: install node.js

```
npm i  # installs typescript
cd test
npx mocha -r ts-node/register  markdotntostringtest.ts
```

## Required permissions

This explains why each permission is requested in `appsscript.json`

* https://www.googleapis.com/auth/documents.currentonly (needed for all the document DOM operations)
* https://www.googleapis.com/auth/script.container.ui (needed for showModalDialog, showSidebar https://developers.google.com/apps-script/reference/base/ui)