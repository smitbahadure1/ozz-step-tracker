import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useAppStore = create(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (val) => set({ _hasHydrated: val }),

      // ── ONBOARDING & AUTH & THEME ───────────────────────────────────────
      hasOnboarded: false,
      setHasOnboarded: (val) => set({ hasOnboarded: val }),
      isSignedIn: false,
      setIsSignedIn: (val) => set({ isSignedIn: val }),
      isDarkMode: true,
      setIsDarkMode: (val) => set({ isDarkMode: val }),
      userName: "",
      setUserName: (name) => set({ userName: name }),
      userGoal: "", // "lose_weight" or "daily_activity"
      setUserGoal: (goal) => set({ userGoal: goal }),
      userFitnessLevel: "", // "beginner", "intermediate", "advanced", "athletic"
      setUserFitnessLevel: (level) => set({ userFitnessLevel: level }),
      dailyStepGoal: 10000,
      setDailyStepGoal: (goal) => set({ dailyStepGoal: goal }),


      // ── PEDOMETER (STEPS) ──────────────────────────────────────────────
      pastStepCount: 0,
      currentStepCount: 0,
      androidBootStepsBaseline: -1,
      lastStepDate: new Date().toDateString(),
      setPastStepCount: (n) => set({ pastStepCount: n }),
      setCurrentStepCount: (n) => set({ currentStepCount: n }),
      setAndroidBootStepsBaseline: (n) => set({ androidBootStepsBaseline: n }),
      setLastStepDate: (dateStr) => set({ lastStepDate: dateStr }),

      // ── MANUAL DAILY LOGS ──────────────────────────────────────────────
      sleepHours: 0,
      sleepMins: 0,
      setSleepHours: (h) => set({ sleepHours: h }),
      setSleepMins: (m) => set({ sleepMins: m }),

      waterGlasses: 0,
      setWaterGlasses: (n) => set({ waterGlasses: n }),

      weightKg: 75,
      setWeightKg: (n) => set({ weightKg: n }),

      heightCm: 175,
      setHeightCm: (n) => set({ heightCm: n }),

      healthSync: false,
      setHealthSync: (val) => set({ healthSync: val }),

      reminders: true,
      setReminders: (val) => set({ reminders: val }),

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

      deleteRun: (id) =>
        set((state) => ({
          runs: state.runs.filter((r) => r.id !== id),
        })),

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
        isSignedIn: state.isSignedIn,
        isDarkMode: state.isDarkMode,
        userName: state.userName,
        userGoal: state.userGoal,
        userFitnessLevel: state.userFitnessLevel,
        dailyStepGoal: state.dailyStepGoal,
        runs: state.runs,
        pastStepCount: state.pastStepCount,
        currentStepCount: state.currentStepCount,
        androidBootStepsBaseline: state.androidBootStepsBaseline,
        lastStepDate: state.lastStepDate,
        weightKg: state.weightKg,
        heightCm: state.heightCm,
        healthSync: state.healthSync,
        reminders: state.reminders,
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
