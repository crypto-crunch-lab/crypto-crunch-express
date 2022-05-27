import axios from "axios";
const request = require('request')
const uuidv4 = require("uuid/v4")
const sign = require('jsonwebtoken').sign
const crypto = require('crypto');
const queryString = require('querystring');

const getBalance = async (accessToken: any, id: Number) => {
    try {
        const coreResponse = await axios({
            method: "GET",
            url: `http://localhost:8080/api/v1/portfolio/key/${id}`,
            headers: { accessToken: accessToken },
        })

        const responseData = coreResponse.data.data;
        const portfolioType = responseData.portfolioType
        const apiKey = responseData.apiKey;
        const secretKey = responseData.secretKey;

        if (portfolioType == "UPBIT") {
            const url = "https://api.upbit.com"

            const payload = {
                access_key: apiKey,
                nonce: uuidv4(),
            }

            const token = sign(payload, secretKey);

            const options = {
                method: "GET",
                url: url + "/v1/accounts",
                headers: { Authorization: `Bearer ${token}` },
            }

            const response = await axios(options)

            console.log(response);

            const data = response.data
            const result: any[] = []
            data.map((value: any) => {
                result.push({
                    'symbol': value.currency,
                    'balance': parseFloat(value.balance)
                })
            })
            return result
        }
        else if (portfolioType == "BINANCE") {
            const url = "https://api.binance.com"
            const timestamp = Date.now() - 1000;
            const signature = crypto.createHmac('sha256', secretKey).update(`timestamp=${timestamp}`).digest('hex')
            const options = {
                method: "GET",
                url: url + "/api/v3/account" + "?" + `timestamp=${timestamp}&signature=${signature}`,
                headers: {
                    "X-MBX-APIKEY": apiKey
                },

            }
            const response = await axios(options)
            const data = response.data.balances.filter((value: any) => { if (parseFloat(value.free) > 0) return value })
            const result: any[] = []
            data.map((value: any) => {
                result.push({
                    'symbol': value.asset,
                    'balance': parseFloat(value.free)
                })
            })
            return result

        } else if (portfolioType == 'BITHUMB') {
            const url = "https://api.bithumb.com/info/balance"

            const nonce = new Date().getTime();
            const parameters = {
                apiKey,
                secretKey,
                currency: "ALL"
            }
            const requestSignature = `${'/info/balance'}${String.fromCharCode(0)}${queryString.stringify(parameters)}${String.fromCharCode(0)}${nonce}`;
            const hmacSignature = Buffer.from(
                crypto.createHmac('sha512', secretKey)
                    .update(requestSignature)
                    .digest('hex'),
            ).toString('base64');

            const headers = {
                'Api-Key': apiKey,
                'Api-Sign': hmacSignature,
                'Api-Nonce': nonce,
            };
            const options = {
                method: "POST",
                url: url,
                data: queryString.stringify(parameters),
                headers
            }

            const response = await axios(options)

            const data: any = response.data.data
            const result: any[] = []
            Object.keys(data).map((value) => {
                if (value.includes("total")) {
                    if (data[value] > 0) {
                        const words = value.split("_")
                        result.push({
                            'symbol': words[1],
                            'balance': parseFloat(data[value])
                        })
                    }
                }
            })
            return result
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

const getAllApiKey = async (accessToken: any) => {
    const coreResponse = await axios({
        method: "GET",
        url: "http://localhost:8080/api/v1/portfolio/",
        headers: { accessToken: accessToken },
    })

    console.log(coreResponse.data)
}
export default {
    getBalance,
    getAllApiKey,
}