# MealBAE — Build Plan

"Your meal, before anything else." A minimalist DoorDash-style food delivery platform for Osogbo, Nigeria, with three role-based interfaces on one app.

## Scope of v1

- Customer app: browse, search, cart, checkout via bank transfer, live order tracking, history + reorder.
- Restaurant dashboard: accept/reject orders, progress status, manage menu.
- Admin dashboard: all orders, dispatch queue, restaurants & meals CRUD, manual payment confirmation.
- Order status flow exactly as specified (8 states).
- Realtime updates on orders via Supabase Realtime.
- Seed 6 Osogbo restaurants with categorized menus.

## Design

Warm neutral background (off-white/cream), deep charcoal text, orange primary accent (`oklch` token), soft cards, rounded-2xl, generous spacing. Mobile-first layouts (390px baseline), sticky bottom cart bar on customer app, elegant status timeline. All colors as semantic tokens in `src/styles.css`. No purple, no default Inter.

Fonts: **Fraunces** (display) + **Inter Tight** (body) via `<link>` in root head.

## Auth

- **Customers**: phone + OTP (Supabase phone auth). NOTE: this requires an SMS provider configured in Cloud auth settings — I'll wire the UI and code; the user will need to enable an SMS provider (Twilio/MessageBird) in Cloud Auth for OTP to actually deliver. I'll note this clearly after build.
- **Restaurant staff & Admin**: email + password.
- Roles via a separate `user_roles` table + `has_role()` security-definer function (never on profiles). Roles: `customer`, `restaurant_staff`, `admin`.
- Route gating: single `/_authenticated` layout owned by the Supabase integration + child pathless layouts `/_authenticated/_customer`, `/_authenticated/_restaurant`, `/_authenticated/_admin` each checking role via router context.

## Data model (Supabase)

Tables (all `public`, RLS on, explicit GRANTs):

- `profiles` (id=auth.users, full_name, phone)
- `user_roles` (user_id, role enum: customer|restaurant_staff|admin, restaurant_id nullable)
- `restaurants` (id, name, address, phone, opens_at, closes_at, is_open_override, image_url, description)
- `menu_categories` (id, restaurant_id, name, sort_order)
- `meals` (id, restaurant_id, category_id, name, description, price_naira, image_url, is_available)
- `bank_accounts` (id, restaurant_id nullable — platform-level if null, bank_name, account_name, account_number)
- `orders` (id, customer_id, restaurant_id, status enum, subtotal, delivery_fee, total, delivery_address, delivery_phone, payment_reference, payment_confirmed_at, rider_name, created_at, updated_at)
- `order_items` (id, order_id, meal_id, name_snapshot, price_snapshot, quantity)
- `order_status_events` (id, order_id, status, note, created_at) — powers timeline

Enum `order_status`: pending_payment, payment_confirmed, awaiting_restaurant_acceptance, accepted_by_restaurant, preparing, ready_for_pickup, out_for_delivery, delivered, rejected, cancelled.

RLS highlights:
- Customers read/write own orders, read restaurants+meals (public where `is_available`).
- Restaurant staff read/update orders for their `restaurant_id`; CRUD meals/categories for their restaurant.
- Admin (via `has_role`) full access.
- Restaurants + meals: public SELECT to `anon` + `authenticated`.
- Trigger: on `orders.status` change → insert into `order_status_events`.
- Trigger: on new order → status defaults to `pending_payment`.

## Routes

Public:
- `/` — customer landing (redirects into customer app if signed-in customer)
- `/auth/customer` — phone + OTP
- `/auth/staff` — email/password for restaurant + admin
- `/r/$restaurantId` — public restaurant menu (SSR-friendly)

Authenticated (customer):
- `/_authenticated/_customer/home` — restaurant grid + search + open-now filter
- `/_authenticated/_customer/cart`
- `/_authenticated/_customer/checkout`
- `/_authenticated/_customer/orders` — history + reorder
- `/_authenticated/_customer/orders/$id` — live tracking timeline

Restaurant:
- `/_authenticated/_restaurant/orders` — new + active tabs
- `/_authenticated/_restaurant/menu`
- `/_authenticated/_restaurant/history`

Admin:
- `/_authenticated/_admin/overview`
- `/_authenticated/_admin/dispatch`
- `/_authenticated/_admin/restaurants`
- `/_authenticated/_admin/meals`
- `/_authenticated/_admin/payments`

## Search & filters

Server function `searchRestaurants({ query, openNow })`:
- If `query`: match meals by name (ilike) → return distinct restaurants where meal `is_available` AND restaurant currently open (compare current Africa/Lagos time to `opens_at`/`closes_at`).
- If `openNow`: filter to currently-open restaurants.
- Uses publishable server client + public SELECT policies.

## Cart

Client-side Zustand store, persisted to localStorage, single-restaurant enforced (adding from another restaurant prompts to clear).

## Checkout / Payment

- Order created with status `pending_payment`.
- Screen shows bank account + reference (order short id) and "I have paid" button → sets a `payment_submitted_at` flag (no status change yet).
- Admin manually confirms → status → `payment_confirmed` → auto-advance to `awaiting_restaurant_acceptance` via trigger.
- Restaurant Accept → `accepted_by_restaurant`; then Preparing → Ready for Pickup.
- Admin dispatch assigns rider → `out_for_delivery`. Rider marks Delivered (admin action for v1).

## Realtime

Subscribe to `orders` row for tracking screen and to `orders` filtered by restaurant_id / status on dashboards. Invalidate React Query on change.

## Seed data (migration)

6 Osogbo restaurants with realistic Nigerian menus: **Iya Sikira Amala Spot**, **The Place Osogbo**, **Kilimanjaro Osogbo**, **Chicken Republic Gbongan Rd**, **Osogbo Suya Palace**, **Cool Chops & Grills**. Each with categories (Starters, Mains, Sides, Drinks, Desserts as applicable) and 6–10 meals with Naira prices. One platform bank account seeded.

## Out of scope for v1 (I'll note in delivery)

- Automatic payment gateway (Paystack) — bank transfer + manual confirmation as specified.
- Real SMS delivery for OTP — requires the user to enable a phone provider in Cloud Auth.
- Actual rider app — admin marks statuses on rider's behalf.
- Push notifications — realtime in-app only.

## Implementation order

1. Enable Lovable Cloud.
2. Migration: enum, tables, GRANTs, RLS, triggers, seed.
3. Design tokens + fonts + shell.
4. Auth pages + role-based routing gates.
5. Customer flow (home → restaurant → cart → checkout → tracking → history).
6. Restaurant dashboard.
7. Admin dashboard.
8. Realtime wiring.
9. Verify with Playwright screenshots at key screens.

Ready to build?
