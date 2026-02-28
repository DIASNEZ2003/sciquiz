// app/sign.jsx
import NetInfo from "@react-native-community/netinfo";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  ImageBackground,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "./Firebase";
import { saveLocalUser } from "./LocalDB";

// Import your avatars
const avatarMap = {
  pp1: require("../assets/pp1.png"),
  pp2: require("../assets/pp2.png"),
  pp3: require("../assets/pp3.png"),
  pp4: require("../assets/pp4.png"),
  pp5: require("../assets/pp5.png"),
};

const Sign = () => {
  const router = useRouter();

  // Animation Refs
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Form States
  const [userAvatar, setUserAvatar] = useState("pp1"); // Default avatar
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Modals & Toggles
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [securePassword, setSecurePassword] = useState(true);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

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
  }, [floatAnim]);

  const handleSignUpPress = async () => {
    // Removed confirmPassword from the check
    if (!fullName || !username || !password) {
      Alert.alert(
        "Access Denied",
        "Please fill in all identification fields! ",
      );
      return;
    }

    const email = `${username.trim().toLowerCase()}@example.com`;

    setLoading(true);

    try {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        Alert.alert(
          "Offline",
          "Mainframe connection required to register a new Account",
        );
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // Save user with their chosen avatar to Firebase
      await set(ref(db, "users/" + user.uid), {
        fullName: fullName,
        username: username,
        email: email,
        score: 0,
        avatarId: userAvatar,
      });

      try {
        // Save user with their chosen avatar to SQLite Offline DB
        saveLocalUser(user.uid, email, password, fullName, userAvatar, 0, 0);
      } catch (sqliteError) {
        console.error("SQLite failed:", sqliteError);
        Alert.alert(
          "Warning",
          "Account registered online, but failed to save offline backup.",
        );
        router.back();
        return;
      }

      Alert.alert("Success", "Account generated successfully!", [
        { text: "ENTER", onPress: () => router.back() },
      ]);
    } catch (error) {
      let errorMessage = "An error occurred during sign up";
      if (error.code === "auth/email-already-in-use")
        errorMessage = "This Lab ID is already in use.";
      else errorMessage = error.message;
      Alert.alert("Error", errorMessage);
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
        <View className="absolute inset-0 bg-black/50" />
      </View>

      {/* --- AVATAR SELECTION MODAL --- */}
      <Modal
        transparent={true}
        visible={avatarModalVisible}
        animationType="slide"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center p-6">
          <View className="bg-blue-950/90 w-full max-w-[400px] rounded-3xl p-6 border-2 border-yellow-500 shadow-2xl shadow-yellow-500/20">
            <Text className="text-yellow-500 text-[12px] font-bold tracking-[4px] uppercase mb-6 text-center">
              SELECT LAB AVATAR
            </Text>
            <View className="flex-row flex-wrap justify-center gap-6 mb-8">
              {Object.keys(avatarMap).map((avatarKey) => (
                <TouchableOpacity
                  key={avatarKey}
                  onPress={() => {
                    setUserAvatar(avatarKey);
                    setAvatarModalVisible(false);
                  }}
                  className={`border-4 rounded-full p-1 ${
                    userAvatar === avatarKey
                      ? "border-yellow-500 bg-yellow-500/20"
                      : "border-blue-800"
                  }`}
                  activeOpacity={0.7}
                >
                  <Image
                    source={avatarMap[avatarKey]}
                    className="w-20 h-20 rounded-full"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              className="bg-blue-800 border-2 border-blue-500 py-4 rounded-2xl items-center"
              onPress={() => setAvatarModalVisible(false)}
            >
              <Text className="text-blue-200 font-bold tracking-widest text-sm uppercase">
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Animated.View
        style={{ opacity: fadeAnim }}
        className="flex-1 px-8 justify-center"
      >
        <View className="absolute bottom-10 -left-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 40,
          }}
        >
          {/* --- BIG LOGO --- */}
          <Animated.Image
            source={require("../assets/logo.png")}
            className="w-full h-24 mb-6"
            resizeMode="contain"
            style={{ transform: [{ translateY: floatAnim }] }}
          />

          <View className="w-full max-w-[450px]">
            {/* --- AVATAR PICKER (TOP OF FORM) --- */}
            <View className="items-center mb-8 mt-2">
              <Text className="text-yellow-500 text-[10px] font-bold tracking-[4px] uppercase mb-3">
                CHOOSE AVATAR
              </Text>
              <TouchableOpacity
                onPress={() => setAvatarModalVisible(true)}
                activeOpacity={0.8}
                className="w-24 h-24 rounded-full border-4 border-yellow-500 bg-blue-900/50 items-center justify-center shadow-lg shadow-yellow-500/30"
              >
                <Image
                  source={avatarMap[userAvatar]}
                  className="w-full h-full rounded-full"
                />
                <View className="absolute -bottom-3 bg-yellow-500 px-3 py-1 rounded-full border-2 border-blue-900">
                  <Text className="text-[#020617] text-[9px] font-black tracking-widest uppercase">
                    EDIT
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* FULL NAME SECTION */}
            <View className="w-full mb-4">
              <Text className="text-blue-400 text-[10px] font-bold tracking-[4px] uppercase mb-2 ml-1">
                FULL NAME
              </Text>
              <View className="bg-blue-950/60 border-2 border-blue-500 rounded-2xl flex-row items-center px-4">
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter Full Name"
                  placeholderTextColor="#64748b"
                  className="flex-1 text-white text-lg py-4 font-medium"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* USERNAME SECTION */}
            <View className="w-full mb-4">
              <Text className="text-blue-400 text-[10px] font-bold tracking-[4px] uppercase mb-2 ml-1">
                USERNAME
              </Text>
              <View className="bg-blue-950/60 border-2 border-blue-500 rounded-2xl flex-row items-center px-4">
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
            <View className="w-full mb-8">
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
                  secureTextEntry={securePassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setSecurePassword(!securePassword)}
                  className="bg-yellow-500/10 px-3 py-1.5 rounded-xl border border-yellow-500/20"
                  activeOpacity={0.6}
                >
                  <Text className="text-yellow-500 text-[10px] font-black tracking-widest">
                    {securePassword ? "SHOW" : "HIDE"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* --- MAIN SIGN UP BUTTON --- */}
            <TouchableOpacity
              onPress={handleSignUpPress}
              disabled={loading}
              activeOpacity={0.8}
              className="mt-2"
            >
              <View
                className="bg-yellow-500 rounded-2xl py-4 items-center shadow-2xl shadow-yellow-500/40"
                style={{ borderBottomWidth: 5, borderBottomColor: "#a16207" }}
              >
                {loading ? (
                  <ActivityIndicator color="#020617" />
                ) : (
                  <Text className="text-[#020617] font-black text-xl tracking-widest uppercase">
                    Sign Up
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {/* --- FOOTER LINKS --- */}
            <View className="flex-row items-center justify-between mt-10 px-2">
              <View className="h-[1px] flex-1 bg-white/10" />
              <Text className="text-slate-300 text-[9px] font-bold uppercase mx-4 tracking-[2px]">
                QuizApp v 0.01
              </Text>
              <View className="h-[1px] flex-1 bg-white/10" />
            </View>

            <TouchableOpacity
              onPress={() => router.back()}
              className="mt-6 items-center"
              activeOpacity={0.7}
            >
              <Text className="text-blue-200 text-sm">
                Already have an Account?{" "}
                <Text className="text-yellow-500 font-bold underline">
                  Log In
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

export default Sign;
