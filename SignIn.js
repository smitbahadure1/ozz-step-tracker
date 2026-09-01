import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { useAppStore } from "./store/useAppStore";
import { Ionicons } from "@expo/vector-icons";

const { width: W } = Dimensions.get("window");

// Constants to match app aesthetics
const C = {
  bg: "#000000",
  card: "#111111",
  cardBorder: "#222222",
  text: "#ffffff",
  muted: "#888888",
  blue: "#3CA8FF",
  orange: "#FF5C00",
};

export default function SignIn() {
  const setIsSignedIn = useAppStore((s) => s.setIsSignedIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between SignIn/SignUp

  const handleAuth = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // For now, this is a mock auth that just lets the user in.
    // In a real app, you would integrate Firebase Auth here.
    setIsSignedIn(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.container}
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              {isSignUp ? "Create Account" : "Welcome Back"}
            </Text>
            <Text style={styles.subtitle}>
              {isSignUp
                ? "Sign up to save your progress and sync across devices."
                : "Sign in to pick up right where you left off."}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={C.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={C.muted}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={C.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={C.muted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {!isSignUp && (
              <TouchableOpacity activeOpacity={0.6} style={{ alignSelf: "flex-end" }}>
                <Text style={styles.forgotPassword}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleAuth}
              style={[
                styles.primaryBtn,
                (!email || !password) && { opacity: 0.5 }
              ]}
              disabled={!email || !password}
            >
              <Text style={styles.primaryBtnText}>
                {isSignUp ? "Sign Up" : "Sign In"}
              </Text>
            </TouchableOpacity>

            <View style={styles.switchModeContainer}>
              <Text style={styles.switchModeText}>
                {isSignUp ? "Already have an account?" : "Don't have an account?"}
              </Text>
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsSignUp(!isSignUp);
                }}
              >
                <Text style={styles.switchModeBtnText}>
                  {isSignUp ? "Sign In" : "Sign Up"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 36,
    color: C.text,
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    lineHeight: 24,
    color: C.muted,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: C.text,
    height: "100%",
  },
  forgotPassword: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: C.blue,
    marginTop: 4,
    marginBottom: 8,
  },
  primaryBtn: {
    backgroundColor: C.blue,
    borderRadius: 100,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  primaryBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#000",
  },
  switchModeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
    gap: 8,
  },
  switchModeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: C.muted,
  },
  switchModeBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: C.text,
  },
});
