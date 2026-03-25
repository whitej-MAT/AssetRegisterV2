import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthProvider.jsx";
import { AuthProvider as OIDCAuthProvider } from "react-oidc-context";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";

const cognitoAuthConfig = {
  // Use your Cognito hosted UI / managed login domain here, not cognito-idp.amazonaws.com
  // Example:
  // authority: "https://your-domain.auth.eu-west-2.amazoncognito.com",
  authority: import.meta.env.VITE_COGNITO_AUTHORITY,

  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
  redirect_uri: import.meta.env.VITE_COGNITO_REDIRECT_URI,
  post_logout_redirect_uri: import.meta.env.VITE_COGNITO_LOGOUT_URI,
  response_type: "code",
  scope: "openid email phone",

  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

const queryClient = new QueryClient();
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <OIDCAuthProvider {...cognitoAuthConfig}>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="AppWrapper">
              <App />
            </div>
          </QueryClientProvider>
        </AuthProvider>
      </OIDCAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);