# Invoice Currency Guide - GBP & USD Display

## Quick Reference for Users

### What Changed?

Your invoices now display in **British Pounds (GBP)** as the primary currency, with live **US Dollar (USD)** conversion rates shown alongside.

### Key Features

#### 1. Live Exchange Rate Display
At the top of the invoices page, you'll see a card showing:
- **Current Rate**: £1 = $X.XXXX
- **Last Updated**: Time of last refresh
- **Refresh Button**: Click to get the latest rate

#### 2. Dual Currency Display

**Summary Cards** show both currencies:
- Total Revenue: £12,456.78 / $15,867.95 USD
- Pending Amount: £3,234.90 / $4,119.89 USD

**Invoice Table** has two amount columns:
- Amount (GBP): Shows the invoice value in pounds
- Amount (USD): Shows the converted value in dollars

### How to Use

#### Viewing Invoices
1. Navigate to **Invoices** from the sidebar
2. The page loads with the latest exchange rate
3. All amounts automatically show in both GBP and USD

#### Refreshing Exchange Rate
1. Look for the exchange rate card in the header
2. Click the **refresh icon** (🔄)
3. Wait for the spinning animation to complete
4. A notification will confirm the update

#### Reading the Table
- **Amount (GBP)**: This is the actual invoice amount
- **Amount (USD)**: This is for reference only, showing the equivalent in US dollars
- Both columns use proper currency formatting

### Understanding the Exchange Rate

#### What It Means
- **£1 = $1.2734** means one British Pound equals 1.2734 US Dollars
- Example: £100 = $127.34

#### When It Updates
- **Automatically**: Every 30 minutes when you visit the page
- **Manually**: Click the refresh button anytime
- **Shows**: Last update time for transparency

#### Rate Source
- Live rates from a reliable financial API
- Updates reflect current market rates
- Cached for 30 minutes for performance

### Examples

#### Example 1: Small Invoice
- GBP: £234.56
- USD: $298.74 (at rate 1.2734)

#### Example 2: Large Invoice
- GBP: £12,450.00
- USD: $15,853.83 (at rate 1.2734)

#### Example 3: Total Revenue
```
┌───────────────────────┐
│ Total Revenue         │
│ £45,678.90           │
│ $58,164.74 USD       │
└───────────────────────┘
```

### Frequently Asked Questions

**Q: Which currency should I use for accounting?**
A: Use **GBP** - that's your actual invoice currency. USD is for reference only.

**Q: Why does the USD amount change?**
A: Exchange rates fluctuate constantly. The USD value updates when you refresh the rate.

**Q: Can I change the primary currency to USD?**
A: Not currently. All invoices are in GBP. Contact your administrator if needed.

**Q: Is the exchange rate accurate?**
A: Yes, it uses live market rates from a reliable financial data provider.

**Q: What if the exchange rate doesn't load?**
A: The system uses a fallback rate to ensure the page works. Try refreshing.

**Q: How often should I refresh the rate?**
A: The system auto-refreshes every 30 minutes. Manual refresh is only needed for real-time accuracy.

**Q: Can I export invoices with USD amounts?**
A: Currently, PDF exports show GBP. USD display is on-screen only.

### Tips

✅ **Best Practice**: Use GBP for all official records and accounting
✅ **International Customers**: Show them both amounts for clarity
✅ **Rate Monitoring**: Check the rate display before quoting prices
✅ **Refresh Regularly**: If dealing with international clients, refresh before calls

### Troubleshooting

**Issue**: Exchange rate shows "Loading..."
- Wait a moment for the API to respond
- Click the refresh button
- Check your internet connection

**Issue**: USD amounts seem wrong
- Verify the exchange rate at the top
- Click refresh to get the latest rate
- Compare with current market rates online

**Issue**: Refresh button not working
- Wait a few seconds and try again
- Reload the page
- Contact support if it persists

### Visual Guide

```
Invoices Page Layout:

┌─────────────────────────────────────────────────────────────┐
│  Invoices                        Exchange Rate Box          │
│  View and manage invoices        ┌──────────────────────┐  │
│                                  │ 📈 GBP → USD Rate   │  │
│                                  │ £1 = $1.2734        │  │
│                                  │ Updated: 14:30      │  │
│                                  │ [🔄 Refresh]        │  │
│                                  └──────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Total Rev.   │  │ Paid Inv.    │  │ Pending      │     │
│  │ £12,456.78  │  │ 45           │  │ £3,234.90   │     │
│  │ $15,867 USD │  │ of 52        │  │ $4,119 USD  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Invoice Table                                              │
│  ┌──────┬────────┬──────┬──────────┬──────────┬────────┐  │
│  │ Inv# │ Patient│ Date │ GBP      │ USD      │ Status │  │
│  ├──────┼────────┼──────┼──────────┼──────────┼────────┤  │
│  │ 001  │ John   │ Nov 1│ £234.56  │ $298.74  │ Paid   │  │
│  │ 002  │ Jane   │ Nov 2│ £567.89  │ $723.20  │ Sent   │  │
│  └──────┴────────┴──────┴──────────┴──────────┴────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Need Help?

- Check the main documentation: `INVOICE_CURRENCY_ENHANCEMENT.md`
- Contact your system administrator
- Report issues through your usual support channels

---

**Remember**: GBP is your primary currency. USD is shown for convenience and reference only.
