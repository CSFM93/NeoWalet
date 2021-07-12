const express = require('express');
const { MessagingResponse } = require('twilio').twiml;
const router = express.Router();
require('dotenv').config()

let { walletManager } = require('./helpers/walletManagerWhatsapp')
let { dbHelper } = require('./helpers/dbHelperWhatsapp')
let { smartContractHelper } = require("./helpers/smartContractHelper")
let isDev = false

let domain = isDev ? process.env.LOCAL : process.env.DOMAIN
let state = {}

const id = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
  
// Importing the Twilio module
const twilio = require('twilio');
  
// Creating a client
const client = twilio(id, token);

router.post('/whatsapp', async (req, res) => {
    console.log('message: ', req.body)
    let message = req.body.Body;
    let userId = req.body.From.replace("whatsapp:+", "")
    try {
        if (message.includes("/start")) {
            start(userId, message)
        } else if (message.includes("/commands")) {
            commands(userId, message)
        } else if (message.includes("/login")) {
            login(userId, message)
        } else if (message.includes("/logout")) {
            logout(userId, message)
        } else if (message.includes("/createAccount")) {
            createAccount(userId, message)
        } else if (message.includes("/addAccount")) {
            addAccount(userId, message)
        } else if (message.includes("/listAccounts")) {
            listAccounts(userId, message)
        } else if (message.includes("/selectAccount")) {
            selectAccount(userId, message)
        } else if (message.includes("/saveAddress")) {
            saveAddress(userId, message)
        } else if (message.includes("/addressList")) {
            addressList(userId, message)
        } else if (message.includes("/balance")) {
            balance(userId, message)
        } else if (message.includes("/send")) {
            send(userId, message)
        }
        res.end
    } catch (error) {
        console.log(error);
    }
});







async function start(userId, msg) {
    try {
        dbHelper.initDB(userId)
        state[userId] = {
            isLoggedIn: false,
            WIFAdded: false,
            currentAccount: -1
        }
        sendMessage(userId, `Welcome ` + userId)

    } catch (error) {
    }
}


function commands(userId, msg) {
    try {
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
        sendMessage(userId, message)

    } catch (error) {

    }
}

async function login(userId, msg) {
    try {
        let url = `${domain}/login.html?userId=${userId}&platform=whatsapp`
        console.log("login ", userId)
        console.log("login ", url)

        let isUserLoggedIn = checkIfUserIsLoggedIn(userId, false)
        console.log('login: ', userId,isUserLoggedIn)
        if (isUserLoggedIn) {
            sendMessage(userId, `You are already logged in `)
        } else {
            let msg = `Please go to the following url in order to login ${url}`.toString()
            // msg = `${url}`.toString()
            // msg = "Please go to the following url in order to login "+ url

            sendMessage(userId, msg)
            waitForUserToLogin(userId)
        }
    } catch (error) {
        console.log("error login: ",error)
    }
}


async function createAccount(userId, msg) {
    try {
        let isUserLoggedIn = checkIfUserIsLoggedIn(userId, true)
        console.log('login: ', userId,isUserLoggedIn)

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
                    sendMessage(userId, msg)
                } else {
                    let msg = "Something went wrong while creating your Neo account"
                    sendMessage(userId, msg)
                }
            })
        }
    } catch (error) {
        let msg = "Something went wrong while logging in"
        sendMessage(userId, msg)
    }
}



async function logout(userId, msg) {
    try {
        let isUserLoggedIn = checkIfUserIsLoggedIn(userId, true)
        if (isUserLoggedIn) {
            state[userId].isLoggedIn = false
            sendMessage(userId, 'logout')
        }
    } catch (error) {

    }
}



async function addAccount(userId, msg) {
    try {
        let url = `${domain}/addAccount.html?userId=${userId}&platform=whatsapp`
        let isUserLoggedIn = checkIfUserIsLoggedIn(userId, true)
        if (isUserLoggedIn) {
            state[userId].WIFAdded = false
            sendMessage(userId, `Please go to the following url in order to add an existing Neo account ` + url)
            waitForUserToAddWIF(userId)
        }
    } catch (error) {

    }
}

async function listAccounts(userId, msg) {
    try {
        let isUserLoggedIn = checkIfUserIsLoggedIn(userId, true)
        if (isUserLoggedIn) {
            dbHelper.getAccounts(userId, function (res) {
                let accounts = res
                let reply = ""
                if (accounts.length > 0) {
                    for (let i = 0; i < accounts.length; i++) {
                        reply += `${(i + 1)}. ${accounts[i].address} \n`
                    }
                    sendMessage(userId, reply)
                } else {
                    let reply = "You don't have any Neo accounts yet"
                    sendMessage(userId, reply)
                }
            })
        }
    } catch (error) {

    }
}

async function selectAccount(userId, msg) {
    try {
        let isUserLoggedIn = checkIfUserIsLoggedIn(userId, true)
        if (isUserLoggedIn) {
            let message = msg
            let parsedMessage = message.replace(/[^.\d]/g, '').trim()
            console.log("select account: ",msg)
            if (parsedMessage !== "") {
                let accountIndex = parseInt(parsedMessage)
                console.log("account index: ", accountIndex)
                let msg
                dbHelper.getAccount(userId, accountIndex, function (account) {
                    if (account !== undefined) {
                        state[userId].currentAccount = (accountIndex - 1)
                        msg = `The current selected account is:\n` + `${accountIndex}. ${account.address}`
                        sendMessage(userId, msg)
                    } else {
                        msg = "Unable to select account because it doesn't exist"
                        sendMessage(userId, msg)
                    }
                })
            } else {
                msg = "Please insert a valid account number"
                sendMessage(userId, msg)
            }
        }
    } catch (error) {

    }

}

async function saveAddress(userId, msg) {
    try {
        let message = msg.split(" ")
        let name = message[1].trim()
        let address = message[2].trim()
        console.log("saving address", name, " ", address)

        let isUserLoggedIn = checkIfUserIsLoggedIn(userId, true)
        if (isUserLoggedIn) {
            let accountIndex = state[userId].currentAccount
            if (accountIndex !== -1) {
                await dbHelper.getAccounts(userId, async function (accounts) {
                    if (accounts !== undefined) {
                        let WIF = accounts[accountIndex].WIF
                        let txid = await smartContractHelper.saveAddress(WIF, name, address)
                        if (txid !== undefined) {
                            sendMessage(userId, `Successfully saved address: ` + txid)
                        } else {
                            sendMessage(userId, "Failed to save address")
                        }
                    }
                })
            }
        }
    } catch (error) {

    }
}

async function addressList(userId, msg) {
    try {
        let isUserLoggedIn = checkIfUserIsLoggedIn(userId, true)
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
                            sendMessage(userId, msg)
                        } else {
                            sendMessage(userId, "Failed to retrieve addressList")
                        }
                    }
                })
            }
        }
    } catch (error) {

    }
}

function balance(userId, msg) {
    try {
        let isUserLoggedIn = checkIfUserIsLoggedIn(userId, true)
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
                            sendMessage(userId, msg)

                        })
                    }
                })
            } else {
                let message = "Please create an account first"
                sendMessage(userId, message)
            }

        }
    } catch (error) {

    }
}

function send(userId, msg) {
    try {
        let message = msg.split(" ")
        console.log(message)
        let amount = message[1].trim()
        let to = message[2].trim()

        let isUserLoggedIn = checkIfUserIsLoggedIn(userId, true)
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
                            sendMessage(userId, msg)
                        } else {
                            let msg = `Transaction failed`
                            sendMessage(userId, msg)
                        }
                    })
                }
            })
        }
    } catch (error) {

    }
}





let waitForUserToLogin = (userId) => {
    setTimeout(() => {
        if (state[userId].isLoggedIn) {
            console.log('login successful')
            sendMessage(userId, "login successful")
        } else {
            console.log('waiting for user to login')
            waitForUserToLogin(userId)
        }
    }, 2000);
}


let waitForUserToAddWIF = (userId) => {
    setTimeout(() => {
        if (state[userId].WIFAdded) {
            sendMessage(userId, "Account added successfully")
        } else {
            console.log('waiting for user  to add WIF')
            waitForUserToAddWIF(userId)
        }
    }, 2000);
}


let changeLoginState = (data) => {
    let password = data.password
    let userId = data.userId
    console.log('change state,', password)
    if (password === process.env.PASSWORD) {
        state[userId].isLoggedIn = true
        console.log('login successful', userId)
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

let checkIfUserIsLoggedIn = (userId, reply) => {
    if (state[userId]) {
        if (!state[userId].isLoggedIn) {
            if (reply) {
                sendMessage(userId, `You are not logged in. Please use the /login command in order login first`)
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
            sendMessage(userId, `You are not logged in. Please use the /login command in order login first`)
        }
        return false
    }
}

function sendMessage(userId, message) {
    console.log("message: ",message)
    if (message !== undefined) {
        try {
            // console.log('message: ',message)
            client.messages
            .create({
                  
                body: message,
                from: 'whatsapp:+14155238886',
                to: `whatsapp:+${userId}`
            })
            .then(message => console.log("Message sent successfully"))
            .catch(error => console.log("failed to send message"))
            .done();
        } catch (error) {
            console.log(error)
        }
    }

}

module.exports = {router, changeLoginState, changeAccountAddingState }
