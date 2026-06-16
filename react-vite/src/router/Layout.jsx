import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ModalProvider, Modal } from "../context/Modal";
import { thunkAuthenticate } from "../redux/session";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import "./Layout.css";

const CHROMELESS = ["/login", "/signup", "/home"];

export default function Layout() {
  const dispatch = useDispatch();
  const [isLoaded, setIsLoaded] = useState(false);
  const location = useLocation();

  useEffect(() => {
    dispatch(thunkAuthenticate()).then(() => setIsLoaded(true));
  }, [dispatch]);

  if (!isLoaded) {
    return (
      <div className="app-boot">
        <div className="abln-logo app-boot-logo">Aura</div>
        <div className="abln-logo-sub">You got Aura?</div>
      </div>
    );
  }

  const chromeless = CHROMELESS.includes(location.pathname);

  return (
    <ModalProvider>
      <div className="app-shell">
        {!chromeless && <Sidebar />}
        <main className={`app-main ${chromeless ? "chromeless" : ""}`}>
          <Outlet />
        </main>
        {!chromeless && <BottomNav />}
        <Modal />
      </div>
    </ModalProvider>
  );
}
