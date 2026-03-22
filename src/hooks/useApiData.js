import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuthContext } from "./useAuthContext"; // ✅ correct

function useApiData({ queryKey, url, enabled = true, itemSerialNumber }) {
  const { auth, selectedPrefix } = useAuthContext();
  const token = auth.user?.id_token;

  return useQuery({
    queryKey: [...queryKey, selectedPrefix, itemSerialNumber], // ✅ include serial number
    queryFn: async () => {
      if (!token) throw new Error("No token found.");
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-prefix": selectedPrefix || "",
        },
      });
      return response.data;
    },
    enabled: enabled && !!selectedPrefix && !!url,
  });
}

export default useApiData;
