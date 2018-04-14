const secrets = require('./secrets')
const assert = require('assert')
const csvdata = require('csvdata')
const {getQuadrigaTransactions} = require('./quadrigaAPI')

/*
Bitcoin.tax CSV info:
date (date and time as YYYY-MM-DD HH:mm:ss Z)
source (optional, such as an exchange name like MtGox or gift, donation, etc)
action (BUY, SELL or FEE)
symbol (BTC, LTC, DASH, etc)
volume (number of coins traded - ignore if FEE)
currency (specify currency such as USD, GBP, EUR or coins, BTC or LTC)
price (price per coin in Currency or blank for lookup - ignore if FEE)
fee (any additional costs of the trade)
feeCurrency (currency of fee if different than Currency)
*/

const getBitcoinTaxCompatibleInfoFromQuadrigaCXInfo = (result) => {
  // Make a copy so we don't modify input data
  const bitcoinTaxResult = {}

  // Make the result.type more easy to understand
  const type = ['deposit', 'widthdrawl', 'trade'][result.type]

  bitcoinTaxResult.source = 'QuadrigaCX'
  bitcoinTaxResult.date = result.datetime
  bitcoinTaxResult.symbol = ['btc', 'eth', 'ltc', 'bch', 'btg'].find((x) => result[x]) || ''
  bitcoinTaxResult.currency = ['usd', 'cad', 'gbp', 'eur'].find((x) => result[x]) || ''

  if (type === 'deposit' || type === 'widthdrawl') {
    // Deposit and withdrawls are only important in terms of fees
    bitcoinTaxResult.action = 'FEE'
  } else {
    // Otherwise we have a BUY or a SELL
    if (Number(result[bitcoinTaxResult.symbol]) < 0) {
      bitcoinTaxResult.action = 'SELL'
    } else {
      bitcoinTaxResult.action = 'BUY'
    }
  }

  const rateSymbol = `${bitcoinTaxResult.symbol}_${bitcoinTaxResult.currency}`
  bitcoinTaxResult.price = Number(result.rate || 0)
  assert(Number(result[rateSymbol] || 0) === Number(result.rate || 0), 'woops:' + JSON.stringify(result))

  bitcoinTaxResult.fee = Number(result.fee || 0)
  if (bitcoinTaxResult.action === 'BUY') {
    bitcoinTaxResult.feeCurrency = bitcoinTaxResult.symbol
    // Add the fee since it'll be subtracted by bitcoin.tax
    bitcoinTaxResult.volume = Number(result[bitcoinTaxResult.symbol] || 0) + bitcoinTaxResult.fee
  } else if (bitcoinTaxResult.action === 'SELL') {
    bitcoinTaxResult.feeCurrency = bitcoinTaxResult.currency
    bitcoinTaxResult.volume = (result[bitcoinTaxResult.symbol] || 0) * -1
  } else {
    bitcoinTaxResult.feeCurrency = 'cad'
    bitcoinTaxResult.volume = 0
  }
  return bitcoinTaxResult
}


const quadrigaSymbolPairs = ['btc_cad', 'btc_usd', 'eth_cad', 'eth_btc', 'ltc_cad', 'ltc_btc', 'bch_cad', 'bch_btc', 'btg_cad', 'btg_btc']
const processNextQuadrigaSymbolPair = (accumulator = {
  current: 0,
  limit: 50,
  results: [],
  symbolPairIndex: 0
}) => {
  const duplicateFeeChecker = {}
  const currentSymbolPair = quadrigaSymbolPairs[accumulator.symbolPairIndex]
  if (accumulator.symbolPairIndex >= quadrigaSymbolPairs.length) {
    const bitcoinTaxResults = accumulator.results
      .map(getBitcoinTaxCompatibleInfoFromQuadrigaCXInfo)
      .filter((result) => result.action !== 'FEE' || result.fee !== 0)
      .filter((result) => {
        if (result.action === 'FEE' && result.fee === 0) {
          return false;
        }
        const key = JSON.stringify(result)
        if (duplicateFeeChecker[key]) {
          return false;
        }
        duplicateFeeChecker[key] = true
        return true
      })
    // console.log('done!', bitcoinTaxResults)
    csvdata.write('quadriga.csv', bitcoinTaxResults, {header: 'date,source,action,volume,symbol,currency,price,fee,feeCurrency'})
    return
  }

  accumulator.current = 0
  accumulator.resultsThisTime = []
  processAllQuadrigaTransactionsForSymbolPair(currentSymbolPair, accumulator)
    .then((results) => {
      accumulator.symbolPairIndex++
      processNextQuadrigaSymbolPair(accumulator)
    }).catch((e) => {
      console.error(e)
    })
}

const processAllQuadrigaTransactionsForSymbolPair = (symbolPair, accumulator) => {
  return new Promise((resolve, reject) => {
    processNextQuadrigaTransactions(quadrigaSymbolPairs[accumulator.symbolPairIndex], accumulator, () => {
      resolve()
    }).catch((e) => {
      console.error(e)
    })
  })
}

/**
 * Returns true if it should process another, or false if there is nothing left to process
 * symbolPair: e.g. btc_cad
 */
const processNextQuadrigaTransactions = (symbolPair, accumulator, done) => {
  return getQuadrigaTransactions(secrets.quadriga, symbolPair, accumulator.current, accumulator.limit)
    .then((results) => {
      accumulator.results = accumulator.results.concat(results)
      accumulator.resultsThisTime = accumulator.resultsThisTime.concat(results)
      accumulator.current = accumulator.resultsThisTime.length
      if (results.length > 0) {
        processNextQuadrigaTransactions(symbolPair, accumulator, done)
      } else {
        done()
      }
    })
}

processNextQuadrigaSymbolPair()
