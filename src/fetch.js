const fetch = require("node-fetch");

const { parseInfoListHtml } = require("./parse");

const default_header = {
    "User-Agent": "manaba-cathie-codes/1.0 manaba.cathie.codes cathiecode-at-gmail-dot-com"
}

const getManabaPage = (url, session_id) => {
    return fetch(url, {
        headers: { ...default_header, "Cookie": `sessionid=${session_id}` }
    });
}

const fetchAssignments = async (session_id) => {
    const origin_date = Date.now();
    const assignments = (await Promise.all(
        ["query", "survey", "report"]
            .map(async postfix => {
                const res = await getManabaPage(`https://manaba.fun.ac.jp/s/home_summary_${postfix}`, session_id);
                return parseInfoListHtml(await res.text(), origin_date);
            })
    )).flat();
    return assignments;
}

module.exports = {
    default_header,
    getManabaPage,
    fetchAssignments
}
