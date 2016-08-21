_Reports_ are custom single-page-response database queries. Say you want to get the total order history amount of a specific customer. Using the entity endpoints now you would have to query all order history and current orders based filter on the customer ID, and then combine those values from the line items. Custom reports makes this easier by supplying a way to create 100% custom reports based on a single SQL query.

A _report_ consists of two files:

- `<report-name>.report.js`
- `<report-name>.report.sql`

Place the files in a folder named `<report-name>` in the `/reports` directory and Kalabalik will automatically locate them and display them on the endpoint list.

## Reports and query parameters

Reports support query parameters. Add the variables wherever needed in the sql query and prefix the value with `@`. The value will then be replaced when a query parameter with the same name is used. Parameters must have default values, which are set in the `<report-name>.report.js` file.

## Example report

An example report that displays the number of active products in the database. The query parameter `sortimentstatus` that is used in the example has a default value of `70`.

**example.report.js**
```
exports.report = {
  name: 'Products',
  parameters: {
    'sortimentstatus': 70
  }
}
```

**example.report.sql**
```
SELECT TOP 1000 COUNT("Art"."ArtikelNr") AS "Artiklar"
FROM "dbo". "Art"
WHERE "Art"."SortimentStatus" <> @sortimentstatus
```
