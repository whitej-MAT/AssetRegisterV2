import { useState, useEffect } from "react";
import { useAuth, hasAuthParams } from "react-oidc-context";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext.jsx";

export const AuthProvider = ({ children }) => {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [groups, setGroups] = useState([]);
  const [prefixes, setPrefixes] = useState([]);
  const [selectedPrefix, setSelectedPrefix] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [isAdminPlus, setIsAdminPlus] = useState(false);

  // Redirect unauthenticated users to Cognito,
  // except when they have just logged out.
  useEffect(() => {
    const url = new URL(window.location.href);
    const wasLoggedOut = url.searchParams.get("logged_out") === "1";

    if (wasLoggedOut) {
      url.searchParams.delete("logged_out");
      window.history.replaceState({}, document.title, url.pathname);
      return;
    }

    if (
      !hasAuthParams() &&
      !auth.isLoading &&
      !auth.isAuthenticated &&
      !auth.activeNavigator &&
      !auth.error
    ) {
      auth.signinRedirect();
    }
  }, [
    auth.isLoading,
    auth.isAuthenticated,
    auth.activeNavigator,
    auth.error,
    auth,
  ]);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      setGroups([]);
      setPrefixes([]);
      setSelectedPrefix("");
      setIsAdmin(false);
      setIsAdminPlus(false);
      setIsViewOnly(false);
      return;
    }

    const userGroups = auth.user?.profile?.["cognito:groups"] || [];
    setGroups(userGroups);

    const uniquePrefixes = [...new Set(userGroups.map((g) => g.split("_")[0]))];
    setPrefixes(uniquePrefixes);

    const pathPrefix = location.pathname.split("/")[1];

    if (uniquePrefixes.includes(pathPrefix)) {
      setSelectedPrefix(pathPrefix);
    } else if (!pathPrefix && uniquePrefixes.length > 0) {
      const defaultPrefix = uniquePrefixes[0];
      setSelectedPrefix(defaultPrefix);
      navigate(`/${defaultPrefix}`, { replace: true });
    } else if (!selectedPrefix && uniquePrefixes.length > 0) {
      const defaultPrefix = uniquePrefixes[0];
      setSelectedPrefix(defaultPrefix);
      navigate(`/${defaultPrefix}`, { replace: true });
    }
  }, [
    auth.isAuthenticated,
    auth.user,
    location.pathname,
    navigate,
    selectedPrefix,
  ]);

  useEffect(() => {
    if (selectedPrefix) {
      setIsAdmin(groups.includes(`${selectedPrefix}_Admin`));
      setIsViewOnly(groups.includes(`${selectedPrefix}_Read_Only`));
      setIsAdminPlus(groups.includes(`${selectedPrefix}_Admin_Plus`));
    } else {
      setIsAdmin(false);
      setIsViewOnly(false);
      setIsAdminPlus(false);
    }
  }, [selectedPrefix, groups]);

  useEffect(() => {
    if (auth.isAuthenticated) {
      console.log("ID Token:", auth.user?.id_token);
      console.log("Access Token:", auth.user?.access_token);
    }
  }, [auth.isAuthenticated, auth.user]);

  return (
    <AuthContext.Provider
      value={{
        auth,
        groups,
        prefixes,
        selectedPrefix,
        setSelectedPrefix,
        isAdmin,
        isViewOnly,
        isAdminPlus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};