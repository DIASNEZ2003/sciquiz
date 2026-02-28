// app/quiz3.jsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { ref, update } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Easing,
    Image,
    ImageBackground,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "./Firebase"; // <-- Ensure Firebase is imported

const Quiz3 = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

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

    // Timer Logic
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
          "curious_case/completed": true,
          "curious_case/status": "done",
        });
      } catch (error) {
        console.error("Error unlocking Module 4:", error);
      }
    }

    // ANTI-CRASH FIX: Give Firebase 150ms to finish before navigating
    setTimeout(() => {
      router.replace({ pathname: "/quiz4", params: { uid: activeUid } });
    }, 150);
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
        {/* FIX: Removed className from Animated.View */}
        <Animated.View
          style={{ transform: [{ translateY: studentFloat }], zIndex: 10 }}
        >
          {/* Wrapper View handles Tailwind */}
          <View className="mb-10 items-center justify-center relative">
            {/* SPEECH CLOUD */}
            {/* FIX: Removed className from Animated.View */}
            <Animated.View
              style={{
                opacity: cloudFade,
                position: "absolute",
                top: -35,
                right: -15,
                zIndex: 20,
              }}
            >
              {/* Wrapper View handles Tailwind */}
              <View className="bg-white rounded-2xl p-3 shadow-xl min-w-[120px]">
                <Text className="text-blue-900 font-bold text-center text-[10px] leading-3">
                  {timeLeft > 0
                    ? `Analyze the case...\n${timeLeft}s remaining`
                    : "Mystery ready!\nTap Find Out."}
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
              </View>
            </Animated.View>

            {/* STUDENT AVATAR */}
            <View className="w-28 h-28 rounded-full border-4 border-yellow-500 bg-blue-900/80 overflow-hidden shadow-2xl">
              <Image
                source={require("../assets/m.png")}
                className="w-full h-full"
                resizeMode="contain"
              />
            </View>
          </View>
        </Animated.View>

        {/* --- CONTENT CARD --- */}
        {/* FIX: Removed className from Animated.View, mapped styling to inline logic */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            flex: 1,
            width: "100%",
            alignItems: "center",
            maxHeight: "60%",
            marginBottom: 40,
          }}
        >
          {/* Safe wrapper View handles all complex Tailwind rendering */}
          <View className="flex-1 bg-blue-950/90 border-2 border-blue-400 rounded-3xl w-full max-w-[400px] shadow-2xl shadow-blue-500/30 overflow-hidden">
            <View className="bg-blue-900/50 py-5 border-b border-blue-400/50">
              <Text className="text-yellow-500 font-black text-2xl text-center tracking-tighter">
                A Curious Case
              </Text>
            </View>

            {/* SCROLLABLE STORY CONTENT */}
            <ScrollView
              className="flex-1 px-6 pt-4"
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              <Text className="text-white text-base font-medium leading-6 mb-4">
                Daddy Willy and Mommy Celia welcomed their baby,{" "}
                <Text className="text-yellow-500 font-black">Baby Volty</Text>.
              </Text>

              <Text className="text-white text-base font-medium leading-6 mb-4">
                However, Baby Volty has{" "}
                <Text className="text-cyan-300 font-black">fair skin</Text>,
                while Daddy Willy has{" "}
                <Text className="text-orange-900 font-black">dark skin</Text>.
              </Text>

              <Text className="text-white text-base font-medium leading-6 mb-4">
                Mommy Celia believes there was a mix-up at the hospital.
              </Text>

              <Text className="text-white text-base font-medium leading-6 mb-6">
                Daddy Willy knows that{" "}
                <Text className="text-yellow-500 font-black">genetics</Text> may
                explain exactly what happened!
              </Text>

              <View className="h-[1px] bg-blue-400/30 w-full mb-4" />

              <Text className="text-blue-200 font-black text-center text-xs tracking-widest uppercase mb-1">
                Question Prompt:
              </Text>
              <Text className="text-white font-bold text-center text-lg italic">
                How can genetics help solve this mystery?
              </Text>
            </ScrollView>

            {/* --- BUTTONS SECTION (Fixed at bottom of card) --- */}
            <View className="p-6 bg-blue-900/30">
              <TouchableOpacity
                onPress={handleContinue}
                activeOpacity={0.8}
                className={`w-full ${timeLeft > 0 ? "opacity-50" : "opacity-100"}`}
                disabled={timeLeft > 0}
              >
                <View
                  className="bg-yellow-500 rounded-2xl py-4 items-center shadow-lg"
                  style={{ borderBottomWidth: 5, borderBottomColor: "#a16207" }}
                >
                  <Text className="text-blue-950 font-black text-xl tracking-widest uppercase">
                    {timeLeft > 0 ? `WAIT ${timeLeft}s` : "Find Out"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* --- MAIN MENU RETURN BUTTON --- */}
              <TouchableOpacity
                onPress={() => {
                  setTimeout(() => {
                    router.replace({
                      pathname: "/lessons",
                      params: { uid: activeUid },
                    });
                  }, 150); // Added timeout here as well for safety
                }}
                activeOpacity={0.7}
                className="mt-6 w-full items-center"
              >
                <Text className="text-blue-300 font-bold text-xs tracking-widest uppercase underline">
                  Return to Main Menu
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

export default Quiz3;
