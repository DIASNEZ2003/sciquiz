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

const Quiz5_5 = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [timeLeft, setTimeLeft] = useState(5);
  const activeUid = auth.currentUser ? auth.currentUser.uid : params.uid;

  // --- ANIMATION REFS ---
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

    // Bypass timer if already completed locally
    let initialTime = 5;
    if (activeUid) {
      const localData = getLocalUser(activeUid);
      if (localData && localData.lesson5_5Completed === 1) {
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
    if (activeUid) {
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        try {
          const userRef = ref(db, `users/${activeUid}`);
          await update(userRef, { "lesson5_5/completed": true });
        } catch (error) {
          updateLocalProgress(activeUid, "lesson5_5Completed", true);
        }
      } else {
        updateLocalProgress(activeUid, "lesson5_5Completed", true);
      }
    }

    setTimeout(() => {
      router.replace({
        pathname: "/quiz7",
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
                top: -35,
                right: -15,
                zIndex: 20,
              }}
            >
              <View className="bg-white rounded-2xl p-3 shadow-xl min-w-[120px]">
                <Text className="text-blue-900 font-bold text-center text-[10px] leading-3">
                  {timeLeft > 0
                    ? `Predicting traits...\n${timeLeft}s remaining`
                    : "Already know Punnet Square?\nTap Continue."}
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

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            flex: 1,
            width: "100%",
            alignItems: "center",
            maxHeight: "59%",
            marginBottom: 40,
          }}
        >
          <View className="flex-1 bg-blue-950/90 border-2 border-blue-400 rounded-3xl w-full max-w-[400px] shadow-2xl shadow-blue-500/30 overflow-hidden">
            <View className="bg-blue-900/50 py-5 border-b border-blue-400/50">
              <Text className="text-yellow-500 font-black text-2xl text-center tracking-tighter px-4">
                What is a Punnett Square?
              </Text>
            </View>

            <ScrollView
              className="flex-1 px-6 pt-6"
              showsVerticalScrollIndicator={false}
            >
              <Text className="text-white text-base font-medium leading-6 mb-4">
                A Punnett square is a simple chart used to predict the possible
                traits of offspring.
              </Text>
              <Text className="text-white text-base font-medium leading-6 mb-6">
                It shows how alleles from each parent combine.
              </Text>

              <View className="bg-blue-900/40 p-4 rounded-2xl border border-blue-400/30">
                <Text className="text-blue-200 font-bold text-sm mb-3 uppercase tracking-widest">
                  Scientists use it to find:
                </Text>
                <View className="flex-row items-start mb-2">
                  <Text className="text-yellow-500 mr-2">•</Text>
                  <Text className="text-white text-base">
                    Possible genotypes
                  </Text>
                </View>
                <View className="flex-row items-start mb-2">
                  <Text className="text-yellow-500 mr-2">•</Text>
                  <Text className="text-white text-base">
                    Possible phenotype
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Text className="text-yellow-500 mr-2">•</Text>
                  <Text className="text-white text-base">
                    The chance of each trait appearing
                  </Text>
                </View>
              </View>
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
                    {timeLeft > 0 ? `WAIT ${timeLeft}s` : "Continue"}
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
                className="mt-4 w-full items-center"
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

export default Quiz5_5;
