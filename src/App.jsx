
import { useAuth } from "react-oidc-context";
import { Routes, Route } from "react-router-dom";
<<<<<<< HEAD
import { useEffect, useState } from "react";
=======
>>>>>>> d609ab2 (Fix Cognito auth redirect and state issue)
import Home from "./pages/home/Home";
import ShowItem from "./pages/showItem/ShowItem";
import AddItem from "./pages/addItem/AddItem";

function App() {
  const auth = useAuth();

<<<<<<< HEAD
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

=======
  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.activeNavigator === "signinRedirect") {
    return <div>Redirecting to sign in...</div>;
  }

  if (auth.activeNavigator === "signoutRedirect") {
    return <div>Signing you out...</div>;
  }

>>>>>>> d609ab2 (Fix Cognito auth redirect and state issue)
  if (auth.error) {
    return <div>Encountering error... {auth.error.message}</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/:prefix" element={<Home />} />
      <Route path="/:prefix/:itemType" element={<Home />} />
      <Route path="/:prefix/:itemType/:tileSlug" element={<Home />} />
      <Route
        path="/:prefix/:itemType/:tileSlug/:serialNumber"
        element={<Home />}
      />
      <Route path="/AddItem/:itemType" element={<AddItem />} />
      <Route
        path="/ShowItem/:deviceType/:serialNumber"
        element={<ShowItem />}
      />
    </Routes>
  );
}

export default App;