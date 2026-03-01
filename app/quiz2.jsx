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
import {
  getLocalUser,
  updateLocalProgress,
  updateLocalUserScore,
} from "./LocalDB";

const Quiz2 = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [quizStarted, setQuizStarted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

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

    // Check LOCAL DB immediately (Works completely offline!)
    if (activeUid) {
      const localData = getLocalUser(activeUid);
      if (localData && localData.lesson2Completed === 1) {
        setAlreadyCompleted(true);
        setQuizStarted(true);
        setIsAnswered(true);
        setSelectedOption("B");
        setIsCorrect(true);
      }
    }

    if (activeUid) {
      const userRef = ref(db, `users/${activeUid}`);
      const unsubscribe = onValue(userRef, (snapshot) => {
        if (snapshot.exists() && isMounted.current) {
          const data = snapshot.val();
          if (data.gene_genius && data.gene_genius.completed) {
            setAlreadyCompleted(true);
            setQuizStarted(true);
            setIsAnswered(true);
            setSelectedOption("B");
            setIsCorrect(true);
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

  const handleCheckAnswer = async (option) => {
    if (isAnswered || isNavigating) return;

    setSelectedOption(option);
    const correct = option === "B";
    setIsCorrect(correct);
    setIsAnswered(true);

    if (isMounted.current) setShowModal(true);

    if (correct && activeUid && !alreadyCompleted) {
      const currentTotalScore = Number(params.score) || 0;
      const newTotalScore = currentTotalScore + 2;

      try {
        const netInfo = await NetInfo.fetch();

        if (netInfo.isConnected) {
          const userRef = ref(db, `users/${activeUid}`);
          await update(userRef, {
            score: newTotalScore,
            "gene_genius/score": 2,
            "gene_genius/completed": true,
          });
        } else {
          // Saved silently offline
          updateLocalUserScore(activeUid, newTotalScore);
          updateLocalProgress(activeUid, "lesson2Completed", true);
        }
      } catch (error) {
        // Saved silently offline on error
        updateLocalUserScore(activeUid, newTotalScore);
        updateLocalProgress(activeUid, "lesson2Completed", true);
      }
    }
  };

  const navigateToNext = () => {
    if (isNavigating || !isMounted.current) return;
    setIsNavigating(true);
    setShowModal(false);

    requestAnimationFrame(() => {
      setTimeout(() => {
        if (isMounted.current) {
          router.replace({
            pathname: "/quiz3",
            params: {
              uid: activeUid,
              score:
                isCorrect && !alreadyCompleted
                  ? (Number(params.score) || 0) + 2
                  : params.score,
            },
          });
        }
        setTimeout(() => {
          if (isMounted.current) setIsNavigating(false);
        }, 500);
      }, 100);
    });
  };

  const navigateToHome = () => {
    if (isNavigating || !isMounted.current) return;
    setIsNavigating(true);

    requestAnimationFrame(() => {
      setTimeout(() => {
        if (isMounted.current)
          router.replace({ pathname: "/home", params: { uid: activeUid } });
        setTimeout(() => {
          if (isMounted.current) setIsNavigating(false);
        }, 500);
      }, 100);
    });
  };

  const closeModal = () => {
    if (isNavigating) return;
    setShowModal(false);
  };

  const renderIntro = () => (
    <View className="items-center w-full">
      <Text className="text-yellow-500 font-black text-3xl text-center mb-6 tracking-tighter">
        Gene Genius
      </Text>
      <View className="bg-blue-950/70 p-7 rounded-3xl border-2 border-blue-500 mb-10 w-full">
        <Text className="text-blue-100 text-lg font-medium text-center leading-7">
          Test what you already know about genetics!{"\n\n"}
          Answer correctly to earn 2 points and proceed to the next lab module.
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => setQuizStarted(true)}
        activeOpacity={0.8}
        className="w-full"
        disabled={isNavigating}
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
          Refresher Question
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
            disabled={isAnswered || isNavigating}
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
          onPress={navigateToNext}
          disabled={isNavigating}
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

  let cloudText = !quizStarted
    ? "Initialization\ncomplete. Begin?"
    : alreadyCompleted
      ? "Reviewing Data:\nPhenotype is the observable physical trait."
      : isAnswered
        ? isCorrect
          ? "Data match!\nProceeding."
          : "Recalibrating...\nTry again."
        : "Choose the right\nobservable trait!";

  return (
    <SafeAreaView className="flex-1 bg-blue-800">
      <StatusBar barStyle="light-content" />
      <View className="absolute inset-0 opacity-40">
        <ImageBackground
          source={require("../assets/bg3.png")}
          className="flex-1"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/60" />
      </View>

      <Modal
        transparent
        visible={showModal}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View className="flex-1 justify-center items-center bg-black/70 px-8">
          <View
            className={`w-full max-w-[400px] p-8 rounded-3xl border-4 ${isCorrect ? "border-green-500 bg-blue-950" : "border-red-500 bg-blue-950"} items-center shadow-2xl`}
          >
            <Text
              className={`font-black text-3xl mb-2 text-center tracking-tighter ${isCorrect ? "text-green-500" : "text-red-500"}`}
            >
              {isCorrect ? "CORRECT!" : "INCORRECT"}
            </Text>

            {isCorrect && (
              <View className="items-center mb-4 mt-2">
                <Text className="text-yellow-400 font-bold text-sm tracking-widest uppercase">
                  +2 Points Earned
                </Text>
                <Text className="text-blue-300 font-bold text-[10px] tracking-widest uppercase mt-1">
                  Status: Completed
                </Text>
              </View>
            )}

            {isCorrect ? (
              <Text className="text-blue-100 text-lg text-center font-medium leading-6 mb-8 mt-2">
                Excellent work! Phenotype refers to physical properties like
                color or height.
              </Text>
            ) : (
              <View className="items-center w-full mb-8">
                <Text className="text-blue-100 text-lg text-center font-medium leading-6 mb-4 mt-2">
                  Not quite. Phenotype defines the traits we can observe
                  physically.
                </Text>

                {/* RED BOX SHOWING EXACT ANSWER */}
                <View className="bg-red-500/20 p-4 rounded-xl border border-red-500 w-full mt-2">
                  <Text className="text-red-300 font-bold text-xs uppercase tracking-widest mb-1">
                    Correct Answer:
                  </Text>
                  <Text className="text-white font-medium">B) Phenotype</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={navigateToNext}
              disabled={isNavigating}
              className={`w-full py-4 rounded-2xl items-center shadow-lg ${isCorrect ? "bg-green-500" : "bg-red-500"}`}
              style={{
                borderBottomWidth: 5,
                borderBottomColor: isCorrect ? "#15803d" : "#991b1b",
              }}
            >
              <Text className="text-white font-black text-xl tracking-widest">
                {alreadyCompleted ? "CONTINUE" : "NEXT QUESTION"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Animated.View
        style={{
          opacity: fadeAnim,
          flex: 1,
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Animated.View
          style={{
            transform: [{ translateY: studentFloat }],
            zIndex: 10,
            marginTop: 105,
            marginBottom: 4,
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <View className="bg-white rounded-2xl p-4 absolute -top-16 -left-28 shadow-2xl z-10 min-w-[150px]">
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
          <View className="w-24 h-24 rounded-full border-4 border-yellow-500 bg-blue-950/90 overflow-hidden shadow-2xl">
            <Image
              source={require("../assets/m.png")}
              className="w-full h-full"
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        <View className="w-full max-w-[480px] px-8 z-10 flex-1">
          {!quizStarted ? renderIntro() : renderQuestion()}
          <TouchableOpacity
            onPress={navigateToHome}
            disabled={isNavigating}
            activeOpacity={0.7}
            className="mt-8 w-full items-center mb-10"
          >
            <Text className="text-blue-300 font-bold text-xs tracking-widest uppercase underline">
              Return to Main Menu
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default Quiz2;
