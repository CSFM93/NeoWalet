
let Neon = require('@cityofzion/neon-js')
let networkMagic = 844378958
let rpcAddress = "https://testnet2.neo.coz.io:443";

let smartContractHelper = {
    async testInvoke(args, operation, scriptHash) {
        const contract = new Neon.experimental.SmartContract(
            Neon.u.HexString.fromHex(scriptHash),
            {
                networkMagic,
                rpcAddress,
            }
        );

        let res
        try {

            res = await contract.testInvoke(operation, args)
                .catch(err => {
                    console.log('error', err)
                })
            console.log(res.state, res.gasconsumed, res.exception)
            if (res.stack) {
                console.log('stack: ', res.stack[0].value)
                let data = res.stack[0].value
            }


        } catch (e) {
            console.log(e)
        }
        return res
    },
    async Invoke(args, operation, scriptHash, WIF) {
        let account = new Neon.wallet.Account(WIF)

        const contract = new Neon.experimental.SmartContract(
            Neon.u.HexString.fromHex(scriptHash),
            {
                networkMagic,
                rpcAddress,
                account
            }
        );

        let result
        try {

            result = await contract.invoke(operation, args)
                .catch(err => {
                    console.log('error', err)
                    return undefined
                })
        } catch (e) {
            console.log(e)
            return undefined
        }
        console.log('txid: ', result)
        return result
    },
    async saveAddress(WIF, name, address) {
        let scriptHash = "0x92913c72887189a438ef447335eb6ccc7150409f"
        let operation = "addAddress"
        let args = [{ "type": "String", "value": `${name.toLowerCase()}` }, { "type": "String", "value": `${address}` }];
        let txid =  this.Invoke(args, operation, scriptHash, WIF)
        return txid
    },
    async getAddress(address, name) {
        let scriptHash = "0x92913c72887189a438ef447335eb6ccc7150409f"
        let operation = "getAddress"
        let args = [{ "type": "String", "value": `${address}` }, { "type": "String", "value": `${name.toLowerCase()}` }];
        let res = await this.testInvoke(args, operation, scriptHash)
        let addressFound = undefined
        if (res.stack[0]) {
            console.log('result: ', res.stack[0].value)
            let data = res.stack[0].value
            let value = Neon.u.HexString.fromBase64(data).toAscii()
            console.log("value", value)
            addressFound = value

            return addressFound
        } else {
            return undefined
        }
    },
    async getAddresses(address) {
        let scriptHash = "0x92913c72887189a438ef447335eb6ccc7150409f"
        let operation = "getAddresses"
        let args = [{ "type": "String", "value": `${address}` }];
        let addresses = []
        let res = await this.testInvoke(args, operation, scriptHash)
        if (res.stack[0]) {
            console.log('result: ', res.stack[0].value)
            let data = res.stack[0].value
            for (let i = 0; i < data.length; i++) {
                let d = data[i].value
                console.log("d: ", d);
                let value = JSON.parse(Neon.u.HexString.fromBase64(d).toAscii())
                console.log(value)
                let address = {
                    name: value[0],
                    address: value[1]
                }
                addresses.push(address)
            }
            return addresses
        } else {
            return undefined
        }

    }
}



// smartContractHelper.saveAddress("L2fwqjEfiNBsbDYVaFNevpRqjVimm9KRNKnTLjX3zcTzfKMBzXLz","tom","NfuqVw8Z7kA6Cp7oAr5fF9MV9URYjcU5iQ")
// smartContractHelper.getAddresses("Nee5iotFmMPK9k6gmWhBW5d1oyUzBa8Qn5")
// smartContractHelper.getAddress("Nee5iotFmMPK9k6gmWhBW5d1oyUzBa8Qn5","tom")

module.exports = { smartContractHelper }