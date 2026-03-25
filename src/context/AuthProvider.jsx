import { useState, useEffect } from "react";
import { useAuth, hasAuthParams } from "react-oidc-context";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext.jsx";

const LOGOUT_REDIRECT_FLAG = "app_logout_redirect";
const LOGOUT_REDIRECT_DELAY_MS = 1200;

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

  useEffect(() => {
    const url = new URL(window.location.href);
    const wasLoggedOut = url.searchParams.get("logged_out") === "1";
    const logoutRedirectPending =
      sessionStorage.getItem(LOGOUT_REDIRECT_FLAG) === "1";

    if (wasLoggedOut) {
      sessionStorage.setItem(LOGOUT_REDIRECT_FLAG, "1");
      url.searchParams.delete("logged_out");
      window.history.replaceState(
        {},
        document.title,
        `${url.pathname}${url.search}${url.hash}`
      );
      return;
    }

    if (
      logoutRedirectPending &&
      !hasAuthParams() &&
      !auth.isLoading &&
      !auth.isAuthenticated &&
      !auth.activeNavigator
    ) {
      const timeoutId = window.setTimeout(() => {
        auth.signinRedirect();
      }, LOGOUT_REDIRECT_DELAY_MS);

      return () => window.clearTimeout(timeoutId);
    }

    if (
      !logoutRedirectPending &&
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
    if (auth.isAuthenticated) {
      sessionStorage.removeItem(LOGOUT_REDIRECT_FLAG);
    }
  }, [auth.isAuthenticated]);

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