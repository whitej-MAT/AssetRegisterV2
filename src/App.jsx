import { useAuth } from "react-oidc-context";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/home/Home";
import ShowItem from "./pages/showItem/ShowItem";
import AddItem from "./pages/addItem/AddItem";

function App() {
  const auth = useAuth();

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.activeNavigator === "signinRedirect") {
    return <div>Redirecting to sign in...</div>;
  }

  if (auth.activeNavigator === "signoutRedirect") {
    return <div>Signing you out...</div>;
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