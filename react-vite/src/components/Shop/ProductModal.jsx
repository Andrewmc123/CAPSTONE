import { useState } from "react";
import { Link } from "react-router-dom";
import { FaBagShopping, FaXmark, FaMinus, FaPlus, FaCartShopping, FaBolt } from "react-icons/fa6";
import { useModal } from "../../context/Modal";
import { addToCart } from "../../utils/cart";
import CartModal from "./CartModal";

const money = (c) => `$${((c || 0) / 100).toFixed(2)}`;

export default function ProductModal({ product }) {
  const { setModalContent, closeModal } = useModal();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const add = () => {
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };
  const buyNow = () => {
    addToCart(product, qty);
    setModalContent(<CartModal startStep="checkout" />);
  };

  return (
    <div className="product-modal">
      <button className="pm-close" onClick={closeModal} aria-label="Close"><FaXmark /></button>

      <div className="pm-media">
        {product.image_url
          ? <img src={product.image_url} alt={product.title} />
          : <div className="pm-noimg"><FaBagShopping /></div>}
      </div>

      <div className="pm-body">
        {product.category && <span className="pm-cat">{product.category}</span>}
        <h2 className="pm-title">{product.title}</h2>
        <p className="pm-price">{money(product.price_cents)}</p>

        {product.seller && (
          <Link to={`/users/${product.seller.id}`} className="pm-seller" onClick={closeModal}>
            <img className="avatar" width={24} height={24} src={product.seller.profile_img || `https://i.pravatar.cc/40?u=${product.seller.id}`} alt="" />
            Sold by @{product.seller.username}
          </Link>
        )}

        {product.description && <p className="pm-desc">{product.description}</p>}

        <div className="pm-qty">
          <span>Quantity</span>
          <div className="pm-qty-ctrl">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Less"><FaMinus /></button>
            <strong>{qty}</strong>
            <button onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="More"><FaPlus /></button>
          </div>
        </div>

        <div className="pm-actions">
          <button className="btn btn-ghost pm-add" onClick={add}>
            <FaCartShopping /> {added ? "Added ✓" : "Add to cart"}
          </button>
          <button className="btn btn-primary pm-buy" onClick={buyNow}>
            <FaBolt /> Buy now
          </button>
        </div>

        {product.link && (
          <a className="pm-extlink" href={product.link} target="_blank" rel="noopener noreferrer">
            Or buy from the seller’s own link ↗
          </a>
        )}
        <p className="pm-demo">Demo checkout — no real payment is taken.</p>
      </div>
    </div>
  );
}
