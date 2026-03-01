import NetInfo from "@react-native-community/netinfo";
import { ResizeMode, Video } from "expo-av";
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

// Moved questions outside to ensure a stable reference
const questions = [
  {
    title: "Problem 1: Flower Color",
    context:
      "In pea plants, flower color is controlled by one gene. Purple flowers (P) are dominant over white flowers (p). A heterozygous purple plant (Pp) is crossed with a white plant (pp).",
    text: "What are the genotypic and phenotypic ratios?",
    options: [
      "Genotypic: 1 PP : 1 pp\nPhenotypic: All Purple",
      "Genotypic: 1 Pp : 1 pp\nPhenotypic: 1 Purple : 1 White",
      "Genotypic: 3 Pp : 1 pp\nPhenotypic: 3 Purple : 1 White",
      "Genotypic: All Pp\nPhenotypic: All Purple",
    ],
    correctLetter: "B",
  },
  {
    title: "Problem 2: Seed Shape",
    context:
      "Round seeds (R) are dominant over wrinkled seeds (r). A homozygous dominant plant (RR) is crossed with a heterozygous plant (Rr).",
    text: "What is the genotypic ratio, and the probability of wrinkled seeds?",
    options: [
      "1 RR : 1 rr | 50% wrinkled",
      "1 RR : 1 Rr | 0% wrinkled",
      "3 RR : 1 rr | 25% wrinkled",
      "All Rr | 100% round",
    ],
    correctLetter: "B",
  },
  {
    title: "Problem 3: Hair Texture",
    context:
      "Curly hair (C) is dominant over straight hair (c). A heterozygous parent (Cc) is crossed with another heterozygous parent (Cc).",
    text: "What are the genotypic and phenotypic ratios?",
    options: [
      "1 CC : 2 Cc : 1 cc\n3 Curly : 1 Straight",
      "1 Cc : 1 cc\n1 Curly : 1 Straight",
      "All CC\nAll Curly",
      "2 CC : 2 cc\n2 Curly : 2 Straight",
    ],
    correctLetter: "A",
  },
  {
    title: "Problem 4: Skin Color",
    context:
      "Dark skin (D) is dominant over fair skin (d). A heterozygous parent (Dd) is crossed with a heterozygous parent (Dd).",
    text: "What is the probability of producing a child with fair skin?",
    options: ["A. ¼ (25%)", "B. ½ (50%)", "C. ¾ (75%)", "D. 0 (0%)"],
    correctLetter: "A",
  },
  {
    title: "Problem 5: Quick Check",
    context: "Let's test your memory without a story!",
    text: "In a monohybrid cross of Rr × Rr, what is the genotypic ratio?",
    options: ["3 : 1", "1 : 1", "1 : 2 : 1", "9 : 3 : 3 : 1"],
    correctLetter: "C",
  },
];

const Quiz10 = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false); // NEW: Locks review state safely
  const [isNavigating, setIsNavigating] = useState(false);
  const [lesson10EarnedScore, setLesson10EarnedScore] = useState(0);

  // Show the final video screen at the end
  const [showFinalVideo, setShowFinalVideo] = useState(false);

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

    if (activeUid) {
      const localData = getLocalUser(activeUid);
      if (
        localData &&
        (localData.lesson10Completed === 1 || localData.lesson10Score >= 10)
      ) {
        setAlreadyCompleted(true);
      }
    }

    if (activeUid) {
      const userRef = ref(db, `users/${activeUid}`);
      const unsubscribe = onValue(userRef, (snapshot) => {
        if (snapshot.exists() && isMounted.current) {
          const data = snapshot.val();
          if (data.lesson10 && data.lesson10.completed) {
            setAlreadyCompleted(true);
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

  // STABLE REVIEW MODE: Only triggers if the user started the quiz IN review mode
  useEffect(() => {
    if (isReviewMode && quizStarted && !showFinalVideo) {
      setIsAnswered(true);
      setIsCorrect(true);
      setSelectedOption(questions[currentQuestionIndex].correctLetter);
    }
  }, [quizStarted, currentQuestionIndex, isReviewMode, showFinalVideo]);

  const handleCheckAnswer = async (optionLetter) => {
    if (isAnswered || isNavigating) return;

    setSelectedOption(optionLetter);
    const currentQ = questions[currentQuestionIndex];

    // STRICT CORRECTNESS CHECK
    const correct = optionLetter === currentQ.correctLetter;

    setIsCorrect(correct);
    setIsAnswered(true);

    if (isMounted.current) setShowModal(true);

    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    // Use !isReviewMode so background DB updates don't get blocked
    if (activeUid && !isReviewMode) {
      const localUser = getLocalUser(activeUid);
      const currentGlobalScore = localUser
        ? localUser.score
        : Number(params.score) || 0;
      const pointsEarned = correct ? 2 : 0;
      const newGlobalScore = currentGlobalScore + pointsEarned;
      const newLessonScore = lesson10EarnedScore + pointsEarned;

      setLesson10EarnedScore(newLessonScore);

      try {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
          const userRef = ref(db, `users/${activeUid}`);
          const updates = {
            score: newGlobalScore,
            "lesson10/score": newLessonScore,
          };
          if (isLastQuestion) updates["lesson10/completed"] = true;
          await update(userRef, updates);
        } else {
          if (correct) updateLocalUserScore(activeUid, newGlobalScore);
          updateLocalLessonScore(activeUid, "lesson10Score", newLessonScore);
          if (isLastQuestion)
            updateLocalProgress(activeUid, "lesson10Completed", true);
        }
      } catch (error) {
        if (correct) updateLocalUserScore(activeUid, newGlobalScore);
        updateLocalLessonScore(activeUid, "lesson10Score", newLessonScore);
        if (isLastQuestion)
          updateLocalProgress(activeUid, "lesson10Completed", true);
      }
    }
  };

  const handleNextAction = () => {
    if (isNavigating || !isMounted.current) return;
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    if (isLastQuestion) {
      setShowModal(false);
      setShowFinalVideo(true);
    } else {
      setShowModal(false);
      // ALWAYS reset state so the next question is clean
      setSelectedOption(null);
      setIsAnswered(false);
      setIsCorrect(false);
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const navigateToHome = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.replace({ pathname: "/home", params: { uid: activeUid } });
  };

  const renderIntro = () => (
    <View className="items-center w-full">
      <Text className="text-yellow-500 font-black text-4xl text-center mb-6 tracking-tighter uppercase">
        Practice Time
      </Text>
      <View className="bg-blue-950/90 p-6 rounded-3xl border-2 border-blue-400 mb-8 w-full shadow-lg items-center">
        <Text className="text-blue-300 font-bold text-sm tracking-widest uppercase mb-4 text-center">
          Instructions
        </Text>
        <Text className="text-white text-lg font-medium leading-7 mb-2 text-center">
          Solve each problem using a Punnett square.
        </Text>
        <Text className="text-white text-lg font-medium leading-7 text-center">
          Choose the correct answers for all{" "}
          <Text className="text-yellow-500 font-black">5 problems.</Text>
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => {
          if (alreadyCompleted) setIsReviewMode(true);
          setQuizStarted(true);
        }}
        activeOpacity={0.8}
        className="w-full"
      >
        <View
          className="bg-yellow-500 rounded-2xl py-4 items-center shadow-xl flex-row justify-center"
          style={{
            borderBottomWidth: 5,
            borderBottomColor: "#a16207",
            minHeight: 60,
          }}
        >
          <Text
            className="text-blue-950 font-black text-xl tracking-widest uppercase px-2"
            style={{ includeFontPadding: false, textAlignVertical: "center" }}
          >
            Start Practice
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderQuestion = () => {
    const currentQ = questions[currentQuestionIndex];
    return (
      <View className="w-full">
        <View className="flex-row justify-between items-center mb-4 px-2">
          <Text className="text-blue-300 font-bold text-xs uppercase tracking-widest">
            Question {currentQuestionIndex + 1} of 5
          </Text>
          <Text className="text-yellow-500 font-bold text-xs uppercase tracking-widest">
            2 Points
          </Text>
        </View>

        <View className="bg-blue-950/90 border border-blue-400 p-5 rounded-3xl mb-6 shadow-lg">
          <Text className="text-yellow-500 font-black text-lg uppercase tracking-widest mb-3">
            {currentQ.title}
          </Text>
          <Text className="text-white text-base font-medium leading-6 mb-5">
            {currentQ.context}
          </Text>
          <View className="h-[2px] bg-blue-400/30 w-full mb-5" />
          <Text className="text-blue-100 font-bold text-lg leading-6">
            {currentQ.text}
          </Text>
        </View>

        {currentQ.options.map((option, index) => {
          const letter = ["A", "B", "C", "D"][index];
          const isCorrectChoice = letter === currentQ.correctLetter;
          const isSelected = selectedOption === letter;

          let borderColor = "border-blue-400";
          let bgColor = "bg-blue-950/80";
          let textColor = "text-white";

          if (isAnswered) {
            if (isCorrectChoice) {
              borderColor = isReviewMode
                ? "border-yellow-500"
                : "border-green-500";
              bgColor = isReviewMode ? "bg-yellow-500/20" : "bg-green-500/20";
              textColor = isReviewMode ? "text-yellow-500" : "text-green-500";
            } else if (isSelected) {
              borderColor = "border-red-500";
              bgColor = "bg-red-500/20";
              textColor = "text-red-500";
            }
          } else if (isSelected) {
            borderColor = "border-yellow-500";
            bgColor = "bg-yellow-500/20";
            textColor = "text-yellow-500";
          }

          return (
            <TouchableOpacity
              key={letter}
              onPress={() => handleCheckAnswer(letter)}
              disabled={isAnswered}
              activeOpacity={0.7}
              className={`flex-row items-center border-2 ${borderColor} ${bgColor} rounded-2xl p-4 mb-3 shadow-md`}
            >
              <View
                className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isAnswered && isCorrectChoice ? (isReviewMode ? "bg-yellow-500" : "bg-green-500") : isSelected && !isAnswered ? "bg-yellow-500" : "bg-blue-800"}`}
              >
                <Text
                  className={`font-black text-lg ${isSelected || (isAnswered && isCorrectChoice) ? "text-blue-950" : "text-white"}`}
                >
                  {letter}
                </Text>
              </View>
              <Text className={`font-bold text-[15px] flex-1 ${textColor}`}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}

        {isReviewMode && (
          <TouchableOpacity
            onPress={handleNextAction}
            activeOpacity={0.8}
            className="mt-5 w-full"
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
                {currentQuestionIndex === 4 ? "See Conclusion" : "Next"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFinalVideo = () => (
    <View className="items-center w-full">
      <Text className="text-yellow-500 font-black text-4xl text-center mb-6 tracking-tighter uppercase">
        Mystery Solved!
      </Text>

      <View className="bg-blue-950/80 p-5 rounded-3xl border-2 border-blue-500 mb-8 w-full shadow-lg">
        <View className="w-full h-48 mb-4 rounded-xl overflow-hidden border-2 border-blue-400/30 bg-black">
          <Video
            source={require("../assets/v3.mp4")}
            style={{ width: "100%", height: "100%" }}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping
            useNativeControls
            isMuted={false}
          />
        </View>

        <Text className="text-white text-base font-medium leading-6 mb-3 text-center">
          Both parents carry genes that determine skin color.
        </Text>
        <Text className="text-white text-base font-medium leading-6 mb-3 text-center">
          Baby Volty inherited a combination of{" "}
          <Text className="text-yellow-500 font-black">recessive alleles</Text>{" "}
          that resulted in fair skin!
        </Text>
        <View className="h-[1px] bg-blue-400/30 w-full my-4" />
        <Text className="text-blue-200 text-sm font-bold tracking-widest uppercase text-center">
          Genetics explains why children may look different from their parents.
        </Text>
      </View>

      <TouchableOpacity
        onPress={navigateToHome}
        activeOpacity={0.8}
        className="w-full"
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
            style={{ includeFontPadding: false, textAlignVertical: "center" }}
          >
            Back to Main Menu
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  let cloudText = !quizStarted
    ? "Ready for some\npractice?"
    : showFinalVideo
      ? "We solved the\nmystery!"
      : isAnswered
        ? isCorrect
          ? "Great job!"
          : "Let's review."
        : "Read the story\ncarefully!";

  return (
    <SafeAreaView className="flex-1 bg-blue-800">
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require("../assets/bg3.png")}
        className="flex-1 opacity-30 absolute inset-0"
        resizeMode="cover"
      />

      <Modal transparent visible={showModal} animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/70 px-8">
          <View
            className={`w-full max-w-[400px] p-8 rounded-3xl border-4 ${isCorrect ? "border-green-500 bg-blue-950" : "border-red-500 bg-blue-950"} items-center shadow-2xl`}
          >
            <Text
              className={`font-black text-3xl mb-2 tracking-tighter ${isCorrect ? "text-green-500" : "text-red-500"}`}
            >
              {isCorrect ? "CORRECT!" : "INCORRECT"}
            </Text>

            {isCorrect && !isReviewMode && (
              <View className="bg-green-900/50 px-4 py-2 rounded-xl mb-4 mt-2">
                <Text className="text-yellow-400 font-black text-sm uppercase tracking-widest">
                  +2 Points Earned
                </Text>
              </View>
            )}

            {isReviewMode ? (
              <Text className="text-blue-300 font-bold text-[10px] tracking-widest uppercase mb-8 mt-2">
                Review Mode
              </Text>
            ) : isCorrect ? (
              <Text className="text-blue-100 text-lg text-center font-medium leading-7 mb-8 mt-2">
                Well done! Your Punnett square is correct.
              </Text>
            ) : (
              <View className="items-center w-full mb-8">
                <Text className="text-blue-100 text-lg text-center font-medium leading-7 mb-4 mt-2">
                  Try again. Check the alleles and combinations carefully.
                </Text>

                {/* NEW RED BOX SHOWING EXACT ANSWER */}
                <View className="bg-red-500/20 p-4 rounded-xl border border-red-500 w-full mt-2">
                  <Text className="text-red-300 font-bold text-xs uppercase tracking-widest mb-1">
                    Correct Answer:
                  </Text>
                  <Text className="text-white font-medium">
                    {questions[currentQuestionIndex].correctLetter}){" "}
                    {
                      questions[currentQuestionIndex].options[
                        ["A", "B", "C", "D"].indexOf(
                          questions[currentQuestionIndex].correctLetter,
                        )
                      ]
                    }
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={handleNextAction}
              activeOpacity={0.8}
              className="w-full"
            >
              <View
                className={`rounded-2xl py-4 flex-row items-center justify-center shadow-xl ${isCorrect ? "bg-green-500" : "bg-red-500"}`}
                style={{
                  borderBottomWidth: 5,
                  borderBottomColor: isCorrect ? "#15803d" : "#991b1b",
                  minHeight: 60,
                }}
              >
                <Text
                  className="text-white font-black text-xl tracking-widest uppercase px-2"
                  style={{
                    includeFontPadding: false,
                    textAlignVertical: "center",
                  }}
                >
                  {currentQuestionIndex === 4 ? "See Conclusion" : "Next"}
                </Text>
              </View>
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
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 20,
          }}
        >
          <Animated.View
            style={{
              transform: [{ translateY: studentFloat }],
              marginBottom: 20,
              marginTop: 70,
              alignItems: "center",
              position: "relative",
              zIndex: 10,
            }}
          >
            <View className="bg-white rounded-2xl p-4 shadow-2xl absolute -top-16 min-w-[150px]">
              <Text
                className="text-blue-950 font-bold text-center text-xs leading-4"
                style={{ includeFontPadding: false }}
              >
                {isReviewMode && !showFinalVideo
                  ? "Reviewing Answers!"
                  : cloudText}
              </Text>
              <View
                style={{
                  position: "absolute",
                  bottom: -10,
                  alignSelf: "center",
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
            <View className="w-24 h-24 rounded-full border-4 border-yellow-500 bg-blue-900/80 overflow-hidden shadow-2xl">
              <Image
                source={require("../assets/m.png")}
                className="w-full h-full"
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          <View className="w-full max-w-[480px] px-8 flex-1 mt-2 z-10">
            {!quizStarted
              ? renderIntro()
              : showFinalVideo
                ? renderFinalVideo()
                : renderQuestion()}

            {!showFinalVideo && (
              <TouchableOpacity
                onPress={navigateToHome}
                activeOpacity={0.7}
                className="mt-8 w-full items-center mb-10"
              >
                <Text className="text-blue-300 font-bold text-xs underline uppercase tracking-widest">
                  Return to Main Menu
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Quiz10;
