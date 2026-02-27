import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ref, update } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// 1. Updated import path and variable name (db instead of database)
import { auth, db } from "./Firebase";

const Index = () => {
  const router = useRouter();
  const floatAnim = useRef(new Animated.Value(0)).current;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          easing: Easing.easeInOut,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.easeInOut,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [floatAnim]);

  const handleSignUpPress = () => {
    router.push("/sign");
  };

  const handleLoginPress = async () => {
    // Validation
    if (!username || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // Create full email by adding @example.com
    const email = `${username}@example.com`;

    setLoading(true);

    try {
      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // 2. Changed 'database' to 'db' here
      await update(ref(db, "users/" + user.uid), {
        lastLogin: new Date().toISOString(),
      });

      Alert.alert("Success", "Logged in successfully!");
      router.push("/home");
    } catch (error) {
      let errorMessage = "Invalid username or password";

      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "Username not found";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid username format";
          break;
        case "auth/user-disabled":
          errorMessage = "This account has been disabled";
          break;
        default:
          errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-blue-950">
      {/* Background Image */}
      <View className="absolute bottom-[100px] left-0">
        <Image
          source={require("../assets/bg.png")}
          className="w-[500px] h-[500px] opacity-15"
          resizeMode="contain"
        />
      </View>

      {/* Main Content */}
      <View className="flex-1 items-center px-6">
        {/* Animated Logo */}
        <Animated.Image
          source={require("../assets/logo.png")}
          className="w-[300px] h-[60px] mt-20 mb-12"
          resizeMode="contain"
          style={{
            transform: [{ translateY: floatAnim }],
          }}
        />

        <View className="w-full max-w-[350px]">
          {/* Username Input - User only types username, @example.com is hidden */}
          <View className="w-full mb-6">
            <View className="flex-row items-center bg-blue-900/50 rounded-full border-2 border-green-400 px-6 py-1 mt-20">
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                placeholderTextColor="#94a3b8"
                className="flex-1 text-white text-base py-4 text-left font-light"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="w-full mb-8">
            <View className="flex-row items-center bg-blue-900/50 rounded-full border-2 border-yellow-300 px-6 py-1">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                className="flex-1 text-white text-base py-4 text-left font-light"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            className={`w-full bg-red-900/70 rounded-full py-4 shadow-lg shadow-blue-500/50 border-2 border-red-500 ${loading ? "opacity-50" : ""}`}
            activeOpacity={0.8}
            onPress={handleLoginPress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-white text-center font-semibold text-lg">
                Log In
              </Text>
            )}
          </TouchableOpacity>

          {/* Separator */}
          <Text className="text-center text-white pt-8">
            ------------------- Haven't Have an Account? -------------------
          </Text>

          {/* Sign Up Button with Image */}
          <TouchableOpacity
            className="pt-5"
            activeOpacity={0.8}
            onPress={handleSignUpPress}
            disabled={loading}
          >
            <Image
              source={require("../assets/Signup.png")}
              className="w-full h-[30px]"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Index;
