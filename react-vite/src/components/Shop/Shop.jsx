import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaBagShopping, FaPlus, FaTag, FaXmark, FaTrash } from "react-icons/fa6";
import { useModal } from "../../context/Modal";
import LoginFormModal from "../LoginFormModal";
import "./Shop.css";

const CATEGORIES = ["all", "fashion", "beauty", "tech", "art", "food", "home", "music", "other"];

function money(cents) {
  return `$${((cents || 0) / 100).toFixed(2)}`;
}

export default function Shop() {
  const user = useSelector((s) => s.session.user);
  const { setModalContent } = useModal();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selling, setSelling] = useState(false);

  const load = (cat = category) => {
    setLoading(true);
    fetch(`/api/shop/?category=${cat}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setProducts(d.products || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(category); }, [category]);

  const onSellClick = () => {
    if (!user) return setModalContent(<LoginFormModal />);
    setSelling(true);
  };

  const onCreated = (product) => {
    setSelling(false);
    setProducts((prev) => [product, ...prev]);
  };

  const onDelete = async (id) => {
    const res = await fetch(`/api/shop/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="page shop-page">
      <header className="shop-head">
        <div>
          <h1><FaBagShopping /> Shop</h1>
          <p className="text-dim">Discover and sell with the community — your storefront, your hustle.</p>
        </div>
        <button className="btn btn-primary shop-sell-btn" onClick={onSellClick}>
          <FaPlus /> Sell something
        </button>
      </header>

      <div className="shop-cats">
        {CATEGORIES.map((c) => (
          <button key={c} className={`chip ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>
            {c[0].toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {selling && <SellForm onClose={() => setSelling(false)} onCreated={onCreated} />}

      {loading ? (
        <div className="shop-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shop-card skeleton" style={{ height: 230 }} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="shop-empty">
          <FaBagShopping />
          <p>No products here yet.</p>
          <button className="btn btn-primary" onClick={onSellClick}>Be the first to sell</button>
        </div>
      ) : (
        <div className="shop-grid">
          {products.map((p) => (
            <article key={p.id} className="shop-card">
              <div className="shop-card-media">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} loading="lazy" />
                ) : (
                  <div className="shop-card-noimg"><FaBagShopping /></div>
                )}
                <span className="shop-card-price">{money(p.price_cents)}</span>
                {user && p.seller_id === user.id && (
                  <button className="shop-card-del" onClick={() => onDelete(p.id)} aria-label="Delete listing">
                    <FaTrash />
                  </button>
                )}
              </div>
              <div className="shop-card-body">
                <h3>{p.title}</h3>
                {p.description && <p className="shop-card-desc">{p.description}</p>}
                <div className="shop-card-foot">
                  {p.seller && (
                    <Link to={`/users/${p.seller.id}`} className="shop-seller">
                      <img className="avatar" width={22} height={22} src={p.seller.profile_img || `https://i.pravatar.cc/40?u=${p.seller.id}`} alt="" />
                      @{p.seller.username}
                    </Link>
                  )}
                  {p.category && <span className="shop-cat-tag"><FaTag /> {p.category}</span>}
                </div>
                {p.link && (
                  <a className="btn btn-primary shop-buy" href={p.link} target="_blank" rel="noopener noreferrer">
                    Buy now
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function SellForm({ onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image_url, setImageUrl] = useState("");
  const [category, setCategory] = useState("fashion");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError("Give your product a title.");
    setBusy(true);
    setError("");
    const res = await fetch("/api/shop/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title, price: parseFloat(price) || 0, description, image_url, category, link }),
    });
    setBusy(false);
    if (res.ok) {
      onCreated(await res.json());
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Could not list product.");
    }
  };

  return (
    <form className="shop-form fade-in" onSubmit={submit}>
      <div className="shop-form-head">
        <h2>List a product</h2>
        <button type="button" className="shop-form-close" onClick={onClose} aria-label="Close"><FaXmark /></button>
      </div>
      <div className="shop-form-grid">
        <label>Title<input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Vintage denim jacket" maxLength={120} /></label>
        <label>Price (USD)<input className="input" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="29.99" /></label>
      </div>
      <label>Image URL<input className="input" value={image_url} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://… (or paste an /images/ path)" /></label>
      <div className="shop-form-grid">
        <label>Category
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.filter((c) => c !== "all").map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>Buy link (optional)<input className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" /></label>
      </div>
      <label>Description<textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell buyers what makes it special." /></label>
      {error && <p className="shop-form-error">{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Listing…" : "Post listing 🛍️"}</button>
    </form>
  );
}
