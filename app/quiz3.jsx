import NetInfo from "@react-native-community/netinfo";
import { ResizeMode, Video } from "expo-av"; // <-- ADDED FOR VIDEO
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

const Quiz3 = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [timeLeft, setTimeLeft] = useState(5);

  const activeUid = auth.currentUser ? auth.currentUser.uid : params.uid;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const studentFloat = useRef(new Animated.Value(0)).current;
  const cloudFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

    let initialTime = 5;
    if (activeUid) {
      const localData = getLocalUser(activeUid);
      if (localData && localData.lesson3Completed === 1) {
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
        pathname: "/quiz4",
        params: { uid: activeUid, score: params.score },
      });
      return;
    }

    const state = await NetInfo.fetch();

    if (state.isConnected) {
      try {
        const userRef = ref(db, `users/${activeUid}`);
        await update(userRef, { "curious_case/completed": true });
      } catch (error) {
        updateLocalProgress(activeUid, "lesson3Completed", true);
      }
    } else {
      // Saved silently in the background
      updateLocalProgress(activeUid, "lesson3Completed", true);
    }

    setTimeout(() => {
      router.replace({
        pathname: "/quiz4",
        params: { uid: activeUid, score: params.score },
      });
    }, 150);
  };

  return (
    <SafeAreaView className="flex-1 bg-blue-800">
      <StatusBar barStyle="light-content" />
      <View className="absolute inset-0 opacity-30">
        <ImageBackground
          source={require("../assets/bg3.png")}
          className="flex-1"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/40" />
      </View>

      <View className="flex-1 px-8 justify-center items-center">
        <Animated.View
          style={{ transform: [{ translateY: studentFloat }], zIndex: 10 }}
        >
          <View className="mb-10 items-center justify-center relative">
            <Animated.View
              style={{
                opacity: cloudFade,
                position: "absolute",
                top: -29,
                right: -15,
                zIndex: 20,
              }}
            >
              <View className="bg-white rounded-2xl p-3 shadow-xl min-w-[120px]">
                <Text className="text-blue-900 font-bold text-center text-[10px] leading-3">
                  {timeLeft > 0
                    ? `Analyze the case...\n${timeLeft}s remaining`
                    : "Mystery ready!\nTap Find Out."}
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
            <View className="w-28 h-28 mt-5 rounded-full border-4 border-yellow-500 bg-blue-900/80 overflow-hidden shadow-2xl">
              <Image
                source={require("../assets/m.png")}
                className="w-full h-full"
                resizeMode="contain"
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            flex: 1,
            width: "100%",
            alignItems: "center",
            maxHeight: "60%", // Slightly increased maxHeight to accommodate the video
            marginBottom: 40,
          }}
        >
          <View className="flex-1 bg-blue-950/90 border-2 border-blue-400 rounded-3xl w-full max-w-[400px] shadow-2xl shadow-blue-500/30 overflow-hidden">
            <View className="bg-blue-900/50 py-5 border-b border-blue-400/50">
              <Text className="text-yellow-500 font-black text-2xl text-center tracking-tighter px-2">
                How can genetics help solve this mystery?
              </Text>
            </View>
            <ScrollView
              className="flex-1 px-6 pt-4"
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {/* --- ADDED VIDEO COMPONENT --- */}
              <View className="w-full h-48 mb-4 rounded-xl overflow-hidden border-2 border-blue-400/30 bg-black">
                <Video
                  source={require("../assets/v2.mp4")}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                  isLooping
                  useNativeControls // Fullscreen and Zoom allowed
                  isMuted={false} // Audio ON
                />
              </View>
              {/* ----------------------------- */}

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
            </ScrollView>

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

export default Quiz3;
