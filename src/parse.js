const parseDate = require("date-fns/parse");
const utcToZonedTime = require("date-fns-tz/utcToZonedTime");
const zonedTimeToUtc = require("date-fns-tz/zonedTimeToUtc");
const { JSDOM } = require("jsdom");

const parseDeadlineToUTC = (origin_date_utc) => (deadline_string) => {
    return zonedTimeToUtc(
        parseDate(
            deadline_string,
            "受付終了日時：yyyy-MM-dd HH:mm",
            utcToZonedTime(origin_date_utc, "Asia/Tokyo")
        ),
        "Asia/Tokyo"
    );
};

const parseInfoListTitle = (title_string) => {
    // HACK: もっと優雅な解決策がほしいですね
    const title_string_lines = title_string.split("\n");
    return title_string_lines[title_string_lines.length - 1].trim(); // 最後の行の、前後の空白を取り除いた文字列
};

const parseInfoList = (doc, origin_date) => {
    const item_elements = doc.querySelector("section")?.querySelectorAll("li");
    return Array.from(item_elements).map((item_element) => ({
        rel_url: item_element.querySelector("a").href,
        title: parseInfoListTitle(item_element.querySelector("h3").textContent),
        course: item_element.querySelector(".info1").textContent,
        deadline: parseDeadlineToUTC(origin_date)(
            item_element.querySelector(".info2").textContent
        ),
    }));
};

const parseInfoListHtml = (html_text, origin_date) => {
    const dom = new JSDOM(html_text);
    return parseInfoList(dom.window.document, origin_date);
};

module.exports = {
    parseInfoListHtml,
};
