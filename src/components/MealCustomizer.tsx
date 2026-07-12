import { useState, useEffect } from "react";
import { formatNaira } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { X, Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";
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
  { id: "none", label: "None", price: 0 },
  { id: "ewedu", label: "Ewedu", price: 0 },
  { id: "egusi", label: "Egusi Soup", price: 300 },
  { id: "efo_riro", label: "Efo Riro", price: 400 },
  { id: "gbegiri", label: "Gbegiri", price: 0 },
  { id: "ewedu_gbegiri", label: "Ewedu & Gbegiri", price: 0 },
  { id: "okro", label: "Okro Soup", price: 200 },
  { id: "banga", label: "Banga Soup", price: 300 },
  { id: "ogbono", label: "Ogbono Soup", price: 300 },
  { id: "oha", label: "Oha Soup", price: 300 },
];

const PROTEINS = [
  { id: "none", label: "None", price: 0 },
  { id: "assorted_meat", label: "Assorted Meat (Beef + Shaki + Ponmo)", price: 800 },
  { id: "beef", label: "Beef (1 piece)", price: 500 },
  { id: "ponmo", label: "Ponmo", price: 300 },
  { id: "shaki", label: "Shaki (Tripe)", price: 400 },
  { id: "grilled_chicken", label: "Grilled Chicken (1 piece)", price: 1500 },
  { id: "peppered_chicken", label: "Peppered Chicken (1 piece)", price: 1500 },
  { id: "fried_chicken", label: "Fried Chicken (1 piece)", price: 1400 },
  { id: "turkey", label: "Peppered Turkey (1 piece)", price: 2200 },
  { id: "titus_fish", label: "Titus Fish (Mackerel)", price: 1200 },
  { id: "croaker_fish", label: "Croaker Fish", price: 1800 },
  { id: "catfish", label: "Catfish (Eja Aro)", price: 2000 },
  { id: "tilapia", label: "Tilapia Fish", price: 1500 },
  { id: "smoked_fish", label: "Smoked Fish", price: 900 },
  { id: "dried_fish", label: "Dried Fish (Eja Sawa)", price: 600 },
  { id: "stockfish", label: "Stock Fish (Panla)", price: 700 },
  { id: "boiled_egg", label: "Boiled Egg (1)", price: 300 },
  { id: "fried_egg", label: "Fried Egg", price: 400 },
  { id: "snail", label: "Snail (2 pieces)", price: 1200 },
  { id: "shrimp", label: "Shrimp / Prawns", price: 1000 },
  { id: "bush_meat", label: "Bush Meat (Dried)", price: 800 },
];

const DRINKS = [
  { id: "none", label: "None", price: 0 },
  { id: "water", label: "Eva Water 75cl", price: 300 },
  { id: "coke_50cl", label: "Coca-Cola 50cl", price: 500 },
  { id: "coke_35cl", label: "Coca-Cola 35cl", price: 400 },
  { id: "fanta", label: "Fanta 50cl", price: 500 },
  { id: "sprite", label: "Sprite 50cl", price: 500 },
  { id: "pepsi", label: "Pepsi 50cl", price: 500 },
  { id: "malt", label: "Malt (Malta Guinness / Dubic)", price: 700 },
  { id: "zobo", label: "Zobo (Chilled 50cl)", price: 700 },
  { id: "kunu", label: "Kunu Aya", price: 500 },
  { id: "tigernut", label: "Tigernut Drink", price: 600 },
  { id: "chapman", label: "Chapman", price: 1200 },
  { id: "smoothie", label: "Fruit Smoothie", price: 1500 },
  { id: "lacasera", label: "Lacasera 50cl", price: 450 },
  { id: "capri_sonne", label: "Capri Sonne", price: 400 },
  { id: "five_alive", label: "Five Alive 35cl", price: 400 },
  { id: "hi_malt", label: "Hi-Malt", price: 600 },
  { id: "peak_milk", label: "Peak Milk 165ml", price: 450 },
];

const PACK_SIZES = [
  { id: "small", label: "Small Pack", description: "Standard takeaway bag", price: 100 },
  { id: "big", label: "Big Pack", description: "Large takeaway box", price: 250 },
];

// Detect swallow-based meals (need soup options)
function isSwallow(catName: string | undefined, mealName: string): boolean {
  if (!catName && !mealName) return false;
  const n = (catName + " " + mealName).toLowerCase();
  return ["amala", "eba", "semo", "pounded yam", "fufu", "iyan", "wheat", "swallow", "tuwo"].some((k) => n.includes(k));
}

// Determine portion unit label
function portionUnit(catName: string | undefined, mealName: string): string {
  const n = (catName + " " + mealName).toLowerCase();
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
  const [showSoups, setShowSoups] = useState(false);
  const [showProteins, setShowProteins] = useState(false);
  const [showDrinks, setShowDrinks] = useState(false);

  const showSoupSection = isSwallow(category?.name, meal.name);
  const unit = portionUnit(category?.name, meal.name);

  const soup = SOUPS.find((s) => s.id === selectedSoup)!;
  const protein = PROTEINS.find((p) => p.id === selectedProtein)!;
  const drink = DRINKS.find((d) => d.id === selectedDrink)!;
  const pack = PACK_SIZES.find((p) => p.id === selectedPack)!;

  const extrasPrice = soup.price + (selectedProtein !== "none" ? protein.price * proteinQty : 0) + (selectedDrink !== "none" ? drink.price * drinkQty : 0) + pack.price;
  const linePrice = meal.price_naira + extrasPrice;
  const totalPrice = linePrice * qty;

  function buildLabel() {
    const parts: string[] = [`${meal.name} (${qty} ${unit}${qty > 1 ? "s" : ""})`];
    if (selectedSoup !== "none") parts.push(soup.label);
    if (selectedProtein !== "none") parts.push(`${proteinQty}× ${protein.label}`);
    if (selectedDrink !== "none") parts.push(`${drinkQty}× ${drink.label}`);
    parts.push(pack.label);
    return parts.join(" + ");
  }

  function handleAdd() {
    const label = buildLabel();
    const cartItemId = `${meal.id}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    add(restaurant.id, restaurant.name, {
      cartItemId,
      mealId: meal.id,
      name: label,
      price: linePrice,
      quantity: qty,
      imageUrl: meal.image_url,
      customLabel: label,
    });
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
      <div className="relative mt-auto w-full max-h-[92vh] bg-white rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Meal Image Header */}
        {meal.image_url && (
          <div className="relative h-48 shrink-0 overflow-hidden rounded-t-3xl">
            <img src={meal.image_url} alt={meal.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
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
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Meal Info */}
          <div>
            <h2 className="font-display text-xl font-extrabold text-foreground leading-tight">{meal.name}</h2>
            {meal.description && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{meal.description}</p>
            )}
            <div className="mt-2 font-display text-lg font-black text-primary">
              from {formatNaira(meal.price_naira)}
            </div>
          </div>

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
            <Section title="Soup Option">
              <button
                onClick={() => setShowSoups(!showSoups)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 cursor-pointer"
              >
                <span className="text-sm font-bold text-foreground">
                  {soup.label} {soup.price > 0 && <span className="text-muted-foreground font-normal text-xs">+{formatNaira(soup.price)}</span>}
                </span>
                {showSoups ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {showSoups && (
                <div className="mt-2 space-y-1.5 max-h-52 overflow-y-auto rounded-xl border border-border p-2 bg-white">
                  {SOUPS.map((s) => (
                    <label key={s.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/40 cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${selectedSoup === s.id ? "border-primary bg-primary" : "border-border"}`}>
                          {selectedSoup === s.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-sm font-medium text-foreground">{s.label}</span>
                      </div>
                      {s.price > 0 && <span className="text-xs text-muted-foreground">+{formatNaira(s.price)}</span>}
                      <input type="radio" className="hidden" checked={selectedSoup === s.id} onChange={() => { setSelectedSoup(s.id); setShowSoups(false); }} />
                    </label>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* ── Protein ── */}
          <Section title="Protein Option">
            <button
              onClick={() => setShowProteins(!showProteins)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 cursor-pointer"
            >
              <span className="text-sm font-bold text-foreground">
                {protein.label} {protein.price > 0 && <span className="text-muted-foreground font-normal text-xs">+{formatNaira(protein.price)}</span>}
              </span>
              {showProteins ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showProteins && (
              <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto rounded-xl border border-border p-2 bg-white">
                {PROTEINS.map((p) => (
                  <label key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/40 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${selectedProtein === p.id ? "border-primary bg-primary" : "border-border"}`}>
                        {selectedProtein === p.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm font-medium text-foreground">{p.label}</span>
                    </div>
                    {p.price > 0 && <span className="text-xs text-muted-foreground">+{formatNaira(p.price)}</span>}
                    <input type="radio" className="hidden" checked={selectedProtein === p.id} onChange={() => { setSelectedProtein(p.id); setShowProteins(false); }} />
                  </label>
                ))}
              </div>
            )}
            {selectedProtein !== "none" && (
              <div className="mt-2 flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-medium">Quantity:</span>
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
          <Section title="Drink Option">
            <button
              onClick={() => setShowDrinks(!showDrinks)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 cursor-pointer"
            >
              <span className="text-sm font-bold text-foreground">
                {drink.label} {drink.price > 0 && <span className="text-muted-foreground font-normal text-xs">+{formatNaira(drink.price)}</span>}
              </span>
              {showDrinks ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showDrinks && (
              <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto rounded-xl border border-border p-2 bg-white">
                {DRINKS.map((d) => (
                  <label key={d.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/40 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${selectedDrink === d.id ? "border-primary bg-primary" : "border-border"}`}>
                        {selectedDrink === d.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm font-medium text-foreground">{d.label}</span>
                    </div>
                    {d.price > 0 && <span className="text-xs text-muted-foreground">+{formatNaira(d.price)}</span>}
                    <input type="radio" className="hidden" checked={selectedDrink === d.id} onChange={() => { setSelectedDrink(d.id); setShowDrinks(false); }} />
                  </label>
                ))}
              </div>
            )}
            {selectedDrink !== "none" && (
              <div className="mt-2 flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-medium">Quantity:</span>
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
          <Section title="Takeaway Pack Size" required>
            <div className="grid grid-cols-2 gap-3">
              {PACK_SIZES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPack(p.id)}
                  className={`flex flex-col p-3 rounded-xl border-2 transition-all cursor-pointer text-left ${
                    selectedPack === p.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-sm font-extrabold text-foreground">{p.label}</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">{p.description}</span>
                  <span className="text-xs font-bold text-primary mt-1.5">+{formatNaira(p.price)}</span>
                </button>
              ))}
            </div>
          </Section>

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
