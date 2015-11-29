_Kalabalik_ is an **unofficial** REST API implementation for the Swedish ERP system [FDT Avance](http://fdt.se/affarssystem/).

It exposes a number of entities that may be relevant to other systems, and makes it possible to build applications around it or connect FDT with external systems. Entities exposed are (among others):

- products (artiklar)
- orders (fakturor)
- customers (kunder)
- purchase orders (inköpsorder)

..and more. Launch Kalabalik and visit the frontpage of the API to see all endpoints.

## Prerequisites

- Node.js (to be able to run the REST server)
- MS SQL access (to be able to get the data)

Kalabalik only supports Avance using MS SQL as data storage.

## Installation instructions

1. Download the [latest release](https://github.com/olssongerthel/Kalabalik/releases) or clone the repo.
2. Unzip/Unpack and go to the folder
3. Copy and rename config.default.js: `cp config/config.default.js config.js` and add your database credentials to config.js.
4. Install dependencies: `npm install --production`
5. Run Kalabalik: `node server.js`
6. Go check it out at `http://localhost:3000` in a browser of choice.

**Optional**: Add username and password to config.js to enable basic authentication. If you don’t want to use 3000 as port number you can change that as well in config.js.

If you want to run Kalabalik on a Windows server, [IIS Node](https://github.com/tjanczuk/iisnode) is recommended as it makes Node.js and Windows work very well together.

## Filtering responses
Kalabalik supports filtering on any database column using pipe delimited values. It supports standard SQL operators such as `=`, `>`, `<`, `LIKE`, `IS NOT` etc. There are some caveats, for example using `LIKE` with `%` would break the URL so use `$` should be used instead of `%`.

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

## Updating entities

Updating an entity is risky since we're dealing with direct database access. If an endpoint supports PUT, then use it carefully. *Extra* fields might be easy and risk free to update, but keep in mind that there might be a lot of things going around when for example an order is saved in FDT Avance - stuff that is not taken into account for in this API.

To update an entity, submit the changes in JSON format as request body, i.e:

**Content type:** application/json

**Method:** PUT

**URL:** http://api.example.com/purchase-orders/2004

**Body**
```
{
  "Notat": "This is an example text added to the notat field on the purchase order with id 2004."
}
```
Note: Sub-entities (such as line items) cannot be updated this way.

## Project status

Kalabalik is currently under development and is subject to change. Not safe for production use.
