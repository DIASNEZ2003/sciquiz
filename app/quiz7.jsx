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

const Quiz7 = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [timeLeft, setTimeLeft] = useState(5);
  const activeUid = auth.currentUser ? auth.currentUser.uid : params.uid;

  // --- ANIMATION REFS ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const studentFloat = useRef(new Animated.Value(0)).current;
  const cloudFade = useRef(new Animated.Value(0)).current;

  // Genetics Terms Data
  const terms = [
    { title: "Genotype", desc: "The genetic makeup of an organism." },
    { title: "Phenotype", desc: "The observable traits of an organism." },
    { title: "Homozygous", desc: "Having two identical alleles for a trait." },
    {
      title: "Heterozygous",
      desc: "Having two different alleles for a trait.",
    },
    {
      title: "Genotypic Ratio",
      desc: "The ratio of different genotypes in offspring.",
    },
    {
      title: "Phenotypic Ratio",
      desc: "The ratio of different phenotypes in offspring.",
    },
  ];

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
    let initialTime = 5;
    if (activeUid) {
      const localData = getLocalUser(activeUid);
      if (localData && localData.lesson7Completed === 1) {
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
        pathname: "/quiz8", // Change this if you want it to go to quiz8 later
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
          "lesson7/completed": true,
        });
        console.log("Quiz 7: Sync to Firebase successful");
      } catch (error) {
        // SAVED SILENTLY OFFLINE IF FIREBASE ERRORS OUT
        updateLocalProgress(activeUid, "lesson7Completed", true);
      }
    } else {
      // SAVED SILENTLY OFFLINE
      updateLocalProgress(activeUid, "lesson7Completed", true);
    }

    // Navigation Delay
    setTimeout(() => {
      // Change "/home" to the next quiz route when you build Quiz 8
      router.replace({
        pathname: "/quiz8",
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

      <View className="flex-1 px-6 justify-center items-center">
        {/* --- ANIMATED MASCOT SECTION --- */}
        <Animated.View
          style={{ transform: [{ translateY: studentFloat }], zIndex: 10 }}
        >
          <View className="mb-4 mt-6 items-center justify-center relative">
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
                    ? `Memorize these...\n${timeLeft}s remaining`
                    : "Memorize the Key Temrs?\nTap Continue."}
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

            <View className="w-24 h-24 rounded-full border-4 border-yellow-500 bg-blue-900/80 overflow-hidden shadow-2xl">
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
            maxHeight: "70%",
            marginBottom: 20,
          }}
        >
          <View className="flex-1 bg-blue-950/90 border-2 border-blue-400 rounded-3xl w-full max-w-[450px] shadow-2xl shadow-blue-500/30 overflow-hidden">
            <View className="bg-blue-900/50 py-4 border-b border-blue-400/50">
              <Text className="text-yellow-500 font-black text-2xl text-center tracking-tighter px-4">
                Genetics Key Terms
              </Text>
            </View>

            {/* SCROLLABLE CARDS */}
            <ScrollView
              className="flex-1 px-4 pt-4"
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {terms.map((term, index) => (
                <View
                  key={index}
                  className="bg-blue-900/40 border border-blue-400/30 p-4 rounded-2xl mb-4 shadow-sm"
                >
                  <Text className="text-yellow-500 font-bold text-lg mb-1 tracking-widest uppercase">
                    {term.title}
                  </Text>
                  <Text className="text-blue-100 text-base font-medium leading-5">
                    {term.desc}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* BUTTON CONTAINER */}
            <View className="p-5 bg-blue-900/30 border-t border-blue-400/20 items-center">
              <TouchableOpacity
                onPress={handleContinue}
                activeOpacity={0.8}
                className={`w-full ${timeLeft > 0 ? "opacity-50" : "opacity-100"}`}
                disabled={timeLeft > 0}
              >
                <View
                  className="bg-yellow-500 rounded-2xl py-4 px-2 items-center shadow-lg"
                  style={{ borderBottomWidth: 5, borderBottomColor: "#a16207" }}
                >
                  <Text className="text-blue-950 font-black text-xl text-center tracking-widest uppercase">
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

export default Quiz7;
