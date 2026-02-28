// app/quiz1.jsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { ref, update } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "./Firebase";

const Quiz1 = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Adjusted to 5 seconds!
  const [timeLeft, setTimeLeft] = useState(5);

  const activeUid = auth.currentUser ? auth.currentUser.uid : params.uid;

  // Animation Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const studentFloat = useRef(new Animated.Value(0)).current;
  const cloudFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance Animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }),
      Animated.timing(cloudFade, {
        toValue: 1,
        duration: 1000,
        delay: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Student Mascot Floating Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(studentFloat, {
          toValue: -10,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(studentFloat, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Timer Logic (Decrements every 1000ms = 1 second)
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleContinue = async () => {
    if (activeUid) {
      try {
        const userRef = ref(db, `users/${activeUid}`);
        await update(userRef, {
          "lesson1/completed": true,
          "lesson1/status": "done",
        });
      } catch (error) {
        console.error("Error unlocking Module 2:", error);
      }
    }
    router.replace({ pathname: "/quiz2", params: { uid: activeUid } });
  };

  return (
    <SafeAreaView className="flex-1 bg-blue-800">
      <StatusBar barStyle="light-content" />

      {/* --- BACKGROUND LAYER --- */}
      <View className="absolute inset-0 opacity-30">
        <ImageBackground
          source={require("../assets/bg3.png")}
          className="flex-1"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/40" />
      </View>

      <View className="flex-1 px-8 justify-center items-center">
        {/* --- STUDENT & CLOUD TEXT SECTION --- */}
        <Animated.View
          style={{ transform: [{ translateY: studentFloat }] }}
          className="mb-10 items-center justify-center"
        >
          {/* SPEECH CLOUD */}
          <Animated.View
            style={{ opacity: cloudFade }}
            className="bg-white rounded-2xl p-3 absolute top-15 -right shadow-xl z-10 min-w-[120px]"
          >
            <Text className="text-blue-900 font-bold text-center text-[10px] leading-3">
              {timeLeft > 0
                ? `Analyze the goals...\n${timeLeft}s remaining`
                : "Objectives met!\nTap Continue."}
            </Text>
            {/* Speech Bubble Tail */}
            <View
              style={{
                position: "absolute",
                bottom: -8,
                right: 15,
                width: 0,
                height: 0,
                borderLeftWidth: 8,
                borderRightWidth: 8,
                borderTopWidth: 10,
                borderStyle: "solid",
                backgroundColor: "transparent",
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderTopColor: "white",
              }}
            />
          </Animated.View>

          {/* STUDENT AVATAR */}
          <View className="w-28 h-28 rounded-full border-4 border-yellow-500 bg-blue-900/80 overflow-hidden shadow-2xl">
            <Image
              source={require("../assets/m.png")}
              className="w-full h-full"
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* --- CONTENT CARD --- */}
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          className="bg-blue-950/90 border-2 border-blue-400 rounded-3xl p-8 w-full max-w-[400px] shadow-2xl shadow-blue-500/30"
        >
          <Text className="text-yellow-500 font-black text-2xl text-center mb-6 tracking-tight">
            What Will You Learn Today?
          </Text>

          <View className="h-[1px] bg-blue-400/30 w-full mb-6" />

          {/* OBJECTIVES */}
          <View className="mb-8">
            <Text className="text-blue-100 font-bold text-sm mb-4">
              You will be able to:
            </Text>

            <View className="flex-row items-start mb-3">
              <Text className="text-yellow-500 mr-3 text-lg">•</Text>
              <Text className="text-white text-base font-medium flex-1">
                Use Punnett squares to predict traits
              </Text>
            </View>
            <View className="flex-row items-start mb-3">
              <Text className="text-yellow-500 mr-3 text-lg">•</Text>
              <Text className="text-white text-base font-medium flex-1">
                Identify genotypes and phenotypes
              </Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-yellow-500 mr-3 text-lg">•</Text>
              <Text className="text-white text-base font-medium flex-1">
                Solve simple monohybrid cross problems
              </Text>
            </View>
          </View>

          {/* --- CONTINUE BUTTON --- */}
          <TouchableOpacity
            onPress={handleContinue}
            activeOpacity={0.8}
            className={`w-full mt-2 ${timeLeft > 0 ? "opacity-50" : "opacity-100"}`}
            disabled={timeLeft > 0}
          >
            <View
              className="bg-yellow-500 rounded-2xl py-4 items-center shadow-lg"
              style={{ borderBottomWidth: 5, borderBottomColor: "#a16207" }}
            >
              <Text className="text-blue-950 font-black text-xl tracking-widest uppercase">
                {timeLeft > 0 ? `WAIT ${timeLeft}s` : "Continue"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* --- MAIN MENU RETURN BUTTON --- */}
          <TouchableOpacity
            onPress={() =>
              router.replace({
                pathname: "/lessons",
                params: { uid: activeUid },
              })
            }
            activeOpacity={0.7}
            className="mt-6 w-full items-center"
          >
            <Text className="text-blue-300 font-bold text-xs tracking-widest uppercase underline">
              Return to Main Menu
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

export default Quiz1;
