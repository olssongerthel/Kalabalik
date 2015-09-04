_Kalabalik_ is an **unofficial** REST API implementation for the Swedish ERP system [FDT Avance](http://fdt.se/affarssystem/).

It currently supports GET on a couple of entity types: products (artiklar), orders (fakturor), line items (fakturarader), customers (kunder) and stock data (lagersaldo).

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
Kalabalik supports filtering on any database column using pipe delimited values. It supports standard SQL operators such as `=`, `>`, `<` etc.

Example 1: Single filter
`/orders?filter=Status=3`

Example 2: Multiple filters
`/orders?filter=Status=3|Dellevererad=1|`

Example 3: Filter on on orders from a certain date
`/orders?filter=Orderdatum>"2015-09-04T00:00:00.000Z"`

Use 1 or 0 for TRUE/FALSE when filtering. Use quotes for strings.

## Controlling the pages and results

There are two available parameters related to results:

`PerPage` can be set to any integer below 10.000. Default is 25.
`page` is the actual page number. This value is available in the metadata on each list result.

## Project status

Kalabalik is currently under development and is subject to change. Not safe for production use.
