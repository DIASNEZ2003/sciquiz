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
    text: "Which words in the story are related to genetics?",
    options: [
      "Genotype, phenotype, heterozygous, homozygous",
      "Red, Blue, Purple",
      "Butterflies, wings, colors",
      "Parents, offspring, brood",
    ],
    correctLetter: "A",
    feedbackCorrect:
      "Correct! Genotype, phenotype, heterozygous, and homozygous are key genetics terms.",
    feedbackWrong: "Not quite. Look for the scientific terms.",
  },
  {
    text: "Why are these words important in predicting traits?",
    options: [
      "They make butterflies look pretty.",
      "They change the weather.",
      "They are just random words.",
      "They help explain how traits are passed from parents to offspring.",
    ],
    correctLetter: "D",
    feedbackCorrect:
      "Excellent! These words help explain how traits are passed from parents to offspring.",
    feedbackWrong:
      "Incorrect. Think about what these words do for predicting the next generation.",
  },
];

const Quiz8 = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Quiz State
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false); // NEW: Locks review state safely
  const [isNavigating, setIsNavigating] = useState(false);
  const [lesson8EarnedScore, setLesson8EarnedScore] = useState(0);

  const activeUid = auth.currentUser ? auth.currentUser.uid : params.uid;

  // Animations
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

    // Check if already answered in LocalDB
    if (activeUid) {
      const localData = getLocalUser(activeUid);
      if (
        localData &&
        (localData.lesson8Completed === 1 || localData.lesson8Score >= 4)
      ) {
        setAlreadyCompleted(true);
      }
    }

    // Check Firebase for completion status
    if (activeUid) {
      const userRef = ref(db, `users/${activeUid}`);
      const unsubscribe = onValue(userRef, (snapshot) => {
        if (snapshot.exists() && isMounted.current) {
          const data = snapshot.val();
          if (data.lesson8 && data.lesson8.completed) {
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
    if (isReviewMode && quizStarted) {
      setIsAnswered(true);
      setIsCorrect(true);
      setSelectedOption(questions[currentQuestionIndex].correctLetter);
    }
  }, [quizStarted, currentQuestionIndex, isReviewMode]);

  const handleCheckAnswer = async (optionLetter) => {
    if (isAnswered || isNavigating) return;

    setSelectedOption(optionLetter);
    const currentQ = questions[currentQuestionIndex];

    // Evaluate correctness strictly
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
      const newLessonScore = lesson8EarnedScore + pointsEarned;

      setLesson8EarnedScore(newLessonScore);

      try {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
          const userRef = ref(db, `users/${activeUid}`);
          const updates = {
            score: newGlobalScore,
            "lesson8/score": newLessonScore,
          };
          if (isLastQuestion) updates["lesson8/completed"] = true;
          await update(userRef, updates);
        } else {
          if (correct) updateLocalUserScore(activeUid, newGlobalScore);
          updateLocalLessonScore(activeUid, "lesson8Score", newLessonScore);
          if (isLastQuestion)
            updateLocalProgress(activeUid, "lesson8Completed", true);
        }
      } catch (error) {
        if (correct) updateLocalUserScore(activeUid, newGlobalScore);
        updateLocalLessonScore(activeUid, "lesson8Score", newLessonScore);
        if (isLastQuestion)
          updateLocalProgress(activeUid, "lesson8Completed", true);
      }
    }
  };

  const handleNextAction = () => {
    if (isNavigating || !isMounted.current) return;
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    if (isLastQuestion) {
      setIsNavigating(true);
      setShowModal(false);
      router.replace({ pathname: "/quiz9", params: { uid: activeUid } });
    } else {
      setShowModal(false);
      // ALWAYS reset state so the next question is clean (or correctly filled by the Review Mode effect)
      setSelectedOption(null);
      setIsAnswered(false);
      setIsCorrect(false);
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const navigateToHome = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.replace({ pathname: "/quiz9", params: { uid: activeUid } });
  };

  const renderIntro = () => (
    <View className="items-center w-full">
      <Text className="text-yellow-500 font-black text-xl text-center mb-6 mt-5 tracking-tighter">
        Bella, Benny, and Their Butterfly Brood
      </Text>

      <View className="bg-blue-950/80 p-5 rounded-3xl border-2 border-blue-500 mb-8 w-full shadow-lg">
        <View className="w-full h-48 mb-4 rounded-xl overflow-hidden border-2 border-blue-400/30 bg-black">
          <Video
            source={require("../assets/v1.mp4")}
            style={{ width: "100%", height: "100%" }}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping
            useNativeControls
            isMuted={false}
          />
        </View>

        <Text className="text-white text-base font-medium leading-6 mb-3">
          Bella and Benny are butterflies with different wing colors. Both are{" "}
          <Text className="text-yellow-500 font-black">heterozygous</Text> for
          wing color.
        </Text>
        <Text className="text-white text-base font-medium leading-6">
          Offspring wings: <Text className="text-red-400 font-bold">Red</Text>,{" "}
          <Text className="text-blue-400 font-bold">Blue</Text>,{" "}
          <Text className="text-purple-400 font-bold">Purple</Text>.
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => {
          if (alreadyCompleted) setIsReviewMode(true);
          setQuizStarted(true);
        }}
        className="w-full"
        activeOpacity={0.8}
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
            className="text-blue-950 font-black text-md tracking-widest uppercase px-2"
            style={{ includeFontPadding: false, textAlignVertical: "center" }}
          >
            Analyze
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderQuestion = () => {
    const currentQ = questions[currentQuestionIndex];
    return (
      <View className="w-full">
        <View className="flex-row justify-between mb-4 px-2">
          <Text className="text-blue-300 font-bold text-xs uppercase tracking-widest">
            Question 0{currentQuestionIndex + 1}
          </Text>
          <Text className="text-yellow-500 font-bold text-xs uppercase tracking-widest">
            2 Points
          </Text>
        </View>
        <Text className="text-white font-bold text-xl mb-8 leading-8 text-center px-2">
          {currentQ.text}
        </Text>
        {currentQ.options.map((option, index) => {
          const letter = ["A", "B", "C", "D"][index];
          const isCorrectChoice = letter === currentQ.correctLetter;
          const isSelected = selectedOption === letter;

          let borderColor = "border-blue-500";
          let bgColor = "bg-blue-950/60";
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
          }

          return (
            <TouchableOpacity
              key={letter}
              onPress={() => handleCheckAnswer(letter)}
              disabled={isAnswered}
              className={`flex-row items-center border-2 ${borderColor} ${bgColor} rounded-2xl p-4 mb-4 shadow-md`}
            >
              <View
                className={`w-9 h-9 rounded-full items-center justify-center mr-4 ${isAnswered && isCorrectChoice ? (isReviewMode ? "bg-yellow-500" : "bg-green-500") : "bg-blue-800"}`}
              >
                <Text className="font-black text-white">{letter}</Text>
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
            className="mt-4 bg-yellow-500 py-4 rounded-2xl items-center shadow-lg"
            style={{ borderBottomWidth: 5, borderBottomColor: "#a16207" }}
          >
            <Text className="text-blue-950 font-black text-xl uppercase">
              Next
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-blue-800">
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require("../assets/bg3.png")}
        className="flex-1 opacity-40 absolute inset-0"
      />

      <Modal transparent visible={showModal} animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/60 px-8">
          <View
            className={`w-full max-w-[400px] p-8 rounded-3xl border-4 ${isCorrect ? "border-green-500 bg-blue-950" : "border-red-500 bg-blue-950"} items-center`}
          >
            <Text
              className={`font-black text-3xl mb-2 tracking-tighter ${isCorrect ? "text-green-500" : "text-red-500"}`}
            >
              {isCorrect ? "CORRECT!" : "INCORRECT"}
            </Text>

            {isCorrect && !isReviewMode && (
              <Text className="text-yellow-400 font-bold text-sm uppercase mb-4">
                +2 Points Earned
              </Text>
            )}

            {isReviewMode ? (
              <Text className="text-blue-300 font-bold text-[10px] tracking-widest uppercase mb-8 mt-2">
                Review Mode
              </Text>
            ) : isCorrect ? (
              <Text className="text-blue-100 text-lg text-center font-medium leading-7 mb-8 mt-2">
                {questions[currentQuestionIndex].feedbackCorrect}
              </Text>
            ) : (
              <View className="items-center w-full mb-8">
                <Text className="text-blue-100 text-lg text-center font-medium leading-7 mb-4 mt-2">
                  {questions[currentQuestionIndex].feedbackWrong}
                </Text>

                {/* RED BOX SHOWING EXACT ANSWER */}
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
              className={`w-full py-4 rounded-2xl items-center ${isCorrect ? "bg-green-500" : "bg-red-500"}`}
              style={{
                borderBottomWidth: 5,
                borderBottomColor: isCorrect ? "#15803d" : "#991b1b",
              }}
            >
              <Text className="text-white font-black uppercase tracking-widest">
                {currentQuestionIndex === 1 ? "Finish" : "Next"}
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
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 20,
          }}
        >
          <Animated.View
            style={{
              transform: [{ translateY: studentFloat }],
              marginBottom: 10,
              marginTop: 35,
              alignItems: "center",
            }}
          >
            <View className="items-center">
              <View className="bg-white rounded-2xl p-4 shadow-2xl min-w-[150px] relative">
                <Text
                  className="text-blue-950 font-bold text-center text-xs"
                  style={{ includeFontPadding: false }}
                >
                  {isReviewMode
                    ? "These explain trait inheritance"
                    : !quizStarted
                      ? "These explain trait inheritance."
                      : isCorrect
                        ? "Excellent!"
                        : "Let's review the answer!"}
                </Text>

                <View
                  style={{
                    position: "absolute",
                    bottom: -10,
                    alignSelf: "center",
                    width: 0,
                    height: 0,
                    backgroundColor: "transparent",
                    borderStyle: "solid",
                    borderLeftWidth: 10,
                    borderRightWidth: 10,
                    borderTopWidth: 10,
                    borderLeftColor: "transparent",
                    borderRightColor: "transparent",
                    borderTopColor: "white",
                  }}
                />
              </View>
            </View>
            <View className="w-24 h-24 mt-2 rounded-full border-4 border-yellow-500 bg-blue-950/90 overflow-hidden">
              <Image
                source={require("../assets/m.png")}
                className="w-full h-full"
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          <View className="w-full max-w-[480px] px-8 flex-1">
            {!quizStarted ? renderIntro() : renderQuestion()}
            <TouchableOpacity
              onPress={navigateToHome}
              className="mt-6 w-full items-center mb-10"
            >
              <Text className="text-blue-300 font-bold text-xs underline uppercase">
                Return to Main Menu
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Quiz8;
