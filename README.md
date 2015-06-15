_Kalabalik_ is an **unofficial** REST API implementation for the Swedish ERP system [FDT Avance](http://fdt.se/affarssystem/).

It currently supports GET on two entity types: products and orders.

## Installation instructions

1. Download the latest release/dev version or clone the repo.
2. Unzip/Unpack and go to the folder
3. Copy and rename settings.default.js: `cp config/settings.default.js settings.js` and add your database credentials to settings.js.
4. Run Kalabalik `node server.js`
5. Go check it out at `http://localhost:3000` in a browser of choice.

## Filtering responses
Kalabalik supports filtering on any database column using pipe delimited values.

Single filter:
`/orders?filter=|Status=3`

Multiple filters:
`/orders?filter=|Status=3|Dellevererad=1`

Use 1 or 0 for TRUE/FALSE when filtering.

## Project status

Kalabalik is currently under development and is subject to change. Not safe for production use.
