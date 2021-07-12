let Neon = require('@cityofzion/neon-js')
let { CONST, wallet, api, u, rpc } = require('@cityofzion/neon-core')

let { dbHelper } = require('./dbHelperDiscord')

let rpcAddress = "https://testnet2.neo.coz.io:443";
const rpcClient = new rpc.RPCClient(rpcAddress);
let networkMagic = 844378958
let scriptHash = "0xefeb7fa101996240a35a88f388407f0027ce02e4"

let walletManager = {
    async checkIfWIFIsValid(WIF) {
        try {
            console.log("checking if wif is valid")
            let account = new Neon.wallet.Account(WIF)
            console.log(account.address)
            return true
        } catch (error) {
            console.log("wif is not valid")
            return false
        }
    },
    async createAccount(userId, cb) {
        let key = Neon.wallet.generatePrivateKey()
        let WIF = Neon.wallet.getWIFFromPrivateKey(key)
        console.log(key, " - ", WIF)
        let account = new Neon.wallet.Account(WIF)
        console.log(account.address)
        let data = {
            address: account.address,
            WIF: WIF
        }
        let accounts = await dbHelper.addAccount(userId, data).then(accounts => {
            // console.log(res)
            return accounts
        })
            .catch(error => {
                console.log('error', error)
                cb(undefined)
            })
        cb(accounts)
    },
    async addAccount(userId, WIF, cb) {
        let account = new Neon.wallet.Account(WIF)
        console.log(account.address)
        let data = {
            address: account.address,
            WIF: WIF
        }
        let accounts = await dbHelper.addAccount(userId, data).then(accounts => {
            return accounts
        })
            .catch(error => {
                console.log('error', error)
                cb(undefined)
            })
        cb(accounts)
    },
    async checkBalance(address, cb) {
        let balanceResponse;
        const inputs = {
            fromAccount: new wallet.Account(
                address
            ),
        }
        try {
            balanceResponse = await rpcClient.execute(new rpc.Query({
                method: "getnep17balances",
                params: [inputs.fromAccount.address],
            }));

            // Check for token funds
            const balances = balanceResponse['balance']
            for (let i = 0; i < balances.length; i++) {
                balances[i]['amount'] = parseInt(balances[i]['amount']) / (100000000)
                if (balances[i]['assethash'].includes(CONST.NATIVE_CONTRACT_HASH.GasToken)) {
                    balances[i]['assetName'] = 'Gas'
                    gasBalance = balances[i]['amount']
                } else if (balances[i]['assethash'].includes(CONST.NATIVE_CONTRACT_HASH.NeoToken)) {
                    balances[i]['assetName'] = 'Neo'
                    neoBalance = balances[i]['amount']
                }
            }
            console.log(balances)
            cb(balances)

        } catch (e) {
            console.log(e)
            console.log(
                "\u001b[31m  ✗ Unable to get balances as plugin was not available. \u001b[0m"
            );
            cb("Unable to get balances as plugin was not available");
        }

    },
    async send(amount, address, WIF,cb) {
        try {


            const facadePromise = Neon.api.NetworkFacade.fromConfig({
                node: rpcAddress,
            });
            const intent = {
                from: new Neon.wallet.Account(WIF),
                to: address,
                decimalAmt: (amount),
                contractHash: Neon.CONST.NATIVE_CONTRACT_HASH.GasToken,
            };

            const signingConfig = {
                signingCallback: Neon.api.signWithAccount(
                    new Neon.wallet.Account(WIF)
                ),
            };

            let result = await facadePromise
                .then((facade) => facade.transferToken([intent], signingConfig))
                .then((txid) => {
                    console.log('transaction id: ', txid)
                    cb(txid)
                })
                .catch((err) => {
                    console.log(err)
                    cb(undefined)
                });
            console.log("result", result)
        } catch (error) {
            cb(undefined)
        }
    }

}


module.exports = { walletManager }