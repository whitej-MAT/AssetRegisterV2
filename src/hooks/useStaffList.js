import { useMemo } from "react";
import useApiData from "./useApiData";
import { useAuthContext } from "./useAuthContext";

export default function useStaffList() {
  const { selectedPrefix } = useAuthContext();
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const staffEndpoint = useMemo(() => {
    if (!selectedPrefix) return "";
    return `${baseUrl}/primaryUsers?prefix=${encodeURIComponent(selectedPrefix)}`;
  }, [baseUrl, selectedPrefix]);

  const { data: staffData } = useApiData({
    queryKey: ["staffList", selectedPrefix],
    url: staffEndpoint,
    enabled: !!staffEndpoint,
  });

  const dataPU = staffData?.items ?? [];

  const dataPUWithNone = useMemo(() => {
    const hasNone = dataPU.some(
      (u) => String(u?.email ?? "").toLowerCase().trim() === "none"
    );
    if (hasNone) return dataPU;
    return [{ id: "None", email: "None" }, ...dataPU];
  }, [dataPU]);

  const staffByEmail = useMemo(() => {
    const map = new Map();
    for (const u of dataPUWithNone) {
      const email = String(u?.email ?? "").trim().toLowerCase();
      if (email) map.set(email, u.id);
    }
    return map;
  }, [dataPUWithNone]);

  return { dataPUWithNone, staffByEmail };
}
