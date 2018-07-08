var request = require('request');
import * as dotenv from 'dotenv';
dotenv.config();
const FOREX_API_KEY = 'bfBuXo30skEAA0ES4Wz3lNQksUjcTuce';
module.exports = {
    getNewFiatPrice(fiatNames) {
        console.log('process.env.FOREX_API_KEY :', process.env.FOREX_API_KEY);
        const pairs = fiatNames.toString();
        const urlForexPrices = `https://forex.1forge.com/1.0.3/quotes?pairs=${pairs}&api_key=${FOREX_API_KEY}`
        return this.requestToResource(urlForexPrices);
    },
    requestToResource(url) {
        return request(url, function (error, response, body) {
            //console.log('error:', error); // Print the error if one occurred
            //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            //console.log('body:', body); // Print the HTML for the Google homepage.
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
