# QuadrigaCX bitcoin.tax importer

Quadriga API exporter to Bitcoin.tax csv format


## Use at your own risk

This is just a best attempt at creating an exporter. It may or may not contain bugs, so please verify the data that is imported.


## Instructions

Run the following code in a terminal:

```
git clone https://github.com/bbondy/quadrigacx-bitcoin.tax
cd quadrigacx-bitcoin.tax
npm install
```

Fill out secrets.js with an API key you can generate from the QuadrigaCX site.  Make sure the key can only do read only operations.
Modify index.js to specify which `TAX_YEAR` you'd like.

```
node .
```

It will write out a file `quadriga.csv`.
Upload that file to bitcoin.tax csv format.

Verify that the data is correct, and please either fix any issues you see or email me at bbondy@gmail.com for help.


## Summarizing capital gains reports


As per [this resource on the Simple Tax site](https://help.simpletax.ca/questions/report-crypto-gains):

"The CRA does not get a line-by-line breakdown through NETFILE, but may ask you to back up your amounts with records."

From what I can tell there's no way to get Bitcoin.tax to give you a summary per asset class.

Copy your capital gains detailed report from Bitcoin.tax to the cloned directory of this repo with a filename of `bitcointax_gains.csv`.

run the following:

`node capital_gains_summary.js`

It will give you an output for each asset type with proceeds and cost basis. You can use that in 1 per line format in your capital gains taxes section.


## No Warranty

I make no warranties over the accuracy or interpretation of Canadian tax laws.  Imported data is up to you to verify for accuracy.

This is not tested yet so use at your own risk!
