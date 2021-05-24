const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");

const { default_header } = require("./fetch");

const manabaLogin = async (id, pw) => {
    const first_res = await fetch(`https://manaba.fun.ac.jp/s/login`, {
        headers: default_header,
    });
    const session_id = first_res.headers
        .raw()
    ["set-cookie"][0].match(/sessionid=(?<sid>[0-9a-f]+);/).groups.sid;
    const first_res_dom = new JSDOM(await first_res.text());
    const first_res_doc = first_res_dom.window.document;

    const params = new URLSearchParams();
    Array.from(first_res_doc.querySelectorAll("form input"))
        .map((input_node) => [
            input_node.getAttribute("name"),
            input_node.getAttribute("value"),
        ])
        .filter(([name, value]) => !!value)
        .forEach(([name, value]) => params.append(name, value));
    params.append("userid", id);
    params.append("password", pw);

    const res = await fetch(`https://manaba.fun.ac.jp/s/login`, {
        method: "POST",
        body: params,
        headers: {
            ...default_header,
            Cookie: `sessionid=${session_id}`,
        },
    });
    if (res.ok) {
        return session_id;
    } else {
        throw new Error("LoginError");
    }
};

module.exports = {
    manabaLogin,
};
