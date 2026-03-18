# Filtering & Searching

Once data is loaded, you can narrow down rows using the **search bar** and **filter drawer**.

## Global Search

The search bar at the top of the toolbar searches **all visible columns** simultaneously.

- Type any keyword and results update automatically (500ms debounce)
- Search is case-insensitive
- Searches the full dataset — not just the current page

## Filter Drawer

Click the **Filters** button in the toolbar to open the filter drawer on the right side.

### Value Filters

For text columns, you can select specific values to show. The drawer loads the **full list of distinct values** from the entire dataset — not just the current page.

::: info
If a column has more than **500 distinct values**, only the first 500 are shown with a notice. Use the search bar inside the filter drawer to find specific values.
:::

### Date Range Filters

For date columns, you can set a **From** and **To** date range. The system compares dates as integers (epoch days) for fast filtering.

## Clearing Filters

- Click **Clear filters** next to the Filters button to remove all active filters at once
- Individual filters can be removed inside the filter drawer
- The Filters button shows a **red badge** with the count of active filters

## Active Filter Count

The toolbar shows how many filters are currently active via a badge on the Filters button.

→ [Selecting Rows](/user-manual/selecting-rows)
