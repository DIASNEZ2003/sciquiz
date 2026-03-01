import NetInfo from "@react-native-community/netinfo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { onValue, ref, update } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "./Firebase";
import {
  getLocalUser,
  updateLocalLessonScore,
  updateLocalProgress,
  updateLocalUserScore,
} from "./LocalDB";

const Quiz9 = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Box state for the 2x2 grid. Indices: 0 (TopL), 1 (TopR), 2 (BotL), 3 (BotR)
  const [gridValues, setGridValues] = useState(["", "", "", ""]);
  const targetAnswers = ["Pp", "pp", "Pp", "pp"]; // The correct answers for Pp x pp
  const alleleOptions = ["", "PP", "Pp", "pp"]; // Cycle options

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("wrong"); // "wrong" or "success"
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [lesson9EarnedScore, setLesson9EarnedScore] = useState(0);

  // NEW: State for the Hint Box
  const [showHint, setShowHint] = useState(false);

  const activeUid = auth.currentUser ? auth.currentUser.uid : params.uid;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const studentFloat = useRef(new Animated.Value(0)).current;
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
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

    // Check LOCAL DB immediately
    if (activeUid) {
      const localData = getLocalUser(activeUid);
      if (localData && localData.lesson9Completed === 1) {
        setAlreadyCompleted(true);
        setGridValues([...targetAnswers]); // Pre-fill if completed
      }
    }

    if (activeUid) {
      const userRef = ref(db, `users/${activeUid}`);
      const unsubscribe = onValue(userRef, (snapshot) => {
        if (snapshot.exists() && isMounted.current) {
          const data = snapshot.val();
          if (data.lesson9 && data.lesson9.completed) {
            setAlreadyCompleted(true);
            setGridValues([...targetAnswers]);
          }
        }
      });
      return () => {
        isMounted.current = false;
        unsubscribe();
      };
    }

    return () => {
      isMounted.current = false;
    };
  }, [activeUid]);

  // Handle Tapping a Box in the Grid
  const handleBoxTap = (index) => {
    if (alreadyCompleted || isNavigating) return;

    const currentVal = gridValues[index];
    const nextIndex =
      (alleleOptions.indexOf(currentVal) + 1) % alleleOptions.length;

    const newGrid = [...gridValues];
    newGrid[index] = alleleOptions[nextIndex];
    setGridValues(newGrid);
  };

  // Check Answers
  const handleCheckSquare = async () => {
    if (alreadyCompleted) {
      // If already done, just show the success feedback
      setModalMode("success");
      setShowModal(true);
      return;
    }

    const isCorrect = gridValues.every(
      (val, index) => val === targetAnswers[index],
    );

    if (isCorrect) {
      setModalMode("success");
      setShowModal(true);

      // Score Logic (2 points for building it correctly)
      if (activeUid) {
        const localUser = getLocalUser(activeUid);
        const currentGlobalScore = localUser
          ? localUser.score
          : Number(params.score) || 0;
        const pointsEarned = 2; // UPDATED to 2 Points
        const newGlobalScore = currentGlobalScore + pointsEarned;
        setLesson9EarnedScore(pointsEarned);

        try {
          const netInfo = await NetInfo.fetch();
          if (netInfo.isConnected) {
            const userRef = ref(db, `users/${activeUid}`);
            await update(userRef, {
              score: newGlobalScore,
              "lesson9/score": pointsEarned,
              "lesson9/completed": true,
            });
          } else {
            updateLocalUserScore(activeUid, newGlobalScore);
            updateLocalLessonScore(activeUid, "lesson9Score", pointsEarned);
            updateLocalProgress(activeUid, "lesson9Completed", true);
          }
        } catch (error) {
          updateLocalUserScore(activeUid, newGlobalScore);
          updateLocalLessonScore(activeUid, "lesson9Score", pointsEarned);
          updateLocalProgress(activeUid, "lesson9Completed", true);
        }
      }
    } else {
      setModalMode("wrong");
      setShowModal(true);
    }
  };

  const handleNextAction = () => {
    if (isNavigating || !isMounted.current) return;

    if (modalMode === "wrong") {
      setShowModal(false);
      return;
    }

    // On Success -> Finish
    setIsNavigating(true);
    setShowModal(false);
    router.replace({ pathname: "/quiz10", params: { uid: activeUid } });
  };

  const navigateToHome = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.replace({ pathname: "/quiz10", params: { uid: activeUid } });
  };

  return (
    <SafeAreaView className="flex-1 bg-blue-800">
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require("../assets/bg3.png")}
        className="flex-1 opacity-40 absolute inset-0"
      />

      {/* FEEDBACK MODAL */}
      <Modal transparent visible={showModal} animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/70 px-6">
          <View
            className={`w-full max-w-[420px] p-8 rounded-3xl border-4 ${modalMode === "success" ? "border-green-500 bg-blue-950" : "border-red-500 bg-blue-950"} items-center shadow-2xl shadow-blue-500/50`}
          >
            <Text
              className={`font-black text-3xl mb-2 text-center tracking-tighter ${modalMode === "success" ? "text-green-500" : "text-red-500"}`}
            >
              {modalMode === "success" ? "SQUARE COMPLETE!" : "NOT QUITE"}
            </Text>

            {modalMode === "success" ? (
              <View className="items-center w-full">
                {/* SHOWS 2 POINTS EARNED */}
                {!alreadyCompleted && (
                  <Text className="text-yellow-400 font-bold text-sm uppercase mb-4">
                    +2 Points Earned
                  </Text>
                )}

                <View className="bg-blue-900/60 p-4 rounded-xl border border-blue-400/30 w-full mb-4">
                  <Text className="text-yellow-500 font-bold text-sm mb-1">
                    Genotypic Ratio:
                  </Text>
                  <Text className="text-white font-medium mb-3">
                    1 Pp : 1 pp
                  </Text>

                  <Text className="text-yellow-500 font-bold text-sm mb-1">
                    Phenotypic Ratio:
                  </Text>
                  <Text className="text-white font-medium">
                    1 Purple : 1 White
                  </Text>
                </View>

                <Text className="text-blue-100 text-sm text-center font-medium leading-5 mb-6">
                  Purple is dominant over white, so heterozygous (Pp) offspring
                  appear purple.
                </Text>
              </View>
            ) : (
              <Text className="text-blue-100 text-lg text-center mb-8 mt-2">
                Check your allele combinations again. Match the top letter with
                the left letter for each box!
              </Text>
            )}

            <TouchableOpacity
              onPress={handleNextAction}
              className={`w-full py-4 rounded-2xl items-center shadow-lg ${modalMode === "success" ? "bg-green-500" : "bg-red-500"}`}
              style={{
                borderBottomWidth: 5,
                borderBottomColor:
                  modalMode === "success" ? "#15803d" : "#b91c1c",
              }}
            >
              <Text className="text-blue-950 font-black text-xl tracking-widest">
                {modalMode === "success" ? "FINISH" : "TRY AGAIN"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            flex: 1,
            width: "100%",
            alignItems: "center",
            paddingVertical: 20,
          }}
        >
          {/* MASCOT */}
          <Animated.View
            style={{
              transform: [{ translateY: studentFloat }],
              zIndex: 10,
              marginTop: 60,
              marginBottom: 10,
              alignItems: "center",
              position: "relative",
            }}
          >
            <View className="bg-white rounded-xl px-4 py-2 absolute -top-12 shadow-2xl z-10 min-w-[150px] border border-blue-100">
              <Text
                className="text-blue-950 font-bold text-center text-[11px] leading-4"
                style={{ includeFontPadding: false }}
              >
                {alreadyCompleted
                  ? "Awesome job!"
                  : "Tap the boxes\nto cycle alleles!"}
              </Text>
              <View
                style={{
                  position: "absolute",
                  bottom: -8,
                  alignSelf: "center",
                  borderLeftWidth: 8,
                  borderRightWidth: 8,
                  borderTopWidth: 8,
                  borderStyle: "solid",
                  backgroundColor: "transparent",
                  borderLeftColor: "transparent",
                  borderRightColor: "transparent",
                  borderTopColor: "white",
                }}
              />
            </View>
            <View className="w-20 h-20 rounded-full border-4 border-yellow-500 bg-blue-950/90 overflow-hidden shadow-2xl">
              <Image
                source={require("../assets/m.png")}
                className="w-full h-full"
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* MAIN CONTENT CARD */}
          <View className="w-full max-w-[480px] px-6 z-10 flex-1">
            <View className="bg-blue-950/90 border-2 border-blue-400 rounded-3xl w-full shadow-2xl shadow-blue-500/30 overflow-hidden mb-6">
              <View className="bg-blue-900/50 py-4 border-b border-blue-400/50">
                <Text className="text-yellow-500 font-black text-xl text-center tracking-tighter px-4">
                  Build the Punnett Square
                </Text>
              </View>

              <View className="p-5">
                <Text className="text-blue-200 font-bold text-xs uppercase tracking-widest mb-1">
                  Problem:
                </Text>
                <Text className="text-white text-base font-medium leading-5 mb-4">
                  A heterozygous purple flower (Pp) is crossed with a white
                  flower (pp).
                </Text>

                <View className="flex-row justify-between mb-4 bg-blue-900/40 p-3 rounded-xl border border-blue-400/20">
                  <Text className="text-white font-bold">
                    Parent 1: <Text className="text-purple-400">Pp</Text>
                  </Text>
                  <Text className="text-white font-bold">
                    Parent 2: <Text className="text-white">pp</Text>
                  </Text>
                </View>

                {/* HINT BUTTON & BOX */}
                {!alreadyCompleted && (
                  <>
                    <TouchableOpacity
                      onPress={() => setShowHint(!showHint)}
                      className="items-center py-2 mb-2"
                    >
                      <Text className="text-yellow-400 font-bold text-xs tracking-widest uppercase underline">
                        {showHint ? "Hide Hint" : "Need a hint?"}
                      </Text>
                    </TouchableOpacity>

                    {showHint && (
                      <View className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/50 mb-4">
                        <Text className="text-blue-100 text-[13px] font-medium leading-5 text-center">
                          Combine the letter from the{" "}
                          <Text className="text-yellow-400 font-bold">TOP</Text>{" "}
                          with the letter from the{" "}
                          <Text className="text-yellow-400 font-bold">
                            LEFT
                          </Text>
                          . Capital letters (P) always go first!
                        </Text>
                      </View>
                    )}
                  </>
                )}

                {/* PUNNETT SQUARE GRID - CENTERED AND YELLOW */}
                <View className="items-center justify-center mb-4 w-full">
                  {/* Top Parent Row */}
                  <View className="flex-row w-48 justify-around ml-8 mb-2">
                    <Text className="text-yellow-500 font-black text-3xl">
                      P
                    </Text>
                    <Text className="text-yellow-500 font-black text-3xl">
                      p
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    {/* Left Parent Column */}
                    <View className="h-48 justify-around mr-4">
                      <Text className="text-yellow-500 font-black text-3xl">
                        p
                      </Text>
                      <Text className="text-yellow-500 font-black text-3xl">
                        p
                      </Text>
                    </View>

                    {/* 2x2 Grid - YELLOW BACKGROUND */}
                    <View className="w-48 h-48 flex-row flex-wrap border-4 border-yellow-500 bg-yellow-400 rounded-xl overflow-hidden shadow-lg">
                      {[0, 1, 2, 3].map((index) => {
                        const val = gridValues[index];
                        const isFilled = val !== "";

                        // Dynamic Text Color: Purple for P, White for p
                        let textColor = "text-yellow-600/40"; // Default empty question mark
                        if (val === "Pp" || val === "PP")
                          textColor = "text-purple-800"; // Deep Purple
                        if (val === "pp") textColor = "text-white"; // Bright White

                        return (
                          <TouchableOpacity
                            key={index}
                            onPress={() => handleBoxTap(index)}
                            activeOpacity={0.7}
                            className="w-1/2 h-1/2 border-2 border-yellow-500 items-center justify-center bg-yellow-400"
                          >
                            <Text
                              className={`font-black text-4xl ${textColor}`}
                              style={
                                val === "pp"
                                  ? {
                                      textShadowColor: "rgba(0, 0, 0, 0.4)",
                                      textShadowOffset: { width: 1, height: 1 },
                                      textShadowRadius: 3,
                                    }
                                  : {}
                              }
                            >
                              {isFilled ? val : "?"}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>

                {/* ACTION BUTTON */}
                <TouchableOpacity
                  onPress={handleCheckSquare}
                  activeOpacity={0.8}
                  className="w-full mt-4"
                >
                  <View
                    className="bg-yellow-500 rounded-2xl py-4 flex-row items-center justify-center shadow-xl"
                    style={{
                      borderBottomWidth: 5,
                      borderBottomColor: "#a16207",
                      minHeight: 60,
                    }}
                  >
                    <Text
                      className="text-blue-950 font-black text-xl tracking-widest uppercase px-2"
                      style={{
                        includeFontPadding: false,
                        textAlignVertical: "center",
                      }}
                    >
                      {alreadyCompleted ? "View Results" : "Check Square"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={navigateToHome}
              activeOpacity={0.7}
              className="w-full items-center mb-10"
            >
              <Text className="text-blue-300 font-bold text-xs tracking-widest uppercase underline">
                Return to Main Menu
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Quiz9;
