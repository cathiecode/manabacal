const { getLoggedInManamaSession } = require("./src/session");
const { fetchAssignments } = require("./src/fetch");
const { assignmentsToIcal } = require("./src/ical");

// In placeにソート
const sortAssignmentsByDeadline = (assignments_array) => {
    return assignments_array.sort((a, b) => a.deadline - b.deadline);
}

const Express = require("express");

const app = Express();

app.get("/:id.:ext", (req, res) => {
    const id = req.params.id;
    const password = req.query.pw;
    const ext = req.params.ext;
    if (!password) {
        throw "Password is empty.";
    }
    if (!ext) {
        throw "Please specify extention.";
    }
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
