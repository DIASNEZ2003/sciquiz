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
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// Updated import to match your config file setup
import { auth, db } from "./Firebase";

const Sign = () => {
  const router = useRouter();
  const floatAnim = useRef(new Animated.Value(0)).current;

  // 1. Added state for Full Name
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignUpPress = async () => {
    // 2. Added fullName to the empty field validation
    if (!fullName || !username || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    const email = `${username}@example.com`;

    if (!validateEmail(email)) {
      Alert.alert("Error", "Invalid username format");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password should be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // 3. Changed database to db, and added fullName to the saved data
      await set(ref(db, "users/" + user.uid), {
        fullName: fullName,
        username: username,
        email: email,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });

      Alert.alert("Success", "Account created successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      let errorMessage = "An error occurred during sign up";

      // Handle specific Firebase errors
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "This username is already taken";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid username format";
          break;
        case "auth/operation-not-allowed":
          errorMessage = "Operation not allowed";
          break;
        case "auth/weak-password":
          errorMessage = "Password is too weak";
          break;
        default:
          errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
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
          className="w-[300px] h-[60px] mt-16 mb-8"
          resizeMode="contain"
          style={{
            transform: [{ translateY: floatAnim }],
          }}
        />

        <View className="w-full max-w-[350px]">
          {/* 4. Full Name Input */}
          <View className="w-full mb-4 mt-4">
            <View className="flex-row items-center bg-blue-900/50 rounded-full border-2 border-purple-400 px-6 py-1">
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Full Name"
                placeholderTextColor="#94a3b8"
                className="flex-1 text-white text-base py-4 text-left font-light"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Username Input */}
          <View className="w-full mb-4">
            <View className="flex-row items-center bg-blue-900/50 rounded-full border-2 border-green-400 px-6 py-1">
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
          <View className="w-full mb-4">
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

          {/* Confirm Password Input */}
          <View className="w-full mb-8">
            <View className="flex-row items-center bg-blue-900/50 rounded-full border-2 border-blue-400 px-6 py-1">
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm Password"
                placeholderTextColor="#94a3b8"
                className="flex-1 text-white text-base py-4 text-left font-light"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            className={`w-full bg-green-600/70 rounded-full py-4 shadow-lg shadow-green-500/50 border-2 border-green-500 ${loading ? "opacity-50" : ""}`}
            activeOpacity={0.8}
            onPress={handleSignUpPress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-white text-center font-semibold text-lg">
                Sign Up
              </Text>
            )}
          </TouchableOpacity>

          {/* Separator */}
          <Text className="text-center text-white pt-8 mb-5">
            ------------------- Already Have an Account? -------------------
          </Text>

          {/* Back to Login Button with Image */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleBackToLogin}
            disabled={loading}
          >
            <Image
              source={require("../assets/Login.png")}
              className="w-full h-[30px]"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Sign;
