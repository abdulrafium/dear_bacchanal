# Admin Dashboard Enhancements: Deletions, Modals, & Clear Revenue

This plan outlines the steps to address your requests regarding order cascade deletion, custom confirm modals, UI icon swapping, and clearing revenue stats.

## User Review Required

> [!WARNING]  
> **Clear Revenue Behavior:** I will implement the "Clear Revenue" button by updating all existing orders to have their financial amount set to `$0.00`. This allows you to keep your order history/records while zeroing out the "Revenue", "EST Profit", and "Avg Ticket" stats. Is this acceptable, or would you prefer a different method?

> [!IMPORTANT]  
> **Order Cascade Deletion:** I will modify the Order Delete API so that when an order is deleted, the corresponding `user_books` document (the customer's specific custom book design) is also permanently deleted. Global templates (`books` collection) will remain completely untouched.

## Proposed Changes

### Backend APIs

#### [MODIFY] [orders API](file:///e:/Project/Dear-bacchanal/app/api/admin/orders/route.ts)
- Update the `DELETE` handler. Before deleting an order (or all orders), fetch the associated `bookId`(s). 
- Perform a cascading delete to remove those specific `user_books` from the database.

#### [NEW] [clear-revenue API](file:///e:/Project/Dear-bacchanal/app/api/admin/stats/clear-revenue/route.ts)
- Create a new POST endpoint that updates all documents in the `orders` collection, setting `amount: 0` and `totalAmount: 0`. This is a one-click reset for your financial stats.

---

### Frontend UI Components

#### [NEW] [ConfirmModal Component](file:///e:/Project/Dear-bacchanal/components/ui/ConfirmModal.tsx)
- Create a reusable, theme-styled dialog modal (using the existing Radix UI Dialog infrastructure) to replace the native browser `confirm("...")` alert.
- It will accept a title, description, and an `onConfirm` action.

#### [MODIFY] [Orders Page](file:///e:/Project/Dear-bacchanal/app/admin/orders/page.tsx)
- Swap the positions of the Invoice (receipt) icon and the Trash icon in the table rows.
- Implement the new `ConfirmModal` for individual deletes and "Delete All" actions, removing the browser `confirm()`.

#### [MODIFY] [Refunds Page](file:///e:/Project/Dear-bacchanal/app/admin/refunds/page.tsx)
- Implement the new `ConfirmModal` for individual deletes and "Delete All" actions, removing the browser `confirm()`.

#### [MODIFY] [Users Page](file:///e:/Project/Dear-bacchanal/app/admin/users/page.tsx)
- Implement the new `ConfirmModal` for individual user deletes, removing the browser `confirm()`.

#### [MODIFY] [Settings Page](file:///e:/Project/Dear-bacchanal/app/admin/settings/page.tsx)
- Add a new "Clear Revenue" button in the General settings (or a dedicated "Danger Zone").
- Connect it to the new `ConfirmModal` to prevent accidental clicks.
- Connect it to the `/api/admin/stats/clear-revenue` endpoint.

## Verification Plan

### Automated Tests
- No automated tests required for these manual admin dashboard changes.

### Manual Verification
- Will test deleting a mock order to verify the `user_book` is removed.
- Will verify the custom modal opens and functions correctly across all 4 pages.
- Will verify the "Clear Revenue" button successfully zeroes out amounts on a test order.
