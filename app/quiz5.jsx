import NetInfo from "@react-native-community/netinfo";
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
import { auth, db } from "./Firebase";
import { getLocalUser, updateLocalProgress } from "./LocalDB";

const Quiz5 = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // The 5-second countdown timer
  const [timeLeft, setTimeLeft] = useState(5);
  const activeUid = auth.currentUser ? auth.currentUser.uid : params.uid;

  // --- ANIMATION REFS ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const studentFloat = useRef(new Animated.Value(0)).current;
  const cloudFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // --- ENTRANCE ANIMATIONS ---
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

    // --- FLOATING MASCOT ANIMATION ---
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

    // --- 5 SECOND TIMER LOGIC ---
    // Instantly check LocalDB! If the user already did this offline, skip the timer!
    let initialTime = 5;
    if (activeUid) {
      const localData = getLocalUser(activeUid);
      if (localData && localData.lesson5Completed === 1) {
        initialTime = 0;
        setTimeLeft(0);
      }
    }

    if (initialTime > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeUid]);

  const handleContinue = async () => {
    if (!activeUid) {
      router.replace({
        pathname: "/quiz6",
        params: { uid: activeUid, score: params.score },
      });
      return;
    }

    const state = await NetInfo.fetch();

    if (state.isConnected) {
      try {
        // ONLINE: Update Firebase directly
        const userRef = ref(db, `users/${activeUid}`);
        await update(userRef, {
          "lesson5/completed": true,
        });
        console.log("Quiz 5: Sync to Firebase successful");
      } catch (error) {
        // SAVED SILENTLY OFFLINE IF FIREBASE ERRORS OUT
        updateLocalProgress(activeUid, "lesson5Completed", true);
      }
    } else {
      // SAVED SILENTLY OFFLINE
      updateLocalProgress(activeUid, "lesson5Completed", true);
    }

    // Navigation Delay
    setTimeout(() => {
      // Assuming it goes to home after. Change to "/quiz6" if you have a 6th lesson!
      router.replace({
        pathname: "/quiz6",
        params: { uid: activeUid, score: params.score },
      });
    }, 150);
  };

  return (
    <SafeAreaView className="flex-1 bg-blue-800">
      <StatusBar barStyle="light-content" />

      {/* BACKGROUND */}
      <View className="absolute inset-0 opacity-30">
        <ImageBackground
          source={require("../assets/bg3.png")}
          className="flex-1"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/40" />
      </View>

      <View className="flex-1 px-8 justify-center items-center">
        {/* --- ANIMATED MASCOT SECTION --- */}
        <Animated.View
          style={{ transform: [{ translateY: studentFloat }], zIndex: 10 }}
        >
          <View className="mb-10 items-center justify-center relative">
            {/* ANIMATED SPEECH CLOUD */}
            <Animated.View
              style={{
                opacity: cloudFade,
                position: "absolute",
                top: -35,
                right: -15,
                zIndex: 20,
              }}
            >
              <View className="bg-white rounded-2xl p-1 py-3 shadow-xl min-w-[120px]">
                <Text className="text-blue-900 font-bold text-center text-[10px] leading-3">
                  {timeLeft > 0
                    ? `Read carefully...\n${timeLeft}s remaining`
                    : "Already know Monohybrid?\nTap Next."}
                </Text>
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
                    borderTopColor: "white",
                    borderLeftColor: "transparent",
                    borderRightColor: "transparent",
                  }}
                />
              </View>
            </Animated.View>

            <View className="w-28 h-28 rounded-full border-4 border-yellow-500 bg-blue-900/80 overflow-hidden shadow-2xl">
              <Image
                source={require("../assets/m.png")}
                className="w-full h-full"
                resizeMode="contain"
              />
            </View>
          </View>
        </Animated.View>

        {/* --- ANIMATED CONTENT CARD --- */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            flex: 1,
            width: "100%",
            alignItems: "center",
            maxHeight: "55%",
            marginBottom: 40,
          }}
        >
          <View className="flex-1 bg-blue-950/90 border-2 border-blue-400 rounded-3xl w-full max-w-[400px] shadow-2xl shadow-blue-500/30 overflow-hidden">
            <View className="bg-blue-900/50 py-5 border-b border-blue-400/50">
              <Text className="text-yellow-500 font-black text-2xl text-center tracking-tighter px-4">
                One Trait at a Time
              </Text>
            </View>

            <ScrollView
              className="flex-1 px-6 pt-6"
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              <View className="flex-row items-start mb-5">
                <Text className="text-yellow-500 mr-3 text-lg mt-[-2px]">
                  •
                </Text>
                <Text className="text-white text-base font-medium flex-1 leading-6">
                  To understand how traits are inherited, scientists study one
                  trait at a time.
                </Text>
              </View>

              <View className="flex-row items-start mb-6">
                <Text className="text-yellow-500 mr-3 text-lg mt-[-2px]">
                  •
                </Text>
                <Text className="text-white text-base font-medium flex-1 leading-6">
                  This type of study is called a monohybrid cross.
                </Text>
              </View>

              <Text className="text-white text-base font-bold mb-3">
                A monohybrid cross helps us predict:
              </Text>

              <View className="flex-row items-start mb-3 ml-4">
                <Text className="text-cyan-300 mr-3 text-lg mt-[-3px]">-</Text>
                <Text className="text-blue-100 text-base font-medium flex-1 leading-6">
                  Possible traits of offspring
                </Text>
              </View>

              <View className="flex-row items-start mb-2 ml-4">
                <Text className="text-cyan-300 mr-3 text-lg mt-[-3px]">-</Text>
                <Text className="text-blue-100 text-base font-medium flex-1 leading-6">
                  The chance of each trait appearing
                </Text>
              </View>
            </ScrollView>

            {/* BUTTON CONTAINER */}
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
                    {timeLeft > 0 ? `WAIT ${timeLeft}s` : "Continue"}
                  </Text>
                </View>
              </TouchableOpacity>
              {/* Added Return to Main Menu Link */}
              <TouchableOpacity
                onPress={() =>
                  router.replace({
                    pathname: "/home",
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
            </View>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

export default Quiz5;
