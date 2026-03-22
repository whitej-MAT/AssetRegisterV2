// TableHeaderBar.jsx
import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useApiData from "../../hooks/useApiData";
import ReusableTable from "../reusableTable/ReusableTable.jsx";
import "./TableHeaderBar.css";
import DatalistInput from "../dataList/Datalist.jsx";
import DropDownBox from "../dropDownBox/DropDownBox";
import HEADER_UI_CONFIG from "./tableHeaderBarConfig.js";
import { toast } from "react-toastify";
import { useAuthContext } from "../../hooks/useAuthContext.js";

// ---------- helpers ----------
function normalizeTileSlug(slug = "") {
  return String(slug)
    .replace(/[-_]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/\s+/g, " ");
}

function toTitleCase(s = "") {
  return String(s).replace(/\b\w/g, (c) => c.toUpperCase());
}

function cleanLocation(value = "") {
  return String(value).replace(/\s*\(\d+\)\s*$/, "").trim();
}

const MATCH_OPTIONS = [
  { value: "contains", label: "Contains" },
  { value: "equals", label: "Equals" },
  { value: "greater than or equal to", label: "Greater than or equal to" },
  { value: "less than or equal to", label: "Less than or equal to" },
];

const MATCH_TO_API = {
  contains: "CONTAINS",
  equals: "EQUALS",
  "greater than or equal to": "GTE",
  "less than or equal to": "LTE",
};

export default function TableHeaderBar() {
  const {isAdmin, isViewOnly, isAdminPlus} = useAuthContext();
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  const {
    prefix: prefixParam,
    itemType: itemTypeParam,
    tileSlug: tileSlugParam,
  } = useParams();

  const itemType = useMemo(
    () => (itemTypeParam ? itemTypeParam.trim().toUpperCase() : ""),
    [itemTypeParam]
  );

  const deviceTypeDisplay = useMemo(() => {
    if (!tileSlugParam) return "";
    return toTitleCase(normalizeTileSlug(tileSlugParam));
  }, [tileSlugParam]);

  const deviceTypeKey = useMemo(
    () => normalizeTileSlug(tileSlugParam).toUpperCase(),
    [tileSlugParam]
  );

  const deviceTypeForApi = useMemo(() => {
    if (!deviceTypeDisplay) return "";
    return deviceTypeDisplay.trim().toUpperCase();
  }, [deviceTypeDisplay]);

  const ui = useMemo(
    () => HEADER_UI_CONFIG[deviceTypeKey] || HEADER_UI_CONFIG.DEFAULT,
    [deviceTypeKey]
  );
  console.log("UI config for device type:", deviceTypeKey, ui);

  const storageKey = useMemo(() => {
    return `tableState:${prefixParam || ""}:${itemType || ""}:${deviceTypeForApi || ""}`;
  }, [prefixParam, itemType, deviceTypeForApi]);

  const [hasHydrated, setHasHydrated] = useState(false);

  const [activeQuery, setActiveQuery] = useState(null);
  const [attributeName, setAttributeName] = useState("");
  const [matchType, setMatchType] = useState("contains");
  const [attributeValue, setAttributeValue] = useState("");
  const [location, setLocation] = useState("");
  const [isWorking, setIsWorking] = useState("");
  const [localFilter, setLocalFilter] = useState("");
  const [visibleRowCount, setVisibleRowCount] = useState(0);
  console.log("Initial visible row count:", visibleRowCount);

  const [nextToken, setNextToken] = useState(null);
  const [prevTokens, setPrevTokens] = useState([]);
  const [currentToken, setCurrentToken] = useState(null);

  const [allLocations, setAllLocations] = useState([]);

  useEffect(() => {
    setHasHydrated(false);

    if (!storageKey) {
      setHasHydrated(true);
      return;
    }

    try {
      const saved = sessionStorage.getItem(storageKey);

      if (saved) {
        const parsed = JSON.parse(saved);

        setActiveQuery(parsed.activeQuery ?? null);
        setAttributeName(parsed.attributeName ?? "");
        setMatchType(parsed.matchType ?? "contains");
        setAttributeValue(parsed.attributeValue ?? "");
        setLocation(parsed.location ?? "");
        setIsWorking(parsed.isWorking ?? "");
        setLocalFilter(parsed.localFilter ?? "");
        setCurrentToken(parsed.currentToken ?? null);
        setPrevTokens(parsed.prevTokens ?? []);
      } else {
        setActiveQuery(null);
        setAttributeName("");
        setMatchType("contains");
        setAttributeValue("");
        setLocation("");
        setIsWorking("");
        setLocalFilter("");
        setCurrentToken(null);
        setPrevTokens([]);
      }

      setNextToken(null);
      setVisibleRowCount(0);
    } catch (err) {
      console.error("Failed to restore table state", err);
    } finally {
      setHasHydrated(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!ui.showLocation) {
      setLocation("");
    }

    if (!ui.showIsWorking) {
      setIsWorking("");
    }
  }, [ui.showLocation, ui.showIsWorking, hasHydrated]);
  console.log("UI config for this tile:", ui);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!storageKey) return;

    const stateToSave = {
      activeQuery,
      attributeName,
      matchType,
      attributeValue,
      location,
      isWorking,
      localFilter,
      currentToken,
      prevTokens,
    };

    sessionStorage.setItem(storageKey, JSON.stringify(stateToSave));
  }, [
    hasHydrated,
    storageKey,
    activeQuery,
    attributeName,
    matchType,
    attributeValue,
    location,
    isWorking,
    localFilter,
    currentToken,
    prevTokens,
  ]);

  const browseUrl = useMemo(() => {
    if (!prefixParam || !itemType || !deviceTypeForApi) return "";

    const params = new URLSearchParams({
      prefix: prefixParam,
      itemType,
      deviceType: deviceTypeForApi,
      limit: "100",
    });

    if (currentToken) {
      params.set("nextToken", currentToken);
    }

    return `${baseUrl}/items?${params.toString()}`;
  }, [baseUrl, prefixParam, itemType, deviceTypeForApi, currentToken]);

  const searchUrl = useMemo(() => {
    if (!activeQuery) return "";
    if (!prefixParam || !itemType || !deviceTypeForApi) return "";

    const params = new URLSearchParams({
      prefix: prefixParam,
      itemType,
      deviceType: deviceTypeForApi,
      limit: "100",
    });

    if (currentToken) {
      params.set("nextToken", currentToken);
    }

    if (activeQuery.attributeName) {
      params.set("attributeName", activeQuery.attributeName);
    }
    if (activeQuery.attributeValue) {
      params.set("attributeValue", activeQuery.attributeValue);
    }
    if (activeQuery.matchType) {
      params.set("matchType", activeQuery.matchType);
    }
    if (activeQuery.location) {
      params.set("location", activeQuery.location);
    }
    if (activeQuery.isWorking) {
      params.set("isWorking", activeQuery.isWorking);
    }

    return `${baseUrl}/items/search?${params.toString()}`;
  }, [baseUrl, activeQuery, prefixParam, itemType, deviceTypeForApi, currentToken]);

  const requestUrl = activeQuery ? searchUrl : browseUrl;

  const { data, isLoading, isError, error } = useApiData({
    queryKey: ["tableData", requestUrl],
    url: requestUrl,
    enabled: !!requestUrl,
  });

  const searchAttributes = useMemo(() => data?.searchAttributes ?? [], [data]);
  const tableRows = useMemo(() => data?.searchableItems?.items ?? [], [data]);
  const tableHeadings = useMemo(() => data?.tableHeaders ?? [], [data]);

  useEffect(() => {
    const nextLocations =
      data?.locations?.items?.map(
        (loc) => `${loc.displayName} (${loc.count})`
      ).filter(Boolean) ?? [];

    if (nextLocations.length > 0) {
      setAllLocations(nextLocations);
    }
  }, [data]);

  useEffect(() => {
    setNextToken(data?.searchableItems?.nextToken ?? null);
  }, [data]);

  const canSearch = useMemo(() => {
    if (attributeName.trim() && !attributeValue.trim()) return false;
    return true;
  }, [attributeName, attributeValue]);

  const handleSearch = useCallback(() => {
    if (!canSearch) return;

    const matchApi = MATCH_TO_API[matchType] || MATCH_TO_API.contains;

    setCurrentToken(null);
    setNextToken(null);
    setPrevTokens([]);

    setActiveQuery({
      attributeName: attributeName.trim(),
      attributeValue: attributeValue.trim(),
      matchType: matchApi,
      location: ui.showLocation ? cleanLocation(location) : "",
      isWorking: ui.showIsWorking ? isWorking || "" : "",
    });
  }, [
    canSearch,
    attributeName,
    attributeValue,
    matchType,
    location,
    isWorking,
    ui.showLocation,
    ui.showIsWorking,
  ]);

  const handleClear = useCallback(() => {
    setAttributeName("");
    setMatchType("contains");
    setAttributeValue("");
    setLocation("");
    setIsWorking("");
    setLocalFilter("");
    setActiveQuery(null);
    setVisibleRowCount(0);
    setCurrentToken(null);
    setNextToken(null);
    setPrevTokens([]);

    sessionStorage.removeItem(storageKey);
  }, [storageKey]);

  const handleAddNewItem = useCallback(() => {
    navigate(`/AddItem/${tileSlugParam}`);
  }, [navigate, tileSlugParam]);

  const [shouldSync, setShouldSync] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  const syncUrl = useMemo(() => {
    if (!prefixParam || !itemType || !deviceTypeForApi) return "";

    const params = new URLSearchParams({
      prefix: prefixParam,
      itemType,
      deviceType: deviceTypeForApi,
    });

    return `${baseUrl}/syncWithMS?${params.toString()}`;
  }, [baseUrl, prefixParam, itemType, deviceTypeForApi]);

  const {
    data: syncData,
    isLoading: isSyncLoading,
    isError: isSyncError,
    error: syncError,
  } = useApiData({
    queryKey: ["syncData", syncUrl],
    url: syncUrl,
    enabled: shouldSync && !!syncUrl,
  });

const handleSyncMicrosoft = useCallback(() => {
  setSyncMessage("");
  setShouldSync(true);
}, []);

useEffect(() => {
  if (!shouldSync) return;

  if (syncData) {
    console.log("Sync successful:", syncData);

    toast.success(syncData?.message || "Sync with Microsoft successful!");

    setShouldSync(false);
  }
}, [syncData, shouldSync]);

useEffect(() => {
  if (!shouldSync) return;

  if (isSyncError) {
    console.error("Sync failed:", syncError);

    const message = String(syncError?.message ?? "Sync failed");

    toast.error(message);
    setSyncMessage(message);

    setShouldSync(false);
  }
}, [isSyncError, syncError, shouldSync]);

useEffect(() => {
  if (!localFilter.trim()) {
    setVisibleRowCount(tableRows.length);
  }
}, [tableRows, localFilter]);

  const handleNextPage = useCallback(() => {
    if (!nextToken) return;
    setPrevTokens((prev) => [...prev, currentToken]);
    setCurrentToken(nextToken);
  }, [nextToken, currentToken]);

  const handlePrevPage = useCallback(() => {
    setPrevTokens((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      const previousToken = copy.pop();
      setCurrentToken(previousToken || null);
      return copy;
    });
  }, []);

  return (
    <>
      <div className="HeaderBar">
        <div className="HeaderTitle">{deviceTypeDisplay || "Select Tile"}</div>

        <div className="RowCountBadge">{visibleRowCount}</div>

        <DatalistInput
          className="HeaderInput"
          value={attributeName}
          onChange={setAttributeName}
          options={searchAttributes}
          placeholder={isLoading ? "Loading..." : "Attribute (type or pick)"}
          disabled={isLoading || searchAttributes.length === 0}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
        />

        <DropDownBox
          className="HeaderSelect"
          value={matchType}
          onChange={setMatchType}
          options={MATCH_OPTIONS}
          disabled={isLoading}
        />

        <input
          className="HeaderInput"
          type="text"
          placeholder="Enter value..."
          value={attributeValue}
          onChange={(e) => setAttributeValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
        />

        {ui.showLocation && (
          <DatalistInput
            className="HeaderInput"
            value={location}
            onChange={setLocation}
            options={allLocations}
            placeholder="Location..."
            disabled={isLoading && allLocations.length === 0}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
        )}

        {ui.showIsWorking && (
          <DropDownBox
            className="HeaderSelect"
            value={isWorking}
            onChange={setIsWorking}
            options={[
              { value: "", label: "Is Working (All)" },
              { value: "TRUE", label: "True" },
              { value: "FALSE", label: "False" },
            ]}
          />
        )}

        <button
          className="HeaderButton"
          onClick={handleSearch}
          type="button"
          disabled={!canSearch}
        >
          Search
        </button>

        <button className="HeaderButton" onClick={handleClear} type="button">
          Clear
        </button>

        <input
          className="HeaderInput"
          type="text"
          placeholder="Filter results..."
          value={localFilter}
          onChange={(e) => setLocalFilter(e.target.value)}
        />

        {ui.showAddNewItem && !isViewOnly && (
        <button className="HeaderButton" type="button" onClick={handleAddNewItem}>
          Add new item
        </button>
      )}

        {ui.showSyncWithMicrosoft && !isViewOnly && (
          <button
            className="HeaderButton"
            type="button"
            onClick={handleSyncMicrosoft}
            disabled={isSyncLoading}
          >
            {isSyncLoading ? "Syncing..." : "Sync with Microsoft"}
          </button>
        )}

        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <button
            className="HeaderButton"
            type="button"
            onClick={handlePrevPage}
            disabled={prevTokens.length === 0 || isLoading}
            title="Previous page"
          >
            ←
          </button>

          <button
            className="HeaderButton"
            type="button"
            onClick={handleNextPage}
            disabled={!nextToken || isLoading}
            title="Next page"
          >
            →
          </button>
        </div>
      </div>

      {isError && (
        <div style={{ marginTop: 8 }}>
          <p>Failed to load data.</p>
          <pre style={{ whiteSpace: "pre-wrap" }}>{String(error?.message ?? error)}</pre>
        </div>
      )}

      {!isError && (
        <ReusableTable
          tableRows={tableRows}
          tableHeadings={tableHeadings}
          globalSearch={localFilter}
          onVisibleRowCountChange={setVisibleRowCount}
        />
      )}

      {syncMessage && (
        <div style={{ marginTop: 8 }}>
          <pre style={{ whiteSpace: "pre-wrap" }}>{syncMessage}</pre>
        </div>
      )}
    </>
  );
}