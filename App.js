import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { Pedometer } from "expo-sensors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useRef, useEffect } from "react";
import { useFonts } from "expo-font";
import {
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import * as Location from "expo-location";
import { WebView } from "react-native-webview";
import {
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Modal,
  PanResponder,
  Platform,
  StatusBar as RNStatusBar,
  BackHandler,
  FlatList,
  Alert,
  Switch,
} from "react-native";

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
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
const Stack = createNativeStackNavigator();
import { useAppStore } from "./store/useAppStore";
import Onboarding from "./Onboarding";
import SignIn from "./SignIn";

const { width: W } = Dimensions.get("window");

// ─── TOKENS ────────────────────────────────────────────────────────────────
const C = {
  bg: "#000000",
  card: "rgba(255, 255, 255, 0.05)", // Glassy translucent
  cardBorder: "rgba(255, 255, 255, 0.5)", // Prominent white border
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
  const xLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Calculate today's index in a Mon-Sun week (Mon=0, Sun=6)
  const todayIdx = (new Date().getDay() + 6) % 7;

  // Calculate today's blocks (max 10 blocks, 300 steps per block)
  const filledBlocks = Math.min(10, Math.floor(currentSteps / 300));
  const emptyBlocks = 10 - filledBlocks;
  const todayCol = [
    ...Array(emptyBlocks).fill(0),
    ...Array(filledBlocks).fill(2),
  ];

  // 0 = empty (dark gray), 1 = filled (muted blue), 2 = active (bright blue)
  const hasSteps = currentSteps > 0;

  const colData = Array.from({ length: 7 }, (_, i) => {
    if (i === todayIdx) return todayCol;
    if (i < todayIdx) {
      // Mock past data
      return hasSteps
        ? [0, 0, 0, 0, 0, 1, 1, 1, 1, 1]
        : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    // Future days are empty
    return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  });

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
                if (val === 2) {
                  const depthColors = [
                    "#002288", // 0 (top, deepest)
                    "#0033aa", // 1
                    "#0044cc", // 2
                    "#0055ee", // 3
                    "#1166ff", // 4
                    "#3388ff", // 5
                    "#55aaff", // 6
                    "#77ccff", // 7
                    "#99eeff", // 8
                    "#bbffff", // 9 (bottom, lightest)
                  ];
                  bg = depthColors[rIdx];
                }

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
                color: cIdx === todayIdx ? "#fff" : "#555",
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
  const calorieDeficit = Math.round(currentSteps * 0.04);
  // Cap visual percent at 1000 active calories
  const percent = Math.min(1, calorieDeficit / 1000);
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
  const dailyStepGoal = useAppStore((s) => s.dailyStepGoal) || 10000;
  const percent = Math.min(1, currentSteps / dailyStepGoal);
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

function SmoothLineChart({ chartData }) {
  const width = W - 72;
  const height = 160;
  const rawData = chartData ? chartData.map(d => d.val) : [74.1, 73.8, 73.5, 73.9, 73.2, 72.8, 72.4];
  const days = chartData ? chartData.map(d => d.day) : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const min = Math.min(...rawData) - 1;
  const max = Math.max(...rawData) + 1;

  const data = rawData.map((d, i) => ({
    x: i / (rawData.length - 1),
    y: (d - min) / (max - min),
    val: d,
    day: days[i],
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

  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleTouch = (evt) => {
    const touchX = evt.nativeEvent.locationX;
    let closestIdx = 0;
    let minDist = Infinity;
    data.forEach((d, i) => {
      const px = d.x * width;
      const dist = Math.abs(px - touchX);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    });
    setSelectedIndex(closestIdx);
  };

  return (
    <View style={{ marginTop: 24, position: "relative" }}>
      {selectedIndex !== null && (
        <View
          style={{
            position: "absolute",
            top: -20,
            left: Math.max(0, Math.min(data[selectedIndex].x * width - 24, width - 48)),
            backgroundColor: C.cardBorder,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            alignItems: "center",
            zIndex: 10,
          }}
        >
          <Text style={{ color: C.text, fontSize: 12, fontFamily: "Inter_600SemiBold" }}>
            {data[selectedIndex].val}kg
          </Text>
        </View>
      )}
      <View
        onStartShouldSetResponder={() => true}
        onResponderGrant={handleTouch}
        onResponderMove={handleTouch}
        onResponderRelease={() => setSelectedIndex(null)}
      >
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={C.orange} stopOpacity="0.5" />
              <Stop offset="1" stopColor={C.orange} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>
          <Path d={areaPath} fill="url(#orangeGrad)" />
          <Path d={linePath} fill="none" stroke={C.orange} strokeWidth={4} />
          {data.map((d, i) => (
            <G key={i}>
              {selectedIndex === i && (
                <SvgLine
                  x1={d.x * width}
                  y1={(1 - d.y) * (height - 40) + 20}
                  x2={d.x * width}
                  y2={height}
                  stroke={C.orange}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              )}
              <Circle
                cx={d.x * width}
                cy={(1 - d.y) * (height - 40) + 20}
                r={selectedIndex === i ? 7 : 5}
                fill={selectedIndex === i ? C.orange : C.bg}
                stroke={C.orange}
                strokeWidth={3}
              />
            </G>
          ))}
        </Svg>
      </View>
    </View>
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
  const dailyStepGoal = useAppStore((s) => s.dailyStepGoal) || 10000;
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
            Total Steps (Last 7 Days)
          </Text>
          <Text
            style={{
              fontFamily: "Inter_800ExtraBold",
              fontSize: 56,
              color: C.blue,
              letterSpacing: -2,
            }}
          >
            {currentSteps.toLocaleString()}
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
              {dailyStepGoal.toLocaleString()}
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

// ─── RUNNING TRACKER ────────────────────────────────────────────────────────

const getDistance = (start, end) => {
  const R = 6371e3; // metres
  const lat1 = (start.latitude * Math.PI) / 180;
  const lat2 = (end.latitude * Math.PI) / 180;
  const deltaLat = ((end.latitude - start.latitude) * Math.PI) / 180;
  const deltaLon = ((end.longitude - start.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
    Math.cos(lat2) *
    Math.sin(deltaLon / 2) *
    Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const customDarkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'poi.park', elementType: 'labels.text.stroke', stylers: [{ color: '#1b1b1b' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#4e4e4e' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
];

function projectCoordinates(coords, width, height, padding = 40) {
  if (coords.length === 0) return { pathString: "", currentPoint: null };
  if (coords.length === 1) {
    const cx = width / 2;
    const cy = height / 2;
    return {
      pathString: `M ${cx},${cy}`,
      currentPoint: { x: cx, y: cy }
    };
  }

  const lats = coords.map(c => c.latitude);
  const lons = coords.map(c => c.longitude);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const latRange = maxLat - minLat || 0.001;
  const lonRange = maxLon - minLon || 0.001;

  const avgLat = (minLat + maxLat) / 2;
  const lonScale = Math.cos(avgLat * Math.PI / 180);

  const adjLonRange = lonRange * lonScale;

  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const scaleX = usableWidth / adjLonRange;
  const scaleY = usableHeight / latRange;

  const scale = Math.min(scaleX, scaleY);

  const xOffset = padding + (usableWidth - (adjLonRange * scale)) / 2;
  const yOffset = padding + (usableHeight - (latRange * scale)) / 2;

  const points = coords.map(c => {
    const x = xOffset + ((c.longitude - minLon) * lonScale) * scale;
    const y = yOffset + (usableHeight - ((c.latitude - minLat) * scale));
    return { x, y };
  });

  const pathString = "M " + points.map(p => `${p.x},${p.y}`).join(" L ");
  return {
    pathString,
    currentPoint: points[points.length - 1]
  };
}

function RunningTracker({ onClose, onUIToggle, scrollY, viewingRun, setViewingRun }) {
  const startRun = useAppStore((s) => s.startRun);
  const endRun = useAppStore((s) => s.endRun);
  const runs = useAppStore((s) => s.runs);
  const deleteRun = useAppStore((s) => s.deleteRun);

  const [hasPermission, setHasPermission] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [distance, setDistance] = useState(0); // in meters
  const [duration, setDuration] = useState(0); // in seconds
  const [currentRegion, setCurrentRegion] = useState(null);
  const [isUIVisible, setIsUIVisible] = useState(true);

  const locationSubscription = useRef(null);
  const timerInterval = useRef(null);
  const webViewRef = useRef(null);
  const uiOpacity = useRef(new Animated.Value(1)).current;

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Bottom Sheet Swipe Physics (Bulletproof Implementation)
  const sheetHeight = screenHeight * 0.85; // Covers 85% of screen when expanded
  const collapsedHeight = 250;
  const maxTranslateY = sheetHeight - collapsedHeight;

  const panY = useRef(new Animated.Value(maxTranslateY)).current;
  const lastPanY = useRef(maxTranslateY);

  useEffect(() => {
    // Force reset on mount in case of hot reload
    panY.setValue(maxTranslateY);
    lastPanY.current = maxTranslateY;
  }, [maxTranslateY]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderGrant: () => {
        // Do nothing, we track state manually via lastPanY
      },
      onPanResponderMove: (_, gestureState) => {
        let newY = lastPanY.current + gestureState.dy;
        if (newY < 0) newY = 0; // clamp top (fully expanded)
        if (newY > maxTranslateY) newY = maxTranslateY; // clamp bottom (fully collapsed)
        panY.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        let newY = lastPanY.current + gestureState.dy;
        let toValue = maxTranslateY; // default to collapse

        // Determine snap point based on velocity or drag distance
        if (gestureState.vy < -0.5) {
          toValue = 0;
        } else if (gestureState.vy > 0.5) {
          toValue = maxTranslateY;
        } else if (newY < maxTranslateY / 2) {
          toValue = 0;
        }

        Animated.spring(panY, {
          toValue,
          tension: 60,
          friction: 9,
          useNativeDriver: true
        }).start();

        lastPanY.current = toValue;
      }
    })
  ).current;

  const toggleSheet = () => {
    const isExpanded = lastPanY.current === 0;
    const toValue = isExpanded ? maxTranslateY : 0;

    Animated.spring(panY, {
      toValue,
      tension: 60,
      friction: 9,
      useNativeDriver: true
    }).start();
    lastPanY.current = toValue;
  };

  useEffect(() => {
    Animated.timing(uiOpacity, {
      toValue: isUIVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (onUIToggle) {
      onUIToggle(isUIVisible);
    }
  }, [isUIVisible]);

  useEffect(() => {
    const route = viewingRun ? viewingRun.route : routeCoordinates;
    if (webViewRef.current && route && route.length > 0) {
      const latLngs = route.map(c => [c.latitude, c.longitude]);
      webViewRef.current.injectJavaScript(`
        if (typeof polyline !== 'undefined' && typeof circle !== 'undefined' && typeof map !== 'undefined') {
          var coords = ${JSON.stringify(latLngs)};
          polyline.setLatLngs(coords);
          var lastCoord = coords[coords.length - 1];
          circle.setLatLng(lastCoord);
          if (${!!viewingRun}) {
            map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
          } else {
            map.panTo(lastCoord);
          }
        }
        true;
      `);
    }
  }, [routeCoordinates, viewingRun]);

  useEffect(() => {
    if (viewingRun && viewingRun.route && viewingRun.route.length > 0) {
      setHasPermission(true);
      setCurrentRegion({
        latitude: viewingRun.route[0].latitude,
        longitude: viewingRun.route[0].longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      return;
    }

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        setCurrentRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      }
    })();
  }, []);

  const startTracking = async () => {
    if (!hasPermission) {
      Alert.alert("Permission denied", "Allow location access to track runs.");
      return;
    }
    setRouteCoordinates([]);
    setDistance(0);
    setDuration(0);
    setIsTracking(true);
    startRun(); // Write to store
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (loc) => {
        const { latitude, longitude } = loc.coords;
        const newCoord = { latitude, longitude };

        setRouteCoordinates(prev => {
          if (prev.length > 0) {
            const lastCoord = prev[prev.length - 1];
            const dist = getDistance(lastCoord, newCoord);
            setDistance(d => d + dist);
          }
          return [...prev, newCoord];
        });
      }
    );

    timerInterval.current = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);
  };

  const stopTracking = () => {
    setIsTracking(false);

    // Save to store only if some distance was covered
    if (distance > 10) {
      endRun({ distanceMeters: distance, durationSec: duration, route: routeCoordinates });
    } else {
      endRun({ distanceMeters: 0, durationSec: 0, route: [] }); // Or we might not save if it's too short
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const distanceKm = viewingRun ? viewingRun.distanceKm : (distance / 1000);
  const durSecs = viewingRun ? viewingRun.durationSec : duration;
  let paceStr = "--:--";
  if (distanceKm > 0) {
    const paceSecs = durSecs / distanceKm;
    paceStr = formatTime(Math.round(paceSecs));
  }

  const { pathString, currentPoint } = projectCoordinates(routeCoordinates, screenWidth, screenHeight, 60);

  if (hasPermission === false) {
    return (
      <View style={{ height: screenHeight, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: C.muted, fontFamily: 'Inter_500Medium' }}>Location permission denied.</Text>
      </View>
    );
  }

  if (!currentRegion) {
    return (
      <View style={{ height: screenHeight, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: C.muted, fontFamily: 'Inter_500Medium', marginTop: 16 }}>Locating GPS...</Text>
      </View>
    );
  }

  return (
    <View style={{ height: screenHeight, backgroundColor: '#000' }}>

      <WebView
        ref={webViewRef}
        style={StyleSheet.absoluteFillObject}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        source={{
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
              <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
              <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
              <style>
                body { padding: 0; margin: 0; background-color: #000; overflow: hidden; }
                #map { height: 100vh; width: 100vw; background-color: #000; }
                .leaflet-control-attribution { display: none !important; }
                .leaflet-control-zoom { display: none !important; }
                
                /* Invert OSM tiles to create a gorgeous Dark Mode */
                .leaflet-layer,
                .leaflet-control-zoom-in,
                .leaflet-control-zoom-out,
                .leaflet-control-attribution {
                  filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
                }
              </style>
            </head>
            <body>
              <div id="map"></div>
              <script>
                var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${currentRegion.latitude}, ${currentRegion.longitude}], 16);
                
                map.on('click', function() {
                  window.ReactNativeWebView.postMessage("TOGGLE_UI");
                });

                // Use completely free standard OpenStreetMap tiles (the CSS filter above makes them dark)
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                  maxZoom: 19
                }).addTo(map);

                var polyline = L.polyline([], {
                  color: '#3CA8FF',
                  weight: 6,
                  opacity: 1,
                  lineJoin: 'round',
                  lineCap: 'round'
                }).addTo(map);

                var circle = L.circleMarker([${currentRegion.latitude}, ${currentRegion.longitude}], {
                  color: '#3CA8FF',
                  fillColor: '#3CA8FF',
                  fillOpacity: 1,
                  radius: 7,
                  weight: 2
                }).addTo(map);
              </script>
            </body>
            </html>
          `
        }}
        onMessage={(event) => {
          if (event.nativeEvent.data === "TOGGLE_UI") {
            setIsUIVisible(prev => !prev);
          }
        }}
      />

      <Animated.View
        style={[StyleSheet.absoluteFillObject, { opacity: uiOpacity }]}
        pointerEvents={isUIVisible ? "box-none" : "none"}
      >
        {/* Top Floating Icons */}
        <View style={{ position: 'absolute', top: 60, left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(28,28,30,0.8)', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="location-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(28,28,30,0.8)', justifyContent: 'center', alignItems: 'center' }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (onClose) onClose();
            }}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Bottom Sheet Panel (Runbuds style - Draggable) */}
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: sheetHeight,
            backgroundColor: '#000000',
            borderTopLeftRadius: 36, borderTopRightRadius: 36,
            borderTopWidth: 1, borderTopColor: '#333',
            paddingTop: 16, paddingHorizontal: 24,
            shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.8, shadowRadius: 30,
            elevation: 24,
            transform: [{ translateY: panY }]
          }}
        >
          {/* Drag Handle (Interactive via Tap & Swipe) */}
          <TouchableOpacity
            onPress={toggleSheet}
            activeOpacity={0.7}
            style={{ width: '100%', paddingVertical: 12, alignItems: 'center', marginBottom: 12 }}
          >
            <View style={{ width: 48, height: 5, borderRadius: 3, backgroundColor: '#888' }} />
          </TouchableOpacity>

          {/* Title & Action Button */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name={isTracking ? "pulse" : "walk"}
                size={24}
                color={isTracking ? "#ff3b30" : C.cyan}
                style={{ marginRight: 10 }}
              />
              <Text style={{ color: '#fff', fontSize: 24, fontFamily: 'Inter_600SemiBold' }}>
                {viewingRun ? "Viewing Run" : (isTracking ? "Active Run" : "Ready to Run")}
              </Text>
            </View>

            {!viewingRun && (
              <TouchableOpacity
                onPress={isTracking ? stopTracking : startTracking}
                style={{
                  width: 52, height: 52, borderRadius: 26,
                  backgroundColor: isTracking ? '#ff3b30' : C.cyan,
                  justifyContent: 'center', alignItems: 'center',
                }}
              >
                <Ionicons name={isTracking ? "square" : "play"} size={26} color={isTracking ? "#fff" : "#000"} style={isTracking ? {} : { marginLeft: 3 }} />
              </TouchableOpacity>
            )}
          </View>

          {/* Main Metrics Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 }}>
            <View>
              <Text style={{ fontFamily: 'monospace', color: '#fff', fontSize: 28, fontWeight: '800' }}>
                {distanceKm.toFixed(2)}
              </Text>
              <Text style={{ fontFamily: 'Inter_500Medium', color: '#888', fontSize: 11, marginTop: 4, letterSpacing: 1.2 }}>KM</Text>
            </View>
            <View>
              <Text style={{ fontFamily: 'monospace', color: '#fff', fontSize: 28, fontWeight: '800' }}>
                {formatTime(durSecs)}
              </Text>
              <Text style={{ fontFamily: 'Inter_500Medium', color: '#888', fontSize: 11, marginTop: 4, letterSpacing: 1.2 }}>TIME</Text>
            </View>
            <View>
              <Text style={{ fontFamily: 'monospace', color: '#fff', fontSize: 28, fontWeight: '800' }}>
                {paceStr}
              </Text>
              <Text style={{ fontFamily: 'Inter_500Medium', color: '#888', fontSize: 11, marginTop: 4, letterSpacing: 1.2 }}>PACE</Text>
            </View>
          </View>

          {/* Separator */}
          <View style={{ height: 1, backgroundColor: '#333', marginBottom: 24 }} />

          {/* Secondary Stats Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Inter_500Medium', color: '#888', fontSize: 10, letterSpacing: 1.5, marginBottom: 4 }}>SPLIT</Text>
              <Text style={{ fontFamily: 'monospace', color: '#fff', fontSize: 16, fontWeight: '600' }}>{distanceKm > 0.5 ? "5:30" : "--"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Inter_500Medium', color: '#888', fontSize: 10, letterSpacing: 1.5, marginBottom: 4 }}>AVG PACE</Text>
              <Text style={{ fontFamily: 'monospace', color: '#fff', fontSize: 16, fontWeight: '600' }}>{paceStr}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Inter_500Medium', color: '#888', fontSize: 10, letterSpacing: 1.5, marginBottom: 4 }}>HR</Text>
              <Text style={{ fontFamily: 'monospace', color: '#fff', fontSize: 16, fontWeight: '600' }}>--</Text>
            </View>
          </View>

          {/* Past Runs History */}
          <View style={{ flex: 1, marginTop: 32 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', color: '#666', fontSize: 12, letterSpacing: 1, marginBottom: 16 }}>PAST RUNS</Text>
            <Animated.ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              onScroll={scrollY ? Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
              ) : undefined}
              scrollEventThrottle={16}
            >
              {(!runs || !Array.isArray(runs) || runs.length === 0) ? (
                <View style={{ alignItems: 'center', marginTop: 24 }}>
                  <Ionicons name="map-outline" size={48} color="#222" />
                  <Text style={{ color: '#444', fontFamily: 'Inter_500Medium', marginTop: 16 }}>No runs yet. Start moving!</Text>
                </View>
              ) : (
                runs.slice().reverse().map((run, idx) => {
                  if (!run) return null;
                  const dist = typeof run.distanceKm === 'number' ? run.distanceKm.toFixed(2) : '0.00';
                  const cals = typeof run.caloriesBurned === 'number' ? run.caloriesBurned : 0;
                  const dateStr = run.date ? new Date(run.date).toLocaleDateString() : 'N/A';
                  const durStr = formatTime(typeof run.durationSec === 'number' ? run.durationSec : 0);

                  return (
                    <TouchableOpacity 
                      key={run.id || idx} 
                      onPress={() => setViewingRun(run)}
                      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 16, borderRadius: 16, marginBottom: 12 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(60, 168, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                        <Ionicons name="walk" size={20} color={C.cyan} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 16 }}>{dist} KM</Text>
                        <Text style={{ color: '#888', fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 4 }}>
                          {dateStr} - {durStr}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
                        <Text style={{ color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>{cals} kcal</Text>
                      </View>
                      <TouchableOpacity onPress={() => {
                        deleteRun(run.id);
                        if (viewingRun && viewingRun.id === run.id) {
                          setViewingRun(null);
                        }
                      }} style={{ padding: 8 }}>
                        <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })
              )}
            </Animated.ScrollView>
          </View>
        </Animated.View>

      </Animated.View>
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
  const [isEditing, setIsEditing] = useState(false);
  const [tempWeight, setTempWeight] = useState(weightKg > 0 ? String(weightKg) : "");
  const chartData = [
    { day: "Mon", val: 74.1 },
    { day: "Tue", val: 73.8 },
    { day: "Wed", val: 73.5 },
    { day: "Thu", val: 73.9 },
    { day: "Fri", val: 73.2 },
    { day: "Sat", val: 72.8 },
    { day: "Today", val: weightKg > 0 ? weightKg : 72.4 },
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
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: "center", marginTop: 16, marginBottom: 32 }}>
          {isEditing ? (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
              <TextInput
                style={{
                  fontFamily: "Inter_800ExtraBold",
                  fontSize: 56,
                  color: "#fff",
                  letterSpacing: -2,
                  padding: 0,
                  margin: 0,
                }}
                value={tempWeight}
                onChangeText={setTempWeight}
                keyboardType="decimal-pad"
                autoFocus={true}
                cursorColor={C.orange}
                selectionColor={C.orange}
                returnKeyType="done"
                onBlur={() => {
                  setIsEditing(false);
                  const p = parseFloat(tempWeight);
                  if (!isNaN(p)) setWeightKg(p);
                }}
                onSubmitEditing={() => {
                  setIsEditing(false);
                  const p = parseFloat(tempWeight);
                  if (!isNaN(p)) setWeightKg(p);
                }}
              />
              <Text style={{ fontFamily: "Inter_800ExtraBold", fontSize: 32, color: C.orange, marginBottom: 8, marginLeft: 4 }}>kg</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsEditing(false);
                  const p = parseFloat(tempWeight);
                  if (!isNaN(p)) setWeightKg(p);
                }}
                style={{
                  marginLeft: 16,
                  marginBottom: 12,
                  backgroundColor: C.orange,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}
              onPress={() => {
                setTempWeight(weightKg > 0 ? String(weightKg) : "");
                setIsEditing(true);
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_800ExtraBold",
                  fontSize: 56,
                  color: "#fff",
                  letterSpacing: -2,
                  textAlign: 'center',
                  minWidth: 100,
                }}
              >
                {weightKg > 0 ? String(weightKg) : "--"}
              </Text>
              <Text style={{ fontFamily: "Inter_800ExtraBold", fontSize: 32, color: C.orange, marginBottom: 8, marginLeft: 4 }}>kg</Text>
            </TouchableOpacity>
          )}

          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 14,
              color: C.muted,
              marginTop: 4,
            }}
          >
            Tap weight to log today's entry
          </Text>
        </View>
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>7-Day Trend</Text>
            <Ionicons name="trending-down" size={16} color={C.orange} />
          </View>
          <SmoothLineChart chartData={chartData} />
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

function SummaryDetailScreen({ onBack, currentSteps = 0, runStats = { distanceKm: 0, caloriesBurned: 0 } }) {
  const dailyStepGoal = useAppStore((s) => s.dailyStepGoal) || 10000;
  const stepDistance = currentSteps * 0.00044;
  const runDistance = runStats.distanceKm * 0.621371; // km to miles
  const distance = (stepDistance + runDistance).toFixed(2);

  const stepCalories = Math.floor(currentSteps * 0.045);
  const calories = stepCalories + runStats.caloriesBurned;

  const floors = Math.floor(currentSteps / 500);
  const progress = Math.min(100, Math.floor((currentSteps / dailyStepGoal) * 100));
  const activeTime = Math.floor(currentSteps / 100) + Math.floor(runStats.durationSec / 60);

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
  const calorieDeficit = Math.round(currentSteps * 0.04);
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
            fontWeight: "700",
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
          Active Calorie Deficit
        </Text>
        <Text
          style={{
            fontFamily: "Inter_800ExtraBold",
            fontSize: 56,
            color: C.blue,
            letterSpacing: -2,
          }}
        >
          {calorieDeficit.toLocaleString()} <Text style={{ fontSize: 24, color: C.muted }}>kcal</Text>
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
          You've burned {calorieDeficit.toLocaleString()} extra calories today just by walking! Keep moving to increase your daily deficit.
        </Text>
      </View>
    </View>
  );
}

function TrendDetailScreen({ onBack, currentSteps = 0 }) {
  const dailyStepGoal = useAppStore((s) => s.dailyStepGoal) || 10000;
  const progress = Math.min(100, Math.floor((currentSteps / dailyStepGoal) * 100));
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

function AppleWalletRow({ icon, label, value, onPress, isDestructive, hideBorder, color }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 20,
        backgroundColor: '#000000', // Deep black
        borderBottomWidth: hideBorder ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{
          width: 38, height: 38, borderRadius: 10,
          backgroundColor: isDestructive ? 'rgba(255, 59, 48, 0.15)' : (color || '#007aff'),
          alignItems: 'center', justifyContent: 'center', marginRight: 16
        }}>
          <Ionicons name={icon} size={22} color={isDestructive ? "#ff3b30" : "#fff"} />
        </View>
        <View>
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 16, color: isDestructive ? "#ff3b30" : "#fff", marginBottom: value ? 2 : 0 }}>
            {label}
          </Text>
          {value && <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: "#8E8E93" }}>{value}</Text>}
        </View>
      </View>
      {!isDestructive && <Ionicons name="chevron-forward" size={18} color="#48484a" />}
    </TouchableOpacity>
  );
}


function AppleWalletSwitchRow({ icon, label, value, onValueChange, color }) {
  const tint = color || '#ffffff';
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: 'transparent',
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{
          width: 40, height: 40, borderRadius: 12,
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
          alignItems: 'center', justifyContent: 'center', marginRight: 16,
          shadowColor: tint, shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15, shadowRadius: 12,
        }}>
          <Ionicons name={icon} size={20} color={tint} />
        </View>
        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#ffffff", letterSpacing: -0.3 }}>
          {label}
        </Text>
      </View>
      <Switch 
        value={value} 
        onValueChange={(val) => {
          Haptics.selectionAsync();
          onValueChange(val);
        }} 
        trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#34c759' }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

function AccountProfileScreen({ setCurrentScreen }) {
  const userName = useAppStore((st) => st.userName);
  const setHasOnboarded = useAppStore((st) => st.setHasOnboarded);
  const setIsSignedIn = useAppStore((st) => st.setIsSignedIn);
  const isDarkMode = useAppStore((st) => st.isDarkMode);
  const setIsDarkMode = useAppStore((st) => st.setIsDarkMode);
  const dailyStepGoal = useAppStore((s) => s.dailyStepGoal) || 10000;
  const setDailyStepGoal = useAppStore((s) => s.setDailyStepGoal);
  const weightKg = useAppStore((s) => s.weightKg);
  const setWeightKg = useAppStore((s) => s.setWeightKg);
  const heightCm = useAppStore((s) => s.heightCm);
  const setHeightCm = useAppStore((s) => s.setHeightCm);
  const healthSync = useAppStore((s) => s.healthSync);
  const setHealthSync = useAppStore((s) => s.setHealthSync);
  const reminders = useAppStore((s) => s.reminders);
  const setReminders = useAppStore((s) => s.setReminders);

  const displayName = userName.trim() || "Athlete";

  const [unit, setUnit] = useState("Metric");
  const [lang, setLang] = useState("English");
  const [cals, setCals] = useState("2400");
  const [water, setWater] = useState("2.5");
  
  const [activeDial, setActiveDial] = useState(null);

  // Dial Configurations
  const getDialConfig = () => {
    switch (activeDial) {
      case 'goal': {
        const ACTUAL = Array.from({length: 26}, (_, i) => 5000 + (i * 1000));
        return { title: "Daily Step Goal", subtitle: "Scroll the dial to set your target", data: ACTUAL, options: [null, ...ACTUAL, null], value: dailyStepGoal, onChange: setDailyStepGoal, suffix: "steps" };
      }
      case 'weight': {
        const ACTUAL = Array.from({length: 101}, (_, i) => 40 + i);
        return { title: "Weight", subtitle: "Set your current weight", data: ACTUAL, options: [null, ...ACTUAL, null], value: weightKg, onChange: setWeightKg, suffix: unit === "Metric" ? "kg" : "lbs" };
      }
      case 'height': {
        const ACTUAL = Array.from({length: 101}, (_, i) => 120 + i);
        return { title: "Height", subtitle: "Set your current height", data: ACTUAL, options: [null, ...ACTUAL, null], value: heightCm, onChange: setHeightCm, suffix: unit === "Metric" ? "cm" : "in" };
      }
      case 'cals': {
        const ACTUAL = Array.from({length: 21}, (_, i) => 1500 + (i * 100));
        return { title: "Daily Calories", subtitle: "Set your daily calorie target", data: ACTUAL, options: [null, ...ACTUAL, null], value: parseInt(cals), onChange: (v) => setCals(v.toString()), suffix: "kcal" };
      }
      case 'water': {
        const ACTUAL = Array.from({length: 11}, (_, i) => 1.0 + (i * 0.5));
        return { title: "Daily Water", subtitle: "Set your daily hydration goal", data: ACTUAL, options: [null, ...ACTUAL, null], value: parseFloat(water), onChange: (v) => setWater(v.toFixed(1)), suffix: "L" };
      }
      case 'unit': {
        const ACTUAL = ["Metric", "Imperial"];
        return { title: "Measurement Units", subtitle: "Select your preferred unit system", data: ACTUAL, options: [null, ...ACTUAL, null], value: unit, onChange: setUnit, suffix: "" };
      }
      case 'lang': {
        const ACTUAL = ["English", "Español", "Français"];
        return { title: "App Language", subtitle: "Select your preferred language", data: ACTUAL, options: [null, ...ACTUAL, null], value: lang, onChange: setLang, suffix: "" };
      }
      default: return null;
    }
  };
  const dialConfig = getDialConfig();
  const ITEM_HEIGHT = 60;

    const showLegalAlert = (title) => {
    Alert.alert(title, "This is a functional prototype. The full terms and privacy policy will be available in the production release.", [{ text: "Understood", style: "default" }]);
  };
  const showVersionInfo = () => {
    Alert.alert("App Version", "You are running the latest version: v1.0.0 (Build 42)");
  };

const ListGroup = ({ title, children }) => (
    <View style={{ marginBottom: 32 }}>
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 16 }}>{title}</Text>
      <View style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)' }}>
        {children}
      </View>
    </View>
  );

  return (
    <View style={{ backgroundColor: '#000000', marginHorizontal: -16, marginTop: -10, paddingTop: 10, paddingHorizontal: 8, paddingBottom: 80, minHeight: Dimensions.get('window').height }}>
      
      {/* ── HERO PROFILE (APPLE FITNESS STYLE) ── */}
      <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 32 }}>
        <ExpoLinearGradient
          colors={['#9c89ff', '#f089e6', '#ffb95e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: '100%',
            height: 220,
            borderRadius: 24,
            padding: 24,
            justifyContent: 'space-between',
            shadowColor: '#f089e6',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 5
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Ionicons name="planet" size={32} color="rgba(255,255,255,0.4)" />
          </View>
          
          <View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 26, color: '#ffffff', marginBottom: 4, letterSpacing: -0.5 }}>
              {displayName}
            </Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>
              {dailyStepGoal.toLocaleString()} Steps Daily
            </Text>
          </View>
          
          <View style={{ position: 'absolute', bottom: -10, right: -10 }}>
            <Ionicons name="aperture" size={120} color="rgba(255,255,255,0.15)" />
          </View>
        </ExpoLinearGradient>
      </View>

      {/* ── GROUPED SETTINGS ── */}
      
      <ListGroup title="Body Metrics & Goals">
        <AppleWalletRow icon="person-outline" color="#ff9500" label="Height" value={heightCm + (unit === "Metric" ? " cm" : " in")} onPress={() => setActiveDial('height')} />
        <AppleWalletRow icon="barbell-outline" color="#34c759" label="Weight" value={weightKg + (unit === "Metric" ? " kg" : " lbs")} onPress={() => setActiveDial('weight')} />
        <AppleWalletRow icon="footsteps-outline" color="#b8ff1f" label="Daily Step Goal" value={dailyStepGoal.toLocaleString()} onPress={() => setActiveDial('goal')} />
        <AppleWalletRow icon="flame-outline" color="#ff3b30" label="Daily Calories" value={cals + " kcal"} onPress={() => setActiveDial('cals')} />
        <AppleWalletRow icon="water-outline" color="#32ade6" label="Daily Water" value={water + " L"} onPress={() => setActiveDial('water')} />
      </ListGroup>


      <ListGroup title="Preferences">
        <AppleWalletRow icon="calculator-outline" color="#5856d6" label="Units" value={unit} onPress={() => setActiveDial('unit')} />
        <AppleWalletRow icon="language-outline" color="#ff9500" label="Language" value={lang} onPress={() => setActiveDial('lang')} />
        <AppleWalletRow icon={isDarkMode ? "moon-outline" : "sunny-outline"} color="#ffcc00" label="Appearance" value={isDarkMode ? "Dark" : "Light"} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsDarkMode(!isDarkMode); }} />
      </ListGroup>

      <ListGroup title="Account & Legal">
        <AppleWalletRow icon="document-text-outline" color="#8e8e93" label="Terms of Service" onPress={() => showLegalAlert("Terms")} />
        <AppleWalletRow icon="shield-checkmark-outline" color="#8e8e93" label="Privacy Policy" onPress={() => showLegalAlert("Privacy")} />
        <AppleWalletRow icon="information-circle-outline" color="#8e8e93" label="App Version" value="v1.0.0" onPress={showVersionInfo} />
        <AppleWalletRow icon="log-out-outline" color="#ff3b30" label="Log Out" onPress={() => setIsSignedIn(false)} isDestructive />
      </ListGroup>
      
      {/* ── UNIFIED DIAL MODAL ── */}
      <Modal visible={activeDial !== null} transparent animationType="slide">
        {dialConfig && (
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <View style={{ backgroundColor: '#1c1c1e', padding: 32, borderTopLeftRadius: 40, borderTopRightRadius: 40 }}>
              
              <View style={{ alignItems: 'center', marginBottom: 32 }}>
                <View style={{ width: 40, height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginBottom: 24 }} />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: '#ffffff' }}>{dialConfig.title}</Text>
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: '#8e8e93', marginTop: 8 }}>{dialConfig.subtitle}</Text>
              </View>

              {/* WHEEL DIAL */}
              <View style={{ height: ITEM_HEIGHT * 3, overflow: 'hidden', justifyContent: 'center', marginBottom: 40 }}>
                <FlatList
                  key={activeDial}
                  data={dialConfig.options}
                  keyExtractor={(item, index) => index.toString()}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  scrollEventThrottle={16}
                  getItemLayout={(data, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                  initialScrollIndex={Math.max(0, dialConfig.data.indexOf(dialConfig.value))}
                  onScroll={(e) => {
                    const y = e.nativeEvent.contentOffset.y;
                    const index = Math.round(y / ITEM_HEIGHT);
                    if (index >= 0 && index < dialConfig.data.length) {
                      const selectedVal = dialConfig.data[index];
                      if (selectedVal && selectedVal !== dialConfig.value) {
                        dialConfig.onChange(selectedVal);
                        Haptics.selectionAsync();
                      }
                    }
                  }}
                  renderItem={({ item }) => {
                    if (item === null) return <View style={{ height: ITEM_HEIGHT }} />;
                    const isSelected = item === dialConfig.value;
                    return (
                      <View style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
                        <Text adjustsFontSizeToFit numberOfLines={1} style={{ 
                          fontFamily: 'Inter_600SemiBold', fontSize: isSelected ? 32 : 22, 
                          color: isSelected ? '#ffffff' : '#8e8e93', opacity: isSelected ? 1 : 0.4,
                          includeFontPadding: false, textAlignVertical: 'center', paddingHorizontal: 4
                        }}>
                          {item.toLocaleString()}
                        </Text>
                        {dialConfig.suffix && isSelected && (
                          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 16, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
                            {dialConfig.suffix}
                          </Text>
                        )}
                      </View>
                    );
                  }}
                />
                <View style={{ position: 'absolute', top: ITEM_HEIGHT, width: '100%', height: ITEM_HEIGHT, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#333', zIndex: -1 }} pointerEvents="none" />
              </View>

              <TouchableOpacity onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setActiveDial(null); }} style={{ backgroundColor: '#ffffff', paddingVertical: 18, borderRadius: 30, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#000000' }}>Done</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveDial(null)} style={{ paddingVertical: 18, alignItems: 'center', marginTop: 8 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#8e8e93' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      
    </View>
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
  const [fontsLoaded, fontError] = useFonts({
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  const hasHydrated = useAppStore((st) => st._hasHydrated);
  const hasOnboarded = useAppStore((st) => st.hasOnboarded);
  const isSignedIn = useAppStore((st) => st.isSignedIn);

  if ((!fontsLoaded && !fontError) || !hasHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000000" }}>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!hasOnboarded ? (
          <Stack.Screen name="Onboarding" component={Onboarding} />
        ) : !isSignedIn ? (
          <Stack.Screen name="SignIn" component={SignIn} />
        ) : (
          <Stack.Screen name="MainApp" component={MainApp} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function MainApp() {
  const [activeTab, setActiveTab] = useState("Home");
  const [currentScreen, setCurrentScreen] = useState("Main"); // 'Main' | 'SleepDetail'
  const [isTrackerUIVisible, setIsTrackerUIVisible] = useState(true);
  const [viewingRun, setViewingRun] = useState(null);

  // Real Hardware Pedometer State
  const [isPedometerAvailable, setIsPedometerAvailable] = useState("checking");

  // Hardware Back Button Handler
  useEffect(() => {
    const backAction = () => {
      if (currentScreen !== "Main") {
        setCurrentScreen("Main");
        return true; // Prevent default behavior (exit)
      }
      if (activeTab !== "Home") {
        setActiveTab("Home");
        return true; // Prevent default behavior (exit)
      }
      return false; // Let default behavior happen (exit app)
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [currentScreen, activeTab]);

  const pastStepCount = useAppStore((s) => s.pastStepCount);
  const currentStepCount = useAppStore((s) => s.currentStepCount);
  const setPastStepCount = useAppStore((s) => s.setPastStepCount);
  const setCurrentStepCount = useAppStore((s) => s.setCurrentStepCount);

  // Manual Entry States
  const sleepHours = useAppStore((s) => s.sleepHours);
  const sleepMins = useAppStore((s) => s.sleepMins);
  const setSleepHours = useAppStore((s) => s.setSleepHours);
  const setSleepMins = useAppStore((s) => s.setSleepMins);

  const waterGlasses = useAppStore((s) => s.waterGlasses);
  const setWaterGlasses = useAppStore((s) => s.setWaterGlasses);

  const weightKg = useAppStore((s) => s.weightKg);
  const setWeightKg = useAppStore((s) => s.setWeightKg);

  const heartRate = useAppStore((s) => s.heartRate);
  const setHeartRate = useAppStore((s) => s.setHeartRate);
  const userName = useAppStore((st) => st.userName);
  const dailyStepGoal = useAppStore((s) => s.dailyStepGoal) || 10000;

  // Run stats for today (from Program tab), added into Home's totals
  const runs = useAppStore((s) => s.runs);
  const todayRunStats = runs
    .filter((r) => new Date(r.date).toDateString() === new Date().toDateString())
    .reduce(
      (acc, r) => ({
        distanceKm: acc.distanceKm + r.distanceKm,
        caloriesBurned: acc.caloriesBurned + r.caloriesBurned,
        durationSec: acc.durationSec + r.durationSec,
      }),
      { distanceKm: 0, caloriesBurned: 0, durationSec: 0 }
    );

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

          const todayStr = start.toDateString();
          const currentState = useAppStore.getState();
          if (currentState.lastStepDate !== todayStr) {
            useAppStore.getState().setPastStepCount(0);
            useAppStore.getState().setCurrentStepCount(0);
            useAppStore.getState().setAndroidBootStepsBaseline(-1);
            useAppStore.getState().setLastStepDate(todayStr);
          }

          if (Platform.OS === 'ios') {
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
          } else {
            subscription = Pedometer.watchStepCount((result) => {
              const state = useAppStore.getState();
              const currentToday = new Date().toDateString();

              if (state.lastStepDate !== currentToday) {
                useAppStore.getState().setPastStepCount(0);
                useAppStore.getState().setCurrentStepCount(0);
                useAppStore.getState().setAndroidBootStepsBaseline(result.steps);
                useAppStore.getState().setLastStepDate(currentToday);
                return;
              }

              let bootBaseline = state.androidBootStepsBaseline;
              if (bootBaseline === -1) {
                useAppStore.getState().setAndroidBootStepsBaseline(result.steps);
                bootBaseline = result.steps;
              }

              let delta = result.steps - bootBaseline;
              if (delta < 0) {
                // Device rebooted
                const previousCurrent = state.currentStepCount;
                useAppStore.getState().setPastStepCount(state.pastStepCount + previousCurrent);
                useAppStore.getState().setAndroidBootStepsBaseline(0);
                bootBaseline = 0;
                delta = result.steps;
              }

              useAppStore.getState().setCurrentStepCount(delta);
            });
          }
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

  const stepDistanceMi = totalSteps * 0.00044;
  const stepCalories = Math.floor(totalSteps * 0.045);

  const combinedDistanceMi = stepDistanceMi + todayRunStats.distanceKm * 0.621371;
  const combinedCalories = stepCalories + todayRunStats.caloriesBurned;

  // Animation for TabBar hide on scroll
  const scrollY = useRef(new Animated.Value(0)).current;
  const mainScrollRef = useRef(null);

  useEffect(() => {
    scrollY.setValue(0);
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ y: 0, animated: false });
    }
  }, [activeTab, scrollY]);

  const diffClamp = Animated.diffClamp(scrollY, 0, 120); // 120px to ensure it completely hides below screen
  const translateY = diffClamp.interpolate({
    inputRange: [0, 120],
    outputRange: [0, 120],
  });

  const firstName = (userName.trim() || "there").split(" ")[0];
  const nameInitial = firstName.charAt(0).toUpperCase();

  const hour = new Date().getHours();
  let greeting = "Morning";
  if (hour >= 12 && hour < 17) greeting = "Afternoon";
  else if (hour >= 17) greeting = "Evening";

  const goalPercentage = Math.min(100, Math.round((totalSteps / dailyStepGoal) * 100));

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="light" />
      <Animated.ScrollView
        ref={mainScrollRef}
        style={[s.scroll, activeTab === "Program" && { display: 'none' }]}
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
                        {greeting}{" "}
                      </Text>
                      <Text
                        style={{
                          color: "#fff",
                          fontFamily: "Inter_800ExtraBold",
                        }}
                      >
                        {firstName}!
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
                        {goalPercentage}%
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
                    <Text
                      style={{
                        fontFamily: "Inter_700Bold",
                        fontSize: 18,
                        color: "#fff",
                      }}
                    >
                      {nameInitial}
                    </Text>
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
                        {combinedDistanceMi.toFixed(2)}
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
                        {combinedCalories}
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
                        {Math.max(0, dailyStepGoal - totalSteps).toLocaleString()}
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
                        {Math.min(100, Math.floor((totalSteps / dailyStepGoal) * 100))}%
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
            {/* RunningTracker has been moved outside of ScrollView for full-screen layout */}

            {/* ================================================================= */}
            {/*                          ACCOUNT TAB                              */}
            {/* ================================================================= */}
            {activeTab === "Account" && <AccountProfileScreen setCurrentScreen={setCurrentScreen} />}

            {/* Spacer for floating tab bar */}
            <View style={{ height: 130 }} />
          </>
        )}
      </Animated.ScrollView>

      {/* Render RunningTracker outside ScrollView to bypass content padding */}
      {currentScreen === "Main" && activeTab === "Program" && (
        <View style={StyleSheet.absoluteFillObject}>
          <RunningTracker
            viewingRun={viewingRun}
            setViewingRun={setViewingRun}
            onClose={() => {
              setActiveTab("Home");
              setViewingRun(null);
            }}
            onUIToggle={setIsTrackerUIVisible}
            scrollY={scrollY}
          />
        </View>
      )}

      {/* Show TabBar unless we are in the Tracker's immersive (hidden UI) mode */}
      {currentScreen === "Main" && !(activeTab === "Program" && !isTrackerUIVisible) && (
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
  safe: {
    flex: 1,
    backgroundColor: C.bg,
    paddingTop: Platform.OS === "android" ? 12 : 0,
  },
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
    zIndex: 999,
    elevation: 10,
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

