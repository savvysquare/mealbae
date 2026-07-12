# MealBae — Chowdeck-style rebuild plan

Scope decisions locked in from your answers:
- Configurator options are a **global catalog** (admin-defined once, all restaurants inherit; per-restaurant price override optional later).
- Seed **~15 core Osogbo dishes** with AI images.
- Categories aren't confirmed — I'll use the sensible set below and you can rename in phase 1.

Approve each phase before I start it. I won't touch the next phase until you say go.

---

## Phase 1 — UI shell & navigation (no schema changes)

**Bottom tab bar** (mobile-first, sticky, matches reference):
`Home · Search · Orders · Support · Profile`

- `Home` → `/home` (existing restaurant list, retouched)
- `Search` → new `/search` route, unified meal + restaurant search
- `Orders` → new `/orders` (replaces `_authenticated/orders`) — anonymous, phone-based, tabs: **My Cart · Ongoing · Completed**. Tracking opens from here.
- `Support` → new `/support` (WhatsApp/phone contact card)
- `Profile` → new `/profile` (saved address, phone, past orders lookup by phone — no login)

**Header** unified everywhere: back arrow · page title (left) · location pill "Lagos ▾" or cart badge (right). Landing page keeps its marketing header; every other page uses the retouched app header.

**Meal-type category chips** on `/home`: horizontally scrollable pill row, no clipped border (`overflow-visible` + padding on the scroller). Proposed set — tell me what to change:
`All · Swallow · Rice · Fast Food · Snacks · Drinks · Breakfast`

**Uniformity pass**: cards, buttons, pill radii, spacing, empty states, skeletons all use one shared set of classes (`card-soft`, `pill`, `btn-primary`, `skeleton`). Fix the clipped category border.

**Visual polish only** — no data model changes. Deliverable: app looks like the reference screenshots with your green palette.

---

## Phase 2 — Meal configurator + global catalog (schema change)

New tables (global catalog, admin-managed under `/admin/catalog`):

```text
option_groups        (id, name, kind: soup|protein|drink|pack_size, required, min/max)
options              (id, group_id, name, image_url, base_price_naira, sort)
meal_option_groups   (meal_id, group_id)   -- which groups apply to a meal
```

`meals` gains: `portion_unit` (`portion` | `wrap` | `scoop`), `min_qty`, `max_qty`, `base_price_naira`.

Cart item shape becomes:
```text
{ mealId, quantity, selections: [{ groupId, optionId, quantity }], notes }
```

Order-item snapshot stores the resolved selections as JSON so historical orders don't break when the catalog changes.

**Configurator UI** (bottom sheet on meal tap): quantity stepper, then each option group with its own picker (radio for single, +/- steppers for multi like protein pieces), live price total, "Add ₦X,XXX" CTA — matches your reference screenshots.

**Admin panel `/admin/catalog`**: CRUD for option groups, options, and which meals get which groups.

---

## Phase 3 — Ratings, delivery time, rider-at-restaurant

**Rider-at-restaurant vs ready-for-pickup** (status split):
Currently `rider_arrived_at_restaurant` and `ready_for_pickup` share the timeline slot. Split so both statuses can coexist: rider-arrived stays checked once passed, ready-for-pickup stays *unchecked* until vendor marks ready even if rider is already there. Timeline shows both dots independently.

**Delivery-time display** on order-received (`delivered` status) and on order history:
Big, bold hero number: `Delivered in 42 min` (from `created_at` → first `delivered` event in `order_status_events`). Placed above the rating card.

**Emoji rating 1–5** shown as soon as status hits `delivered`:
```text
1 😠  2 😕  3 😐  4 🙂  5 🤩
```
Plus optional text review. New table `restaurant_reviews (order_id UNIQUE, restaurant_id, rating 1-5, review_text, delivery_phone, created_at)`. Delivery-phone gate matches existing anonymous tracking pattern.

Restaurant card shows `⭐ avg(rating) (count)`, materialized via a view `restaurant_rating_stats`. Restaurant detail page lists recent reviews.

**Reorder** button on `/orders` completed tab: hydrates cart from `order_items` snapshot (already partly wired) — will handle new configurator selections too.

---

## Phase 4 — Seeded meals & images

15 core Osogbo dishes, one AI image each (`gpt-image-2`, low quality, ~₦ minimal spend):

Amala · Eba · Semo · Pounded Yam · Fufu · Wheat/Tuwo · Jollof Rice · Fried Rice · White Rice & Stew · Beans (Ewa) · Yam & Egg · Spaghetti · Moin Moin · Ewedu & Gbegiri · Asaro (Yam Porridge)

Global option seeds:
- Soups: Egusi, Efo Riro, Ogbono, Okra, Vegetable, Banga
- Proteins: Chicken (fried/grilled), Turkey, Fish (titus/croaker), Beef, Goat Meat, Ponmo, Egg (boiled/fried), Sausage
- Drinks: Bottled Water, Coke, Fanta, Sprite, Chivita Juice, Zobo, Kunu
- Pack size: Small, Big
- Portion units per swallow: wrap; rice/beans: portion; ewedu/gbegiri: scoop

Admin can assign these to any restaurant's menu with one click.

---

## Technical notes

- All new pages: separate routes, own `head()` metadata, mobile-first.
- Bottom tab is a shared component, hidden on `/`, `/admin/*`, `/vendor/*`, `/rider`, `/checkout`.
- Configurator schema uses server functions for admin writes; customer reads via publishable client with anon SELECT policies.
- Reviews table: anon can INSERT gated by matching `delivery_phone` on the order; anyone can SELECT aggregate.
- All UI uses existing green tokens in `src/styles.css` — no palette change.

---

## What I need from you

1. **Approve Phase 1** to start, or edit the category list first.
2. Confirm the bottom-tab labels (Home/Search/Orders/Support/Profile) — or swap Support for "Track".
3. Anything to add/remove from the 15 seed dishes.

I'll ship Phase 1 in one turn, wait for your sign-off, then Phase 2, etc.