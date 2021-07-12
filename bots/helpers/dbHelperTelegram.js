
const fs = require('fs');



let dbHelper = {
    async initDB(userId){
        let db
        let files = fs.readdirSync("./users/telegram/")

        if (files.includes(`${userId}.json`)) {
            console.log(" json file exists ")
            db = JSON.parse(fs.readFileSync(`./users/telegram/${userId}.json`))
            return db
        } else {
            console.log(" json file does not exist ")
            let accounts = { accounts: [] }
            let data = JSON.stringify(accounts);
            fs.writeFileSync(`./users/telegram/${userId}.json`, data);
            db = JSON.parse(fs.readFileSync(`./users/telegram/${userId}.json`))
            return db
        }
    },
    async getAccounts(userId,cb) {
        let db = await this.initDB(userId)
        // db = await JSON.parse(fs.readFileSync(`./users/telegram/${userId}.json`))
        let accounts = db.accounts
        console.log("accounts: ", db.accounts)
        cb(accounts)
    },
    async addAccount(userId,account) {
        let db = await this.initDB(userId)

        try {
            // db = await JSON.parse(fs.readFileSync(`./users/telegram/${userId}.json`))
            let accounts = db.accounts
            // console.log("writing: ", accounts)
            accounts.push(account)
            let payload = { accounts : accounts }
            let data = JSON.stringify(payload);
            fs.writeFileSync(`./users/telegram/${userId}.json`, data);
            return accounts
        } catch (error) {
            console.log("error")
        }
    },
    async getAccount(userId,accountIndex,cb) {
        let db = await this.initDB(userId)
        let accounts = db.accounts
        accountIndex = accountIndex - 1
        if((accounts.length - 1) >= accountIndex){
            console.log('account found')
            cb (accounts[accountIndex])
        }else{
            cb (undefined)
        }
    }
}



module.exports = { dbHelper }