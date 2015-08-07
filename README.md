_Kalabalik_ is an **unofficial** REST API implementation for the Swedish ERP system [FDT Avance](http://fdt.se/affarssystem/).

It currently supports GET on three entity types: products (artiklar), orders (fakturor) and line items (fakturarader).

## Prerequisites

- Node.js (to be able to run the REST server)
- MS SQL access (to be able to get the data)

Kalabalik only supports Avance using MS SQL as data storage.

## Installation instructions

1. Download the [latest release](https://github.com/olssongerthel/Kalabalik/releases) or clone the repo.
2. Unzip/Unpack and go to the folder
3. Copy and rename settings.default.js: `cp config/settings.default.js settings.js` and add your database credentials to settings.js.
4. Install dependencies: `npm install --production`
5. Run Kalabalik: `node server.js`
6. Go check it out at `http://localhost:3000` in a browser of choice.

**Optional**: Add username and password to settings.js to enable basic authentication. If you don’t want to use 3000 as port number you can change that as well in settings.js.

## Filtering responses
Kalabalik supports filtering on any database column using pipe delimited values.

Single filter:
`/orders?filter=|Status=3`

Multiple filters:
`/orders?filter=|Status=3|Dellevererad=1`

Use 1 or 0 for TRUE/FALSE when filtering.

## Project status

Kalabalik is currently under development and is subject to change. Not safe for production use.
