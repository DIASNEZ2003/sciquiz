// app/quiz2.jsx
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
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "./Firebase";
import { getLocalUser, saveLocalUser } from "./LocalDB";

const Quiz2 = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Quiz State
  const [quizStarted, setQuizStarted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);

  // Track if they already completed this in the past
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  // Safely get the user's UID whether online or offline
  const activeUid = auth.currentUser ? auth.currentUser.uid : params.uid;

  // Animation Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const studentFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

    // --- CHECK IF ALREADY COMPLETED ---
    if (activeUid) {
      const userRef = ref(db, `users/${activeUid}`);
      const unsubscribe = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          // If the database says they already finished "gene_genius"
          if (
            data.gene_genius &&
            (data.gene_genius.status === "done" || data.gene_genius.completed)
          ) {
            setAlreadyCompleted(true);
            setQuizStarted(true); // Skip intro
            setIsAnswered(true); // Lock answers
            setSelectedOption("B"); // Highlight correct answer
            setIsCorrect(true);
          }
        }
      });
      return () => unsubscribe();
    }
  }, [activeUid, fadeAnim, studentFloat]);

  const handleCheckAnswer = async (option) => {
    if (isAnswered) return;
    setSelectedOption(option);

    const correct = option === "B"; // Phenotype is correct
    setIsCorrect(correct);
    setIsAnswered(true);

    // --- SCORE & STATUS SAVING LOGIC ---
    if (correct && activeUid) {
      try {
        const netInfo = await NetInfo.fetch();
        let newTotalScore = 5;

        // 1. Update SQLite (Offline Backup)
        const localData = getLocalUser(activeUid);
        if (localData) {
          newTotalScore = (localData.score || 0) + 5;
          saveLocalUser(
            activeUid,
            localData.email,
            localData.password,
            localData.fullName,
            localData.avatarId,
            newTotalScore,
            netInfo.isConnected ? 0 : 1,
          );
        }

        // 2. Update Firebase (If Online)
        if (netInfo.isConnected) {
          const userRef = ref(db, `users/${activeUid}`);
          await update(userRef, {
            score: newTotalScore,
            "gene_genius/score": 5,
            "gene_genius/status": "done",
            "gene_genius/completed": true,
          });
        }
      } catch (error) {
        console.error("Error saving score & status:", error);
      }
    }

    // Show the result modal ONLY if this is their first time answering
    if (!alreadyCompleted) {
      setTimeout(() => {
        setShowModal(true);
      }, 600);
    }
  };

  const renderIntro = () => (
    <View className="items-center w-full">
      <Text className="text-yellow-500 font-black text-3xl text-center mb-6 tracking-tighter">
        Gene Genius
      </Text>
      <View className="bg-blue-950/70 p-7 rounded-3xl border-2 border-blue-500 mb-10 w-full">
        <Text className="text-blue-100 text-lg font-medium text-center leading-7">
          Test what you already know about genetics!{"\n\n"}
          Answer correctly to earn 5 points and proceed to the next lab module.
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => setQuizStarted(true)}
        activeOpacity={0.8}
        className="w-full"
      >
        <View
          className="bg-yellow-500 rounded-2xl py-4 items-center shadow-xl"
          style={{ borderBottomWidth: 5, borderBottomColor: "#a16207" }}
        >
          <Text className="text-blue-950 font-black text-xl tracking-widest uppercase">
            Start Quiz
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderQuestion = () => (
    <View className="w-full">
      <View className="flex-row justify-between mb-6 px-2">
        <Text className="text-blue-300 font-bold text-xs uppercase tracking-widest">
          Question 01
        </Text>
        <Text className="text-yellow-500 font-bold text-xs uppercase tracking-widest">
          Easy
        </Text>
      </View>

      <Text className="text-white font-bold text-xl mb-10 leading-8 text-center px-2">
        What do we call the observable trait of an organism?
      </Text>

      {["Genotype", "Phenotype", "Allele", "Gene"].map((option, index) => {
        const optionLetter = ["A", "B", "C", "D"][index];
        const isThisSelected = selectedOption === optionLetter;

        let borderColor = "border-blue-500";
        let bgColor = "bg-blue-950/60";
        let circleBg = "bg-blue-800";
        let textColor = "text-white";

        if (isAnswered) {
          if (optionLetter === "B") {
            borderColor = alreadyCompleted
              ? "border-yellow-500"
              : "border-green-500";
            bgColor = alreadyCompleted
              ? "bg-yellow-500/20"
              : isThisSelected
                ? "bg-green-500/20"
                : "bg-blue-950/60";
            circleBg = alreadyCompleted ? "bg-yellow-500" : "bg-green-500";
            textColor = alreadyCompleted ? "text-yellow-500" : "text-green-500";
          } else if (isThisSelected) {
            borderColor = "border-red-500";
            bgColor = "bg-red-500/20";
            circleBg = "bg-red-500";
            textColor = "text-red-500";
          }
        } else if (isThisSelected) {
          borderColor = "border-yellow-500";
          bgColor = "bg-yellow-500/10";
          circleBg = "bg-yellow-500";
        }

        return (
          <TouchableOpacity
            key={optionLetter}
            onPress={() => handleCheckAnswer(optionLetter)}
            disabled={isAnswered}
            activeOpacity={0.7}
            className={`flex-row items-center border-2 ${borderColor} ${bgColor} rounded-2xl p-4 mb-4 shadow-md`}
          >
            <View
              className={`w-9 h-9 rounded-full items-center justify-center mr-5 ${circleBg}`}
            >
              <Text
                className={`font-black text-lg ${isThisSelected || (optionLetter === "B" && isAnswered) ? "text-blue-950" : "text-white"}`}
              >
                {optionLetter}
              </Text>
            </View>
            <Text
              className={`font-bold text-lg flex-1 ${isAnswered && (isThisSelected || optionLetter === "B") ? textColor : "text-white"}`}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}

      {alreadyCompleted && (
        <TouchableOpacity
          onPress={() => {
            setTimeout(() => {
              router.push({ pathname: "/quiz3", params: { uid: activeUid } });
            }, 100);
          }}
          className="mt-6 bg-yellow-500 py-4 rounded-2xl items-center shadow-lg w-full"
          style={{ borderBottomWidth: 5, borderBottomColor: "#a16207" }}
        >
          <Text className="text-blue-950 font-black text-xl tracking-widest uppercase">
            NEXT QUESTION
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  let cloudText = "";
  if (!quizStarted) {
    cloudText = "Initialization\ncomplete. Begin?";
  } else if (alreadyCompleted) {
    cloudText = "Reviewing Data:\nPhenotype refers to observable traits.";
  } else if (isAnswered) {
    cloudText = isCorrect
      ? "Data match!\nProceeding."
      : "Recalibrating...\nTry again.";
  } else {
    cloudText = "Choose the right\nobservable trait!";
  }

  return (
    <SafeAreaView className="flex-1 bg-blue-800">
      <StatusBar barStyle="light-content" />

      {/* --- BACKGROUND LAYER --- */}
      <View className="absolute inset-0 opacity-40">
        <ImageBackground
          source={require("../assets/bg3.png")}
          className="flex-1"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/60" />
      </View>

      {/* --- FEEDBACK MODAL --- */}
      <Modal
        transparent
        visible={showModal && !alreadyCompleted}
        animationType="fade"
      >
        <View className="flex-1 justify-center items-center bg-black/80 px-8">
          <View
            className={`w-full max-w-[400px] p-8 rounded-3xl border-4 ${isCorrect ? "border-green-500 bg-blue-950" : "border-yellow-500 bg-blue-950"} items-center shadow-2xl shadow-blue-500/50`}
          >
            <Text
              className={`font-black text-3xl mb-2 text-center tracking-tighter ${isCorrect ? "text-green-500" : "text-yellow-500"}`}
            >
              {isCorrect ? "CORRECT!" : "WRONG"}
            </Text>

            {isCorrect && (
              <View className="items-center mb-4 mt-2">
                <Text className="text-yellow-400 font-bold text-sm tracking-widest uppercase">
                  +5 Points Earned
                </Text>
                <Text className="text-blue-300 font-bold text-[10px] tracking-widest uppercase mt-1">
                  Status: Done
                </Text>
              </View>
            )}

            <Text className="text-blue-100 text-lg text-center font-medium leading-6 mb-8 mt-2">
              {isCorrect
                ? "Excellent work! Phenotype refers to physical properties like color or height."
                : "Not quite. Phenotype defines the traits we can observe physically."}
            </Text>

            <TouchableOpacity
              onPress={() => {
                setShowModal(false);
                setTimeout(() => {
                  router.push({
                    pathname: "/quiz3",
                    params: { uid: activeUid },
                  });
                }, 150); // Small timeout to prevent navigation crash
              }}
              className={`w-full py-4 rounded-2xl items-center shadow-lg ${isCorrect ? "bg-green-500" : "bg-yellow-500"}`}
              style={{
                borderBottomWidth: 5,
                borderBottomColor: isCorrect ? "#15803d" : "#a16207",
              }}
            >
              <Text className="text-blue-950 font-black text-xl tracking-widest">
                NEXT QUESTION
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- MAIN CONTENT LAYER --- */}
      {/* FIX: Removed className from Animated.View, mapped it to style instead */}
      <Animated.View style={{ opacity: fadeAnim, flex: 1, width: "100%" }}>
        {/* Safe wrapper View handles the Tailwind styling */}
        <View className="flex-1 px-8 justify-center items-center">
          {/* MASCOT SECTION */}
          {/* FIX: Removed className from Animated.View */}
          <Animated.View
            style={{ transform: [{ translateY: studentFloat }], zIndex: 10 }}
          >
            {/* Safe wrapper View */}
            <View className="mt-20 mb-1 items-center justify-center relative">
              {/* Speech Cloud */}
              <View className="bg-white rounded-2xl p-4 absolute -top-16 mt-5 -left-28 shadow-2xl z-10 min-w-[150px]">
                <Text className="text-blue-950 font-bold text-center text-xs leading-4">
                  {cloudText}
                </Text>
                <View
                  style={{
                    position: "absolute",
                    bottom: -10,
                    right: 20,
                    width: 0,
                    height: 0,
                    borderLeftWidth: 10,
                    borderRightWidth: 10,
                    borderTopWidth: 10,
                    borderStyle: "solid",
                    backgroundColor: "transparent",
                    borderLeftColor: "transparent",
                    borderRightColor: "transparent",
                    borderTopColor: "white",
                  }}
                />
              </View>

              {/* Avatar Graphic */}
              <View className="w-24 h-24 rounded-full border-4 border-yellow-500 bg-blue-950/90 overflow-hidden shadow-2xl">
                <Image
                  source={require("../assets/m.png")}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              </View>
            </View>
          </Animated.View>

          {/* QUIZ CONTENT */}
          <View className="w-full max-w-[480px] z-10 flex-1">
            {!quizStarted ? renderIntro() : renderQuestion()}

            {/* MAIN MENU BUTTON */}
            <TouchableOpacity
              onPress={() => {
                setTimeout(() => {
                  router.replace({
                    pathname: "/lessons",
                    params: { uid: activeUid },
                  });
                }, 100);
              }}
              activeOpacity={0.7}
              className="mt-8 w-full items-center mb-10"
            >
              <Text className="text-blue-300 font-bold text-xs tracking-widest uppercase underline">
                Return to Main Menu
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default Quiz2;
