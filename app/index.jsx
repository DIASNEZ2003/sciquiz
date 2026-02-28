// app/index.jsx
import AsyncStorage from "@react-native-async-storage/async-storage"; // <-- Added this!
import NetInfo from "@react-native-community/netinfo";
import { useRouter } from "expo-router";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { get, ref, update } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "./Firebase";
import { getLocalUserByCredentials, initDB, saveLocalUser } from "./LocalDB";

const { width, height } = Dimensions.get("window");

const Index = () => {
  const router = useRouter();

  // Animation Refs
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Form States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  useEffect(() => {
    initDB();

    const checkSessions = async () => {
      try {
        // 1. Check for an OFFLINE session first!
        const offlineUid = await AsyncStorage.getItem("active_uid");

        if (offlineUid) {
          setTimeout(() => {
            router.replace({ pathname: "/home", params: { uid: offlineUid } });
          }, 150);
          return; // Stop here if offline session exists
        }

        // 2. If no offline session, check Firebase (Online Session)
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            await AsyncStorage.setItem("active_uid", user.uid); // Sync Firebase to our local storage
            setTimeout(() => {
              router.replace({ pathname: "/home", params: { uid: user.uid } });
            }, 150);
          } else {
            // 3. No sessions found anywhere? Fade in the Login Screen!
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }).start();
          }
        });
      } catch (error) {
        console.error("Session check error:", error);
      }
    };

    checkSessions();

    // Infinite Floating Logo Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -15,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Subtle background pulse for the "Glow" effects
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [floatAnim, fadeAnim, pulseAnim, router]);

  const handleLoginPress = async () => {
    if (!username || !password) {
      Alert.alert(
        "Access Denied",
        "DNA match requires both Lab ID and Passcode! 🧬",
      );
      return;
    }

    const email = `${username.trim().toLowerCase()}@example.com`;
    setLoading(true);

    try {
      const netInfo = await NetInfo.fetch();

      if (netInfo.isConnected) {
        // --- ONLINE LOGIN ---
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const user = userCredential.user;

        await update(ref(db, "users/" + user.uid), {
          lastLogin: new Date().toISOString(),
        });

        const snapshot = await get(ref(db, "users/" + user.uid));
        let fullName = "",
          avatarId = null,
          score = 0;

        if (snapshot.exists()) {
          const userData = snapshot.val();
          fullName = userData.fullName || "";
          avatarId = userData.avatarId || null;
          score = userData.score || 0;
        }

        saveLocalUser(user.uid, email, password, fullName, avatarId, score, 0);

        // Save Local Session Token!
        await AsyncStorage.setItem("active_uid", user.uid);
        router.replace({ pathname: "/home", params: { uid: user.uid } });
      } else {
        // --- OFFLINE LOGIN ---
        const localUser = getLocalUserByCredentials(email, password);

        if (localUser) {
          Alert.alert("Offline Mode", "Authorized via Local Database");

          // Save Local Session Token!
          await AsyncStorage.setItem("active_uid", localUser.uid);
          router.replace({ pathname: "/home", params: { uid: localUser.uid } });
        } else {
          Alert.alert(
            "Connection Error",
            "No internet and no matching local scientist profile found.",
          );
        }
      }
    } catch (error) {
      Alert.alert(
        "Auth Failure",
        "Invalid credentials. Please re-verify your Lab ID.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-blue-800">
      <StatusBar barStyle="light-content" />

      {/* --- BACKGROUND IMAGE LAYER --- */}
      <View className="absolute inset-0 opacity-35">
        <ImageBackground
          source={require("../assets/bg3.png")}
          className="flex-1"
          resizeMode="cover"
        />
        {/* Dark overlay to keep the yellow/blue text readable */}
        <View className="absolute inset-0 bg-black/50" />
      </View>

      <Animated.View
        style={{ opacity: fadeAnim }}
        className="flex-1 items-center px-8 justify-center"
      >
        <View className="absolute bottom-10 -left-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />

        {/* --- BIG LOGO --- */}
        <Animated.Image
          source={require("../assets/logo.png")}
          className="w-full h-44 mb-8"
          resizeMode="contain"
          style={{ transform: [{ translateY: floatAnim }] }}
        />

        <View className="w-full max-w-[450px]">
          {/* USERNAME SECTION */}
          <View className="w-full mb-6">
            <Text className="text-blue-400 text-[10px] font-bold tracking-[4px] uppercase mb-2 ml-1">
              USERNAME
            </Text>
            <View className="bg-blue-950/60 border-2 border-blue-600 rounded-2xl flex-row items-center px-4">
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Enter Username"
                placeholderTextColor="#64748b"
                className="flex-1 text-white text-lg py-4 font-medium"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* PASSWORD SECTION */}
          <View className="w-full mb-4">
            <Text className="text-yellow-500 text-[10px] font-bold tracking-[4px] uppercase mb-2 ml-1">
              PASSWORD
            </Text>
            <View className="bg-blue-950/60 border-2 border-yellow-500 rounded-2xl flex-row items-center px-4">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#64748b"
                className="flex-1 text-white text-lg py-4 font-medium"
                secureTextEntry={secureText}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setSecureText(!secureText)}
                className="bg-yellow-500/10 px-3 py-1.5 rounded-xl border border-yellow-500/20"
                activeOpacity={0.6}
              >
                <Text className="text-yellow-500 text-[10px] font-black tracking-widest">
                  {secureText ? "SHOW" : "HIDE"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* --- MAIN LOGIN BUTTON --- */}
          <TouchableOpacity
            onPress={handleLoginPress}
            disabled={loading}
            activeOpacity={0.8}
            className="mt-8"
          >
            <View
              className="bg-yellow-500 rounded-2xl py-4 items-center shadow-2xl shadow-yellow-500/40"
              style={{ borderBottomWidth: 5, borderBottomColor: "#a16207" }}
            >
              {loading ? (
                <ActivityIndicator color="#020617" />
              ) : (
                <Text className="text-[#020617] font-black text-xl tracking-tighter">
                  LOG IN
                </Text>
              )}
            </View>
          </TouchableOpacity>

          {/* --- FOOTER LINKS --- */}
          <View className="flex-row items-center justify-between mt-12 px-2">
            <View className="h-[1px] flex-1 bg-white/10" />
            <Text className="text-slate-300 text-[9px] font-bold uppercase mx-4 tracking-[2px]">
              QuizApp v 0.01
            </Text>
            <View className="h-[1px] flex-1 bg-white/10" />
          </View>

          <TouchableOpacity
            onPress={() => router.push("/sign")}
            className="mt-6 items-center"
            activeOpacity={0.7}
          >
            <Text className="text-slate-400 text-sm">
              New User?{" "}
              <Text className="text-yellow-500 font-bold underline">
                Sign Up
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default Index;
