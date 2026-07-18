import React, { useState, useEffect } from "react";
import { formatNaira } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { X, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

interface Meal {
  id: string;
  name: string;
  description: string | null;
  price_naira: number;
  image_url: string | null;
  is_available: boolean;
  category_id: string | null;
}
interface Category { id: string; name: string }

interface MealCustomizerProps {
  meal: Meal;
  restaurant: { id: string; name: string };
  category: Category | undefined;
  onClose: () => void;
}

// ─── Option Definitions ──────────────────────────────────────────────────────

type Option = { id: string; label: string; emoji: string; price: number; imageUrl?: string };

const SOUPS: Option[] = [
  { id: "none",          label: "None",          emoji: "🚫", price: 0,   imageUrl: "/meal-options/soups/none.png" },
  { id: "ewedu",         label: "Ewedu",         emoji: "🥬", price: 0,   imageUrl: "/meal-options/soups/ewedu.png" },
  { id: "egusi",         label: "Egusi Soup",    emoji: "🍲", price: 300, imageUrl: "/meal-options/soups/egusi.png" },
  { id: "efo_riro",      label: "Efo Riro",      emoji: "🫙", price: 400, imageUrl: "/meal-options/soups/efo-riro.png" },
  { id: "gbegiri",       label: "Gbegiri",       emoji: "🟤", price: 0,   imageUrl: "/meal-options/soups/gbegiri.png" },
  { id: "ewedu_gbegiri", label: "Ewedu and Gbegiri",emoji: "🥬", price: 0, imageUrl: "/meal-options/soups/ewedu-gbegiri.png" },
  { id: "okro",          label: "Okro Soup",     emoji: "🫑", price: 200, imageUrl: "/meal-options/soups/okro.png" },
  { id: "banga",         label: "Banga Soup",    emoji: "🌴", price: 300, imageUrl: "/meal-options/soups/banga.png" },
  { id: "ogbono",        label: "Ogbono Soup",   emoji: "🪵", price: 300, imageUrl: "/meal-options/soups/ogbono.png" },
  { id: "oha",           label: "Oha Soup",      emoji: "🍃", price: 300, imageUrl: "/meal-options/soups/oha.png" },
];

const PROTEINS: Option[] = [
  { id: "assorted_meat",    label: "Assorted Meat",      emoji: "🥩", price: 800,  imageUrl: "/meal-options/proteins/assorted-meat.png" },
  { id: "beef",             label: "Beef",               emoji: "🥩", price: 500,  imageUrl: "/meal-options/proteins/beef.png" },
  { id: "ponmo",            label: "Ponmo",              emoji: "🟫", price: 300,  imageUrl: "/meal-options/proteins/ponmo.png" },
  { id: "shaki",            label: "Shaki (Tripe)",      emoji: "🫀", price: 400,  imageUrl: "/meal-options/proteins/shaki.png" },
  { id: "grilled_chicken",  label: "Grilled Chicken",   emoji: "🍗", price: 1500, imageUrl: "/meal-options/proteins/grilled-chicken.png" },
  { id: "peppered_chicken", label: "Peppered Chicken",  emoji: "🍗", price: 1500, imageUrl: "/meal-options/proteins/peppered-chicken.png" },
  { id: "fried_chicken",    label: "Fried Chicken",     emoji: "🍗", price: 1400, imageUrl: "/meal-options/proteins/fried-chicken.png" },
  { id: "turkey",           label: "Peppered Turkey",   emoji: "🦃", price: 2200, imageUrl: "/meal-options/proteins/turkey.png" },
  { id: "titus_fish",       label: "Titus Fish",        emoji: "🐟", price: 1200, imageUrl: "/meal-options/proteins/titus-fish.png" },
  { id: "croaker_fish",     label: "Croaker Fish",      emoji: "🐠", price: 1800, imageUrl: "/meal-options/proteins/croaker-fish.png" },
  { id: "catfish",          label: "Catfish (Eja Aro)", emoji: "🐡", price: 2000, imageUrl: "/meal-options/proteins/catfish.png" },
  { id: "tilapia",          label: "Tilapia",           emoji: "🐟", price: 1500, imageUrl: "/meal-options/proteins/tilapia.png" },
  { id: "smoked_fish",      label: "Smoked Fish",       emoji: "🎣", price: 900,  imageUrl: "/meal-options/proteins/smoked-fish.png" },
  { id: "dried_fish",       label: "Dried Fish",        emoji: "🐚", price: 600,  imageUrl: "/meal-options/proteins/dried-fish.png" },
  { id: "stockfish",        label: "Stock Fish (Panla)",emoji: "🪸", price: 700,  imageUrl: "/meal-options/proteins/stockfish.png" },
  { id: "boiled_egg",       label: "Boiled Egg",        emoji: "🥚", price: 300,  imageUrl: "/meal-options/proteins/boiled-egg.png" },
  { id: "fried_egg",        label: "Fried Egg",         emoji: "🍳", price: 400,  imageUrl: "/meal-options/proteins/fried-egg.png" },
  { id: "snail",            label: "Snail",             emoji: "🐌", price: 1200, imageUrl: "/meal-options/proteins/snail.png" },
  { id: "shrimp",           label: "Shrimp / Prawns",   emoji: "🦐", price: 1000, imageUrl: "/meal-options/proteins/shrimp.png" },
  { id: "bush_meat",        label: "Bush Meat",         emoji: "🦌", price: 800,  imageUrl: "/meal-options/proteins/bush-meat.png" },
];

const DRINKS: Option[] = [
  { id: "water",       label: "Eva Water 75cl",   emoji: "💧", price: 300,  imageUrl: "/meal-options/drinks/water.png" },
  { id: "coke_50cl",   label: "Coca-Cola 50cl",   emoji: "🥤", price: 500,  imageUrl: "/meal-options/drinks/coke.png" },
  { id: "coke_35cl",   label: "Coca-Cola 35cl",   emoji: "🥤", price: 400,  imageUrl: "/meal-options/drinks/coke-small.png" },
  { id: "fanta",       label: "Fanta 50cl",        emoji: "🟠", price: 500,  imageUrl: "/meal-options/drinks/fanta.png" },
  { id: "sprite",      label: "Sprite 50cl",       emoji: "🟢", price: 500,  imageUrl: "/meal-options/drinks/sprite.png" },
  { id: "pepsi",       label: "Pepsi 50cl",        emoji: "🔵", price: 500,  imageUrl: "/meal-options/drinks/pepsi.png" },
  { id: "malt",        label: "Malt",              emoji: "🍺", price: 700,  imageUrl: "/meal-options/drinks/malt.png" },
  { id: "zobo",        label: "Zobo 50cl",         emoji: "❤️", price: 700,  imageUrl: "/meal-options/drinks/zobo.png" },
  { id: "kunu",        label: "Kunu Aya",          emoji: "🥛", price: 500,  imageUrl: "/meal-options/drinks/kunu.png" },
  { id: "tigernut",    label: "Tigernut Drink",    emoji: "🌰", price: 600,  imageUrl: "/meal-options/drinks/tigernut.png" },
  { id: "chapman",     label: "Chapman",           emoji: "🍹", price: 1200, imageUrl: "/meal-options/drinks/chapman.png" },
  { id: "smoothie",    label: "Fruit Smoothie",    emoji: "🍓", price: 1500, imageUrl: "/meal-options/drinks/smoothie.png" },
  { id: "lacasera",    label: "Lacasera 50cl",     emoji: "🫧", price: 450,  imageUrl: "/meal-options/drinks/lacasera.png" },
  { id: "capri_sonne", label: "Capri Sonne",       emoji: "🍊", price: 400,  imageUrl: "/meal-options/drinks/capri-sonne.png" },
  { id: "five_alive",  label: "Five Alive 35cl",   emoji: "🍋", price: 400,  imageUrl: "/meal-options/drinks/five-alive.png" },
  { id: "hi_malt",     label: "Hi-Malt",           emoji: "🍺", price: 600,  imageUrl: "/meal-options/drinks/hi-malt.png" },
];

const EXTRAS: Option[] = [
  { id: "fried_plantain", label: "Fried Plantain (Dodo)",    emoji: "🍌", price: 500, imageUrl: "/meal-options/extras/dodo.png" },
  { id: "boli",           label: "Boli (Roasted Plantain)",  emoji: "🍌", price: 400, imageUrl: "/meal-options/extras/boli.png" },
  { id: "plantain_chips", label: "Plantain Chips",           emoji: "🍟", price: 300, imageUrl: "/meal-options/extras/plantain-chips.png" },
  { id: "moin_moin",      label: "Moin Moin",                emoji: "🟡", price: 500, imageUrl: "/meal-options/extras/moin-moin.png" },
  { id: "coleslaw",       label: "Coleslaw",                 emoji: "🥗", price: 400, imageUrl: "/meal-options/extras/coleslaw.png" },
  { id: "salad",          label: "Green Salad",              emoji: "🥗", price: 500, imageUrl: "/meal-options/extras/salad.png" },
  { id: "extra_stew",     label: "Extra Stew",               emoji: "🍅", price: 300, imageUrl: "/meal-options/extras/stew.png" },
  { id: "extra_egg",      label: "Extra Egg",                emoji: "🥚", price: 200, imageUrl: "/meal-options/proteins/boiled-egg.png" },
  { id: "extra_ponmo",    label: "Extra Ponmo",              emoji: "🟫", price: 300, imageUrl: "/meal-options/proteins/ponmo.png" },
  { id: "chin_chin",      label: "Chin Chin",                emoji: "🍪", price: 300, imageUrl: "/meal-options/extras/chin-chin.png" },
  { id: "puff_puff",      label: "Puff Puff (4pc)",          emoji: "🍩", price: 400, imageUrl: "/meal-options/extras/puff-puff.png" },
  { id: "yam_side",       label: "Boiled Yam",               emoji: "🍠", price: 500, imageUrl: "/meal-options/extras/yam.png" },
];

const PACK_SIZES: (Option & { description: string })[] = [
  { id: "small", label: "Small Pack", description: "Standard bag", emoji: "🛍️", price: 100 },
  { id: "big", label: "Big Pack", description: "Large box", emoji: "📦", price: 250 },
];

// Detect swallow-based meals (need soup options)
function isSwallow(catName: string | undefined, mealName: string): boolean {
  const n = ((catName ?? "") + " " + mealName).toLowerCase();
  return ["amala", "eba", "semo", "pounded yam", "fufu", "iyan", "wheat", "swallow", "tuwo"].some((k) => n.includes(k));
}

// Strip soup/protein combo from meal name for display only
function stripSoupFromName(name: string): string {
  return name.split(/\s*[&+]\s*/)[0].replace(/\s+with\s+.*/i, "").trim();
}

// Determine portion unit label
function portionUnit(catName: string | undefined, mealName: string): string {
  const n = ((catName ?? "") + " " + mealName).toLowerCase();
  if (["amala", "eba", "semo", "pounded yam", "fufu", "iyan", "wheat", "swallow", "tuwo"].some((k) => n.includes(k)))
    return "Wrap";
  if (["rice", "jollof", "fried rice", "pasta", "spaghetti", "noodles"].some((k) => n.includes(k)))
    return "Scoop";
  return "Portion";
}

type QtyMap = Record<string, number>;

// ─── Component ───────────────────────────────────────────────────────────────

export function MealCustomizer({ meal, restaurant, category, onClose }: MealCustomizerProps) {
  const { add } = useCart();

  const [qty, setQty] = useState(1);
  const [selectedSoup, setSelectedSoup] = useState("none");
  const [proteinQtys, setProteinQtys] = useState<QtyMap>({});
  const [drinkQtys, setDrinkQtys] = useState<QtyMap>({});
  const [extraQtys, setExtraQtys] = useState<QtyMap>({});
  const [selectedPack, setSelectedPack] = useState("small");

  const showSoupSection = isSwallow(category?.name, meal.name);
  const unit = portionUnit(category?.name, meal.name);

  const soup = SOUPS.find((s) => s.id === selectedSoup)!;
  const pack = PACK_SIZES.find((p) => p.id === selectedPack)!;

  function sumMap(map: QtyMap, defs: Option[]): number {
    return defs.reduce((acc, o) => acc + (map[o.id] ?? 0) * o.price, 0);
  }

  const proteinsTotal = sumMap(proteinQtys, PROTEINS);
  const drinksTotal = sumMap(drinkQtys, DRINKS);
  const extrasSubTotal = sumMap(extraQtys, EXTRAS);
  const soupPrice = selectedSoup !== "none" ? soup.price : 0;

  const extrasPrice = soupPrice + proteinsTotal + drinksTotal + extrasSubTotal + pack.price;
  const linePrice = meal.price_naira + extrasPrice;
  const totalPrice = linePrice * qty;

  function bump(map: QtyMap, setter: (m: QtyMap) => void, id: string, delta: number) {
    const next = Math.max(0, (map[id] ?? 0) + delta);
    const copy = { ...map };
    if (next === 0) delete copy[id];
    else copy[id] = next;
    setter(copy);
  }

  function pickedList(map: QtyMap, defs: Option[]): { def: Option; qty: number }[] {
    return defs
      .filter((o) => (map[o.id] ?? 0) > 0)
      .map((o) => ({ def: o, qty: map[o.id]! }));
  }

  function buildLabel() {
    const displayName = stripSoupFromName(meal.name);
    const parts: string[] = [`${displayName} (${qty} ${unit}${qty > 1 ? "s" : ""})`];
    if (selectedSoup !== "none") parts.push(soup.label);
    for (const p of pickedList(proteinQtys, PROTEINS)) parts.push(`${p.qty}× ${p.def.label}`);
    for (const d of pickedList(drinkQtys, DRINKS)) parts.push(`${d.qty}× ${d.def.label}`);
    for (const e of pickedList(extraQtys, EXTRAS)) parts.push(`${e.qty}× ${e.def.label}`);
    parts.push(pack.label);
    return parts.join(" + ");
  }

  function handleAdd() {
    const label = buildLabel();
    const displayName = stripSoupFromName(meal.name);
    const cartItemId = `${meal.id}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    add(restaurant.id, restaurant.name, {
      cartItemId,
      mealId: meal.id,
      name: displayName,
      price: linePrice,
      quantity: qty,
      imageUrl: meal.image_url,
      customLabel: label,
    });
    toast.success(`${displayName} added to cart!`);
    onClose();
  }

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const pickedProteins = pickedList(proteinQtys, PROTEINS);
  const pickedDrinks = pickedList(drinkQtys, DRINKS);
  const pickedExtras = pickedList(extraQtys, EXTRAS);
  const anyExtras = pickedProteins.length + pickedDrinks.length + pickedExtras.length > 0 || selectedSoup !== "none";

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative mt-auto w-full max-h-[94vh] bg-white rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Meal Image Header */}
        {meal.image_url ? (
          <div className="relative h-52 shrink-0 overflow-hidden rounded-t-3xl">
            <img src={meal.image_url} alt={meal.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10" />
            <div className="absolute bottom-4 left-5 right-14">
              <h2 className="font-display text-xl font-extrabold text-white leading-tight drop-shadow">{stripSoupFromName(meal.name)}</h2>
              <div className="mt-1 font-display text-lg font-black text-white/90">
                from {formatNaira(meal.price_naira)}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-5 pt-6 pb-2 shrink-0">
            <h2 className="font-display text-xl font-extrabold text-foreground leading-tight">{stripSoupFromName(meal.name)}</h2>
            <div className="mt-2 font-display text-lg font-black text-primary">
              from {formatNaira(meal.price_naira)}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-md cursor-pointer hover:bg-white"
        >
          <X className="h-4 w-4 text-foreground" />
        </button>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">
          {/* Portion count */}
          <Section title={`${unit} Count`} required>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="h-10 w-10 rounded-full border-2 border-border flex items-center justify-center hover:border-primary text-foreground cursor-pointer"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-display text-2xl font-extrabold w-10 text-center tabular-nums text-foreground">
                {qty}
              </span>
              <button
                onClick={() => setQty(qty + 1)}
                className="h-10 w-10 rounded-full bg-primary flex items-center justify-center hover:brightness-105 text-primary-foreground cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
              <span className="text-sm text-muted-foreground font-medium">
                {unit}{qty > 1 ? "s" : ""}
              </span>
            </div>
          </Section>

          {/* Soup — single pick */}
          {showSoupSection && (
            <Section title="Choose Soup">
              <div className="-mx-1 overflow-x-auto scrollbar-none pb-1">
                <div className="flex gap-2.5 px-1" style={{ width: "max-content" }}>
                  {SOUPS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSoup(s.id)}
                      className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl border-2 transition-all cursor-pointer shrink-0 min-w-[72px] ${
                        selectedSoup === s.id
                          ? "border-primary bg-primary/8 shadow-sm"
                          : "border-border/70 bg-white hover:border-border"
                      }`}
                    >
                      <OptionImage option={s} size={40} />
                      <span className={`text-[10px] font-bold text-center leading-tight ${selectedSoup === s.id ? "text-primary" : "text-foreground"}`}>
                        {s.label}
                      </span>
                      {s.price > 0 && (
                        <span className="text-[9px] text-muted-foreground">+{formatNaira(s.price)}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </Section>
          )}

          {/* Proteins — multi-pick with per-option quantity */}
          <Section title="Add Proteins" subtitle="Tap + to add. Mix as many as you like — e.g. 1 beef + 2 chicken.">
            <OptionStepperGrid
              defs={PROTEINS}
              map={proteinQtys}
              onBump={(id, d) => bump(proteinQtys, setProteinQtys, id, d)}
            />
          </Section>

          {/* Drinks — multi-pick */}
          <Section title="Add Drinks" subtitle="Add different drinks together.">
            <OptionStepperGrid
              defs={DRINKS}
              map={drinkQtys}
              onBump={(id, d) => bump(drinkQtys, setDrinkQtys, id, d)}
            />
          </Section>

          {/* Extras — multi-pick */}
          <Section title="Extras" subtitle="Plantain, sides & finger foods.">
            <OptionStepperGrid
              defs={EXTRAS}
              map={extraQtys}
              onBump={(id, d) => bump(extraQtys, setExtraQtys, id, d)}
            />
          </Section>

          {/* Takeaway Pack */}
          <Section title="Takeaway Pack" required>
            <div className="grid grid-cols-2 gap-3">
              {PACK_SIZES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPack(p.id)}
                  className={`flex flex-col items-start p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                    selectedPack === p.id
                      ? "border-primary bg-primary/8"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-2xl mb-1">{p.emoji}</span>
                  <span className="text-sm font-extrabold text-foreground">{p.label}</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">{p.description}</span>
                  <span className="text-xs font-bold text-primary mt-1.5">+{formatNaira(p.price)}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Summary */}
          {anyExtras && (
            <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-1.5 text-sm">
              <div className="font-bold text-foreground text-xs uppercase tracking-wider mb-2">Your Order</div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{qty}× {stripSoupFromName(meal.name)}</span>
                <span className="font-semibold">{formatNaira(meal.price_naira * qty)}</span>
              </div>
              {selectedSoup !== "none" && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{soup.emoji} {soup.label}</span>
                  <span>{soup.price > 0 ? `+${formatNaira(soup.price)}` : <span className="text-emerald-600 font-semibold">Free</span>}</span>
                </div>
              )}
              {pickedProteins.map((p) => (
                <div key={p.def.id} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{p.def.emoji} {p.qty}× {p.def.label}</span>
                  <span>+{formatNaira(p.def.price * p.qty)}</span>
                </div>
              ))}
              {pickedDrinks.map((d) => (
                <div key={d.def.id} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{d.def.emoji} {d.qty}× {d.def.label}</span>
                  <span>+{formatNaira(d.def.price * d.qty)}</span>
                </div>
              ))}
              {pickedExtras.map((e) => (
                <div key={e.def.id} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{e.def.emoji} {e.qty}× {e.def.label}</span>
                  <span>+{formatNaira(e.def.price * e.qty)}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{pack.emoji} {pack.label}</span>
                <span>+{formatNaira(pack.price)}</span>
              </div>
              <div className="border-t border-border/60 pt-1.5 flex justify-between font-bold">
                <span>Order Total</span>
                <span className="text-primary">{formatNaira(totalPrice)}</span>
              </div>
            </div>
          )}

          <div className="h-4" />
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 border-t border-border bg-white px-5 py-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="text-xs text-muted-foreground font-medium">Total</div>
            <div className="font-display text-xl font-black text-foreground tabular-nums">
              {formatNaira(totalPrice)}
            </div>
            {extrasPrice > 0 && (
              <div className="text-[10px] text-muted-foreground mt-0.5">
                +{formatNaira(extrasPrice)} extras
              </div>
            )}
          </div>
          <button
            onClick={handleAdd}
            className="flex-[2] rounded-2xl bg-primary py-4 text-sm font-extrabold text-primary-foreground shadow-lg shadow-primary/25 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
          >
            Add {formatNaira(totalPrice)} to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section helper ─────────────────────────────────────────────────────────
function Section({ title, subtitle, required, children }: { title: string; subtitle?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">{title}</h3>
        {required && (
          <span className="text-[10px] font-bold text-primary border border-primary/30 bg-primary/5 px-1.5 py-0.5 rounded-full">
            Required
          </span>
        )}
      </div>
      {subtitle && <p className="text-[11px] text-muted-foreground mb-2.5">{subtitle}</p>}
      {!subtitle && <div className="mb-2" />}
      {children}
    </div>
  );
}

// ─── Option image (with emoji fallback) ─────────────────────────────────────
function OptionImage({ option, size = 40 }: { option: Option; size?: number }) {
  const [failed, setFailed] = React.useState(false);
  if (!option.imageUrl || failed) {
    return <span style={{ fontSize: size * 0.6, lineHeight: 1 }}>{option.emoji}</span>;
  }
  return (
    <img
      src={option.imageUrl}
      alt={option.label}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className="rounded-xl object-cover"
      style={{ width: size, height: size }}
    />
  );
}

// ─── Multi-pick stepper grid ────────────────────────────────────────────────
function OptionStepperGrid({
  defs,
  map,
  onBump,
}: {
  defs: Option[];
  map: QtyMap;
  onBump: (id: string, delta: number) => void;
}) {
  return (
    <div className="-mx-1 overflow-x-auto scrollbar-none pb-1">
      <div className="flex gap-2.5 px-1" style={{ width: "max-content" }}>
        {defs.map((o) => {
          const q = map[o.id] ?? 0;
          const active = q > 0;
          return (
            <div
              key={o.id}
              className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl border-2 transition-all shrink-0 min-w-[86px] ${
                active ? "border-primary bg-primary/8 shadow-sm" : "border-border/70 bg-white"
              }`}
            >
              <OptionImage option={o} size={44} />
              <span className={`text-[10px] font-bold text-center leading-tight ${active ? "text-primary" : "text-foreground"}`}>
                {o.label}
              </span>
              {o.price > 0 && (
                <span className="text-[9px] text-muted-foreground">+{formatNaira(o.price)}</span>
              )}
              <div className="mt-1 flex items-center gap-1.5">
                <button
                  onClick={() => onBump(o.id, -1)}
                  disabled={q === 0}
                  className="h-6 w-6 rounded-full border border-border flex items-center justify-center cursor-pointer hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label={`Remove one ${o.label}`}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="font-bold text-xs w-4 text-center tabular-nums">{q}</span>
                <button
                  onClick={() => onBump(o.id, +1)}
                  className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:brightness-105"
                  aria-label={`Add one ${o.label}`}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
