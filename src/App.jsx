
import { useAuth } from "react-oidc-context";
import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Home from "./pages/home/Home";
import ShowItem from "./pages/showItem/ShowItem";
import AddItem from "./pages/addItem/AddItem";

function App() {
  const auth = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (auth.isLoading) return;

    const params = new URLSearchParams(window.location.search);

    // 🛑 Prevent redirect loop on Cognito callback
    if (params.get("code") || params.get("state")) {
      return; 
    }

    if (!auth.isAuthenticated && !auth.error) {
      const fromLogout = params.get("logged_out");

      if (fromLogout === "1") {
        setRedirecting(true);
        auth.signinRedirect();
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.error]);

  if (auth.isLoading || redirecting) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Encountering error... {auth.error.message}</div>;
  }

  
    return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:prefix" element={<Home />} />
        <Route path="/:prefix/:itemType" element={<Home />} />
        <Route path="/:prefix/:itemType/:tileSlug" element={<Home />} />
        <Route path="/:prefix/:itemType/:tileSlug/:serialNumber" element={<Home />} />
        <Route path="/AddItem/:itemType" element={<AddItem />} />
        {/* ✅ explicit ShowItem routes */}
        <Route path="/ShowItem/:deviceType/:serialNumber" element={<ShowItem />} />
      </Routes>
    );
  }
  

export default App;
