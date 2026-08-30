import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import { Pedometer } from "expo-sensors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useRef, useEffect } from "react";
import {
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Switch,
  Alert,
  TextInput,
} from "react-native";
import {
  useFonts,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Line as SvgLine,
  G,
  Rect,
  ClipPath,
} from "react-native-svg";
import * as d3 from "d3-shape";
import * as Haptics from "expo-haptics";

const { width: W } = Dimensions.get("window");

// ─── TOKENS ────────────────────────────────────────────────────────────────
const C = {
  bg: "#000000",
  card: "rgba(255, 255, 255, 0.05)", // Glassy translucent
  cardBorder: "rgba(255, 255, 255, 0.12)", // Thin crisp glass edge
  text: "#ffffff",
  muted: "#808084",
  lime: "#b8ff1f",
  purple: "#967aff",
  blue: "#3ca8ff",
  cyan: "#47d1b3",
  orange: "#ff5c00",
  pink: "#ff2d55",
  grayDot: "#3a3a3c",
};

// ─── ICONS ─────────────────────────────────────────────────────────────────
const ArrowRight = () => (
  <View style={s.arrowCircle}>
    <Ionicons name="chevron-forward" size={12} color={C.muted} />
  </View>
);



// ─── CHARTS ────────────────────────────────────────────────────────────────

function BlockGridChart({ currentSteps = 0 }) {
  const yLabels = [
    "3K",
    "2.7K",
    "2.4K",
    "2.1K",
    "1.8K",
    "1.5K",
    "1.2K",
    "900",
    "600",
    "300",
  ];
  const xLabels = ["Wed", "Thu", "Fri", "Mon", "Tue", "Sat", "Sun"];

  // Calculate today's blocks (max 10 blocks, 300 steps per block)
  const filledBlocks = Math.min(10, Math.floor(currentSteps / 300));
  const emptyBlocks = 10 - filledBlocks;
  const todayCol = [
    ...Array(emptyBlocks).fill(0),
    ...Array(filledBlocks).fill(2),
  ];

  // 0 = empty (dark gray), 1 = filled (muted blue), 2 = active (bright blue)
  const colData = [
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1], // Wed
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1], // Thu
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1], // Fri
    todayCol, // Mon (Today)
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Tue (Future)
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Sat (Future)
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Sun (Future)
  ];

  return (
    <View style={{ flexDirection: "row", marginTop: 16 }}>
      {/* Y-Axis */}
      <View
        style={{
          justifyContent: "space-between",
          paddingRight: 12,
          paddingBottom: 24,
          paddingVertical: 2,
        }}
      >
        {yLabels.map((l) => (
          <Text
            key={l}
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 10,
              color: "#555",
            }}
          >
            {l}
          </Text>
        ))}
      </View>
      {/* Grid */}
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {colData.map((col, cIdx) => (
          <View key={cIdx} style={{ alignItems: "center" }}>
            <View style={{ gap: 4, marginBottom: 12 }}>
              {col.map((val, rIdx) => {
                let bg = "#1c1c1e"; // empty
                if (val === 1) bg = "rgba(60, 168, 255, 0.2)"; // filled
                if (val === 2) bg = C.blue; // active

                return (
                  <View
                    key={rIdx}
                    style={{
                      width: 26,
                      height: 18,
                      borderRadius: 6,
                      backgroundColor: bg,
                    }}
                  />
                );
              })}
            </View>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 10,
                color: cIdx === 3 ? "#fff" : "#555",
              }}
            >
              {xLabels[cIdx]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// HomeSummaryCard has been removed in favor of standard s.card layouts

function SleepChart() {
  const trackCount = 18;
  const activeIndices = [0, 4, 9, 16];

  return (
    <View style={s.sleepChartWrapper}>
      <View style={s.sleepChartInner}>
        {Array.from({ length: trackCount }).map((_, i) => {
          const isActive = activeIndices.includes(i);
          return (
            <View key={i} style={s.sleepTrackCol}>
              <View
                style={[
                  s.sleepBar,
                  { backgroundColor: isActive ? C.purple : "#2c2c2e" },
                ]}
              />
              {i === activeIndices[activeIndices.length - 1] && (
                <View style={s.sleepTriangle} />
              )}
            </View>
          );
        })}
      </View>
      <View style={s.chartLabels}>
        <Text style={s.chartLabelText}>09:00</Text>
        <Text style={s.chartLabelText}>20:00</Text>
      </View>
    </View>
  );
}

function WaterDrops() {
  return (
    <View style={s.waterDropsContainer}>
      <Ionicons
        name="water"
        size={22}
        color={C.blue}
        style={{ marginLeft: -2, marginRight: 2 }}
      />
      <Ionicons
        name="water"
        size={22}
        color={C.blue}
        style={{ marginRight: 2 }}
      />
      <Ionicons
        name="water"
        size={22}
        color={C.blue}
        style={{ marginRight: 2 }}
      />
      <View style={{ alignItems: "center", marginRight: 2 }}>
        <Ionicons name="water" size={22} color={C.blue} />
        <View style={s.waterTriangle} />
      </View>
      <Ionicons name="water-outline" size={22} color={C.grayDot} />
    </View>
  );
}

function WeightVisual() {
  return (
    <View style={s.weightVisualContainer}>
      <Ionicons name="trending-down" size={28} color={C.orange} />
      <View style={s.weightTrendBadge}>
        <Text style={s.weightTrendText}>-1.2 kg</Text>
      </View>
    </View>
  );
}

function HeartRateVisual() {
  const bars = [12, 16, 26, 10, 32, 14, 18, 12];
  return (
    <View style={s.hrVisualContainer}>
      {bars.map((v, i) => (
        <View key={i} style={[s.hrBar, { height: v }]} />
      ))}
    </View>
  );
}

function DeficitVisual({ currentSteps = 0 }) {
  const deficit = Math.max(0, 10000 - currentSteps);
  const percent = deficit / 10000;
  const bars = [...Array(6)].map((_, i) =>
    Math.max(4, 28 * percent * (1 - i * 0.15)),
  );
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        height: 28,
        gap: 4,
        marginTop: 8,
      }}
    >
      {bars.map((v, i) => (
        <View
          key={i}
          style={{
            width: 4,
            height: v,
            backgroundColor: C.blue,
            borderRadius: 2,
          }}
        />
      ))}
    </View>
  );
}

function TrendVisual({ currentSteps = 0 }) {
  const percent = Math.min(1, currentSteps / 10000);
  const bars = [...Array(7)].map((_, i) =>
    Math.max(4, 28 * percent * (0.6 + i * 0.1)),
  );
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        height: 28,
        gap: 4,
        marginTop: 8,
      }}
    >
      {bars.map((v, i) => (
        <View
          key={i}
          style={{
            width: 4,
            height: v,
            backgroundColor: C.orange,
            borderRadius: 2,
          }}
        />
      ))}
    </View>
  );
}

// ─── BESPOKE SVG CHARTS ────────────────────────────────────────────────────

function ProgressRing({ radius, stroke, progress, color, bg }) {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <Svg height={radius * 2} width={radius * 2}>
      <Circle
        stroke={bg || "rgba(255,255,255,0.1)"}
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <Circle
        stroke={color}
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={circumference + " " + circumference}
        style={{ strokeDashoffset }}
        strokeLinecap="round"
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
    </Svg>
  );
}

function HypnogramChart() {
  const width = W - 72; // Padding
  const height = 160;
  // Levels: Awake=0, REM=1, Light=2, Deep=3
  const data = [
    { x: 0, y: 0 },
    { x: 0.1, y: 0 },
    { x: 0.1, y: 2 },
    { x: 0.3, y: 2 },
    { x: 0.3, y: 3 },
    { x: 0.5, y: 3 },
    { x: 0.5, y: 1 },
    { x: 0.7, y: 1 },
    { x: 0.7, y: 2 },
    { x: 0.8, y: 2 },
    { x: 0.8, y: 0 },
    { x: 1, y: 0 },
  ];
  const stepPath = d3
    .line()
    .x((d) => d.x * width)
    .y((d) => (d.y / 3) * (height - 20) + 10)
    .curve(d3.curveStepAfter)(data);

  const areaPath = d3
    .area()
    .x((d) => d.x * width)
    .y0(height)
    .y1((d) => (d.y / 3) * (height - 20) + 10)
    .curve(d3.curveStepAfter)(data);

  return (
    <Svg width={width} height={height} style={{ marginTop: 24 }}>
      <Defs>
        <LinearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={C.purple} stopOpacity="0.4" />
          <Stop offset="1" stopColor={C.purple} stopOpacity="0.0" />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill="url(#sleepGrad)" />
      <Path d={stepPath} fill="none" stroke={C.purple} strokeWidth={3} />
      {[0, 1, 2, 3].map((i) => (
        <SvgLine
          key={i}
          x1="0"
          y1={(i / 3) * (height - 20) + 10}
          x2={width}
          y2={(i / 3) * (height - 20) + 10}
          stroke="#222"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      ))}
    </Svg>
  );
}

function SmoothLineChart() {
  const width = W - 72;
  const height = 160;
  const rawData = [74.1, 73.8, 73.5, 73.9, 73.2, 72.8, 72.4];
  const min = Math.min(...rawData) - 1;
  const max = Math.max(...rawData) + 1;

  const data = rawData.map((d, i) => ({
    x: i / (rawData.length - 1),
    y: (d - min) / (max - min),
  }));

  const linePath = d3
    .line()
    .x((d) => d.x * width)
    .y((d) => (1 - d.y) * (height - 40) + 20)
    .curve(d3.curveMonotoneX)(data);

  const areaPath = d3
    .area()
    .x((d) => d.x * width)
    .y0(height)
    .y1((d) => (1 - d.y) * (height - 40) + 20)
    .curve(d3.curveMonotoneX)(data);

  return (
    <Svg width={width} height={height} style={{ marginTop: 24 }}>
      <Defs>
        <LinearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={C.orange} stopOpacity="0.5" />
          <Stop offset="1" stopColor={C.orange} stopOpacity="0.0" />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill="url(#orangeGrad)" />
      <Path d={linePath} fill="none" stroke={C.orange} strokeWidth={4} />
      {data.map((d, i) => (
        <Circle
          key={i}
          cx={d.x * width}
          cy={(1 - d.y) * (height - 40) + 20}
          r={5}
          fill={C.bg}
          stroke={C.orange}
          strokeWidth={3}
        />
      ))}
    </Svg>
  );
}

function RangeChart() {
  const width = W - 72;
  const height = 160;
  const data = [
    { min: 58, max: 80, avg: 65 },
    { min: 55, max: 70, avg: 60 },
    { min: 60, max: 120, avg: 85 },
    { min: 80, max: 142, avg: 110 },
    { min: 70, max: 110, avg: 90 },
    { min: 60, max: 85, avg: 72 },
    { min: 65, max: 95, avg: 78 },
    { min: 60, max: 80, avg: 68 },
    { min: 58, max: 75, avg: 65 },
    { min: 62, max: 85, avg: 70 },
    { min: 60, max: 82, avg: 68 },
    { min: 55, max: 70, avg: 62 },
  ];

  const minVal = 50;
  const maxVal = 150;

  return (
    <Svg width={width} height={height} style={{ marginTop: 24 }}>
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * (width - 16) + 8;
        const yTop = (1 - (d.max - minVal) / (maxVal - minVal)) * height;
        const yBottom = (1 - (d.min - minVal) / (maxVal - minVal)) * height;
        const yAvg = (1 - (d.avg - minVal) / (maxVal - minVal)) * height;

        return (
          <G key={i}>
            <SvgLine
              x1={x}
              y1={yTop}
              x2={x}
              y2={yBottom}
              stroke="rgba(255, 45, 85, 0.3)"
              strokeWidth={12}
              strokeLinecap="round"
            />
            <Circle cx={x} cy={yAvg} r={4} fill="#fff" />
          </G>
        );
      })}
    </Svg>
  );
}

function LiquidTankChart({ waterLiters = 0 }) {
  const width = 140;
  const height = 260;
  const progress = Math.min(1, waterLiters / 2.5);
  const fillHeight = height * progress;

  // Front wave
  let wave1 = `M 0,${height - fillHeight} `;
  for (let x = 0; x <= width; x += 5) {
    const y = height - fillHeight + Math.sin(x * 0.05) * 8;
    wave1 += `L ${x},${y} `;
  }
  wave1 += `L ${width},${height} L 0,${height} Z`;

  // Back wave
  let wave2 = `M 0,${height - fillHeight} `;
  for (let x = 0; x <= width; x += 5) {
    const y = height - fillHeight + Math.sin(x * 0.05 + 2) * 8;
    wave2 += `L ${x},${y} `;
  }
  wave2 += `L ${width},${height} L 0,${height} Z`;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 32,
      }}
    >
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={C.cyan} stopOpacity="1" />
            <Stop offset="1" stopColor={C.blue} stopOpacity="1" />
          </LinearGradient>
          <ClipPath id="tankClip">
            <Rect x="0" y="0" width={width} height={height} rx={width / 2} />
          </ClipPath>
        </Defs>

        <Rect
          x="0"
          y="0"
          width={width}
          height={height}
          rx={width / 2}
          fill="#141415"
          stroke={C.cardBorder}
          strokeWidth={2}
        />

        <G clipPath="url(#tankClip)">
          <Path d={wave2} fill="url(#waterGrad)" opacity="0.4" />
          <Path d={wave1} fill="url(#waterGrad)" />
        </G>

        <Rect
          x="16"
          y="16"
          width="12"
          height={height - 32}
          rx="6"
          fill="#ffffff"
          opacity="0.05"
        />
      </Svg>

      <View style={{ marginLeft: 32 }}>
        <Text
          style={{
            fontFamily: "Inter_800ExtraBold",
            fontSize: 56,
            color: "#fff",
            letterSpacing: -2,
          }}
        >
          1.8<Text style={{ fontSize: 24 }}>L</Text>
        </Text>
        <Text
          style={{
            fontFamily: "Inter_500Medium",
            fontSize: 14,
            color: C.cyan,
            marginTop: 4,
          }}
        >
          72% of Daily Goal
        </Text>
      </View>
    </View>
  );
}

// ─── EXTENDED ACTIVITY CHART ───────────────────────────────────────────────
function ExtendedBlockGridChart({ currentSteps = 0 }) {
  const yLabels = [
    "3K",
    "2.7K",
    "2.4K",
    "2.1K",
    "1.8K",
    "1.5K",
    "1.2K",
    "900",
    "600",
    "300",
  ];
  // 3 weeks (21 days) of data
  const xLabels = [
    "M",
    "T",
    "W",
    "T",
    "F",
    "S",
    "S",
    "M",
    "T",
    "W",
    "T",
    "F",
    "S",
    "S",
    "M",
    "T",
    "W",
    "T",
    "F",
    "S",
    "S",
  ];

  const filledBlocks = Math.min(10, Math.floor(currentSteps / 300));
  const emptyBlocks = 10 - filledBlocks;
  const todayCol = [
    ...Array(emptyBlocks).fill(0),
    ...Array(filledBlocks).fill(2),
  ];

  const colData = [...Array(21)].map((_, cIdx) => {
    // Today is index 17
    if (cIdx === 17) return todayCol;
    // Future or past (no historical data without Health Connect)
    return [...Array(10)].fill(0);
  });

  return (
    <View style={{ flexDirection: "row", marginVertical: 24, height: 260 }}>
      <View
        style={{
          justifyContent: "space-between",
          paddingRight: 12,
          paddingBottom: 24,
          paddingVertical: 2,
        }}
      >
        {yLabels.map((l) => (
          <Text
            key={l}
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 10,
              color: "#555",
            }}
          >
            {l}
          </Text>
        ))}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <View style={{ flexDirection: "row", gap: 12, paddingRight: 32 }}>
          {colData.map((col, cIdx) => (
            <View key={cIdx} style={{ alignItems: "center" }}>
              <View style={{ gap: 4, marginBottom: 12 }}>
                {col.map((val, rIdx) => {
                  let bg = "#1c1c1e";
                  if (val === 1) bg = "rgba(60, 168, 255, 0.2)";
                  if (val === 2) bg = C.blue;
                  return (
                    <View
                      key={rIdx}
                      style={{
                        width: 22,
                        height: 18,
                        borderRadius: 6,
                        backgroundColor: bg,
                      }}
                    />
                  );
                })}
              </View>
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 10,
                  color: cIdx === 17 ? "#fff" : "#555",
                }}
              >
                {xLabels[cIdx]}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── DETAIL SCREENS ────────────────────────────────────────────────────────

function ActivityDetailScreen({ onBack, currentSteps = 0 }) {
  const fakePastSteps = 48420; // Simulated historical total for demo
  const totalThreeWeeks = fakePastSteps + currentSteps;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 16,
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: C.cardBorder,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: "Inter_700Bold",
            fontSize: 18,
            color: C.text,
            marginLeft: 16,
          }}
        >
          Activity
        </Text>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "center", marginTop: 16, marginBottom: 16 }}>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: C.muted,
              marginBottom: 4,
            }}
          >
            Total Steps (3 Weeks)
          </Text>
          <Text
            style={{
              fontFamily: "Inter_800ExtraBold",
              fontSize: 56,
              color: C.blue,
              letterSpacing: -2,
            }}
          >
            {totalThreeWeeks.toLocaleString()}
          </Text>
        </View>

        <ExtendedBlockGridChart currentSteps={currentSteps} />

        <View style={[s.card, { padding: 20 }]}>
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 16,
              color: C.text,
              marginBottom: 4,
            }}
          >
            Live Update Active
          </Text>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 13,
              color: C.muted,
              lineHeight: 20,
            }}
          >
            Your pedometer is actively feeding real data to this chart. Today's
            block lights up as you walk.
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 16, marginTop: 16 }}>
          <View style={[s.card, { flex: 1, padding: 16 }]}>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 16,
                color: C.text,
                marginBottom: 2,
              }}
            >
              Today's Total
            </Text>
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 18,
                color: C.lime,
              }}
            >
              {currentSteps.toLocaleString()}
            </Text>
          </View>
          <View style={[s.card, { flex: 1, padding: 16 }]}>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 16,
                color: C.text,
                marginBottom: 2,
              }}
            >
              Daily Goal
            </Text>
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 18,
                color: C.blue,
              }}
            >
              10,000
            </Text>
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── SLEEP DETAIL SCREEN ──────────────────────────────────────────────────

function SleepDetailScreen({ onBack, sleepHours = 0, sleepMins = 0, setSleepHours, setSleepMins }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 16,
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: C.cardBorder,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: "Inter_700Bold",
            fontSize: 18,
            color: C.text,
            marginLeft: 16,
          }}
        >
          Sleep Analysis
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Metric */}
        <View style={{ alignItems: "center", marginTop: 16, marginBottom: 32 }}>
          <Text
            style={{
              fontFamily: "Inter_800ExtraBold",
              fontSize: 56,
              color: C.purple,
              letterSpacing: -2,
            }}
          >
            {sleepHours}h {sleepMins}m
          </Text>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (sleepMins >= 15) {
                  setSleepMins(sleepMins - 15);
                } else if (sleepHours > 0) {
                  setSleepHours(sleepHours - 1);
                  setSleepMins(45);
                }
              }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="remove" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={{ justifyContent: 'center', paddingHorizontal: 12 }}>
              <Text style={{ fontFamily: "Inter_600SemiBold", color: "#fff", fontSize: 16 }}>Log Sleep</Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (sleepMins <= 30) {
                  setSleepMins(sleepMins + 15);
                } else {
                  setSleepHours(sleepHours + 1);
                  setSleepMins(0);
                }
              }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: C.purple,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: C.muted,
              marginTop: 4,
            }}
          >
            Total Time Asleep
          </Text>
        </View>

        {/* Detailed Chart Card */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Sleep Stages</Text>
            <Ionicons name="moon" size={16} color={C.purple} />
          </View>

          {/* Graph */}
          <HypnogramChart />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 12,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 11,
                color: "#555",
              }}
            >
              22:00
            </Text>
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 11,
                color: "#555",
              }}
            >
              07:00
            </Text>
          </View>

          {/* Legend */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 24,
              paddingTop: 24,
              borderTopWidth: 1,
              borderTopColor: C.cardBorder,
            }}
          >
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: C.orange,
                  marginBottom: 6,
                }}
              />
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 11,
                  color: C.text,
                }}
              >
                Awake
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 10,
                  color: C.muted,
                  marginTop: 2,
                }}
              >
                24m
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: C.blue,
                  marginBottom: 6,
                }}
              />
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 11,
                  color: C.text,
                }}
              >
                REM
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 10,
                  color: C.muted,
                  marginTop: 2,
                }}
              >
                1h 12m
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: C.purple,
                  marginBottom: 6,
                }}
              />
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 11,
                  color: C.text,
                }}
              >
                Light
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 10,
                  color: C.muted,
                  marginTop: 2,
                }}
              >
                3h 40m
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#311b59",
                  marginBottom: 6,
                }}
              />
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 11,
                  color: C.text,
                }}
              >
                Deep
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 10,
                  color: C.muted,
                  marginTop: 2,
                }}
              >
                1h 8m
              </Text>
            </View>
          </View>
        </View>

        {/* Sub Metrics */}
        <View style={{ flexDirection: "row", marginTop: 16, marginBottom: 40 }}>
          <View style={[s.card, { flex: 1, marginRight: 8, padding: 16 }]}>
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 12,
                color: C.muted,
                marginBottom: 4,
              }}
            >
              Time in Bed
            </Text>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 20,
                color: "#fff",
              }}
            >
              7h 10m
            </Text>
          </View>
          <View style={[s.card, { flex: 1, marginLeft: 8, padding: 16 }]}>
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 12,
                color: C.muted,
                marginBottom: 4,
              }}
            >
              Sleep Score
            </Text>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 20,
                color: C.lime,
              }}
            >
              88 / 100
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── WATER DETAIL SCREEN ──────────────────────────────────────────────────

function WaterDetailScreen({ onBack, waterGlasses = 0, setWaterGlasses }) {
  const chartData = [
    { time: "08:00", amount: 300 },
    { time: "10:00", amount: 500 },
    { time: "12:00", amount: 0 },
    { time: "14:00", amount: 400 },
    { time: "16:00", amount: 200 },
    { time: "18:00", amount: 400 },
    { time: "20:00", amount: 0 },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 16,
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: C.cardBorder,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: "Inter_700Bold",
            fontSize: 18,
            color: C.text,
            marginLeft: 16,
          }}
        >
          Hydration
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
           <Text style={{ fontFamily: "Inter_800ExtraBold", fontSize: 56, color: C.blue, letterSpacing: -2 }}>
              {(waterGlasses * 0.25).toFixed(1)}L
           </Text>
           <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (waterGlasses > 0) setWaterGlasses(waterGlasses - 1);
              }}
              style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255, 255, 255, 0.1)", alignItems: "center", justifyContent: "center" }}
            >
              <Ionicons name="remove" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={{ justifyContent: 'center', paddingHorizontal: 12 }}>
              <Text style={{ fontFamily: "Inter_600SemiBold", color: "#fff", fontSize: 16 }}>1 Glass</Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setWaterGlasses(waterGlasses + 1);
              }}
              style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.blue, alignItems: "center", justifyContent: "center" }}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Liquid Tank */}
        <View style={{ alignItems: "center" }}>
           <LiquidTankChart waterLiters={waterGlasses * 0.25} />
        </View>

        {/* Sub Metrics */}
        <View style={{ flexDirection: "row", marginTop: 16, marginBottom: 40 }}>
          <View style={[s.card, { flex: 1, marginRight: 8, padding: 16 }]}>
            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: C.muted, marginBottom: 4 }}>Daily Goal</Text>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: "#fff" }}>2.5L</Text>
          </View>
          <View style={[s.card, { flex: 1, marginLeft: 8, padding: 16 }]}>
            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: C.muted, marginBottom: 4 }}>Remaining</Text>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: C.cyan }}>
               {Math.max(0, 2.5 - (waterGlasses * 0.25)).toFixed(1)}L
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── WEIGHT DETAIL SCREEN ─────────────────────────────────────────────────

function WeightDetailScreen({ onBack, weightKg = 0, setWeightKg }) {
  const chartData = [
    { day: "Mon", val: 74.1 },
    { day: "Tue", val: 73.8 },
    { day: "Wed", val: 73.5 },
    { day: "Thu", val: 73.9 },
    { day: "Fri", val: 73.2 },
    { day: "Sat", val: 72.8 },
    { day: "Sun", val: 72.4 },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 16,
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: C.cardBorder,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: "Inter_700Bold",
            fontSize: 18,
            color: C.text,
            marginLeft: 16,
          }}
        >
          Body Weight
        </Text>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "center", marginTop: 16, marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
            <TextInput
              style={{
                fontFamily: "Inter_800ExtraBold",
                fontSize: 56,
                color: C.orange,
                letterSpacing: -2,
                minWidth: 100,
                textAlign: 'center',
                padding: 0,
                margin: 0,
              }}
              value={weightKg > 0 ? String(weightKg) : ""}
              placeholder="0.0"
              placeholderTextColor="rgba(255, 92, 0, 0.3)"
              keyboardType="numeric"
              onChangeText={(text) => {
                const parsed = parseFloat(text);
                if (!isNaN(parsed)) {
                  setWeightKg(parsed);
                } else if (text === "") {
                  setWeightKg(0);
                }
              }}
            />
            <Text style={{ fontFamily: "Inter_800ExtraBold", fontSize: 32, color: C.orange, marginBottom: 8, marginLeft: 4 }}>kg</Text>
          </View>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: C.muted,
              marginTop: 4,
            }}
          >
            Current Weight
          </Text>
        </View>
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>7-Day Trend</Text>
            <Ionicons name="trending-down" size={16} color={C.orange} />
          </View>
          <SmoothLineChart />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 12,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 11,
                color: "#555",
              }}
            >
              Mon
            </Text>
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 11,
                color: "#555",
              }}
            >
              Sun
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", marginTop: 16, marginBottom: 40 }}>
          <View style={[s.card, { flex: 1, marginRight: 8, padding: 16 }]}>
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 12,
                color: C.muted,
                marginBottom: 4,
              }}
            >
              Goal Weight
            </Text>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 20,
                color: "#fff",
              }}
            >
              70.0 kg
            </Text>
          </View>
          <View style={[s.card, { flex: 1, marginLeft: 8, padding: 16 }]}>
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 12,
                color: C.muted,
                marginBottom: 4,
              }}
            >
              Total Lost
            </Text>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 20,
                color: C.orange,
              }}
            >
              -1.2 kg
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── HEART RATE DETAIL SCREEN ─────────────────────────────────────────────

function HeartRateDetailScreen({ onBack, heartRate = 0, setHeartRate }) {
  const chartData = [
    62, 65, 60, 68, 110, 135, 142, 125, 105, 85, 75, 70, 68, 65, 64,
  ];
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 16,
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: C.cardBorder,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: "Inter_700Bold",
            fontSize: 18,
            color: C.text,
            marginLeft: 16,
          }}
        >
          Heart Rate
        </Text>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "center", marginTop: 16, marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
            <TextInput
              style={{
                fontFamily: "Inter_800ExtraBold",
                fontSize: 56,
                color: C.pink,
                letterSpacing: -2,
                minWidth: 80,
                textAlign: 'center',
                padding: 0,
                margin: 0,
              }}
              value={heartRate > 0 ? String(heartRate) : ""}
              placeholder="0"
              placeholderTextColor="rgba(255, 33, 107, 0.3)"
              keyboardType="numeric"
              onChangeText={(text) => {
                const parsed = parseInt(text, 10);
                if (!isNaN(parsed)) {
                  setHeartRate(parsed);
                } else if (text === "") {
                  setHeartRate(0);
                }
              }}
            />
            <Text style={{ fontFamily: "Inter_800ExtraBold", fontSize: 32, color: C.pink, marginBottom: 8, marginLeft: 4 }}>bpm</Text>
          </View>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: C.muted,
              marginTop: 4,
            }}
          >
            Daily Average
          </Text>
        </View>
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Today's Range</Text>
            <Ionicons name="heart" size={16} color={C.pink} />
          </View>
          <RangeChart />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 12,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 11,
                color: "#555",
              }}
            >
              00:00
            </Text>
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 11,
                color: "#555",
              }}
            >
              23:59
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", marginTop: 16, marginBottom: 40 }}>
          <View style={[s.card, { flex: 1, marginRight: 8, padding: 16 }]}>
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 12,
                color: C.muted,
                marginBottom: 4,
              }}
            >
              Resting HR
            </Text>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 20,
                color: "#fff",
              }}
            >
              58 bpm
            </Text>
          </View>
          <View style={[s.card, { flex: 1, marginLeft: 8, padding: 16 }]}>
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 12,
                color: C.muted,
                marginBottom: 4,
              }}
            >
              High HR
            </Text>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 20,
                color: C.pink,
              }}
            >
              142 bpm
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── SUMMARY DETAIL SCREEN ────────────────────────────────────────────────

function SummaryDetailScreen({ onBack, currentSteps = 0 }) {
  const distance = (currentSteps * 0.00044).toFixed(2);
  const calories = Math.floor(currentSteps * 0.045);
  const floors = Math.floor(currentSteps / 500);
  const progress = Math.min(100, Math.floor((currentSteps / 10000) * 100));
  const activeTime = Math.floor(currentSteps / 100);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 16,
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: C.cardBorder,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: "Inter_700Bold",
            fontSize: 18,
            color: C.text,
            marginLeft: 16,
          }}
        >
          Summary
        </Text>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "center", marginTop: 16, marginBottom: 32 }}>
          <Text
            style={{
              fontFamily: "Inter_800ExtraBold",
              fontSize: 56,
              color: C.lime,
              letterSpacing: -2,
            }}
          >
            {currentSteps.toLocaleString()}
          </Text>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: C.muted,
              marginTop: 4,
            }}
          >
            Total Steps Today
          </Text>
        </View>

        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Daily Highlights</Text>
            <Ionicons name="star" size={16} color={C.lime} />
          </View>

          <View style={{ marginTop: 16 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 14,
                  color: C.text,
                }}
              >
                Distance
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 14,
                  color: "#fff",
                }}
              >
                {distance} mi
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 14,
                  color: C.text,
                }}
              >
                Calories
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 14,
                  color: "#fff",
                }}
              >
                {calories} kcal
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 14,
                  color: C.text,
                }}
              >
                Floors Climbed
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 14,
                  color: "#fff",
                }}
              >
                {floors}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: "row", marginTop: 16, marginBottom: 40 }}>
          <View style={[s.card, { flex: 1, marginRight: 8, padding: 16 }]}>
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 12,
                color: C.muted,
                marginBottom: 4,
              }}
            >
              Goal Progress
            </Text>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 20,
                color: "#fff",
              }}
            >
              {progress}%
            </Text>
          </View>
          <View style={[s.card, { flex: 1, marginLeft: 8, padding: 16 }]}>
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 12,
                color: C.muted,
                marginBottom: 4,
              }}
            >
              Active Time
            </Text>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 20,
                color: C.lime,
              }}
            >
              {activeTime} min
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function DeficitDetailScreen({ onBack, currentSteps = 0 }) {
  const deficit = Math.max(0, 10000 - currentSteps);
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 16,
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: C.cardBorder,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: "Inter_700Bold",
            fontSize: 18,
            color: C.text,
            marginLeft: 16,
          }}
        >
          Deficit
        </Text>
      </View>
      <View style={{ padding: 16, alignItems: "center", marginTop: 32 }}>
        <Text
          style={{
            fontFamily: "Inter_500Medium",
            fontSize: 14,
            color: C.muted,
            marginBottom: 4,
          }}
        >
          Steps Behind Goal
        </Text>
        <Text
          style={{
            fontFamily: "Inter_800ExtraBold",
            fontSize: 56,
            color: C.blue,
            letterSpacing: -2,
          }}
        >
          {deficit.toLocaleString()}
        </Text>
        <Text
          style={{
            fontFamily: "Inter_500Medium",
            fontSize: 14,
            color: C.text,
            marginTop: 16,
            textAlign: "center",
            paddingHorizontal: 32,
            lineHeight: 22,
          }}
        >
          You need {deficit.toLocaleString()} more steps to reach your daily
          goal of 10,000 steps.
        </Text>
      </View>
    </View>
  );
}

function TrendDetailScreen({ onBack, currentSteps = 0 }) {
  const progress = Math.min(100, Math.floor((currentSteps / 10000) * 100));
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 16,
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: C.cardBorder,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: "Inter_700Bold",
            fontSize: 18,
            color: C.text,
            marginLeft: 16,
          }}
        >
          Trend
        </Text>
      </View>
      <View style={{ padding: 16, alignItems: "center", marginTop: 32 }}>
        <Text
          style={{
            fontFamily: "Inter_500Medium",
            fontSize: 14,
            color: C.muted,
            marginBottom: 4,
          }}
        >
          Daily Goal Progress
        </Text>
        <Text
          style={{
            fontFamily: "Inter_800ExtraBold",
            fontSize: 56,
            color: C.orange,
            letterSpacing: -2,
          }}
        >
          {progress}%
        </Text>
        <Text
          style={{
            fontFamily: "Inter_500Medium",
            fontSize: 14,
            color: C.text,
            marginTop: 16,
            textAlign: "center",
            paddingHorizontal: 32,
            lineHeight: 22,
          }}
        >
          Your pedometer is actively tracking your progress to your goal!
        </Text>
      </View>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  isDestructive,
  hideBorder,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderBottomWidth: hideBorder ? 0 : 1,
        borderBottomColor: C.cardBorder,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Ionicons
          name={icon}
          size={20}
          color={isDestructive ? "#ff3b30" : "#fff"}
          style={{ marginRight: 14 }}
        />
        <Text
          style={{
            fontFamily: "Inter_600SemiBold",
            fontSize: 15,
            color: isDestructive ? "#ff3b30" : "#fff",
          }}
        >
          {label}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {value ? (
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: C.muted,
            }}
          >
            {value}
          </Text>
        ) : (
          !isDestructive && (
            <Ionicons name="chevron-forward" size={18} color={C.muted} />
          )
        )}
      </View>
    </TouchableOpacity>
  );
}

function AccountProfileScreen() {
  // Functional states for the prototype UI
  const [unit, setUnit] = useState("Metric");
  const [lang, setLang] = useState("English");
  const [steps, setSteps] = useState("10,000");
  const [cals, setCals] = useState("2,400 kcal");
  const [water, setWater] = useState("2.5 L");

  // Handlers to make buttons feel alive
  const toggleUnit = () =>
    setUnit((prev) => (prev === "Metric" ? "Imperial" : "Metric"));

  const toggleLang = () => {
    if (lang === "English") setLang("Español");
    else if (lang === "Español") setLang("Français");
    else setLang("English");
  };

  const cycleSteps = () => {
    if (steps === "10,000") setSteps("12,000");
    else if (steps === "12,000") setSteps("15,000");
    else setSteps("10,000");
  };

  const cycleCals = () => {
    if (cals === "2,400 kcal") setCals("2,600 kcal");
    else if (cals === "2,600 kcal") setCals("3,000 kcal");
    else setCals("2,400 kcal");
  };

  const cycleWater = () => {
    if (water === "2.5 L") setWater("3.0 L");
    else if (water === "3.0 L") setWater("4.0 L");
    else setWater("2.5 L");
  };

  const showLegalAlert = (title) => {
    Alert.alert(
      title,
      "This is a functional prototype. The full terms and privacy policy will be available in the production release.",
      [{ text: "Understood", style: "default" }],
    );
  };

  const showVersionInfo = () => {
    Alert.alert(
      "App Version",
      "You are running the latest version: v1.0.0 (Build 42)",
    );
  };

  return (
    <>
      <View style={{ alignItems: "center", paddingVertical: 32 }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: C.cardBorder,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Text
            style={{ fontFamily: "Inter_700Bold", fontSize: 36, color: "#fff" }}
          >
            A
          </Text>
        </View>
        <Text
          style={{
            fontFamily: "Inter_700Bold",
            fontSize: 24,
            color: "#fff",
            marginBottom: 4,
          }}
        >
          Alex
        </Text>
        <Text
          style={{
            fontFamily: "Inter_600SemiBold",
            fontSize: 13,
            color: C.lime,
          }}
        >
          Ozzz Free Plan
        </Text>
      </View>

      {/* ── GOALS ── */}
      <Text
        style={{
          fontFamily: "Inter_700Bold",
          fontSize: 12,
          color: C.muted,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          marginLeft: 20,
          marginBottom: 8,
          marginTop: 8,
        }}
      >
        Goals
      </Text>
      <View style={[s.card, { padding: 0, overflow: "hidden" }]}>
        <SettingsRow
          icon="walk-outline"
          label="Daily Steps"
          value={steps}
          onPress={cycleSteps}
        />
        <SettingsRow
          icon="flame-outline"
          label="Calories"
          value={cals}
          onPress={cycleCals}
        />
        <SettingsRow
          icon="water-outline"
          label="Water Intake"
          value={water}
          onPress={cycleWater}
          hideBorder
        />
      </View>

      {/* ── PREFERENCES ── */}
      <Text
        style={{
          fontFamily: "Inter_700Bold",
          fontSize: 12,
          color: C.muted,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          marginLeft: 20,
          marginBottom: 8,
          marginTop: 24,
        }}
      >
        Preferences
      </Text>
      <View style={[s.card, { padding: 0, overflow: "hidden" }]}>
        <SettingsRow
          icon="scale-outline"
          label="Units"
          value={unit}
          onPress={toggleUnit}
        />
        <SettingsRow
          icon="language-outline"
          label="Language"
          value={lang}
          onPress={toggleLang}
          hideBorder
        />
      </View>

      {/* ── ABOUT & LEGAL ── */}
      <Text
        style={{
          fontFamily: "Inter_700Bold",
          fontSize: 12,
          color: C.muted,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          marginLeft: 20,
          marginBottom: 8,
          marginTop: 24,
        }}
      >
        About
      </Text>
      <View
        style={[s.card, { padding: 0, overflow: "hidden", marginBottom: 80 }]}
      >
        <SettingsRow
          icon="document-text-outline"
          label="Terms of Service"
          onPress={() => showLegalAlert("Terms of Service")}
        />
        <SettingsRow
          icon="shield-checkmark-outline"
          label="Privacy Policy"
          onPress={() => showLegalAlert("Privacy Policy")}
        />
        <SettingsRow
          icon="information-circle-outline"
          label="App Version"
          value="v1.0.0"
          onPress={showVersionInfo}
          hideBorder
        />
      </View>
    </>
  );
}

// ─── TAB BAR ───────────────────────────────────────────────────────────────

function TabBar({ activeTab, setActiveTab, translateY }) {
  const tabs = [
    { id: "Home", icon: "home", iconOutline: "home-outline", type: "ion" },
    {
      id: "Program",
      icon: "chart-bar",
      iconOutline: "chart-bar",
      type: "material",
    },
    {
      id: "Account",
      icon: "person",
      iconOutline: "person-outline",
      type: "ion",
    },
  ];

  return (
    <Animated.View style={[s.tabBarContainer, { transform: [{ translateY }] }]}>
      {tabs.map((t) => {
        const isActive = t.id === activeTab;

        if (isActive) {
          return (
            <TouchableOpacity key={t.id} activeOpacity={1}>
              <View style={s.tabActiveOuter}>
                <View style={s.tabActiveGap}>
                  <View style={s.tabActiveInner}>
                    {t.type === "ion" ? (
                      <Ionicons name={t.icon} size={20} color="#fff" />
                    ) : (
                      <MaterialCommunityIcons
                        name={t.icon}
                        size={22}
                        color="#fff"
                      />
                    )}
                    <Text style={s.tabLabelActive}>{t.id}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={t.id}
            style={s.tabInactiveBubble}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(t.id);
            }}
          >
            {t.type === "ion" ? (
              <Ionicons name={t.iconOutline} size={22} color={C.muted} />
            ) : (
              <MaterialCommunityIcons
                name={t.iconOutline}
                size={24}
                color={C.muted}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
}

// ─── SLIDE IN SCREEN WRAPPER ──────────────────────────────────────────────

function SlideInScreen({ visible, children }) {
  const [active, setActive] = useState(visible);
  const translateY = useRef(new Animated.Value(1000)).current;

  useEffect(() => {
    if (visible) {
      setActive(true);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        stiffness: 250,
        damping: 30,
        mass: 1,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 1000,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setActive(false));
    }
  }, [visible]);

  if (!active && !visible) return null;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: C.bg, zIndex: 10, transform: [{ translateY }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState("Home");
  const [currentScreen, setCurrentScreen] = useState("Main"); // 'Main' | 'SleepDetail'

  // Real Hardware Pedometer State
  const [isPedometerAvailable, setIsPedometerAvailable] = useState("checking");
  const [pastStepCount, setPastStepCount] = useState(0);
  const [currentStepCount, setCurrentStepCount] = useState(0);

  // Manual Entry States
  const [sleepHours, setSleepHours] = useState(0);
  const [sleepMins, setSleepMins] = useState(0);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [weightKg, setWeightKg] = useState(0);
  const [heartRate, setHeartRate] = useState(0);

  useEffect(() => {
    let subscription;
    const subscribe = async () => {
      try {
        const permission = await Pedometer.requestPermissionsAsync();
        if (permission.status !== "granted") {
          setIsPedometerAvailable("permission_denied");
          return;
        }

        const isAvailable = await Pedometer.isAvailableAsync();
        setIsPedometerAvailable(String(isAvailable));

        if (isAvailable) {
          const end = new Date();
          const start = new Date();
          start.setHours(0, 0, 0, 0); // Start of today

          try {
            const pastStepsResult = await Pedometer.getStepCountAsync(
              start,
              end,
            );
            if (pastStepsResult) {
              setPastStepCount(pastStepsResult.steps);
            }
          } catch (e) {
            console.log("Could not get past steps:", e);
          }

          subscription = Pedometer.watchStepCount((result) => {
            setCurrentStepCount(result.steps);
          });
        }
      } catch (e) {
        console.log("Pedometer error:", e);
        setIsPedometerAvailable("error");
      }
    };

    subscribe();
    return () => {
      if (subscription && subscription.remove) {
        subscription.remove();
      }
    };
  }, []);

  const totalSteps = pastStepCount + currentStepCount;

  // Animation for TabBar hide on scroll
  const scrollY = useRef(new Animated.Value(0)).current;
  const diffClamp = Animated.diffClamp(scrollY, 0, 120); // 120px to ensure it completely hides below screen
  const translateY = diffClamp.interpolate({
    inputRange: [0, 120],
    outputRange: [0, 120],
  });

  let [fontsLoaded] = useFonts({
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="light" />
      <Animated.ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        {/* ================================================================= */}
        {/*                           MAIN SCREENS                            */}
        {/* ================================================================= */}
        {currentScreen === "Main" && (
          <>
            {/* ================================================================= */}
            {/*                           HOME TAB                                */}
            {/* ================================================================= */}
            {activeTab === "Home" && (
              <>
                {/* ── HEADER ── */}
                <View style={s.header}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.headerTextLine}>
                      <Text
                        style={{
                          color: C.muted,
                          fontFamily: "Inter_500Medium",
                        }}
                      >
                        Morning{" "}
                      </Text>
                      <Text
                        style={{
                          color: "#fff",
                          fontFamily: "Inter_800ExtraBold",
                        }}
                      >
                        Alex!
                      </Text>
                    </Text>
                    <Text style={s.headerTextLine}>
                      <Text
                        style={{
                          color: C.muted,
                          fontFamily: "Inter_500Medium",
                        }}
                      >
                        You've finished{" "}
                      </Text>
                      <Text
                        style={{
                          color: "#fff",
                          fontFamily: "Inter_800ExtraBold",
                        }}
                      >
                        78%
                      </Text>
                      <Text
                        style={{
                          color: C.muted,
                          fontFamily: "Inter_500Medium",
                        }}
                      >
                        {" "}
                        of
                      </Text>
                    </Text>
                    <Text
                      style={[
                        s.headerTextLine,
                        { color: "#fff", fontFamily: "Inter_800ExtraBold" },
                      ]}
                    >
                      the program
                    </Text>
                  </View>

                  <View style={s.avatarWrap}>
                    <Ionicons name="person" size={24} color="#666" />
                  </View>
                </View>



                {/* ── BLOCK GRID CHART ── */}
                <TouchableOpacity
                  style={s.card}
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCurrentScreen("ActivityDetail");
                  }}
                >
                  <View style={s.cardHeader}>
                    <Text style={s.cardTitle}>Activity</Text>
                    <ArrowRight />
                  </View>
                  <Text style={s.metricLabel}>This Week</Text>
                  <BlockGridChart currentSteps={totalSteps} />
                </TouchableOpacity>

                {/* ── SUMMARY CARD ── */}
                <TouchableOpacity
                  style={s.card}
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCurrentScreen("SummaryDetail");
                  }}
                >
                  <View style={s.cardHeader}>
                    <Text style={s.cardTitle}>Summary</Text>
                    <ArrowRight />
                  </View>
                  <Text style={s.metricLabel}>
                    Total Steps{" "}
                    {isPedometerAvailable === "false" && "(No Sensor)"}
                  </Text>
                  <Text style={[s.metricValue, { color: C.lime }]}>
                    {totalSteps.toLocaleString()}
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      marginTop: 24,
                      justifyContent: "space-between",
                      paddingHorizontal: 16,
                    }}
                  >
                    <View style={{ alignItems: "center" }}>
                      <Text
                        style={{
                          fontFamily: "Inter_700Bold",
                          color: "#fff",
                          fontSize: 16,
                        }}
                      >
                        {(totalSteps * 0.00044).toFixed(2)}
                        <Text style={{ fontSize: 12 }}> mi</Text>
                      </Text>
                      <Text
                        style={{
                          fontFamily: "Inter_500Medium",
                          color: "#888",
                          fontSize: 11,
                          marginTop: 4,
                        }}
                      >
                        Distance
                      </Text>
                    </View>
                    <View style={{ alignItems: "center" }}>
                      <Text
                        style={{
                          fontFamily: "Inter_700Bold",
                          color: "#fff",
                          fontSize: 16,
                        }}
                      >
                        {Math.floor(totalSteps * 0.045)}
                        <Text style={{ fontSize: 12 }}> kcal</Text>
                      </Text>
                      <Text
                        style={{
                          fontFamily: "Inter_500Medium",
                          color: "#888",
                          fontSize: 11,
                          marginTop: 4,
                        }}
                      >
                        Calories
                      </Text>
                    </View>
                    <View style={{ alignItems: "center" }}>
                      <Text
                        style={{
                          fontFamily: "Inter_700Bold",
                          color: "#fff",
                          fontSize: 16,
                        }}
                      >
                        {Math.floor(totalSteps / 500)}
                      </Text>
                      <Text
                        style={{
                          fontFamily: "Inter_500Medium",
                          color: "#888",
                          fontSize: 11,
                          marginTop: 4,
                        }}
                      >
                        Floors
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* ── TOP METRICS ROW (from inspiration) ── */}
                <View style={s.row}>
                  {/* Card 1: Steps Behind */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCurrentScreen("DeficitDetail");
                    }}
                    style={[s.card, s.halfCard, { marginRight: 8 }]}
                  >
                    <View>
                      <View style={s.cardHeader}>
                        <Text style={s.cardTitle}>Deficit</Text>
                        <ArrowRight />
                      </View>
                      <Text style={s.metricLabel}>Steps behind</Text>
                      <Text style={[s.metricValue, { color: C.blue }]}>
                        {Math.max(0, 10000 - totalSteps).toLocaleString()}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <DeficitVisual currentSteps={totalSteps} />
                      <View
                        style={{
                          alignSelf: "flex-end",
                          padding: 6,
                          backgroundColor: "rgba(60, 168, 255, 0.15)",
                          borderRadius: 8,
                        }}
                      >
                        <Ionicons name="walk" size={16} color={C.blue} />
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Card 2: Trend */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCurrentScreen("TrendDetail");
                    }}
                    style={[s.card, s.halfCard, { marginLeft: 8 }]}
                  >
                    <View>
                      <View style={s.cardHeader}>
                        <Text style={s.cardTitle}>Progress</Text>
                        <ArrowRight />
                      </View>

              
                      <Text style={s.metricLabel}>Daily Goal</Text>
                      <Text style={[s.metricValue, { color: C.orange }]}>
                        {Math.min(100, Math.floor((totalSteps / 10000) * 100))}%
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <TrendVisual currentSteps={totalSteps} />
                      <View
                        style={{
                          alignSelf: "flex-end",
                          padding: 6,
                          backgroundColor: "rgba(255, 92, 0, 0.15)",
                          borderRadius: 8,
                        }}
                      >
                        <Ionicons name="arrow-up" size={16} color={C.orange} />
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>

{/* ── ROW 1: SLEEP & WATER ── */}
                {/* ── ROW 1: WATER & WEIGHT ── */}
                <View style={s.row}>
                  {/* WATER */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCurrentScreen("WaterDetail");
                    }}
                    style={[s.card, s.halfCard, { marginRight: 8 }]}
                  >
                    <View>
                      <View style={s.cardHeader}>
                        <Text style={s.cardTitle}>Water</Text>
                        <ArrowRight />
                      </View>
                      <Text style={s.metricLabel}>Today</Text>
                      <Text style={[s.metricValue, { color: C.blue }]}>
                        {(waterGlasses * 0.25).toFixed(1)}L
                      </Text>
                    </View>
                    <WaterDrops />
                  </TouchableOpacity>

                  {/* WEIGHT */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCurrentScreen("WeightDetail");
                    }}
                    style={[s.card, s.halfCard, { marginLeft: 8 }]}
                  >
                    <View>
                      <View style={s.cardHeader}>
                        <Text style={s.cardTitle}>Weight</Text>
                        <ArrowRight />
                      </View>
                      <Text style={s.metricLabel}>Current</Text>
                      <Text style={[s.metricValue, { color: C.orange }]}>
                        {weightKg === 0 ? '--' : weightKg.toFixed(1)} <Text style={{ fontSize: 16 }}>kg</Text>
                      </Text>
                    </View>
                    <WeightVisual />
                  </TouchableOpacity>
                </View>

              </>
            )}

            {/* ================================================================= */}
            {/*                          PROGRAM TAB                              */}
            {/* ================================================================= */}
            {activeTab === "Program" && (
              <>
                {/* ── HEADER ── */}
                <View style={s.header}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.headerTextLine}>
                      <Text
                        style={{
                          color: C.muted,
                          fontFamily: "Inter_500Medium",
                        }}
                      >
                        Program{" "}
                      </Text>
                      <Text
                        style={{
                          color: "#fff",
                          fontFamily: "Inter_800ExtraBold",
                        }}
                      >
                        Overview
                      </Text>
                    </Text>
                    <Text style={s.headerTextLine}>
                      <Text
                        style={{
                          color: C.muted,
                          fontFamily: "Inter_500Medium",
                        }}
                      >
                        Track your{" "}
                      </Text>
                      <Text
                        style={{
                          color: "#fff",
                          fontFamily: "Inter_800ExtraBold",
                        }}
                      >
                        progress
                      </Text>
                    </Text>
                  </View>

                  <View style={s.avatarWrap}>
                    <Ionicons name="person" size={24} color="#666" />
                  </View>
                </View>

                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
                  <Ionicons name="construct-outline" size={48} color={C.muted} />
                  <Text style={{ color: C.muted, fontFamily: 'Inter_500Medium', marginTop: 16 }}>
                    Ready for a new feature...
                  </Text>
                </View>
              </>
            )}

            {/* ================================================================= */}
            {/*                          ACCOUNT TAB                              */}
            {/* ================================================================= */}
            {activeTab === "Account" && <AccountProfileScreen />}

            {/* Spacer for floating tab bar */}
            <View style={{ height: 130 }} />
          </>
        )}
      </Animated.ScrollView>

      {/* Only show TabBar if we are on the Main screen */}
      {currentScreen === "Main" && (
        <TabBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          translateY={translateY}
        />
      )}

      {/* ================================================================= */}
      {/*                        SUB-SCREENS                                */}
      {/* ================================================================= */}

      <SlideInScreen visible={currentScreen === "ActivityDetail"}>
        <ActivityDetailScreen
          onBack={() => setCurrentScreen("Main")}
          currentSteps={totalSteps}
        />
      </SlideInScreen>

      <SlideInScreen visible={currentScreen === "SleepDetail"}>
        <SleepDetailScreen 
          onBack={() => setCurrentScreen("Main")} 
          sleepHours={sleepHours} 
          sleepMins={sleepMins} 
          setSleepHours={setSleepHours} 
          setSleepMins={setSleepMins} 
        />
      </SlideInScreen>

      <SlideInScreen visible={currentScreen === "WaterDetail"}>
        <WaterDetailScreen 
          onBack={() => setCurrentScreen("Main")} 
          waterGlasses={waterGlasses} 
          setWaterGlasses={setWaterGlasses} 
        />
      </SlideInScreen>

      <SlideInScreen visible={currentScreen === "WeightDetail"}>
        <WeightDetailScreen 
          onBack={() => setCurrentScreen("Main")} 
          weightKg={weightKg} 
          setWeightKg={setWeightKg} 
        />
      </SlideInScreen>

      <SlideInScreen visible={currentScreen === "HeartRateDetail"}>
        <HeartRateDetailScreen onBack={() => setCurrentScreen("Main")} />
      </SlideInScreen>

      <SlideInScreen visible={currentScreen === "SummaryDetail"}>
        <SummaryDetailScreen
          onBack={() => setCurrentScreen("Main")}
          currentSteps={totalSteps}
        />
      </SlideInScreen>

      <SlideInScreen visible={currentScreen === "DeficitDetail"}>
        <DeficitDetailScreen
          onBack={() => setCurrentScreen("Main")}
          currentSteps={totalSteps}
        />
      </SlideInScreen>

      <SlideInScreen visible={currentScreen === "TrendDetail"}>
        <TrendDetailScreen
          onBack={() => setCurrentScreen("Main")}
          currentSteps={totalSteps}
        />
      </SlideInScreen>
    </SafeAreaView>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { padding: 16, paddingTop: 10 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 26,
    paddingHorizontal: 4,
  },
  headerTextLine: {
    fontFamily: "Inter_500Medium",
    fontSize: 21,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1f1f21",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
    marginTop: 4,
  },

  // Cards
  card: {
    backgroundColor: C.card,
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  halfCard: {
    flex: 1,
    justifyContent: "space-between",
  },
  row: { flexDirection: "row" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: C.text,
    letterSpacing: -0.3,
  },
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: C.muted,
    marginBottom: 2,
  },
  metricValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    letterSpacing: -0.5,
  },

  // Charts Common
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  chartLabelText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: "#555",
  },

  // Sleep Chart
  sleepChartWrapper: { marginTop: 16 },
  sleepChartInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 44,
  },
  sleepTrackCol: { alignItems: "center", width: 6 },
  sleepBar: { width: 3, height: "100%", borderRadius: 3 },
  sleepTriangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: C.purple,
    position: "absolute",
    bottom: -10,
  },

  // Water
  waterDropsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 32,
  },
  waterTriangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: C.blue,
    position: "absolute",
    bottom: -8,
  },
  waterBottomText: {
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    fontSize: 11,
  },

  // Weight
  weightVisualContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 32,
  },
  weightTrendBadge: {
    backgroundColor: "rgba(255, 92, 0, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  weightTrendText: {
    fontFamily: "Inter_700Bold",
    color: C.orange,
    fontSize: 11,
  },

  // Heart Rate
  hrVisualContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 32,
  },
  hrBar: { width: 4, backgroundColor: C.pink, borderRadius: 2 },

  // Tab Bar
  tabBarContainer: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  tabActiveOuter: {
    borderRadius: 32,
    padding: 1.5, // outer border thickness
    backgroundColor: C.lime, // outer border color
  },
  tabActiveGap: {
    borderRadius: 30,
    padding: 3, // gap thickness
    backgroundColor: "#000", // gap color
  },
  tabActiveInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    borderRadius: 27,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8, // space between icon and text
  },
  tabLabelActive: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 13,
    color: "#fff",
  },
  tabInactiveBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.08)", // glassy dark
    alignItems: "center",
    justifyContent: "center",
  },

  // Settings
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  settingText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text },
});
