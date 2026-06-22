import { useState } from "react";
import { useSelector } from "react-redux";
import {
  FaXmark, FaMinus, FaPlus, FaTrash, FaBagShopping, FaArrowLeft, FaLock, FaCircleCheck,
} from "react-icons/fa6";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";
import { useCart, setQty, removeFromCart, clearCart } from "../../utils/cart";

const money = (c) => `$${((c || 0) / 100).toFixed(2)}`;
const FREE_SHIP = 5000;
const FLAT_SHIP = 599;

export default function CartModal({ startStep = "cart" }) {
  const { setModalContent, closeModal } = useModal();
  const user = useSelector((s) => s.session.user);
  const items = useCart();
  const [step, setStep] = useState(startStep === "checkout" && items.length ? "checkout" : "cart");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  const [ship, setShip] = useState({ name: "", address: "", city: "", state: "", zip: "" });
  const [card, setCard] = useState({ number: "", exp: "", cvc: "", name: "" });

  const subtotal = items.reduce((n, i) => n + (i.price_cents || 0) * i.qty, 0);
  const shipping = subtotal === 0 ? 0 : subtotal >= FREE_SHIP ? 0 : FLAT_SHIP;
  const total = subtotal + shipping;

  const goCheckout = () => {
    if (!user) return setModalContent(<LoginFormModal />);
    if (!items.length) return;
    setError("");
    setStep("checkout");
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    setError("");
    for (const [k, label] of [["name", "name"], ["address", "address"], ["city", "city"], ["state", "state"], ["zip", "ZIP"]]) {
      if (!ship[k].trim()) return setError(`Please enter your shipping ${label}.`);
    }
    const digits = card.number.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) return setError("Enter a valid card number.");
    if (!/^\d{2}\/\d{2}$/.test(card.exp.trim())) return setError("Enter card expiry as MM/YY.");
    if (!/^\d{3,4}$/.test(card.cvc.trim())) return setError("Enter the 3–4 digit security code.");

    setBusy(true);
    const res = await fetch("/api/shop/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        items: items.map((i) => ({ product_id: i.product_id, qty: i.qty })),
        shipping: ship,
        card_last4: digits.slice(-4),
      }),
    });
    setBusy(false);
    if (res.ok) {
      const placed = await res.json();
      clearCart();
      setOrder(placed);
      setStep("done");
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Could not place your order.");
    }
  };

  // ---------- confirmation ----------
  if (step === "done" && order) {
    return (
      <div className="cart-modal">
        <button className="pm-close" onClick={closeModal} aria-label="Close"><FaXmark /></button>
        <div className="cart-done">
          <FaCircleCheck className="cart-done-icon" />
          <h2>Order confirmed!</h2>
          <p className="cart-done-sub">Order <strong>#{order.id}</strong> — {money(order.total_cents)} charged{order.card_last4 ? ` to ••••${order.card_last4}` : ""}.</p>
          <p className="cart-done-ship">Shipping to {order.ship_name}, {order.ship_address}, {order.ship_city} {order.ship_state} {order.ship_zip}</p>
          <div className="cart-done-items">
            {order.items.map((i) => (
              <div key={i.product_id} className="cart-done-item">
                <span>{i.qty}× {i.title}</span>
                <span>{money(i.price_cents * i.qty)}</span>
              </div>
            ))}
          </div>
          <button className="btn btn-primary cart-checkout-btn" onClick={closeModal}>Continue shopping</button>
          <p className="pm-demo">Demo order — no real payment was taken.</p>
        </div>
      </div>
    );
  }

  // ---------- checkout ----------
  if (step === "checkout") {
    return (
      <div className="cart-modal">
        <div className="cart-head">
          <button className="cart-back" onClick={() => setStep("cart")} aria-label="Back"><FaArrowLeft /></button>
          <h2>Checkout</h2>
          <button className="pm-close" onClick={closeModal} aria-label="Close"><FaXmark /></button>
        </div>
        <form className="cart-checkout" onSubmit={placeOrder}>
          <h3>Shipping</h3>
          <input className="input" placeholder="Full name" value={ship.name} onChange={(e) => setShip({ ...ship, name: e.target.value })} />
          <input className="input" placeholder="Address" value={ship.address} onChange={(e) => setShip({ ...ship, address: e.target.value })} />
          <div className="cart-row3">
            <input className="input" placeholder="City" value={ship.city} onChange={(e) => setShip({ ...ship, city: e.target.value })} />
            <input className="input" placeholder="State" value={ship.state} onChange={(e) => setShip({ ...ship, state: e.target.value })} />
            <input className="input" placeholder="ZIP" value={ship.zip} onChange={(e) => setShip({ ...ship, zip: e.target.value })} />
          </div>

          <h3>Payment <span className="cart-demo-badge"><FaLock /> Demo — no real charge</span></h3>
          <input className="input" placeholder="Name on card" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
          <input className="input" inputMode="numeric" placeholder="Card number" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
          <div className="cart-row2">
            <input className="input" placeholder="MM/YY" value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} />
            <input className="input" inputMode="numeric" placeholder="CVC" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} />
          </div>

          <div className="cart-summary">
            <div><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div><span>Shipping</span><span>{shipping === 0 ? "Free" : money(shipping)}</span></div>
            <div className="cart-total"><span>Total</span><span>{money(total)}</span></div>
          </div>

          {error && <p className="cart-error">{error}</p>}
          <button className="btn btn-primary cart-checkout-btn" type="submit" disabled={busy}>
            {busy ? "Placing order…" : `Pay ${money(total)}`}
          </button>
        </form>
      </div>
    );
  }

  // ---------- cart ----------
  return (
    <div className="cart-modal">
      <div className="cart-head">
        <h2><FaBagShopping /> Your cart</h2>
        <button className="pm-close" onClick={closeModal} aria-label="Close"><FaXmark /></button>
      </div>

      {items.length === 0 ? (
        <div className="cart-empty">
          <FaBagShopping />
          <p>Your cart is empty.</p>
          <button className="btn btn-primary" onClick={closeModal}>Browse the shop</button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {items.map((i) => (
              <div key={i.product_id} className="cart-item">
                <div className="cart-item-img">
                  {i.image_url ? <img src={i.image_url} alt={i.title} /> : <FaBagShopping />}
                </div>
                <div className="cart-item-info">
                  <strong>{i.title}</strong>
                  <span>{money(i.price_cents)}</span>
                </div>
                <div className="cart-item-right">
                  <div className="cart-qty">
                    <button onClick={() => setQty(i.product_id, i.qty - 1)} aria-label="Less"><FaMinus /></button>
                    <strong>{i.qty}</strong>
                    <button onClick={() => setQty(i.product_id, i.qty + 1)} aria-label="More"><FaPlus /></button>
                  </div>
                  <button className="cart-remove" onClick={() => removeFromCart(i.product_id)} aria-label="Remove"><FaTrash /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div><span>Shipping</span><span>{shipping === 0 ? "Free" : money(shipping)}</span></div>
            <div className="cart-total"><span>Total</span><span>{money(total)}</span></div>
          </div>
          {subtotal < FREE_SHIP && subtotal > 0 && (
            <p className="cart-freeship">Add {money(FREE_SHIP - subtotal)} more for free shipping 🚚</p>
          )}

          <button className="btn btn-primary cart-checkout-btn" onClick={goCheckout}>
            {user ? "Checkout" : "Log in to checkout"} · {money(total)}
          </button>
        </>
      )}
    </div>
  );
}
