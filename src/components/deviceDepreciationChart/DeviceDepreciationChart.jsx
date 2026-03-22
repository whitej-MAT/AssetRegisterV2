// src/components/deviceDepreciationChart/DeviceDepreciationChart.jsx
import React, { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, Tooltip, Legend);

const money = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `£${x.toFixed(2)}`;
};

function parseISODate(d) {
  return new Date(`${d}T00:00:00Z`);
}

function interpolateCurrentValue(points, field, nowDate) {
  if (!Array.isArray(points) || points.length === 0) return null;

  const sorted = [...points].sort((a, b) => parseISODate(a.date) - parseISODate(b.date));
  const now = nowDate;

  const start = parseISODate(sorted[0].date);
  const end = parseISODate(sorted[sorted.length - 1].date);

  if (now <= start) return Number(sorted[0][field]);
  if (now >= end) return Number(sorted[sorted.length - 1][field]);

  for (let i = 0; i < sorted.length - 1; i++) {
    const d0 = parseISODate(sorted[i].date);
    const d1 = parseISODate(sorted[i + 1].date);
    if (now >= d0 && now <= d1) {
      const v0 = Number(sorted[i][field]);
      const v1 = Number(sorted[i + 1][field]);
      const t = (now - d0) / (d1 - d0);
      if (!Number.isFinite(v0) || !Number.isFinite(v1) || !Number.isFinite(t)) return null;
      return v0 + (v1 - v0) * t;
    }
  }
  return null;
}

export default function DeviceDepreciationChart({ depreciation }) {
  const [showSYD, setShowSYD] = useState(true);
  const [showSL, setShowSL] = useState(true);

  const points = useMemo(() => {
    const raw = Array.isArray(depreciation?.points) ? depreciation.points : [];
    return [...raw].sort((a, b) => parseISODate(a.date) - parseISODate(b.date));
  }, [depreciation]);

  const labels = useMemo(() => points.map((p) => p.date), [points]);

  const asOfDate = depreciation?.meta?.asOfDate; // "YYYY-MM-DD"
  const now = useMemo(() => (asOfDate ? parseISODate(asOfDate) : new Date()), [asOfDate]);

  // fractional x position for "today"
  const todayX = useMemo(() => {
    if (points.length === 0) return null;

    const start = parseISODate(points[0].date);
    const end = parseISODate(points[points.length - 1].date);

    if (now <= start) return 0;
    if (now >= end) return points.length - 1;

    for (let i = 0; i < points.length - 1; i++) {
      const d0 = parseISODate(points[i].date);
      const d1 = parseISODate(points[i + 1].date);
      if (now >= d0 && now <= d1) {
        const t = (now - d0) / (d1 - d0);
        return i + t;
      }
    }
    return null;
  }, [points, now]);

  const currentSL = useMemo(
    () => interpolateCurrentValue(points, "straightLineBookValue", now),
    [points, now]
  );
  const currentSYD = useMemo(
    () => interpolateCurrentValue(points, "sydBookValue", now),
    [points, now]
  );

  const chartData = useMemo(() => {
    if (!points.length) return null;

    const sl = points.map((p, i) => ({ x: i, y: Number(p.straightLineBookValue) }));
    const syd = points.map((p, i) => ({ x: i, y: Number(p.sydBookValue) }));

    // compute y-range for today line
    const allY = [...sl, ...syd].map((d) => d.y).filter((v) => Number.isFinite(v));
    const yMin = Math.min(...allY, 0);
    const yMax = Math.max(...allY, 0);

    const datasets = [];

    if (showSL) {
      datasets.push({
        label: "Straight-line",
        font: { weight: "bold", size: 18 },
        backgroundColor: "#a33b32",
        borderColor: "#a33b32",
        data: sl,
        borderWidth: 2,
        pointRadius: 3,
      });
    }

    if (showSYD) {
      datasets.push({
        label: "SYD (Book Value)",
        backgroundColor: "#a33b32",
        borderColor: "#a33b32",
        data: syd,
        borderWidth: 2,
        pointRadius: 3,
      });
    }

    // ✅ Today line as its own dataset (always renders)
    if (Number.isFinite(todayX)) {
      datasets.push({
        label: asOfDate ? `Today (${asOfDate})` : "Today",
        data: [
          { x: todayX, y: yMin },
          { x: todayX, y: yMax },
        ],
        borderColor: "#a33b32",
        borderWidth: 2,
        pointRadius: 0,
        showLine: true,
        // hide from legend + tooltips if you want
        // (legend filtered below)
      });
    }

    return { datasets };
  }, [points, showSL, showSYD, todayX, asOfDate]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      parsing: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            // hide the Today dataset from legend
            filter: (item) => !String(item.text || "").startsWith("Today"),
          },
        },
        tooltip: {
          callbacks: {
            title: (items) => {
              const i = items?.[0]?.parsed?.x;
              if (i == null) return "";
              return labels[Math.round(i)] ?? "";
            },
          },
        },
      },
      scales: {
        x: {
  type: "linear",

  // ✅ keep padding, but align everything
  min: -0.5,
  max: Math.max(0, points.length - 1) + 0.5,

  // ✅ do NOT offset ticks/grid
  offset: false,

  ticks: {
    stepSize: 1,
    precision: 0,          // ✅ ensure integer ticks
    autoSkip: true,
    maxRotation: 0,
    callback: (value) => labels[Math.round(value)] ?? "",
  },

  grid: {
    // ✅ ensures grid lines match tick positions (integers)
    drawTicks: true,
  },

  title: { display: true, text: "Date (every 6 months)", font: { weight: "bold", size: 18 } },
},
        y: {
          beginAtZero: true,
          title: { display: true, text: "Value", font: { weight: "bold", size: 18 } },
          ticks: { callback: (v) => `£${v}` },
        },
      },
    }),
    [labels, points.length]
  );

  if (!chartData) return <div>No depreciation data available.</div>;

  const pctNow = Number(depreciation?.meta?.percentThroughLifeNow);
  const pctText = Number.isFinite(pctNow) ? `${Math.round(pctNow * 100)}%` : "—";

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center", justifyContent: "space-around" }}>
        <div>
          <div style={{ fontSize: 14, opacity: 0.75 }}>Life progress now</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{pctText}</div>
        </div>

        <div>
          <div style={{ fontSize: 14, opacity: 0.75 }}>
            Current Straight-line value{asOfDate ? ` (as of ${asOfDate})` : ""}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{money(currentSL)}</div>
        </div>

        <div>
          <div style={{ fontSize: 14, opacity: 0.75 }}>
            Current SYD value{asOfDate ? ` (as of ${asOfDate})` : ""}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{money(currentSYD)}</div>
        </div>
      </div>

      <div style={{ height: 550, marginTop: 10 }}>
        <Line
          key={`dep-${depreciation?.meta?.purchaseDate}-${depreciation?.meta?.asOfDate}-${depreciation?.points?.length}`}
          data={chartData}
          options={options}
        />
      </div>
    </div>
  );
}