import axios, { AxiosError } from 'axios';
import { AssetResponseDto } from '../interfaces/asset/AssetResponseDto';
import { ExcahngeResponseDto } from '../interfaces/asset/exchangeResponseDto';
const uuidv4 = require("uuid/v4")
const sign = require('jsonwebtoken').sign
const crypto = require('crypto');
const queryString = require('querystring');

const getBalance = async (id: Number) => {
    const prod: boolean = process.env.NODE_ENV === ' production';
    let url
    if (prod) {
        url = `http://server.crypto-crunch-tech.com:8080/api/v1/asset/key/${id}`
    } else {
        url = `http://localhost:8080/api/v1/asset/key/${id}`
    }
    try {
        const coreResponse = await axios({
            method: "GET",
            url: `http://server.crypto-crunch-tech.com:8080/api/v1/asset/key/${id}`,
        })
        const exchangeOptions = {
            method: "GET",
            url: "http://api.manana.kr/exchange/rate.json"
        }
        const exchangeResponse = await axios(exchangeOptions)
        const exchangeData = exchangeResponse.data
        const usdRate = exchangeData.filter((value: ExcahngeResponseDto) => { if (value.name == "USDKRW=X") return value.rate })[0].rate
        const responseData = coreResponse.data.data;
        const assetType = responseData.assetType
        const apiKey = responseData.apiKey;
        const secretKey = responseData.secretKey;

        if (assetType == "UPBIT") {
            const url = "https://api.upbit.com"
            const apiKey = "N3ajRkmxC8xGys4pkvLxUdayCnetO17xZISN0AG0"
            const secretKey = "RQMLvyxkZJro57FyYWrH73kbpqtaOYhfy1YDuOJE"
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

            const data = response.data
            const result: AssetResponseDto[] = []
            let totalAsset: number = 0
            await Promise.all(data.map(async (value: any) => {
                const symbol = value.currency
                const balance = parseFloat(value.balance)
                let price
                if (symbol != "KRW") {
                    const marketOptions = {
                        method: 'GET',
                        url: `https://api.upbit.com/v1/candles/minutes/1?market=KRW-${symbol}&count=1`,
                        headers: { Accept: 'application/json' }
                    };
                    const marketResponse = await axios(marketOptions)
                    const marketData = marketResponse.data[0]
                    price = marketData.trade_price
                    const usdAsset = price * balance / usdRate
                    result.push({
                        symbol,
                        balance,
                        asset: balance * price,
                        usdAsset
                    })
                    totalAsset += usdAsset
                } else {
                    const usdAsset = balance / usdRate
                    result.push({
                        symbol,
                        balance,
                        asset: balance,
                        usdAsset
                    })
                    totalAsset += usdAsset
                }
            }))

            return {
                assets: result,
                totalAsset
            }

        }
        else if (assetType == "BINANCE") {
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
            const result: AssetResponseDto[] = []
            let totalAsset: number = 0
            await Promise.all(data.map(async (value: any) => {
                const symbol = value.asset
                const balance = parseFloat(value.free)
                let price
                if (symbol != "BUSD") {
                    const marketOptions = {
                        method: "GET",
                        url: url + "/api/v3/avgPrice" + "?" + `symbol=${symbol}BUSD`,
                        headers: {
                            "X-MBX-APIKEY": apiKey
                        },
                    }
                    const newResponse = await axios(marketOptions)
                    price = parseFloat(newResponse.data.price)
                    const asset: number = balance * price
                    result.push({
                        symbol,
                        balance,
                        asset: asset * usdRate,
                        usdAsset: asset
                    })
                    totalAsset = totalAsset + asset
                } else {
                    result.push({
                        symbol,
                        balance,
                        asset: balance * usdRate,
                        usdAsset: balance
                    })
                    totalAsset += balance
                }
            }))
            return {
                assets: result,
                totalAsset: totalAsset
            }
        } else if (assetType == 'BITHUMB') {

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
            const status = response.data.status
            if (status == '5300') {
                return null
            }
            const data = response.data.data
            const result: AssetResponseDto[] = []
            let totalAsset: number = 0
            await Promise.all(Object.keys(data).map(async (value) => {
                if (value.includes("total")) {
                    if (data[value] > 0) {
                        const words = value.split("_")
                        const symbol = words[1]
                        const balance = parseFloat(data[value])
                        let price
                        if (symbol != 'krw') {
                            const marketOptions = {
                                method: "GET",
                                url: `https://api.bithumb.com/public/ticker/${symbol}`,
                                headers: { Accept: 'application/json' }
                            }
                            const marketResponse = await axios(marketOptions)
                            const marketData = marketResponse.data.data
                            price = marketData.closing_price
                            const usdAsset = balance * price / usdRate
                            result.push({
                                symbol,
                                balance,
                                asset: balance * price,
                                usdAsset
                            })
                            totalAsset += usdAsset
                        } else {
                            const usdAsset = balance / usdRate
                            result.push({
                                symbol,
                                balance,
                                asset: balance,
                                usdAsset
                            })
                            totalAsset += usdAsset
                        }
                    }
                }
            }))
            return {
                asset: result,
                totalAsset
            }
        }
    } catch (err) {
        const errors = err as Error | AxiosError;
        if (!axios.isAxiosError(errors)) {
            console.log(errors)
            throw errors
        }
        return null
    }
}

const getAllApiKey = async (accessToken: any) => {
    const coreResponse = await axios({
        method: "GET",
        url: "http://localhost:8080/api/v1/asset/",
        headers: { accessToken: accessToken },
    })

    console.log(coreResponse.data)
}
export default {
    getBalance,
    getAllApiKey,
}