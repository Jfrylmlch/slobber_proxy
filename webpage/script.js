// To make a random query
// http://127.0.0.1:8013/random

// To check the dictionary info of an entry
// http://127.0.0.1:8013/slob/{slobid}

async function getRedirectedQuery() {
    let redirectedQuery = await fetch(
        `http://127.0.0.1:3333/redirected-query/`
    );
    redirectedQuery = redirectedQuery.text();
    return redirectedQuery;
}

async function getQueryResults(query) {
    let result = await fetch(`http://127.0.0.1:3333/find/${query}`);
    result = await result.json();
    if (result) {
        return result;
    }
}

function showQueryResults(result) {
    if (result.length <= 0) return;
    const resultsContainer = document.querySelector("#lookup-result");
    resultsContainer.replaceChildren();

    let resultsList = document.createElement("ul");

    for (let i = 0; i < result.length; i++) {
        const item = document.createElement("li");

        const itemUrl = document.createElement("a");
        itemUrl.href = "http://127.0.0.1:8013" + result[i].url;
        itemUrl.target = "content";

        const itemLabel = document.createElement("div");
        itemLabel.innerHTML = `<strong>${result[i].label}</strong>`;

        const dictLabel = document.createElement("small");
        dictLabel.textContent = result[i].dictLabel;

        itemUrl.appendChild(itemLabel);
        itemUrl.appendChild(dictLabel);

        item.appendChild(itemUrl);

        item.addEventListener("click", () => {
            const contentHeader = document.querySelector("#content-header");
            contentHeader.style.display = "flex";

            const headerTitle = document.querySelector("#header-title");
            headerTitle.innerText = `${result[i].dictLabel}: ${result[i].label}`;
        });

        resultsList.appendChild(item);
    }

    resultsContainer.appendChild(resultsList);
}

async function getDictInfo() {
    const res = await fetch("http://127.0.0.1:8013/slob");
    const dictinfo = res.json();
    return dictinfo;
}

function showDictInfo(dictInfo) {
    if (!dictInfo) return;
    dictInfo = dictInfo.slobs;
    function appendRows(data, tbl) {
        for (let j in data) {
            const r = document.createElement("tr");
            const k = document.createElement("td");
            const v = document.createElement("td");
            k.innerText = j;
            v.innerText = data[j];
            r.appendChild(k);
            r.appendChild(v);
            tbl.appendChild(r);
        }
        return tbl;
    }
    const html = document.createElement("html");
    const body = document.createElement("body");
    for (i = 0; i < dictInfo.length; i++) {
        // dict name
        const dictName = document.createElement("h1");
        dictName.innerText = dictInfo[i].tags.label;

        // file info
        let fileInfoTbl = document.createElement("table");
        const fileInfo = {
            file: dictInfo[i].file,
            id: dictInfo[i].id,
            encoding: dictInfo[i].encoding,
            compression: dictInfo[i].compression,
            refCount: dictInfo[i].refCount,
            blobCount: dictInfo[i].blobCount,
        };
        fileInfoTbl = appendRows(fileInfo, fileInfoTbl);

        // tags
        const tagsSecTitle = document.createElement("h2");
        tagsSecTitle.innerText = "Tags";

        let tagsTbl = document.createElement("table");
        const tags = {
            createDate: dictInfo[i].tags["created.at"],
            label: dictInfo[i].tags.label,
        };
        tagsTbl = appendRows(tags, tagsTbl);

        // content types
        const contentTypesSecTitle = document.createElement("h2");
        contentTypesSecTitle.innerText = "Content Types";
        const contentTypesList = document.createElement("ul");
        for (let j of dictInfo[i].contentTypes) {
            const contentType = document.createElement("li");
            contentType.innerText = j;
            contentTypesList.appendChild(contentType);
        }

        // separator
        const hline = document.createElement("hr");

        body.appendChild(dictName);
        body.appendChild(fileInfoTbl);
        body.appendChild(tagsSecTitle);
        body.appendChild(tagsTbl);
        body.appendChild(contentTypesSecTitle);
        body.appendChild(contentTypesList);
        body.appendChild(hline);
    }
    html.appendChild(body);
    return html;
}

async function getRandomArticle() {
    const res = await fetch("http://127.0.0.1:8013/random");
    const data = await res.json();
    if (data) {
        return data;
    }
}

async function showRandomArticle(data) {
    const result = await getQueryResults(data.label);
    showQueryResults(result);
    contentFrame.src = "http://127.0.0.1:8013" + data.url;
    document.querySelector("#lookup-result ul > li > a").click();
}

// ------------------------------------------------------------------------//
// ------------------------------- main ---------------------------------- //
// ------------------------------------------------------------------------//

const searchBox = document.querySelector("input#word");
const contentHeader = document.querySelector("#content-header");
const contentFrame = document.querySelector("#content");

const onSearchTextChange = async (e) => {
    // const retrieved = sessionStorage.getItem(e.target.value);
    // if (retrieved) {
    //     showQueryResults(JSON.parse(retrieved));
    // } else {
    //     const result = await getQueryResults(e.target.value);
    //     showQueryResults(result);
    //     if (result.length > 0) {
    //         const stringifedResult = JSON.stringify(result);
    //         sessionStorage.setItem(e.target.value, stringifedResult);
    //     }
    // }

    const result = await getQueryResults(e.target.value);
    showQueryResults(result);
};

// searchBox.addEventListener("keydown", onSearchTextChange);
searchBox.addEventListener("keyup", onSearchTextChange);
// searchBox.addEventListener("change", onSearchTextChange);
searchBox.addEventListener("paste", onSearchTextChange);

let prevQuery = "";
setTimeout(async function temp() {
    const redirectedQuery = await getRedirectedQuery();
    // const retrieved = sessionStorage.getItem(redirectedQuery);
    // if (redirectedQuery && redirectedQuery != prevQuery) {
    //     if (retrieved) {
    //         try {
    //             showQueryResults(JSON.parse(retrieved));
    //         } catch (err) {
    //             console.log(err);
    //         }
    //     } else {
    //         const result = await getQueryResults(redirectedQuery);
    //         showQueryResults(result);
    //         const stringifedResult = JSON.stringify(result);
    //         if (sessionStorage.getItem(prevQuery) != stringifedResult) {
    //             sessionStorage.setItem(redirectedQuery, stringifedResult);
    //         }
    //     }
    //     document.querySelector("#lookup-result ul > li > a").click();
    //     // contentFrame.src = document.querySelector("li > a").href;
    //     prevQuery = redirectedQuery;

    //     // searchBox.value = redirectedQuery;
    // }
    if (redirectedQuery && redirectedQuery != prevQuery) {
        const result = await getQueryResults(redirectedQuery);
        showQueryResults(result);
        document.querySelector("#lookup-result ul > li > a").click();
        prevQuery = redirectedQuery;
    }
    setTimeout(temp, 100);
}, 100);

const dictLink = document.querySelector("#dict-link");
dictLink.addEventListener("click", async function () {
    const dictInfo = await getDictInfo();
    const dictInfoPageContent = showDictInfo(dictInfo);
    contentHeader.style.display = "none";
    contentFrame.srcdoc = dictInfoPageContent.outerHTML;
});

const randomLink = document.querySelector("#random-link");
randomLink.addEventListener("click", async function () {
    const data = await getRandomArticle();
    await showRandomArticle(data);
});

// not working due to cross-origin fetching
// contentFrame.addEventListener("load", async function(){
//     contentHeader.style.display = "flex";
// const pathComponents = this.contentWindow.location.pathname.split("/");
// const slobId = pathComponents[2]
// const query = pathComponents[3]
// const res = await fetch(`http://127.0.0.1:8013/slob/${slobId}`)
// const currItemDictInfo = await res.json();
// const dictName = currItemDictInfo.tags.label
//     const headerTitle = document.querySelector("#header-title");
//     headerTitle.innerText = `${dictName}: ${query}`;
// })
