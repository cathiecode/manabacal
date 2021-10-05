const genIcal = require('ical-generator');
const subDate = require("date-fns/sub");

const assignmentsToIcal = (owner, assignment_array) => {
    const cal = genIcal({domain: "manabacal.cathie.codes", name: `${owner}のmanaba上の課題`, timezone: 'Etc/GMT'});
    assignment_array
        .filter(assignment => assignment.deadline !== null)
        .forEach(assignment => {
        cal.createEvent({
            summary: assignment.title,
            description: `${assignment.course} https://manaba.fun.ac.jp/ct/${assignment.rel_url}`,
            url: `https://manaba.fun.ac.jp/ct/${assignment.rel_url}`,
            start: subDate(assignment.deadline, {minutes: 15}),
            end:   assignment.deadline
        })
    });
    return cal;
}

module.exports = {
    assignmentsToIcal
}
