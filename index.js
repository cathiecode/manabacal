const fetch = require("node-fetch");
const parseDate = require("date-fns/parse");
const formatDate = require("date-fns/format");
const zonedTimeToUtc = require("date-fns-tz/zonedTimeToUtc");
const utcToZonedTime = require("date-fns-tz/utcToZonedTime");
const { JSDOM } = require("jsdom");
const genIcal = require('ical-generator');

const default_header = {
    "User-Agent": "manabacal/1.0 manabacal.cathie.codes cathiecode-at-gmail-dot-com"
}

const parseDeadlineToUTC = origin_date_utc => deadline_string => {
    return zonedTimeToUtc(parseDate(deadline_string, "受付終了日時：yyyy-MM-dd HH:mm", utcToZonedTime(origin_date_utc, "Asia/Tokyo")), "Asia/Tokyo");
}

const parseInfoListTitle = title_string => { // HACK: もっと優雅な解決策がほしいですね
    const title_string_lines = title_string.split("\n");
    return title_string_lines[title_string_lines.length - 1].trim(); // 最後の行の、前後の空白を取り除いた文字列
}

const parseInfoList = (doc, origin_date) => {
    const item_elements = doc.querySelector("section")?.querySelectorAll("li");
    return (
        Array.from(item_elements)
            .map(item_element => ({
                rel_url: item_element.querySelector("a").href,
                title: parseInfoListTitle(item_element.querySelector("h3").textContent),
                course: item_element.querySelector(".info1").textContent,
                deadline: parseDeadlineToUTC(origin_date)(item_element.querySelector(".info2").textContent),
            }))
    );
}

const manabaLogin = async (id, pw) => {
    const first_res = await fetch(`https://manaba.fun.ac.jp/s/login`, {headers: default_header});
    const session_id = first_res.headers.raw()['set-cookie'][0].match(/sessionid=(?<sid>[0-9a-f]+);/).groups.sid;
    const first_res_dom = new JSDOM(await first_res.text());
    const first_res_doc = first_res_dom.window.document;

    const params = new URLSearchParams();
    Array.from(first_res_doc.querySelectorAll("form input"))
        .map(input_node => [input_node.getAttribute("name"), input_node.getAttribute("value")])
        .filter(([name, value]) => !!value)
        .forEach(([name, value]) => params.append(name, value));
    params.append("userid", id);
    params.append("password", pw);

    const res = await fetch(`https://manaba.fun.ac.jp/s/login`, {
        method: "POST",
        body: params,
        headers: {
            ...default_header,
            "Cookie": `sessionid=${session_id}`,
        }
    });
    if (res.ok) {
        return session_id;
    } else {
        throw new Error("LoginError");
    }
}

const getLoggedInManamaSession = async (id, pw) => {
    return manabaLogin(id, pw); // TODO: キャッシュとか
}

const getManabaPage = (url, session_id) => {
    return fetch(url, {
        headers: {...default_header, "Cookie": `sessionid=${session_id}`}
    });
}

const fetchAssignments = async (session_id) => {
    const origin_date = Date.now();
    const assignments = (await Promise.all(
        ["query", "survey", "report"]
            .map(async postfix => {
                const res = await getManabaPage(`https://manaba.fun.ac.jp/s/home_summary_${postfix}`, session_id);
                const dom = new JSDOM(await res.text());
                return parseInfoList(dom.window.document, origin_date);
            })
    )).flat();
    return assignments;
}

// In placeにソート
const sortAssignmentsByDeadline = (assignments_array) => {
    return assignments_array.sort((a, b)=> a.deadline - b.deadline);
}

const assignmentsToIcal = (owner, assignment_array) => {
    const cal = genIcal({domain: "manabacal.cathie.codes", name: `${owner}のmanaba上の課題`, timezone: 'Etc/GMT'});
    assignment_array.forEach(assignment => {
        cal.createEvent({
            summary: assignment.title,
            description: assignment.course,
            url: `https://manaba.fun.ac.jp/ct/${assignment.rel_url}`,
            start: assignment.deadline
        })
    });
    return cal;
}

const Express = require("express");

const app = Express();

app.get("/:id.:ext", (req, res) => {
    const id = req.params.id;
    const password = req.query.pw;
    const ext = req.params.ext;
    getLoggedInManamaSession(id, password)
        .then(fetchAssignments)
        .then(result => {
            const sortedResult = sortAssignmentsByDeadline(result);
            switch (ext) {
                case "ical":
                    res.type("text/calendar");
                    res.send(assignmentsToIcal(id, sortedResult).toString());
                    break;
                default:
                case "json":
                    res.json(sortedResult);
                    break;
            }
            res.end();
        })
        .catch(e => {
            res.status(502);
            res.end();
            throw e;
        })
});

app.listen(process.env.PORT || 80);