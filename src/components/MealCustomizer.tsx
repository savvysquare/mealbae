import { useState, useEffect } from "react";
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

const SOUPS = [
  { id: "none", label: "None", emoji: "🚫", price: 0 },
  { id: "ewedu", label: "Ewedu", emoji: "🥬", price: 0 },
  { id: "egusi", label: "Egusi Soup", emoji: "🍲", price: 300 },
  { id: "efo_riro", label: "Efo Riro", emoji: "🫙", price: 400 },
  { id: "gbegiri", label: "Gbegiri", emoji: "🟤", price: 0 },
  { id: "ewedu_gbegiri", label: "Ewedu & Gbegiri", emoji: "🥬", price: 0 },
  { id: "okro", label: "Okro Soup", emoji: "🫑", price: 200 },
  { id: "banga", label: "Banga Soup", emoji: "🌴", price: 300 },
  { id: "ogbono", label: "Ogbono Soup", emoji: "🪵", price: 300 },
  { id: "oha", label: "Oha Soup", emoji: "🍃", price: 300 },
];

const PROTEINS = [
  { id: "none", label: "None", emoji: "🚫", price: 0 },
  { id: "assorted_meat", label: "Assorted Meat", emoji: "🥩", price: 800 },
  { id: "beef", label: "Beef (1 pc)", emoji: "🥩", price: 500 },
  { id: "ponmo", label: "Ponmo", emoji: "🟫", price: 300 },
  { id: "shaki", label: "Shaki (Tripe)", emoji: "🫀", price: 400 },
  { id: "grilled_chicken", label: "Grilled Chicken", emoji: "🍗", price: 1500 },
  { id: "peppered_chicken", label: "Peppered Chicken", emoji: "🍗", price: 1500 },
  { id: "fried_chicken", label: "Fried Chicken", emoji: "🍗", price: 1400 },
  { id: "turkey", label: "Peppered Turkey", emoji: "🦃", price: 2200 },
  { id: "titus_fish", label: "Titus Fish", emoji: "🐟", price: 1200 },
  { id: "croaker_fish", label: "Croaker Fish", emoji: "🐠", price: 1800 },
  { id: "catfish", label: "Catfish (Eja Aro)", emoji: "🐡", price: 2000 },
  { id: "tilapia", label: "Tilapia", emoji: "🐟", price: 1500 },
  { id: "smoked_fish", label: "Smoked Fish", emoji: "🎣", price: 900 },
  { id: "dried_fish", label: "Dried Fish", emoji: "🐚", price: 600 },
  { id: "stockfish", label: "Stock Fish (Panla)", emoji: "🪸", price: 700 },
  { id: "boiled_egg", label: "Boiled Egg", emoji: "🥚", price: 300 },
  { id: "fried_egg", label: "Fried Egg", emoji: "🍳", price: 400 },
  { id: "snail", label: "Snail (2 pcs)", emoji: "🐌", price: 1200 },
  { id: "shrimp", label: "Shrimp / Prawns", emoji: "🦐", price: 1000 },
  { id: "bush_meat", label: "Bush Meat", emoji: "🦌", price: 800 },
];

const DRINKS = [
  { id: "none", label: "None", emoji: "🚫", price: 0 },
  { id: "water", label: "Eva Water 75cl", emoji: "💧", price: 300 },
  { id: "coke_50cl", label: "Coca-Cola 50cl", emoji: "🥤", price: 500 },
  { id: "coke_35cl", label: "Coca-Cola 35cl", emoji: "🥤", price: 400 },
  { id: "fanta", label: "Fanta 50cl", emoji: "🟠", price: 500 },
  { id: "sprite", label: "Sprite 50cl", emoji: "🟢", price: 500 },
  { id: "pepsi", label: "Pepsi 50cl", emoji: "🔵", price: 500 },
  { id: "malt", label: "Malt", emoji: "🍺", price: 700 },
  { id: "zobo", label: "Zobo 50cl", emoji: "❤️", price: 700 },
  { id: "kunu", label: "Kunu Aya", emoji: "🥛", price: 500 },
  { id: "tigernut", label: "Tigernut Drink", emoji: "🌰", price: 600 },
  { id: "chapman", label: "Chapman", emoji: "🍹", price: 1200 },
  { id: "smoothie", label: "Fruit Smoothie", emoji: "🍓", price: 1500 },
  { id: "lacasera", label: "Lacasera 50cl", emoji: "🫧", price: 450 },
  { id: "capri_sonne", label: "Capri Sonne", emoji: "🍊", price: 400 },
  { id: "five_alive", label: "Five Alive 35cl", emoji: "🍋", price: 400 },
  { id: "hi_malt", label: "Hi-Malt", emoji: "🍺", price: 600 },
];

const PACK_SIZES = [
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

// ─── Component ───────────────────────────────────────────────────────────────

export function MealCustomizer({ meal, restaurant, category, onClose }: MealCustomizerProps) {
  const { add } = useCart();

  const [qty, setQty] = useState(1);
  const [selectedSoup, setSelectedSoup] = useState("none");
  const [selectedProtein, setSelectedProtein] = useState("none");
  const [proteinQty, setProteinQty] = useState(1);
  const [selectedDrink, setSelectedDrink] = useState("none");
  const [drinkQty, setDrinkQty] = useState(1);
  const [selectedPack, setSelectedPack] = useState("small");
  const [activeSection, setActiveSection] = useState<"soup" | "protein" | "drink" | null>(null);

  const showSoupSection = isSwallow(category?.name, meal.name);
  const unit = portionUnit(category?.name, meal.name);

  const soup = SOUPS.find((s) => s.id === selectedSoup)!;
  const protein = PROTEINS.find((p) => p.id === selectedProtein)!;
  const drink = DRINKS.find((d) => d.id === selectedDrink)!;
  const pack = PACK_SIZES.find((p) => p.id === selectedPack)!;

  const extrasPrice =
    soup.price +
    (selectedProtein !== "none" ? protein.price * proteinQty : 0) +
    (selectedDrink !== "none" ? drink.price * drinkQty : 0) +
    pack.price;
  const linePrice = meal.price_naira + extrasPrice;
  const totalPrice = linePrice * qty;

  function buildLabel() {
    const displayName = stripSoupFromName(meal.name);
    const parts: string[] = [`${displayName} (${qty} ${unit}${qty > 1 ? "s" : ""})`];
    if (selectedSoup !== "none") parts.push(soup.label);
    if (selectedProtein !== "none") parts.push(`${proteinQty}× ${protein.label}`);
    if (selectedDrink !== "none") parts.push(`${drinkQty}× ${drink.label}`);
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

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />

      {/* Sheet */}
      <div className="relative mt-auto w-full max-h-[94vh] bg-white rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Meal Image Header */}
        {meal.image_url ? (
          <div className="relative h-52 shrink-0 overflow-hidden rounded-t-3xl">
            <img src={meal.image_url} alt={meal.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10" />
            <div className="absolute bottom-4 left-5 right-14">
              <h2 className="font-display text-xl font-extrabold text-white leading-tight drop-shadow">{stripSoupFromName(meal.name)}</h2>
              {meal.description && (
                <p className="text-xs text-white/80 mt-0.5 line-clamp-1">{meal.description}</p>
              )}
              <div className="mt-1 font-display text-lg font-black text-white/90">
                from {formatNaira(meal.price_naira)}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-5 pt-6 pb-2 shrink-0">
            <h2 className="font-display text-xl font-extrabold text-foreground leading-tight">{stripSoupFromName(meal.name)}</h2>
            {meal.description && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{meal.description}</p>
            )}
            <div className="mt-2 font-display text-lg font-black text-primary">
              from {formatNaira(meal.price_naira)}
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-md cursor-pointer hover:bg-white"
        >
          <X className="h-4 w-4 text-foreground" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">

          {/* ── Quantity (Portions / Wraps / Scoops) ── */}
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

          {/* ── Soup Selection (swallow only) ── */}
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
                      <span className="text-2xl">{s.emoji}</span>
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

          {/* ── Protein ── */}
          <Section title="Add Protein">
            <div className="-mx-1 overflow-x-auto scrollbar-none pb-1">
              <div className="flex gap-2.5 px-1" style={{ width: "max-content" }}>
                {PROTEINS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProtein(p.id)}
                    className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl border-2 transition-all cursor-pointer shrink-0 min-w-[72px] ${
                      selectedProtein === p.id
                        ? "border-primary bg-primary/8 shadow-sm"
                        : "border-border/70 bg-white hover:border-border"
                    }`}
                  >
                    <span className="text-2xl">{p.emoji}</span>
                    <span className={`text-[10px] font-bold text-center leading-tight ${selectedProtein === p.id ? "text-primary" : "text-foreground"}`}>
                      {p.label}
                    </span>
                    {p.price > 0 && (
                      <span className="text-[9px] text-muted-foreground">+{formatNaira(p.price)}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            {selectedProtein !== "none" && (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-medium">How many?</span>
                <button onClick={() => setProteinQty(Math.max(1, proteinQty - 1))} className="h-7 w-7 rounded-full border border-border flex items-center justify-center cursor-pointer hover:border-primary">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="font-bold text-sm w-5 text-center">{proteinQty}</span>
                <button onClick={() => setProteinQty(proteinQty + 1)} className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:brightness-105">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            )}
          </Section>

          {/* ── Drink ── */}
          <Section title="Add a Drink">
            <div className="-mx-1 overflow-x-auto scrollbar-none pb-1">
              <div className="flex gap-2.5 px-1" style={{ width: "max-content" }}>
                {DRINKS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDrink(d.id)}
                    className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl border-2 transition-all cursor-pointer shrink-0 min-w-[72px] ${
                      selectedDrink === d.id
                        ? "border-primary bg-primary/8 shadow-sm"
                        : "border-border/70 bg-white hover:border-border"
                    }`}
                  >
                    <span className="text-2xl">{d.emoji}</span>
                    <span className={`text-[10px] font-bold text-center leading-tight ${selectedDrink === d.id ? "text-primary" : "text-foreground"}`}>
                      {d.label}
                    </span>
                    {d.price > 0 && (
                      <span className="text-[9px] text-muted-foreground">+{formatNaira(d.price)}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            {selectedDrink !== "none" && (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-medium">How many?</span>
                <button onClick={() => setDrinkQty(Math.max(1, drinkQty - 1))} className="h-7 w-7 rounded-full border border-border flex items-center justify-center cursor-pointer hover:border-primary">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="font-bold text-sm w-5 text-center">{drinkQty}</span>
                <button onClick={() => setDrinkQty(drinkQty + 1)} className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:brightness-105">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            )}
          </Section>

          {/* ── Takeaway Pack ── */}
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

          {/* ── Price Breakdown Summary ── */}
          {extrasPrice > 0 && (
            <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-1.5 text-sm">
              <div className="font-bold text-foreground text-xs uppercase tracking-wider mb-2">Your Order</div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{qty}× {stripSoupFromName(meal.name)}</span>
                <span className="font-semibold">{formatNaira(meal.price_naira * qty)}</span>
              </div>
              {selectedSoup !== "none" && soup.price > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{soup.emoji} {soup.label}</span>
                  <span>+{formatNaira(soup.price)}</span>
                </div>
              )}
              {selectedSoup !== "none" && soup.price === 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{soup.emoji} {soup.label}</span>
                  <span className="text-emerald-600 font-semibold">Free</span>
                </div>
              )}
              {selectedProtein !== "none" && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{protein.emoji} {proteinQty}× {protein.label}</span>
                  <span>+{formatNaira(protein.price * proteinQty)}</span>
                </div>
              )}
              {selectedDrink !== "none" && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{drink.emoji} {drinkQty}× {drink.label}</span>
                  <span>+{formatNaira(drink.price * drinkQty)}</span>
                </div>
              )}
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

          {/* Spacer so bottom bar doesn't overlap last item */}
          <div className="h-4" />
        </div>

        {/* ── Sticky Footer: Price + Add ── */}
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

// ─── Section Helper ──────────────────────────────────────────────────────────
function Section({ title, required, children }: { title: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">{title}</h3>
        {required && (
          <span className="text-[10px] font-bold text-primary border border-primary/30 bg-primary/5 px-1.5 py-0.5 rounded-full">
            Required
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
