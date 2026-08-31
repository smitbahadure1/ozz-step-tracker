import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useAppStore = create(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (val) => set({ _hasHydrated: val }),

      // ── ONBOARDING ──────────────────────────────────────────────────────
      hasOnboarded: false,
      setHasOnboarded: (val) => set({ hasOnboarded: val }),
      userName: "",
      setUserName: (name) => set({ userName: name }),

      // ── PEDOMETER (STEPS) ──────────────────────────────────────────────
      pastStepCount: 0,
      currentStepCount: 0,
      setPastStepCount: (n) => set({ pastStepCount: n }),
      setCurrentStepCount: (n) => set({ currentStepCount: n }),

      // ── MANUAL DAILY LOGS ──────────────────────────────────────────────
      sleepHours: 0,
      sleepMins: 0,
      setSleepHours: (h) => set({ sleepHours: h }),
      setSleepMins: (m) => set({ sleepMins: m }),

      waterGlasses: 0,
      setWaterGlasses: (n) => set({ waterGlasses: n }),

      weightKg: 0,
      setWeightKg: (n) => set({ weightKg: n }),

      heartRate: 0,
      setHeartRate: (n) => set({ heartRate: n }),

      // ── RUN TRACKING (Program tab writes, Home tab reads) ─────────────
      runs: [], // { id, date (ISO), distanceKm, durationSec, caloriesBurned, route }
      activeRun: null,

      startRun: () =>
        set({
          activeRun: { startTime: Date.now(), distance: 0, duration: 0 },
        }),

      // Call this in stopTracking() with the final distance (meters), duration (sec), and route array
      endRun: ({ distanceMeters, durationSec, route }) =>
        set((state) => {
          const distanceKm = distanceMeters / 1000;
          // Rough MET-based estimate: ~60 kcal per km for an average runner.
          const caloriesBurned = Math.round(distanceKm * 60);

          const newRun = {
            id: Date.now(),
            date: new Date().toISOString(),
            distanceKm,
            durationSec,
            caloriesBurned,
            route,
          };

          return {
            runs: [...state.runs, newRun],
            activeRun: null,
          };
        }),

      // ── DERIVED SELECTORS ──────────────────────────────────────────────
      getTodayRuns: () => {
        const today = new Date().toDateString();
        return get().runs.filter(
          (r) => new Date(r.date).toDateString() === today,
        );
      },

      getTodayRunStats: () => {
        const todayRuns = get().getTodayRuns();
        return todayRuns.reduce(
          (acc, r) => ({
            distanceKm: acc.distanceKm + r.distanceKm,
            caloriesBurned: acc.caloriesBurned + r.caloriesBurned,
            durationSec: acc.durationSec + r.durationSec,
          }),
          { distanceKm: 0, caloriesBurned: 0, durationSec: 0 },
        );
      },
    }),
    {
      name: "ozzz-app",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasOnboarded: state.hasOnboarded,
        userName: state.userName,
      }),
      onRehydrateStorage: () => () => {
        useAppStore.setState({ _hasHydrated: true });
      },
    },
  ),
);

useAppStore.persist.onFinishHydration(() => {
  useAppStore.setState({ _hasHydrated: true });
});
if (useAppStore.persist.hasHydrated()) {
  useAppStore.setState({ _hasHydrated: true });
}
