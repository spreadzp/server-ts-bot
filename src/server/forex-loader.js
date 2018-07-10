var request = require('request');
import * as dotenv from 'dotenv';
dotenv.config(); 

module.exports = {
    getNewFiatPrice(fiatNames) {
        console.log('process.env.FOREX_API_KEY :', process.env.FOREX_API_KEY);
        const pairs = fiatNames.toString();
        const urlForexPrices = `https://forex.1forge.com/1.0.3/quotes?pairs=${pairs}&api_key=${process.env.FOREX_API_KEY}`
        return this.requestToResource(urlForexPrices);
    },
    requestToResource(url) {
        return request(url, function (error, response, body) {
        })
    },
    fiatParser(data) {
        const forexPrices = {};
        data = JSON.parse(data);
        for (const iterator in data) {
            forexPrices[data[iterator].symbol] = [data[iterator].bid,             
            data[iterator].ask, data[iterator].price];
        }
        console.log('forexPrices :', forexPrices);
        return forexPrices;
    } 
}
