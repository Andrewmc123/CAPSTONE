import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ModalProvider, Modal } from "../context/Modal";
import { thunkAuthenticate } from "../redux/session";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import MobileTopBar from "../components/common/MobileTopBar";
import Splash from "../components/common/Splash";
import BirthdayGreeting from "../components/common/BirthdayGreeting";
import "./Layout.css";

const CHROMELESS = ["/login", "/signup", "/home"];
const SPLASH_MIN_MS = 1700;   // keep the launch screen up at least this long

// full-screen, immersive screens that get no mobile app bar
const isImmersive = (path) =>
  path === "/" || path === "/following" || path.startsWith("/video/");

export default function Layout() {
  const dispatch = useDispatch();
  const [authed, setAuthed] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  const [splashGone, setSplashGone] = useState(false);
  const location = useLocation();

  useEffect(() => {
    dispatch(thunkAuthenticate()).then(() => setAuthed(true));
    const t = setTimeout(() => setMinElapsed(true), SPLASH_MIN_MS);
    return () => clearTimeout(t);
  }, [dispatch]);

  // booting until auth resolves AND the minimum splash time has passed
  const booting = !(authed && minElapsed);

  // once booting ends, fade the splash out, then drop it from the DOM
  useEffect(() => {
    if (booting || splashGone) return;
    const t = setTimeout(() => setSplashGone(true), 650);
    return () => clearTimeout(t);
  }, [booting, splashGone]);

  const chromeless = CHROMELESS.includes(location.pathname);

  return (
    <ModalProvider>
      {!splashGone && <Splash fading={!booting} />}
      {authed && (
        <div className="app-shell">
          {!chromeless && <Sidebar />}
          <main className={`app-main ${chromeless ? "chromeless" : ""}`}>
            {!chromeless && !isImmersive(location.pathname) && <MobileTopBar />}
            <Outlet />
          </main>
          {!chromeless && <BottomNav />}
          <Modal />
          <BirthdayGreeting />
        </div>
      )}
    </ModalProvider>
  );
}
