# Example Money/Profit Table Output

## Financial Analysis Table (Only shown if cost/profit data exists)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Financial Analysis - Cost & Profit                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ ITEM                    │ WEEK 1      │ WEEK 2         │ WEEK 3         │ PROFIT    │
├──────────────────────────────────────────────────────────────────────────────┤
│ Bananas                 │ $120        │ $200 (+80)     │ $280 (+80)     │ $600      │ ← Green (positive)
│ Eggs                    │ $45         │ $35 (-10)      │ $35            │ $115      │ ← Green (positive)
│ Espresso beans          │ $25         │ $50 (+25)      │ $25 (-25)      │ $100      │ ← Green (positive)
│ Fresh croissant dough   │ $80         │ $60 (-20)      │ $40 (-20)      │ $180      │ ← Green (positive)
│ Oat milk barista        │ $36         │ $48 (+12)      │ $60 (+12)      │ $144      │ ← Green (positive)
│ Strawberries            │ $16         │ $8 (-8)        │ $24 (+16)      │ $48       │ ← Green (positive)
│ To-go hot cups          │ $40         │ $30 (-10)      │ $20 (-10)      │ $90       │ ← Green (positive)
│ Whole milk              │ $6          │ $9 (+3)        │ $12 (+3)       │ $27       │ ← Green (positive)
└──────────────────────────────────────────────────────────────────────────────┘
```

## Features:

1. **Week Columns**: Show total cost for each week
2. **Money Changes in Parentheses**: 
   - Week 1: Just the value (e.g., `$120`)
   - Week 2+: Value with change from previous week (e.g., `$200 (+80)` means $200, up $80 from week 1)
3. **Profit Column**: 
   - Shows total profit across all weeks
   - **Green**: Positive profit
   - **Red**: Negative profit (loss)
4. **Color Coding**: 
   - Green for increases in money week-to-week
   - Red for decreases in money week-to-week
   - Green/Red for profit column based on positive/negative

## Notes:

- This table only appears if the analysis contains cost/profit data
- If no money information is available, this table is not displayed
- Changes are calculated week-to-week (current week - previous week)
- Profit is the sum of all weeks' total costs

