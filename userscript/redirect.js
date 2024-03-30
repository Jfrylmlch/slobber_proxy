// ==UserScript==
// @name        Slobber Proxy
// @match       https://*/*
// @match       http://*/*
// @grant       none
// @version     1.0
// @author      Jfrylmlch
// ==/UserScript==

const SELECTIONS = { prev: "", curr: "" };

function updateSelections(selections) {
    // if (document.selection) return
    const selection = window.getSelection();
    const selectedText = selection
        .toString()
        .replace(/^\s+/, "")
        .replace(/\s+$/, "");
    if (selectedText.length > 0) {
        selections.prev = selections.curr;
        selections.curr = selectedText;
    }
    return selections;
}

async function sendDictQuery(selections) {
    if (selections.prev !== selections.curr && selections.curr.length > 0) {
        const res = await fetch("http://127.0.0.1:3333/auto-find/", {
            method: "POST",
            body: JSON.stringify({
                query: selections.curr,
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8",
            },
        });
    }
}

// detect new selection of text
const body = document.querySelector("body");
body.addEventListener("mouseup", async function (event) {
    updateSelections(SELECTIONS);
    await sendDictQuery(SELECTIONS);
});
