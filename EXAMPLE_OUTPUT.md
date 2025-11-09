# Example Ledger Output - Multi-Week Analysis

## What the Output Looks Like

When you upload multiple files (representing different weeks), the ledger will show:

### Example with 3 Weeks of Data:

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ Inventory Ledger - Multi-Week Analysis (3 weeks)                                           │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ ITEM                    │ WEEK 1 │ WEEK 2 │ WEEK 3 │ NET CHANGE │ % CHANGE                │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ Bananas                 │  3.00  │  5.00  │  7.00  │   +4.00    │  +133.3%  ← Green (>5%) │
│ Eggs                    │  1.00  │  1.00  │  1.00  │    0.00    │     0.0%                │
│ Espresso beans          │  1.00  │  2.00  │  1.00  │    0.00    │     0.0%                │
│ Fresh croissant dough   │  4.00  │  3.00  │  2.00  │   -2.00    │   -50.0%  ← Red (<-5%)  │
│ Oat milk barista        │  3.00  │  4.00  │  5.00  │   +2.00    │   +66.7%  ← Green (>5%) │
│ Strawberries            │  2.00  │  1.00  │  3.00  │   +1.00    │   +50.0%  ← Green (>5%) │
│ To-go hot cups          │  4.00  │  3.00  │  2.00  │   -2.00    │   -50.0%  ← Red (<-5%)  │
│ Whole milk              │  2.00  │  3.00  │  4.00  │   +2.00    │  +100.0%  ← Green (>5%) │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

## How It Works:

1. **Week Columns**: Each uploaded file becomes a "Week" column showing the quantity used for that week
2. **Week-to-Week Changes**: Values are color-coded based on changes from previous week:
   - **Green**: Increase >5% from previous week
   - **Red**: Decrease >5% from previous week
   - **Normal**: Changes within ±5%
3. **Net Change**: Shows the total change from Week 1 to the last week
4. **% Change**: Percentage change from first week to last week
5. **Item Tracking**: Items are matched by name across all weeks

## Color Coding Rules:

- **Green background/text**: Increase >5% (either week-to-week or net change)
- **Red background/text**: Decrease >5% (either week-to-week or net change)
- **Normal**: Changes within ±5% range

## Example Scenario:

If you upload 3 CSV files:
- **Week 1 file**: Shows initial quantities
- **Week 2 file**: Shows quantities for week 2 (compared to week 1)
- **Week 3 file**: Shows quantities for week 3 (compared to week 2)

The ledger will:
- Track each item across all 3 weeks
- Show week-to-week values with color coding
- Calculate net change from Week 1 to Week 3
- Display percentage change for the entire period

