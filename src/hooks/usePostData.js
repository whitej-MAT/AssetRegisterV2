import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuthContext } from "./useAuthContext";

const useSubmitData = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { auth, selectedPrefix } = useAuthContext(); // 👈 grab the prefix

  const submitData = async (url, payload, method = "post") => {
    setIsSubmitting(true);
    setError(null);
    toast.info("Sending data...");

    try {
      const token = auth.user?.id_token || auth.user?.access_token;
      if (!token) throw new Error("No token found. User may not be authenticated.");

      

      const response = await axios({
        method,
        url,
        data: payload,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-prefix": selectedPrefix || "",
        },
      });

      console.log("Submit response:", response);

      // ✅ Handle both styles of Lambda responses
      const data = response.data;
      const parsedBody =
        typeof data.body === "string"
          ? JSON.parse(data.body)
          : data.body || data;

      if (data.statusCode && data.statusCode >= 400) {
        const message = parsedBody?.message || "An error occurred.";
        toast.error(message);
        throw new Error(message);
      }

      toast.success(parsedBody?.message || "Data submitted successfully!");
      console.log("Response data:", parsedBody);
      return parsedBody;

    } catch (err) {
      setError(err);
      toast.error(err.message || "Request failed.");
      console.error("Submit error:", err);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ return the hook interface
  return { submitData, isSubmitting, error };
};

export default useSubmitData;
