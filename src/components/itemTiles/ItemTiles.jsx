// ItemTiles.jsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useApiData from "../../hooks/useApiData";
import "./ItemTiles.css";
import { assetMainTiles, equipmentMainTiles } from "./ItemTilesData";

const COLLAPSED_HEIGHT = 60;

function normalizeItemType(itemTypeParam) {
  // Only two valid modes for this UI: asset | device
  return itemTypeParam === "asset" ? "asset" : "device";
}

function toCamelCase(label = "") {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")      // remove special chars
    .split(/\s+/)                    // split by spaces
    .map((word, index) =>
      index === 0
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("");
}

export default function ItemTiles({
  prefix: prefixProp,
  onSelectedTileChange,
  onTilesLoaded,
}) {
  const { prefix: prefixParam, itemType: itemTypeParam } = useParams();
  const navigate = useNavigate();

  const prefix = prefixProp ?? prefixParam ?? "";
  const effectiveItemType = useMemo(
    () => normalizeItemType(itemTypeParam),
    [itemTypeParam]
  );

  // API expects overviewType to be "asset" or "device"
  const overviewType = effectiveItemType;

  const orderedNames = useMemo(() => {
    return overviewType === "asset" ? assetMainTiles : equipmentMainTiles;
  }, [overviewType]);

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const endpoint = useMemo(() => {
    if (!prefix) return "";
    return `${baseUrl}/overview?prefix=${encodeURIComponent(
      prefix
    )}&overviewType=${encodeURIComponent(overviewType)}`;
  }, [baseUrl, prefix, overviewType]);

  const { data, isLoading, isError, error } = useApiData({
    queryKey: ["tileData", prefix, overviewType],
    url: endpoint,
    enabled: !!endpoint,
  });

  // API -> tiles
  const apiTiles = useMemo(() => {
    const items = data?.items ?? [];
    return items.map((item) => ({
      sk: item.SK,
      label: item.displayName,
      labelKey: toCamelCase(item.displayName),
      count: Number(item.count ?? 0),
      isSpecial: false,
    }));
  }, [data]);

  // Special tile: switch route
  const specialTile = useMemo(
    () => ({
      sk: "__SWITCH_TYPE__",
      label: effectiveItemType === "asset" ? "View Devices" : "Back",
      count: null,
      isSpecial: true,
    }),
    [effectiveItemType]
  );

  // Build MAIN tiles in exact order, then OTHER tiles
  const { mainTiles, otherTiles } = useMemo(() => {
    const byKey = new Map(apiTiles.map((t) => [t.labelKey, t]));

    const orderedKeys = orderedNames.map(toCamelCase);
    const mains = orderedKeys.map((k) => byKey.get(k)).filter(Boolean);

    const mainKeySet = new Set(mains.map((t) => t.labelKey));
    const others = apiTiles.filter((t) => !mainKeySet.has(t.labelKey));

    return { mainTiles: mains, otherTiles: others };
  }, [apiTiles, orderedNames]);

  // Selectable tiles exclude the switch tile
  const selectableTiles = useMemo(() => [...mainTiles, ...otherTiles], [mainTiles, otherTiles]);

  // Emit tiles upward (once per change)
  const lastEmitKeyRef = useRef("");
  useEffect(() => {
    if (typeof onTilesLoaded !== "function") return;
    if (isLoading || isError) return;

    const emitKey = selectableTiles
      .map((t) => `${t.sk}|${t.label}|${t.count}`)
      .join("~");

    if (emitKey === lastEmitKeyRef.current) return;
    lastEmitKeyRef.current = emitKey;

    onTilesLoaded(selectableTiles, {
      effectiveItemType, // "asset" | "device"
      overviewType,      // "asset" | "device"
      prefix,
    });
  }, [
    onTilesLoaded,
    selectableTiles,
    effectiveItemType,
    overviewType,
    prefix,
    isLoading,
    isError,
  ]);

  const allTiles = useMemo(() => [specialTile, ...mainTiles, ...otherTiles], [
    specialTile,
    mainTiles,
    otherTiles,
  ]);

  const hasOtherTiles = otherTiles.length > 0;
  const totalRealTiles = mainTiles.length + otherTiles.length;

  const shouldStartCollapsed = useMemo(() => totalRealTiles > 6, [totalRealTiles]);

  const [showAllTiles, setShowAllTiles] = useState(false);

  // reset collapse state when context changes
  useEffect(() => {
    setShowAllTiles(!shouldStartCollapsed);
  }, [shouldStartCollapsed, prefix, overviewType]);

  const tilesToRender = useMemo(() => {
    if (showAllTiles) return allTiles;
    return [specialTile, ...mainTiles];
  }, [showAllTiles, allTiles, specialTile, mainTiles]);



  const handleTileClick = (tile) => {
  if (!tile) return;

  // special tile switches asset/device
  if (tile.isSpecial) {
    const nextType = effectiveItemType === "asset" ? "device" : "asset";
    navigate(`/${encodeURIComponent(prefix)}/${nextType}`);
    return;
  }

  // ✅ include displayName in the URL
  const tileCamel = (tile.label);
  console.log("Tile clicked:", { label: tile.label, camel: tileCamel, sk: tile.sk });
  navigate(
    `/${encodeURIComponent(prefix)}/${encodeURIComponent(
      effectiveItemType
    )}/${encodeURIComponent(tileCamel)}`
  );

  // keep your callback if you still need it
  onSelectedTileChange?.(tile);
};


  // Smooth expand/collapse height animation
  const contentRef = useRef(null);
  const [height, setHeight] = useState(COLLAPSED_HEIGHT);

  useLayoutEffect(() => {
    if (!contentRef.current) return;
    const target = showAllTiles ? contentRef.current.scrollHeight : COLLAPSED_HEIGHT;
    requestAnimationFrame(() => setHeight(target));
  }, [showAllTiles, tilesToRender.length]);

  useEffect(() => {
    const onResize = () => {
      if (!contentRef.current) return;
      setHeight(showAllTiles ? contentRef.current.scrollHeight : COLLAPSED_HEIGHT);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [showAllTiles]);

  // UI states
  if (!prefix) return <div className="Wrapper">Loading site...</div>;
  if (isLoading) return <div className="Wrapper">Loading overview...</div>;

  if (isError) {
    return (
      <div className="Wrapper">
        Failed to load overview tiles.
        <pre style={{ whiteSpace: "pre-wrap" }}>{String(error?.message ?? error)}</pre>
      </div>
    );
  }

  return (
    <div className="Wrapper">
      <div className="TileHeader">
        <button
          type="button"
          className="ShowAllButton"
          onClick={() => setShowAllTiles((p) => !p)}
          disabled={!hasOtherTiles}
          title={!hasOtherTiles ? "No additional tiles to show" : undefined}
        >
          {showAllTiles ? "Show less" : `Show all tiles (${totalRealTiles})`}
        </button>
      </div>

      <div className="TilesOuter" style={{ height: `${height}px` }}>
        <div ref={contentRef} className="TilesInner">
          {tilesToRender.map((tile) => {
            return (
              <div
                key={tile.sk}
                className={`Tile ${tile.isSpecial ? "specialTile" : ""} ${
                  tile.count === 0 ? "emptyTile" : ""
                }`}
                onClick={() => handleTileClick(tile)}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleTileClick(tile);
                }}
              >
                <div className="ItemDisplayName">{tile.label}</div>
                {!tile.isSpecial && <div className="ItemCount">{tile.count}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
