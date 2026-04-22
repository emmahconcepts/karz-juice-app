import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Minus, Trash2, X, Phone, MessageCircle, CheckCircle, Leaf, Droplets, Star, ChevronRight, AlertCircle } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface CartItem { id: number; size: string; price: number; quantity: number; }
interface CustomerInfo { name: string; phone: string; location: string; }
type View = "shop" | "cart" | "checkout" | "confirm";

// ── Product data ─────────────────────────────────────────────────────────────
const PRODUCTS = [
  { id: 1, size: "300ml", price: 3000,   label: "Mini",       desc: "Quick refresh for one",       emoji: "🧃" },
  { id: 2, size: "500ml", price: 5000,   label: "Regular",    desc: "Perfect on-the-go",            emoji: "🍊" },
  { id: 3, size: "1L",    price: 10000,  label: "Large",      desc: "Share with the family",        emoji: "🍋" },
  { id: 4, size: "5L",    price: 45000,  label: "Party",      desc: "Great for small gatherings",   emoji: "🎉" },
  { id: 5, size: "10L",   price: 90000,  label: "Bulk",       desc: "For events and catering",      emoji: "🏪" },
  { id: 6, size: "20L",   price: 180000, label: "Commercial", desc: "Wholesale & large orders",     emoji: "🚚" },
];

const FLAVOURS = ["Mango", "Passion Fruit", "Pineapple", "Mixed Fruit", "Watermelon", "Orange"];

const WHATSAPP_NUMBER = "256700000000"; // Replace with real number

function fmtUGX(n: number) { return `UGX ${n.toLocaleString()}`; }

// ── Sub-components ────────────────────────────────────────────────────────────

function HeroSection({ cartCount, onCartClick }: { cartCount: number; onCartClick: () => void }) {
  return (
    <header style={{ background: "linear-gradient(135deg, #FF9800 0%, #e65100 60%, #0B6623 100%)", color: "#fff", padding: "0 1rem" }}>
      {/* Nav */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 960, margin: "0 auto", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>KJ</div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Karz Juice</span>
        </div>
        <button
          onClick={onCartClick}
          style={{ position: "relative", background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: "8px 14px", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 14 }}
        >
          <ShoppingCart size={17} />
          Cart
          {cartCount > 0 && (
            <span style={{ position: "absolute", top: -6, right: -6, background: "#D32F2F", color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
              {cartCount}
            </span>
          )}
        </button>
      </nav>

      {/* Hero text */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 0 48px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "4px 14px", fontSize: 13, marginBottom: 16 }}>
          🇺🇬 Fresh · Natural · Made in Uganda
        </div>
        <h1 style={{ fontSize: "clamp(28px, 6vw, 48px)", fontWeight: 800, margin: "0 0 12px", lineHeight: 1.15 }}>
          Pure Juice,<br />Delivered Fresh
        </h1>
        <p style={{ fontSize: 16, opacity: 0.9, margin: "0 0 28px", maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
          Freshly squeezed Ugandan fruit juices. Order today, delivered to your door.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {["🍊 No preservatives", "🌿 100% natural", "⚡ Same-day delivery"].map(t => (
            <span key={t} style={{ background: "rgba(255,255,255,0.15)", padding: "6px 14px", borderRadius: 20, fontSize: 13 }}>{t}</span>
          ))}
        </div>
      </div>
    </header>
  );
}

function ProductCard({ p, qty, onAdd, onRemove }: { p: typeof PRODUCTS[0]; qty: number; onAdd: () => void; onRemove: () => void }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(135deg, #fff8f0, #f0faf4)", padding: "24px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 4 }}>{p.emoji}</div>
        <div style={{ fontWeight: 700, fontSize: 18, color: "#1a1a1a" }}>{p.size}</div>
        <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{p.label}</div>
      </div>
      <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ fontSize: 13, color: "#555", margin: 0 }}>{p.desc}</p>
        <div style={{ fontWeight: 700, fontSize: 18, color: "#FF9800" }}>{fmtUGX(p.price)}</div>
        {qty === 0 ? (
          <button onClick={onAdd} style={{ background: "#0B6623", color: "#fff", border: "none", borderRadius: 10, padding: "10px 0", fontWeight: 600, fontSize: 14, cursor: "pointer", width: "100%" }}>
            Add to cart
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={onRemove} style={{ background: "#f5f5f5", border: "none", borderRadius: 8, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={15} color="#333" /></button>
            <span style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 16 }}>{qty}</span>
            <button onClick={onAdd} style={{ background: "#0B6623", border: "none", borderRadius: 8, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={15} color="#fff" /></button>
          </div>
        )}
      </div>
    </div>
  );
}

function CartPanel({ cart, onClose, onCheckout, onUpdate }: { cart: CartItem[]; onClose: () => void; onCheckout: () => void; onUpdate: (id: number, qty: number) => void }) {
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex" }}>
      <div onClick={onClose} style={{ flex: 1, background: "rgba(0,0,0,0.4)" }} />
      <div style={{ width: "min(400px, 100vw)", background: "#fff", display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: "1px solid #eee" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>Your cart ({cart.length})</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={20} color="#555" /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#888" }}>
              <ShoppingCart size={40} style={{ opacity: 0.3, margin: "0 auto 12px", display: "block" }} />
              <p style={{ margin: 0 }}>Your cart is empty</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f5f5f5" }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600, color: "#1a1a1a", fontSize: 15 }}>{item.size}</p>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#FF9800", fontWeight: 600 }}>{fmtUGX(item.price)}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => onUpdate(item.id, item.quantity - 1)} style={{ background: "#f5f5f5", border: "none", borderRadius: 6, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={12} /></button>
                <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{item.quantity}</span>
                <button onClick={() => onUpdate(item.id, item.quantity + 1)} style={{ background: "#0B6623", border: "none", borderRadius: 6, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={12} color="#fff" /></button>
              </div>
              <button onClick={() => onUpdate(item.id, 0)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#ccc" }}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div style={{ padding: "16px 20px", borderTop: "1px solid #eee" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 16, color: "#555" }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>{fmtUGX(total)}</span>
            </div>
            <button onClick={onCheckout} style={{ width: "100%", background: "#0B6623", color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
              Proceed to checkout →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckoutForm({ cart, onBack, onConfirm }: { cart: CartItem[]; onBack: () => void; onConfirm: (info: CustomerInfo) => void }) {
  const [info, setInfo] = useState<CustomerInfo>({ name: "", phone: "", location: "" });
  const [errors, setErrors] = useState<Partial<CustomerInfo>>({});
  const [flavour, setFlavour] = useState(FLAVOURS[0]);
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  function validate() {
    const e: Partial<CustomerInfo> = {};
    if (!info.name.trim()) e.name = "Name is required";
    if (!info.phone.trim()) e.phone = "Phone number is required";
    else if (!/^[\d\s+()-]{9,15}$/.test(info.phone)) e.phone = "Enter a valid phone number";
    if (!info.location.trim()) e.location = "Delivery location is required";
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onConfirm(info);
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 16px" }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#555", fontSize: 14, marginBottom: 20 }}>
        ← Back to cart
      </button>
      <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700, color: "#1a1a1a" }}>Checkout</h2>

      {/* Order summary */}
      <div style={{ background: "#f9f9f9", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
        <p style={{ margin: "0 0 10px", fontWeight: 600, fontSize: 14, color: "#555" }}>Order summary</p>
        {cart.map(i => (
          <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
            <span style={{ color: "#333" }}>{i.size} × {i.quantity}</span>
            <span style={{ color: "#FF9800", fontWeight: 600 }}>{fmtUGX(i.price * i.quantity)}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px solid #eee", marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
          <span>Total</span>
          <span style={{ color: "#0B6623" }}>{fmtUGX(total)}</span>
        </div>
      </div>

      {/* Flavour picker */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 6, color: "#333" }}>Juice flavour</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {FLAVOURS.map(f => (
            <button
              key={f}
              onClick={() => setFlavour(f)}
              style={{ padding: "6px 14px", borderRadius: 20, border: `2px solid ${flavour === f ? "#0B6623" : "#ddd"}`, background: flavour === f ? "#0B6623" : "#fff", color: flavour === f ? "#fff" : "#333", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Customer fields */}
      {(["name", "phone", "location"] as const).map(field => (
        <div key={field} style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 6, color: "#333", textTransform: "capitalize" }}>
            {field === "location" ? "Delivery location" : field} *
          </label>
          <input
            type={field === "phone" ? "tel" : "text"}
            value={info[field]}
            onChange={e => { setInfo(f => ({ ...f, [field]: e.target.value })); setErrors(er => ({ ...er, [field]: undefined })); }}
            placeholder={field === "name" ? "Your full name" : field === "phone" ? "+256 700 000 000" : "Area, street, or landmark"}
            style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${errors[field] ? "#D32F2F" : "#ddd"}`, borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box" }}
          />
          {errors[field] && (
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#D32F2F", display: "flex", alignItems: "center", gap: 4 }}>
              <AlertCircle size={12} /> {errors[field]}
            </p>
          )}
        </div>
      ))}

      <p style={{ fontSize: 12, color: "#888", margin: "0 0 20px" }}>
        Payment is on delivery. Cash and Mobile Money accepted.
      </p>

      <button onClick={handleSubmit} style={{ width: "100%", background: "#0B6623", color: "#fff", border: "none", borderRadius: 12, padding: "16px 0", fontWeight: 700, fontSize: 17, cursor: "pointer", marginBottom: 12 }}>
        Place Order 🎉
      </button>

      {/* WhatsApp fallback */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi Karz Juice! I'd like to order:\n${cart.map(i => `${i.size} x${i.quantity} = ${fmtUGX(i.price * i.quantity)}`).join("\n")}\nTotal: ${fmtUGX(total)}\nFlavour: ${flavour}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: "#25D366", color: "#fff", borderRadius: 12, padding: "14px 0", fontWeight: 700, fontSize: 15, textDecoration: "none", boxSizing: "border-box" }}
      >
        <MessageCircle size={18} /> Order via WhatsApp instead
      </a>

      <a
        href={`tel:+${WHATSAPP_NUMBER}`}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: "#fff", color: "#333", border: "1.5px solid #ddd", borderRadius: 12, padding: "13px 0", fontWeight: 600, fontSize: 15, textDecoration: "none", marginTop: 10, boxSizing: "border-box" }}
      >
        <Phone size={17} /> Call to order
      </a>
    </div>
  );
}

function ConfirmScreen({ info, cart, onReset }: { info: CustomerInfo; cart: CartItem[]; onReset: () => void }) {
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  return (
    <div style={{ maxWidth: 480, margin: "60px auto", padding: "0 16px", textAlign: "center" }}>
      <div style={{ background: "#f0faf4", width: 72, height: 72, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <CheckCircle size={36} color="#0B6623" />
      </div>
      <h2 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 800, color: "#1a1a1a" }}>Order placed!</h2>
      <p style={{ color: "#555", marginBottom: 24 }}>
        Thank you, <strong>{info.name}</strong>! We'll call <strong>{info.phone}</strong> to confirm your order shortly.
      </p>
      <div style={{ background: "#f9f9f9", borderRadius: 12, padding: "16px", marginBottom: 28, textAlign: "left" }}>
        <p style={{ margin: "0 0 8px", fontWeight: 600, fontSize: 14, color: "#555" }}>Order summary</p>
        {cart.map(i => (
          <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
            <span>{i.size} × {i.quantity}</span>
            <span style={{ color: "#FF9800", fontWeight: 600 }}>{fmtUGX(i.price * i.quantity)}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px solid #eee", marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
          <span>Total</span>
          <span style={{ color: "#0B6623" }}>{fmtUGX(total)}</span>
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 13, color: "#777" }}>📍 Delivering to: {info.location}</p>
      </div>
      <button onClick={onReset} style={{ background: "#FF9800", color: "#fff", border: "none", borderRadius: 12, padding: "14px 28px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
        Order again
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EcommerceLanding() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [view, setView] = useState<View>("shop");
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({ name: "", phone: "", location: "" });

  function updateCart(id: number, delta: number) {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      const product = PRODUCTS.find(p => p.id === id)!;
      if (!existing) {
        return [...prev, { id, size: product.size, price: product.price, quantity: 1 }];
      }
      const newQty = existing.quantity + delta;
      if (newQty <= 0) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, quantity: newQty } : i);
    });
  }

  function setQty(id: number, qty: number) {
    if (qty <= 0) { setCart(prev => prev.filter(i => i.id !== id)); return; }
    const product = PRODUCTS.find(p => p.id === id)!;
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing) return prev.map(i => i.id === id ? { ...i, quantity: qty } : i);
      return [...prev, { id, size: product.size, price: product.price, quantity: qty }];
    });
  }

  function handleConfirmOrder(info: CustomerInfo) {
    setCustomerInfo(info);
    // TODO: POST to /api/orders or trpc.orders.create
    setView("confirm");
  }

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf8", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Cart panel overlay */}
      {view === "cart" && (
        <CartPanel
          cart={cart}
          onClose={() => setView("shop")}
          onCheckout={() => setView("checkout")}
          onUpdate={setQty}
        />
      )}

      {view === "shop" && (
        <>
          <HeroSection cartCount={cartCount} onCartClick={() => setView("cart")} />

          {/* Flavours ribbon */}
          <div style={{ background: "#fff", borderBottom: "1px solid #eee", overflowX: "auto" }}>
            <div style={{ display: "flex", gap: 8, padding: "12px 16px", maxWidth: 960, margin: "0 auto" }}>
              {FLAVOURS.map(f => (
                <span key={f} style={{ whiteSpace: "nowrap", background: "#fff8f0", border: "1px solid #ffe0b2", borderRadius: 20, padding: "5px 14px", fontSize: 13, color: "#e65100", fontWeight: 500 }}>
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Products grid */}
          <main style={{ maxWidth: 960, margin: "0 auto", padding: "28px 16px" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Choose your size</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
              {PRODUCTS.map(p => (
                <ProductCard
                  key={p.id}
                  p={p}
                  qty={cart.find(i => i.id === p.id)?.quantity ?? 0}
                  onAdd={() => updateCart(p.id, 1)}
                  onRemove={() => updateCart(p.id, -1)}
                />
              ))}
            </div>

            {/* Trust badges */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 40, padding: "24px 0", borderTop: "1px solid #eee" }}>
              {[
                { icon: <Leaf size={20} color="#0B6623" />, title: "100% Natural", desc: "No preservatives or additives" },
                { icon: <Droplets size={20} color="#1565c0" />, title: "Freshly squeezed", desc: "Made to order daily" },
                { icon: <Star size={20} color="#FF9800" />, title: "Premium quality", desc: "Grade A Ugandan fruits" },
              ].map(b => (
                <div key={b.title} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "14px", background: "#fff", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                  <div style={{ flexShrink: 0 }}>{b.icon}</div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{b.title}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#777" }}>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </main>

          {/* Sticky checkout bar */}
          {cartCount > 0 && (
            <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0B6623", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 -4px 16px rgba(0,0,0,0.12)", zIndex: 50 }}>
              <span style={{ color: "#fff", fontWeight: 600 }}>
                {cartCount} item{cartCount !== 1 ? "s" : ""} · {fmtUGX(cart.reduce((s, i) => s + i.price * i.quantity, 0))}
              </span>
              <button onClick={() => setView("cart")} style={{ background: "#FF9800", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                View cart <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Footer */}
          <footer style={{ background: "#1a1a1a", color: "#aaa", textAlign: "center", padding: "24px 16px", marginTop: cartCount > 0 ? 64 : 0 }}>
            <p style={{ margin: 0, fontSize: 13 }}>© {new Date().getFullYear()} Karz Juice · Kampala, Uganda · Fresh • Natural • Made with love 🇺🇬</p>
          </footer>
        </>
      )}

      {view === "checkout" && (
        <>
          <HeroSection cartCount={cartCount} onCartClick={() => setView("cart")} />
          <CheckoutForm cart={cart} onBack={() => setView("cart")} onConfirm={handleConfirmOrder} />
        </>
      )}

      {view === "confirm" && (
        <ConfirmScreen info={customerInfo} cart={cart} onReset={() => { setCart([]); setView("shop"); }} />
      )}
    </div>
  );
}
