_Reports_ are custom single-page-response database queries. Say you want to get the total order history amount of a specific customer. Using the entity endpoints now you would have to query all order history and current orders based filter on the customer ID, and then combine those values from the line items. Custom reports makes this easier by supplying a way to create 100% custom reports based on a single SQL query.

A _report_ consists of two files:

- `<report-name>.report.js`
- `<report-name>.report.sql`

Place the files in a folder named `<report-name>` in the `/reports` directory and Kalabalik will automatically locate them and display them on the endpoint list.

## Reports and query parameters

Reports support query parameters. Add the variables wherever needed in the sql query and prefix the value with `@`. The value will then be replaced when a query parameter with the same name is used. Parameters must have default values unless they are required, which are set in the `<report-name>.report.js` file.

## Example report

An example report that displays the total order value of a specific customer (both finished and ongoing orders). The query parameter `customerID` that is used in the example does not have a default value.

**example.report.js**
```
exports.report = {
  name: 'Customer total',
  parameters: {
    customerID: {
      value: null, // Leave this empty if your report requires a parameter value.
      type: 'string', // Can also be set to 'integer'
      required: true // This parameter is required because it doesn't have a default value.
    }
  }
}
```

**example.report.sql**
```
SELECT (
  (
    SELECT ISNULL(SUM(BeloppExkl), 0)
    FROM "FaktK"
    INNER JOIN "FaktH"
      ON FaktK.Ordernr = FaktH.Ordernr
    WHERE FaktH.Kundnr = @customerID
    AND FaktH.status != 1 /* Ignore quotes */
    AND FaktK.Typ IN (0,1)
  )
  +
  (
    SELECT ISNULL(SUM(Belopp - MomsBelopp), 0)
    FROM "FaktHstK"
    INNER JOIN "FaktHstH"
      ON FaktHstK.FakturaNr = FaktHstH.FakturaNr
    WHERE FaktHstH.Kundnr = @customerID
    AND FaktHstK.Typ IN (0,1)
  )
) as Total
```
