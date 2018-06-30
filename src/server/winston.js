const winston = require('winston'); 
let logger;
/* const logger = new (winston.Logger)({
    transports: [
       new (winston.transports.File)({
        name: 'info-file',
        filename: 'filelog-info.log',
        level: 'info'
      }),  
      new (winston.transports.File)({
        name: 'error-file',
        filename: 'filelog-error.log',
        level: 'error'
      }),
      new (winston.transports.File)({
        name: 'orders-file',
        filename: 'all-orders.log',
        level: 'info'
      })
    ]
  });  */
module.exports = logger;

   /* const forexPrices  = { EURUSD: [ 1.16103, 1.16103, 1.16103 ],
  GBPUSD: [ 1.317, 1.317, 1.317 ],
  USDJPY: [ 109.984, 109.984, 109.984 ] }

  const key =  Object.keys(forexPrices)
  
  

   const searchFiat = key.find(function(element) {
    return element.includes("JPY") 
  } )
   console.log('searchFiat :', searchFiat);  */  