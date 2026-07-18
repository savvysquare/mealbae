# Multi-restaurant orders

Today one `orders` row is tied to one `restaurant_id`. To let a customer order from two or more restaurants in a single checkout, we introduce a parent "order group" and keep one `orders` row per restaurant beneath it. Vendors still accept/prepare their own sub-order; the customer sees one combined tracker.

## Data model

New table:

```text
order_groups
  id uuid pk
  code text unique                -- short human code, shown to customer
  customer_name, delivery_phone, delivery_address, delivery_notes
  subtotal_naira, delivery_fee_naira, total_naira
  payment_status ('pending' | 'confirmed')
  created_at
```

`orders` changes:
- add `order_group_id uuid references order_groups(id)` (nullable for legacy rows)
- keep `restaurant_id` — each order still belongs to exactly one restaurant
- delivery fee becomes per-restaurant on the sub-order; the group total is the sum

`order_items` unchanged (already scoped to an order).

RLS / GRANT: mirror `orders` policies on `order_groups`. Anon SELECT gated by matching `delivery_phone` (same pattern as tracking today).

## Checkout flow

1. Cart already supports items from multiple restaurants (grouped by `restaurantId`).
2. On "I have paid":
   - Insert one `order_groups` row.
   - For each restaurant in the cart, insert one `orders` row with `order_group_id = group.id` and its own `order_items`.
   - Payment is one transfer for `total_naira`; vendors see only their sub-order total.
3. Navigate to `/track/g/{group.code}` (new group tracker) instead of a single order id.

## Tracker

- New route `src/routes/track.g.$code.tsx`: one page showing the group header (address, total, paid status) and a stacked card per sub-order with its own status timeline (accepted → preparing → ready → picked up → delivered) and rider info.
- Existing `/track/$id` still works for legacy single-order tracking and for deep links from a vendor.
- `/orders` (customer) groups sub-orders under their `order_group_id` so the list shows one entry per checkout with a "2 restaurants" chip when applicable.

## Vendor & rider

- No change to vendor UX — each vendor still sees its own `orders` row and accepts/prepares/marks ready independently.
- Dispatch/rider: unchanged per sub-order. A rider is assigned to one sub-order at a time (simpler; we can add "combined pickup" later if two restaurants are close).
- Group is considered fully delivered when every child order is `delivered`.

## Admin

- `admin.overview` and `admin.dispatch` gain an "Order group" column when `order_group_id` is set, so ops can see linked sub-orders.
- Payments view aggregates by group for reconciliation.

## Reorder

Reorder from `/orders` rehydrates the cart from all sub-orders in the group, preserving the multi-restaurant shape.

## Out of scope (for a later phase)

- Combined rider pickup across two restaurants in one trip.
- Per-restaurant partial refunds inside a group.
- Group-level cancellation UX (for now, cancel each sub-order).

## Technical notes

- Migration adds `order_groups` + `orders.order_group_id` + GRANTs + RLS policies in one file.
- Cart already keys items by `restaurantId`; checkout just iterates that grouping.
- Server function `placeOrderGroup` (in `src/lib/orders.functions.ts`) does the group + child inserts in a single transaction via `supabaseAdmin` after verifying the caller's phone matches the group.
- Tracker uses `order_groups` + join to `orders` + `order_status_events`; anon SELECT gated by `delivery_phone` match.

Approve and I'll ship it in one turn: migration, checkout rewrite, group tracker, `/orders` grouping, and reorder.
