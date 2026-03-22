// src/hooks/useAuthContext.js
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

export const useAuthContext = () => useContext(AuthContext);

