_Kalabalik_ is an **unofficial** REST API implementation for the Swedish ERP system [FDT Avance](http://fdt.se/affarssystem/).

It currently supports GET on two entity types: products and orders.

## Installation instructions

1. Download the latest release/dev version or clone the repo.
2. Unzip/Unpack and go to the folder
3. Copy and rename settings.default.js: `cp config/settings.default.js settings.js` and add your database credentials to settings.js.
4. Run Kalabalik `node server.js`
5. Go check it out at `http://localhost:3000` in a browser of choice.

## Project status

Kalabalik is currently under development and is subject to change. Not safe for production use.
