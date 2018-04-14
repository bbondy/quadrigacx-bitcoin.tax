/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const r = require('request')
const crypto = require('crypto');
const querystring = require('querystring');

// QuadrigaCX documentation:
// https://www.quadrigacx.com/api_info

/**
 * Resolves a promise with the Quadriga transactions
 * Note that the max serverside limit is 50
 * */
const getQuadrigaTransactions = (auth, book, offset=0, limit=50) =>
  quadrigaPrivateAPI(auth,
    'https://api.quadrigacx.com/v2/user_transactions', {
      offset,
      limit,
      book
  })

/**
 * Resolves a promise with a private quadriga API call
 * */
const quadrigaPrivateAPI = (auth, url, extraParams) => {
  return new Promise((resolve, reject) => {
    const nonce = Date.now()
    const signature = crypto.createHmac('sha256', auth.secret)
      .update(nonce + auth.clientID + auth.key)
      .digest('hex');
    const postData = {
      nonce,
      key: auth.key,
      signature: signature,
      ...extraParams
    }
    const options = {
      method: 'POST',
      body: postData,
      json: true,
      url
    }
    r(options, function (err, res, body) {
      resolve(body)
    })
  })
}


module.exports = {
  getQuadrigaTransactions,
}
