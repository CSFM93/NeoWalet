const { Telegraf } = require("telegraf")
require('dotenv').config()
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

let { walletManager } = require('./helpers/walletManagerTelegram')
let { dbHelper } = require('./helpers/dbHelperTelegram')
let { smartContractHelper } = require("./helpers/smartContractHelper")
let isDev = false
let domain = isDev ? "http://localhost:3042" : process.env.DOMAIN
let state = {}



bot.start(async (ctx) => {
    try {
        let userId = ctx.message.from.id
        dbHelper.initDB(userId)
        state[userId] = {
            isLoggedIn: false,
            WIFAdded: false,
            currentAccount: -1
        }
        ctx.reply(`Welcome ` + ctx.message.from.id)

    } catch (error) {


    }
})

bot.command('commands', (ctx) => {
    try {
        let userId = ctx.message.from.id
        let message = "Here is the list of commands: \n"
        message += "/start : start a conversation with the bot. \n"
        message += "/commands : show the list of commands. \n"
        message += "/login : login to your Neo Wallet using the password you set on your server. \n"
        message += "/logout : logout your Neo Wallet . \n"
        message += "/createAccount : create a new Neo account. \n"
        message += "/addAccount : add an existing Neo account. \n"
        message += "/listAccounts : list all your Neo accounts. \n"
        message += "/selectAccount : select a Neo account.\n e.g: selectAccount 1  \n"
        message += "/saveAddress : save a Neo account address in your address list. \n"
        message += "/addressList : show all the Neo account addresses in your address list. \n"
        message += "/balance : check selected account balance. \n"
        message += "/send : send Gas to a Neo account address by passing the name of the address in your address list or just enter the address.\n e.g /send 10 sam or /send 10 NeoAddress \n"        
        ctx.reply(message)
        
    } catch (error) {

    }
})

bot.command('login', (ctx) => {
    try {
        let userId = ctx.message.from.id
        let url = `${domain}/login.html?userId=${userId}&platform=telegram`
        let isUserLoggedIn = checkIfUserIsLoggedIn(userId, ctx, false)
        if (isUserLoggedIn) {
            ctx.reply(`You are already logged in `)
        } else {
            ctx.reply(`Please go to the following url in order to login ` + url)
            waitForUserToLogin(ctx, userId)
        }
    } catch (error) {

    }
})


bot.command('createAccount', (ctx) => {
    try {


        let userId = ctx.message.from.id
        let isUserLoggedIn = checkIfUserIsLoggedIn(userId, ctx, true)
        if (isUserLoggedIn) {
            walletManager.createAccount(userId, function (accounts) {
                console.log('accounts: ', accounts)
                if (accounts !== undefined) {
                    let msg = "Account created successfully \n"

                    if (accounts.length === 0) {
                        state[userId].currentAccount = 0
                    } else {
                        console.log('already has accounts')
                    }

                    for (let i = 0; i < accounts.length; i++) {
                        let account = accounts[i].address
                        msg += `${i + 1}. ${account} \n`
                    }
                    ctx.reply(msg)
                } else {
                    let msg = "Something went wrong while creating your Neo account"
                    ctx.reply(msg)
                }
            })
        }
    } catch (error) {
        let msg = "Something went wrong while logging in"
        ctx.reply(msg)
    }
})



bot.command('logout', (ctx) => {
    try {
        let userId = ctx.message.from.id
        let isUserLoggedIn = checkIfUserIsLoggedIn(userId, ctx, true)
        if (isUserLoggedIn) {
            state[userId].isLoggedIn = false
            ctx.reply('logout')
        }
    } catch (error) {

    }
})

bot.command('addAccount', (ctx) => {
    try {
        let userId = ctx.message.from.id
        let url = `${domain}/addAccount.html?userId=${userId}&platform=telegram`
        let isUserLoggedIn = checkIfUserIsLoggedIn(userId, ctx, true)
        if (isUserLoggedIn) {
            state[userId].WIFAdded = false
            ctx.reply(`Please go to the following url in order to add an existing Neo account ` + url)
            waitForUserToAddWIF(ctx, userId)
        }
    } catch (error) {

    }
})

bot.command('listAccounts', (ctx) => {
    try {

        let userId = ctx.message.from.id
        let isUserLoggedIn = checkIfUserIsLoggedIn(userId, ctx, true)
        if (isUserLoggedIn) {
            dbHelper.getAccounts(userId, function (res) {
                let accounts = res
                let reply = ""
                if (accounts.length > 0) {
                    for (let i = 0; i < accounts.length; i++) {
                        reply += `${(i + 1)}. ${accounts[i].address} \n`
                    }
                    ctx.reply(reply)
                } else {
                    let reply = "You don't have any Neo accounts yet"
                    ctx.reply(reply)
                }
            })
        }
    } catch (error) {

    }
})

bot.command('selectAccount', (ctx) => {
    try {


        let userId = ctx.message.from.id
        let isUserLoggedIn = checkIfUserIsLoggedIn(userId, ctx, true)
        if (isUserLoggedIn) {
            let message = ctx.message.text
            let parsedMessage = message.replace(/[^.\d]/g, '').trim()

            if (parsedMessage !== "") {
                let accountIndex = parseInt(parsedMessage)
                console.log("account index: ", accountIndex)
                let msg
                dbHelper.getAccount(userId, accountIndex, function (account) {
                    if (account !== undefined) {
                        state[userId].currentAccount = (accountIndex - 1)
                        msg = `The current selected account is:\n` + `${accountIndex}. ${account.address}`
                        ctx.reply(msg)
                    } else {
                        msg = "Unable to select account because it doesn't exist"
                        ctx.reply(msg)
                    }
                })
            } else {
                msg = "Please insert a valid account number"
                ctx.reply(msg)
            }
        }
    } catch (error) {

    }

})

bot.command('saveAddress', async (ctx) => {
    try {
        let userId = ctx.message.from.id
        let message = ctx.message.text.split(" ")
        let name = message[1].trim()
        let address = message[2].trim()

        let isUserLoggedIn = checkIfUserIsLoggedIn(userId, ctx, true)
        if (isUserLoggedIn) {
            let accountIndex = state[userId].currentAccount
            if (accountIndex !== -1) {
                await dbHelper.getAccounts(userId, async function (accounts) {
                    if (accounts !== undefined) {
                        let WIF = accounts[accountIndex].WIF
                        let txid = await smartContractHelper.saveAddress(WIF, name, address)
                        if (txid !== undefined) {
                            ctx.reply(`Successfully saved address: ` + txid)
                        } else {
                            ctx.reply("Failed to save address")
                        }
                    }
                })
            }
        }
    } catch (error) {

    }
})

bot.command('addressList', async (ctx) => {
    try {
        let userId = ctx.message.from.id
        let isUserLoggedIn = checkIfUserIsLoggedIn(userId, ctx, true)
        if (isUserLoggedIn) {
            let accountIndex = state[userId].currentAccount
            if (accountIndex !== -1) {
                await dbHelper.getAccounts(userId, async function (accounts) {
                    if (accounts !== undefined) {
                        let address = accounts[accountIndex].address
                        let addresses = await smartContractHelper.getAddresses(address)
                        if (addresses !== undefined) {
                            console.log("found: ", addresses)
                            let msg = "Here is your address list: \n"
                            for (let i = 0; i < addresses.length; i++) {
                                msg += `${i + 1}. ${addresses[i].name}  ${addresses[i].address} \n`
                            }
                            ctx.reply(msg)
                        } else {
                            ctx.reply("Failed to retrieve addressList")
                        }
                    }
                })
            }
        }
    } catch (error) {

    }
})

bot.command('balance', (ctx) => {
    try {
        let userId = ctx.message.from.id
        let isUserLoggedIn = checkIfUserIsLoggedIn(userId, ctx, true)
        if (isUserLoggedIn) {

            if (state[userId].currentAccount !== -1) {
                dbHelper.getAccounts(userId, function (accounts) {
                    if (accounts.length > 0) {
                        let index = state[userId].currentAccount
                        let address = accounts[index].address
                        walletManager.checkBalance(address, function (balances) {
                            console.log("balances ", balances)
                            let msg = `Balance for account ${address}:\n `
                            if (balances.length > 0) {
                                for (let i = 0; i < balances.length; i++) {
                                    msg += `${balances[i].assetName} : ${balances[i].amount} \n`
                                }
                            } else {
                                msg += `Gas: 0, Neo: 0`
                            }
                            ctx.reply(msg)

                        })
                    }
                })
            } else {
                let message = "Please create an account first"
                ctx.reply(message)
            }

        }
    } catch (error) {

    }
})

bot.command('send', async (ctx) => {
    try {
        let userId = ctx.message.from.id
        let message = ctx.message.text.split(" ")
        console.log(message)
        let amount = message[1].trim()
        let to = message[2].trim()





        let isUserLoggedIn = checkIfUserIsLoggedIn(userId, ctx, true)
        if (isUserLoggedIn) {
            dbHelper.getAccounts(userId, async function (accounts) {
                if (accounts.length > 0) {
                    let index = state[userId].currentAccount
                    let WIF = accounts[index].WIF
                    if (to.length < 34) {
                        let address = accounts[index].address
                        console.log(" search for address in smart contract, ", address)
                        to = await smartContractHelper.getAddress(address, to)
                    }
                    walletManager.send(amount, to, WIF, function (txid) {
                        if (txid !== undefined) {
                            let msg = `Successfully Sent ${amount} GAS to ${to}\n` + `Transaction id: ${txid}`
                            ctx.reply(msg)
                        } else {
                            let msg = `Transaction failed`
                            ctx.reply(msg)
                        }
                    })
                }
            })
        }
    } catch (error) {

    }
})


bot.launch()


let waitForUserToLogin = (ctx, userId) => {
    setTimeout(() => {
        if (state[userId].isLoggedIn) {
            console.log('login successful')
            ctx.reply("login successful")
        } else {
            console.log('waiting for user to login')
            waitForUserToLogin(ctx, userId)
        }
    }, 2000);
}


let waitForUserToAddWIF = (ctx, userId) => {
    setTimeout(() => {
        if (state[userId].WIFAdded) {
            ctx.reply("Account added successfully")
        } else {
            console.log('waiting for user  to add WIF')
            waitForUserToAddWIF(ctx, userId)
        }
    }, 2000);
}


let changeLoginState = (data) => {
    let password = data.password
    let userId = data.userId
    console.log('change state,', password)
    if (password === process.env.PASSWORD) {
        state[userId].isLoggedIn = true
        console.log('login successful')
        return true
    } else {
        console.log('login failed')
        return false
    }
}

let changeAccountAddingState = async (data) => {
    console.log("here")
    let WIF = data.WIF
    let userId = data.userId
    let isWIFValid = await walletManager.checkIfWIFIsValid(WIF)
    console.log('change state, is WIF valid', isWIFValid)
    if (isWIFValid) {
        await walletManager.addAccount(userId, WIF, function (accounts) {
            if (accounts !== undefined) {
                state[userId].WIFAdded = true
                console.log('wif added successfully: ', accounts)
                return true
            }
        })
        return true
    } else {
        console.log('wif is invalid')
        return false
    }
}

let checkIfUserIsLoggedIn = (userId, ctx, reply) => {
    if (state[userId]) {
        if (!state[userId].isLoggedIn) {
            if (reply) {
                ctx.reply(`You are not logged in. Please use the /login command in order login first`)
            }
            state[userId].WIFAdded = false
            return false
        } else {
            return true
        }
    } else {
        state[userId] = {
            isLoggedIn: false,
            WIFAdded: false,
            currentAccount: -1
        }
        if (reply) {
            ctx.reply(`You are not logged in. Please use the /login command in order login first`)
        }
        return false
    }
}


// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

module.exports = { changeLoginState, changeAccountAddingState }