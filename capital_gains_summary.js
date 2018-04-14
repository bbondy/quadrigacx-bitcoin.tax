/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Calculates a capital gains summary from a detailed bitcoin.tax capital gains CSV export.

const csvdata = require('csvdata')
csvdata.load('bitcointax_gains.csv').then((result) => {
  console.log(result.reduce((summary, current) => {
    const symbol = current['Symbol']
    summary[symbol] =  summary[symbol] || {}
    summary[symbol].proceeds = (summary[symbol].proceeds || 0) + current['Proceeds']
    summary[symbol].costBasis = (summary[symbol].costBasis || 0) + current['Cost Basis']
    current['Cost Basis']
    return summary
  }, {}))
})
