# Credit Shop

## Current State
- HomeScreen (Udhar section): Customer list with udhaar/payment navigation, customer barcode scanner, AND an "Add Customer" FAB + AddCustomerSheet.
- CustomersScreen: Customer list with edit/delete buttons, add customer FAB. No link to customer profile or barcode from this screen.

## Requested Changes (Diff)

### Add
- CustomersScreen: tapping customer row navigates to customerProfile screen (for viewing info, passbook, barcode)
- CustomersScreen: barcode view accessible from customer row or profile

### Modify
- HomeScreen (Udhar): Remove "Add Customer" FAB and AddCustomerSheet -- udhaar section is for udhaar/payment only
- HomeScreen (Udhar): Customer rows navigate to customerProfile for udhaar/payment as before
- CustomersScreen: wire up navigate prop so tap on customer opens their profile; keep edit/delete actions

### Remove
- Remove Add Customer FAB and AddCustomerSheet from HomeScreen

## Implementation Plan
1. HomeScreen.tsx: remove addOpen state, AddCustomerSheet import/usage, and Add Customer FAB
2. CustomersScreen.tsx: use navigate prop to open customerProfile on row tap (add info/view button or make whole row tappable), keep edit/delete icon buttons. Add Customer FAB remains.
3. Verify TypeScript compiles cleanly.
