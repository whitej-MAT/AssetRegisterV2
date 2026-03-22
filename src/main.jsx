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
  authority: "https://cognito-idp.eu-west-2.amazonaws.com/eu-west-2_oPM5UEmul",
  client_id: "1mam54gmn5p75g2u9fafcts8sm",
  redirect_uri: "http://localhost:5173",
  response_type: "code",
  scope: "email openid phone",
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