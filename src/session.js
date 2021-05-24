const { manabaLogin } = require("./manaba_login")

const getLoggedInManamaSession = async (id, pw) => {
    return await manabaLogin(id, pw);
}

module.exports = {
    getLoggedInManamaSession
}
