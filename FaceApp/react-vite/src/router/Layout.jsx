import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ModalProvider, Modal } from "../context/Modal";
import { thunkAuthenticate } from "../redux/session";
import Navigation from "../components/Navigation/Navigation";
import BottomPanel from "../components/BottomPanel";



export default function Layout() {
  const dispatch = useDispatch();
  const [isLoaded, setIsLoaded] = useState(false);
  const sessionUser = useSelector((state) => state.session.user);
  const location = useLocation();

  useEffect(() => {
    dispatch(thunkAuthenticate()).then(() => setIsLoaded(true));
  }, [dispatch]);

  const isHome = location.pathname === "/";
  const showBottomPanel = !!sessionUser && !isHome;

  return (
  <>
    <ModalProvider>
      <div className={isHome ? "home-background" : ""}>
        <Navigation />
        {isLoaded && (
          <div className="main-body">
            {showBottomPanel && <BottomPanel />}

            <div className="main-content">
              <Outlet />  {/* Only render child routes here */}
            </div>
          </div>
        )}
        <Modal />
      </div>
    </ModalProvider>
  </>
);
}