import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { useAppStore } from "./store/useAppStore";

const { width: W } = Dimensions.get("window");

const C = {
  bg: "#000000",
  card: "rgba(255, 255, 255, 0.05)",
  cardBorder: "rgba(255, 255, 255, 0.12)",
  text: "#ffffff",
  muted: "#808084",
  lime: "#b8ff1f",
  blue: "#3ca8ff",
  orange: "#ff5c00",
};

function OzzzMark({ size = 88 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 72">
      <Path
        d="M2 64 L24 12 L36 40 L54 4 L78 64 H62 L54 36 L40 58 L28 32 L14 64 Z"
        fill={C.orange}
      />
    </Svg>
  );
}

function MiniActivityGrid() {
  const cols = [
    [0, 0, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1],
    [0, 0, 0, 1, 1, 1],
    [0, 0, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 2, 2],
    [0, 0, 0, 0, 0, 0],
  ];
  const today = 5;
  const days = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <View style={styles.gridWrap}>
      {cols.map((col, cIdx) => (
        <View key={cIdx} style={styles.gridCol}>
          {col.map((val, rIdx) => {
            let bg = "#1c1c1e";
            if (val === 1) bg = "rgba(60, 168, 255, 0.28)";
            if (val === 2) bg = C.blue;
            return <View key={rIdx} style={[styles.gridCell, { backgroundColor: bg }]} />;
          })}
          <Text style={[styles.gridDay, cIdx === today && { color: "#fff" }]}>
            {days[cIdx]}
          </Text>
        </View>
      ))}
    </View>
  );
}

function RunVisual() {
  return (
    <View style={styles.runVisual}>
      <View style={styles.runRingOuter}>
        <View style={styles.runRingMid}>
          <View style={styles.runRingInner}>
            <Ionicons name="navigate" size={32} color={C.orange} />
          </View>
        </View>
      </View>
      <View style={styles.runStatsRow}>
        <View style={styles.runStat}>
          <Text style={styles.runStatValue}>5.2</Text>
          <Text style={styles.runStatLabel}>km</Text>
        </View>
        <View style={styles.runStat}>
          <Text style={styles.runStatValue}>24:10</Text>
          <Text style={styles.runStatLabel}>time</Text>
        </View>
        <View style={styles.runStat}>
          <Text style={styles.runStatValue}>4:38</Text>
          <Text style={styles.runStatLabel}>pace</Text>
        </View>
      </View>
    </View>
  );
}

const PAGES = 4;

export default function Onboarding() {
  const setHasOnboarded = useAppStore((s) => s.setHasOnboarded);
  const setUserName = useAppStore((s) => s.setUserName);

  const [page, setPage] = useState(0);
  const [name, setName] = useState("");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const glow = useRef(new Animated.Value(0.08)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 0.2,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.08,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);

  useEffect(() => {
    if (page === 3) {
      const t = setTimeout(() => inputRef.current?.focus(), 280);
      return () => clearTimeout(t);
    }
    Keyboard.dismiss();
  }, [page]);

  const goTo = (index) => {
    const next = Math.max(0, Math.min(PAGES - 1, index));
    setPage(next);
    scrollRef.current?.scrollTo({ x: next * W, animated: true });
  };

  const finish = (displayName) => {
    Keyboard.dismiss();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setUserName(displayName.trim());
    setHasOnboarded(true);
  };

  const onNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (page < PAGES - 1) {
      goTo(page + 1);
      return;
    }
    finish(name);
  };

  const onSkip = () => finish("");

  const last = page === PAGES - 1;
  const canFinish = name.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.topBar}>
          <View style={styles.dots}>
            {Array.from({ length: PAGES }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === page && styles.dotActive,
                  i === page && { backgroundColor: C.orange },
                ]}
              />
            ))}
          </View>
          {!last ? (
            <TouchableOpacity onPress={onSkip} hitSlop={12}>
              <Text style={styles.skip}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / W);
            setPage(i);
          }}
          scrollEventThrottle={16}
        >
          {/* 1 — Brand */}
          <View style={styles.page}>
            <View style={styles.hero}>
              <Animated.View style={[styles.glow, { opacity: glow }]} />
              <OzzzMark />
              <Text style={styles.wordmark}>Ozzz</Text>
              <Text style={styles.tagline}>Train in the dark.{"\n"}Read it in the light.</Text>
            </View>
          </View>

          {/* 2 — Activity */}
          <View style={styles.page}>
            <View style={styles.card}>
              <MiniActivityGrid />
            </View>
            <Text style={styles.title}>Your week,{"\n"}at a glance</Text>
            <Text style={styles.body}>
              Steps light up as you move. Today’s column grows with every walk — no
              guesswork, just a live board.
            </Text>
          </View>

          {/* 3 — Runs */}
          <View style={styles.page}>
            <View style={styles.card}>
              <RunVisual />
            </View>
            <Text style={styles.title}>Go outside.{"\n"}We’ll map it.</Text>
            <Text style={styles.body}>
              Track distance, pace, and calories on Program. Finished runs fold back
              into your Home totals.
            </Text>
          </View>

          {/* 4 — Name */}
          <View style={styles.page}>
            <Text style={styles.kicker}>ALMOST THERE</Text>
            <Text style={styles.title}>What should{"\n"}we call you?</Text>
            <Text style={styles.body}>This shows up on your home screen.</Text>
            <TextInput
              ref={inputRef}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={C.muted}
              selectionColor={C.orange}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => canFinish && finish(name)}
              style={styles.input}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onNext}
            disabled={last && !canFinish}
            style={[
              styles.cta,
              last && !canFinish && styles.ctaDisabled,
            ]}
          >
            <Text style={[styles.ctaText, last && !canFinish && styles.ctaTextDisabled]}>
              {last ? "Get started" : "Continue"}
            </Text>
            <Ionicons
              name={last ? "arrow-forward" : "chevron-forward"}
              size={18}
              color={last && !canFinish ? C.muted : "#000"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },
  skip: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: C.muted,
  },
  dots: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#3a3a3c",
  },
  dotActive: {
    width: 22,
    backgroundColor: C.orange,
  },
  page: {
    width: W,
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    justifyContent: "center",
  },
  hero: {
    alignItems: "center",
    marginTop: -40,
  },
  glow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: C.orange,
    top: -40,
    pointerEvents: "none",
  },
  wordmark: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 48,
    color: C.text,
    letterSpacing: -1.5,
    marginTop: 18,
  },
  tagline: {
    fontFamily: "Inter_500Medium",
    fontSize: 18,
    lineHeight: 26,
    color: C.muted,
    textAlign: "center",
    marginTop: 12,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 22,
    marginBottom: 32,
  },
  title: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 34,
    lineHeight: 40,
    color: C.text,
    letterSpacing: -1,
    marginBottom: 12,
  },
  body: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    lineHeight: 24,
    color: C.muted,
  },
  kicker: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.6,
    color: C.orange,
    marginBottom: 12,
  },
  input: {
    marginTop: 28,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    color: C.text,
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
  },
  cta: {
    height: 56,
    borderRadius: 28,
    backgroundColor: C.orange,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaDisabled: {
    backgroundColor: "#3a3a3c",
  },
  ctaText: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 16,
    color: "#000",
  },
  ctaTextDisabled: {
    color: C.muted,
  },
  gridWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gridCol: { alignItems: "center", gap: 5 },
  gridCell: {
    width: 28,
    height: 16,
    borderRadius: 5,
  },
  gridDay: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#555",
    marginTop: 8,
  },
  runVisual: { alignItems: "center", paddingVertical: 8 },
  runRingOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: "rgba(255, 92, 0, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  runRingMid: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 1,
    borderColor: "rgba(255, 92, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  runRingInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255, 92, 0, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  runStatsRow: {
    flexDirection: "row",
    marginTop: 20,
    gap: 22,
  },
  runStat: { alignItems: "center" },
  runStatValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: C.text,
  },
  runStatLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
