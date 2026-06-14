import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaCamera, FaTrash, FaUserGroup } from "react-icons/fa6";
import { fetchPeople, fetchPersonPhotos, deletePerson } from "../../redux/vault";
import "./Vault.css";

export default function Vault() {
  const dispatch = useDispatch();
  const people = useSelector((s) => s.vault.people);
  const loaded = useSelector((s) => s.vault.loaded);
  const [active, setActive] = useState(null);
  const photos = useSelector((s) => (active ? s.vault.photosByPerson[active.id] : null));
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => { dispatch(fetchPeople()); }, [dispatch]);

  const open = (person) => { setActive(person); dispatch(fetchPersonPhotos(person.id)); };
  const close = () => { setActive(null); setLightbox(null); };

  const removePerson = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Remove this person and their photos from your vault?")) {
      await dispatch(deletePerson(id));
      if (active?.id === id) close();
    }
  };

  // ---- per-person gallery ----
  if (active) {
    return (
      <div className="page vault-page">
        <header className="vault-head">
          <button className="vault-back" onClick={close} aria-label="Back"><FaArrowLeft /></button>
          <h1>{active.name}</h1>
          <Link to="/camera" className="btn btn-ghost"><FaCamera /> Capture</Link>
        </header>

        {photos && photos.length === 0 ? (
          <div className="vault-empty"><p>No photos with {active.name} yet — capture one!</p></div>
        ) : (
          <div className="vault-photo-grid">
            {(photos || []).map((ph) => (
              <button key={ph.id} className="vault-photo" onClick={() => setLightbox(ph)}>
                <img src={ph.image_url} alt={active.name} />
              </button>
            ))}
          </div>
        )}

        {lightbox && (
          <div className="vault-lightbox" onClick={() => setLightbox(null)}>
            <img src={lightbox.image_url} alt="" />
          </div>
        )}
      </div>
    );
  }

  // ---- people grid ----
  return (
    <div className="page vault-page">
      <header className="vault-head">
        <h1>Your People</h1>
        <Link to="/camera" className="btn btn-primary"><FaCamera /> Camera</Link>
      </header>

      {loaded && people.length === 0 ? (
        <div className="vault-empty">
          <FaUserGroup className="vault-empty-icon" />
          <p>No people yet.</p>
          <p className="vault-empty-sub">
            Open the Camera and the app starts learning the faces around you. Name someone once,
            and every future photo files itself under the right friend.
          </p>
          <Link to="/camera" className="btn btn-primary"><FaCamera /> Open Camera</Link>
        </div>
      ) : (
        <div className="vault-people-grid">
          {people.map((p) => (
            <button key={p.id} className="vault-person-card" onClick={() => open(p)}>
              <span className="vault-person-del" onClick={(e) => removePerson(e, p.id)} title="Remove">
                <FaTrash />
              </span>
              <div className="vault-person-cover">
                {p.cover_image
                  ? <img src={p.cover_image} alt={p.name} />
                  : <span>{p.name?.[0]?.toUpperCase()}</span>}
              </div>
              <strong>{p.name}</strong>
              <span className="vault-person-count">
                {p.photo_count} photo{p.photo_count === 1 ? "" : "s"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
