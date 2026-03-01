import NetInfo from "@react-native-community/netinfo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ref, update } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    BackHandler,
    ImageBackground,
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

// COMPACT 50 QUESTION ARRAY (Easy, Moderate, Hard)
const allQuestions = [
  // --- EASY LEVEL ---
  {
    q: "What is the main purpose of a Punnett square?",
    opts: [
      "To observe cells",
      "To predict possible offspring traits",
      "To identify chromosomes",
      "To classify organisms",
    ],
    ans: 1,
    exp: "A Punnett square is used to predict the possible combinations of alleles and traits that offspring may inherit.",
    level: "EASY",
  },
  {
    q: "In a Punnett square, what do the letters T and t represent?",
    opts: ["Traits", "Chromosomes", "Alleles from parents", "Phenotypes"],
    ans: 2,
    exp: "Letters in a Punnett square represent alleles passed from each parent.",
    level: "EASY",
  },
  {
    q: "Tall (T) is dominant over short (t). What is the phenotype of a plant with genotype Tt?",
    opts: ["Short", "Tall", "Medium", "Cannot be determined"],
    ans: 1,
    exp: "The dominant allele (T) masks the recessive allele (t), so the plant appears tall.",
    level: "EASY",
  },
  {
    q: "Which genotype represents a recessive trait?",
    opts: ["TT", "Tt", "tt", "T"],
    ans: 2,
    exp: "A recessive trait appears only when two recessive alleles are present.",
    level: "EASY",
  },
  {
    q: "How many alleles control one trait in a Punnett square?",
    opts: ["One", "Two", "Three", "Four"],
    ans: 1,
    exp: "Each trait is controlled by two alleles—one from each parent.",
    level: "EASY",
  },
  {
    q: "A Punnett square shows TT, Tt, Tt, tt. How many offspring show the dominant trait?",
    opts: ["One", "Two", "Three", "Four"],
    ans: 2,
    exp: "TT and Tt show the dominant trait, giving 3 dominant outcomes.",
    level: "EASY",
  },
  {
    q: "Which genotype shows two identical alleles?",
    opts: ["Tt", "tt", "T", "Rt"],
    ans: 1,
    exp: "Identical alleles indicate a homozygous genotype.",
    level: "EASY",
  },
  {
    q: "Why does the dominant trait appear in a heterozygous organism?",
    opts: [
      "It is learned",
      "It is stronger",
      "It masks the recessive allele",
      "It replaces genes",
    ],
    ans: 2,
    exp: "Dominant alleles mask the expression of recessive alleles.",
    level: "EASY",
  },
  {
    q: "What is the probability of producing a short plant from Tt × tt?",
    opts: ["0%", "25%", "50%", "100%"],
    ans: 2,
    exp: "Half of the offspring inherit two recessive alleles (tt).",
    level: "EASY",
  },
  {
    q: "Which cross is represented by Tt × Tt?",
    opts: [
      "Homozygous × recessive",
      "Heterozygous × heterozygous",
      "Dominant × recessive",
      "Recessive × recessive",
    ],
    ans: 1,
    exp: "Both parents have one dominant and one recessive allele.",
    level: "EASY",
  },
  {
    q: "What does each box in a Punnett square represent?",
    opts: [
      "A trait",
      "A chromosome",
      "A possible offspring genotype",
      "A phenotype only",
    ],
    ans: 2,
    exp: "Each box shows one possible allele combination in offspring.",
    level: "EASY",
  },
  {
    q: "Which genotype will always express the dominant trait?",
    opts: ["tt", "Tt", "TT", "none"],
    ans: 2,
    exp: "Two dominant alleles guarantee expression of the dominant trait.",
    level: "EASY",
  },
  {
    q: "What type of cross studies only one trait?",
    opts: ["Dihybrid", "Polygenic", "Monohybrid", "Test cross"],
    ans: 2,
    exp: "A monohybrid cross focuses on one trait.",
    level: "EASY",
  },
  {
    q: "If both parents pass recessive alleles, the offspring will be _____.",
    opts: ["Dominant", "Heterozygous", "Recessive", "Mixed"],
    ans: 2,
    exp: "Two recessive alleles result in a recessive phenotype.",
    level: "EASY",
  },
  {
    q: "Punnett squares show results based on _____.",
    opts: ["Certainty", "Observation", "Probability", "Environment"],
    ans: 2,
    exp: "Punnett squares predict the chance of traits appearing, not exact outcomes.",
    level: "EASY",
  },

  // --- MODERATE LEVEL ---
  {
    q: "A heterozygous tall plant (Tt) is crossed with a short plant (tt). What is the expected phenotypic ratio?",
    opts: ["3:1", "1:1", "4:0", "1:3"],
    ans: 1,
    exp: "Half the offspring are tall (Tt) and half are short (tt).",
    level: "MODERATE",
  },
  {
    q: "What percent of offspring from Tt × Tt are short?",
    opts: ["0%", "25%", "50%", "75%"],
    ans: 1,
    exp: "One out of four offspring (tt) is short.",
    level: "MODERATE",
  },
  {
    q: "Which genotypic ratio results from Rr × Rr?",
    opts: ["3:1", "2:2", "1:2:1", "4:0"],
    ans: 2,
    exp: "RR, Rr, Rr, rr gives a 1:2:1 ratio.",
    level: "MODERATE",
  },
  {
    q: "Why can two tall plants produce a short offspring?",
    opts: [
      "Mutation occurred",
      "Traits changed",
      "Parents are heterozygous carriers",
      "Environment affected growth",
    ],
    ans: 2,
    exp: "Both parents may carry the recessive allele.",
    level: "MODERATE",
  },
  {
    q: "Which cross produces all dominant offspring?",
    opts: ["tt × tt", "Tt × tt", "TT × tt", "Tt × Tt"],
    ans: 2,
    exp: "All offspring receive one dominant allele.",
    level: "MODERATE",
  },
  {
    q: "What conclusion can be made if offspring show a 1:1 ratio?",
    opts: [
      "Both parents are dominant",
      "One parent is heterozygous and the other recessive",
      "Both parents are recessive",
      "Parents are identical",
    ],
    ans: 1,
    exp: "A heterozygous × recessive cross gives a 1:1 ratio.",
    level: "MODERATE",
  },
  {
    q: "What percent of offspring are dominant in Rr × rr?",
    opts: ["0%", "25%", "50%", "75%"],
    ans: 2,
    exp: "Half inherit the dominant allele.",
    level: "MODERATE",
  },
  {
    q: "Why are probabilities used instead of exact numbers?",
    opts: [
      "Genes are unstable",
      "Fertilization is random",
      "Traits disappear",
      "Parents choose traits",
    ],
    ans: 1,
    exp: "Which sperm fertilizes which egg is random.",
    level: "MODERATE",
  },
  {
    q: "Which genotype represents a carrier?",
    opts: ["RR", "rr", "Rr", "R"],
    ans: 2,
    exp: "A carrier has one dominant and one recessive allele.",
    level: "MODERATE",
  },
  {
    q: "Which genotype cannot express a recessive trait?",
    opts: ["rr", "Rr", "RR", "none"],
    ans: 2,
    exp: "No recessive allele is present.",
    level: "MODERATE",
  },
  {
    q: "What happens if both parents are homozygous recessive?",
    opts: ["All dominant", "All recessive", "Mixed", "No offspring"],
    ans: 1,
    exp: "All offspring receive recessive alleles.",
    level: "MODERATE",
  },
  {
    q: "What does genetic variation mean in Punnett squares?",
    opts: [
      "All offspring same",
      "Different genotypes appear",
      "No traits appear",
      "Traits disappear",
    ],
    ans: 1,
    exp: "Variation means differences among offspring.",
    level: "MODERATE",
  },
  {
    q: "Why is a Punnett square reliable?",
    opts: [
      "It controls traits",
      "It predicts possible allele combinations",
      "It changes genes",
      "It removes variation",
    ],
    ans: 1,
    exp: "It predicts possible allele combinations.",
    level: "MODERATE",
  },
  {
    q: "Which cross studies one trait only?",
    opts: ["Dihybrid", "Polygenic", "Monohybrid", "Test cross"],
    ans: 2,
    exp: "Monohybrid crosses focus on one trait.",
    level: "MODERATE",
  },
  {
    q: "Which outcome best shows probability?",
    opts: [
      "Exact number of offspring",
      "Chance of traits appearing",
      "DNA structure",
      "Learned traits",
    ],
    ans: 1,
    exp: "Probability predicts the chance of traits appearing.",
    level: "MODERATE",
  },

  // --- HARD LEVEL ---
  {
    q: "A heterozygous tall plant (Tt) is crossed with a short plant (tt). What is the probability that an offspring will be tall?",
    opts: ["0%", "25%", "50%", "100%"],
    ans: 2,
    exp: "From the cross Tt × tt, half of the offspring inherit Tt (tall) and half inherit tt (short). Therefore, the probability of a tall offspring is 50%.",
    level: "HARD",
  },
  {
    q: "What phenotypic ratio is expected from a cross between two heterozygous plants (Tt × Tt)?",
    opts: ["1 : 1", "2 : 2", "3 : 1", "4 : 0"],
    ans: 2,
    exp: "The Punnett square for Tt × Tt results in TT, Tt, Tt, tt. Three genotypes show the dominant trait and one shows the recessive trait, giving a 3:1 ratio.",
    level: "HARD",
  },
  {
    q: "Two plants are crossed and all of the offspring show the dominant trait. Which parental genotypes most likely produced this result?",
    opts: ["tt × tt", "Tt × tt", "TT × tt", "Tt × Tt"],
    ans: 2,
    exp: "In a TT × tt cross, all offspring inherit one dominant allele and one recessive allele (Tt), so all show the dominant trait.",
    level: "HARD",
  },
  {
    q: "In a cross between Rr × rr, what percentage of the offspring are expected to show the recessive trait?",
    opts: ["0%", "25%", "50%", "75%"],
    ans: 2,
    exp: "The Punnett square for Rr × rr shows that half of the offspring are rr, which express the recessive trait.",
    level: "HARD",
  },
  {
    q: "Which genotypic ratio is produced when two heterozygous parents (Rr × Rr) are crossed?",
    opts: ["3 : 1", "1 : 1", "1 : 2 : 1", "4 : 0"],
    ans: 2,
    exp: "The Punnett square gives RR, Rr, Rr, rr, resulting in a 1 RR : 2 Rr : 1 rr genotypic ratio.",
    level: "HARD",
  },
  {
    q: "A cross between Rr × rr is performed. What is the expected phenotypic ratio?",
    opts: ["3:1", "1:1", "4:0", "1:3"],
    ans: 1,
    exp: "Half of the offspring are Rr (dominant) and half are rr (recessive), resulting in a 1:1 ratio.",
    level: "HARD",
  },
  {
    q: "Two heterozygous parents (Tt × Tt) produce offspring. Which statement is correct?",
    opts: [
      "All offspring are tall",
      "All offspring are short",
      "Some offspring show the recessive trait",
      "No variation occurs",
    ],
    ans: 2,
    exp: "A Tt × Tt cross produces tt offspring, which express the recessive trait.",
    level: "HARD",
  },
  {
    q: "Why is probability used when predicting traits with a Punnett square?",
    opts: [
      "Genes are unstable",
      "Fertilization is random",
      "Traits disappear",
      "Parents select traits",
    ],
    ans: 1,
    exp: "Which sperm fertilizes which egg is random, so only probabilities can be predicted.",
    level: "HARD",
  },
  {
    q: "If 75% of offspring show the dominant trait, which cross most likely occurred?",
    opts: ["rr × rr", "RR × rr", "Rr × Rr", "Rr × rr"],
    ans: 2,
    exp: "A heterozygous cross produces a 3:1 ratio, where 75% show the dominant trait.",
    level: "HARD",
  },
  {
    q: "Which genotype guarantees the expression of a recessive trait?",
    opts: ["RR", "Rr", "rr", "R"],
    ans: 2,
    exp: "Recessive traits appear only when two recessive alleles are present.",
    level: "HARD",
  },
  {
    q: "Two parents show the dominant phenotype, but one child shows the recessive phenotype. What can be concluded about the parents?",
    opts: [
      "Both are homozygous dominant",
      "Both are heterozygous carriers",
      "One parent mutated",
      "Environment caused the trait",
    ],
    ans: 1,
    exp: "Both parents must carry the recessive allele to pass it to the child.",
    level: "HARD",
  },
  {
    q: "Which Punnett square result best demonstrates genetic variation?",
    opts: [
      "All offspring identical",
      "Only dominant phenotypes appear",
      "Offspring have different genotypes",
      "No offspring are formed",
    ],
    ans: 2,
    exp: "Genetic variation is shown when offspring have different allele combinations.",
    level: "HARD",
  },
  {
    q: "A cross results in a 1 dominant : 1 recessive phenotypic ratio. Which parental genotypes are most likely?",
    opts: ["TT × TT", "Tt × Tt", "Tt × tt", "tt × tt"],
    ans: 2,
    exp: "A heterozygous × recessive cross produces a 1:1 ratio.",
    level: "HARD",
  },
  {
    q: "Why can a recessive trait skip a generation?",
    opts: [
      "The trait disappears",
      "Parents carry the allele but do not express it",
      "Environment hides the trait",
      "Genes mutate",
    ],
    ans: 1,
    exp: "Heterozygous parents carry the recessive allele without showing it.",
    level: "HARD",
  },
  {
    q: "Why is a monohybrid cross used in these Punnett square problems?",
    opts: [
      "It studies two traits",
      "It focuses on one trait only",
      "It removes variation",
      "It changes genes",
    ],
    ans: 1,
    exp: "Monohybrid crosses examine inheritance of a single trait.",
    level: "HARD",
  },
  {
    q: "If an offspring expresses a recessive trait, what must be true about the alleles inherited?",
    opts: [
      "One dominant allele was inherited",
      "Two recessive alleles were inherited",
      "One allele mutated",
      "Alleles disappeared",
    ],
    ans: 1,
    exp: "Recessive traits require two recessive alleles.",
    level: "HARD",
  },
  {
    q: "Which cross produces 100% heterozygous offspring?",
    opts: ["TT × TT", "tt × tt", "TT × tt", "Tt × Tt"],
    ans: 2,
    exp: "Each offspring receives one dominant allele and one recessive allele.",
    level: "HARD",
  },
  {
    q: "In pea plants, yellow seeds (Y) are dominant over green seeds (y). A heterozygous yellow plant is crossed with a green plant: Yy × yy. What percentage of the offspring will have green seeds?",
    opts: ["25%", "50%", "75%", "100%"],
    ans: 1,
    exp: "Green seeds appear only if the genotype is yy. In the cross Yy × yy, 2 out of 4 offspring are yy → 50% will have green seeds.",
    level: "HARD",
  },
  {
    q: "In pea plants, round seeds (R) are dominant over wrinkled seeds (r). A homozygous round plant is crossed with a wrinkled plant: RR × rr. What will be the genotype of all offspring?",
    opts: ["RR", "Rr", "rr", "50% RR and 50% rr"],
    ans: 1,
    exp: "The RR parent gives only R and the rr parent gives only r. All offspring receive one R and one r, so all are Rr and show the dominant trait.",
    level: "HARD",
  },
  {
    q: "In pea plants, tall stems (T) are dominant over short stems (t). Two heterozygous tall plants are crossed: Tt × Tt. What will be the phenotypic ratio of the offspring?",
    opts: [
      "3 Tall : 1 Short",
      "1 Tall : 1 Short",
      "2 Tall : 2 Short",
      "All Tall",
    ],
    ans: 0,
    exp: "Tall (T) is dominant, so any plant with at least one T is tall. Only tt is short, and only 1 out of 4 is tt → 3 tall and 1 short.",
    level: "HARD",
  },
];

const FinalQuiz = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const activeUid = auth.currentUser ? auth.currentUser.uid : params.uid;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // DISABLE HARDWARE BACK BUTTON (Android)
  useEffect(() => {
    const onBackPress = () => {
      return true;
    };

    BackHandler.addEventListener("hardwareBackPress", onBackPress);

    return () => {
      BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    };
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [currentIndex, quizFinished]);

  const handleAnswer = (optIndex) => {
    if (isAnswered) return;
    setSelectedOption(optIndex);
    setIsAnswered(true);

    const correct = optIndex === allQuestions[currentIndex].ans;
    if (correct) {
      setEarnedPoints((prev) => prev + 2); // 2 Points per question
    }
  };

  const nextQuestion = async () => {
    if (currentIndex < allQuestions.length - 1) {
      setSelectedOption(null);
      setIsAnswered(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      // FINISH EXAM - Save to Database with requested format
      if (activeUid) {
        const localUser = getLocalUser(activeUid);
        const currentGlobalScore = localUser ? localUser.score : 0;
        const newGlobalScore = currentGlobalScore + earnedPoints;

        try {
          const netInfo = await NetInfo.fetch();
          if (netInfo.isConnected) {
            await update(ref(db, `users/${activeUid}`), {
              score: newGlobalScore,
              "finalquiz/finalscore": earnedPoints,
              "finalquiz/completed": true,
            });
          } else {
            updateLocalUserScore(activeUid, newGlobalScore);
            updateLocalLessonScore(activeUid, "finalQuizScore", earnedPoints);
            updateLocalProgress(activeUid, "finalQuizCompleted", true);
          }
        } catch (err) {
          updateLocalUserScore(activeUid, newGlobalScore);
          updateLocalLessonScore(activeUid, "finalQuizScore", earnedPoints);
          updateLocalProgress(activeUid, "finalQuizCompleted", true);
        }
      }
      setQuizFinished(true);
    }
  };

  if (quizFinished) {
    return (
      <SafeAreaView className="flex-1 bg-blue-900 justify-center items-center px-6">
        <ImageBackground
          source={require("../assets/bg3.png")}
          className="absolute inset-0 opacity-30"
        />
        <View className="bg-blue-950 border-4 border-yellow-500 rounded-3xl p-8 items-center shadow-2xl w-full max-w-[400px]">
          <Text className="text-yellow-500 font-black text-4xl mb-2 tracking-widest text-center">
            EXAM COMPLETE!
          </Text>
          <Text className="text-white text-lg font-bold mb-6 text-center">
            You have completed all 50 questions!
          </Text>

          <View className="bg-blue-900 p-6 rounded-2xl w-full items-center border border-blue-500 mb-8">
            <Text className="text-blue-300 font-bold tracking-widest uppercase mb-2">
              Total Points Earned
            </Text>
            <Text className="text-yellow-400 font-black text-6xl">
              {earnedPoints}
            </Text>
            <Text className="text-blue-200 mt-2">out of 100 max points</Text>
          </View>

          <TouchableOpacity
            onPress={() => router.replace("/home")}
            className="bg-yellow-500 w-full py-4 rounded-2xl items-center shadow-lg border-b-4 border-yellow-700"
          >
            <Text className="text-blue-950 font-black text-xl tracking-widest uppercase">
              Return Home
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQ = allQuestions[currentIndex];
  const isCorrect = selectedOption === currentQ.ans;

  return (
    <SafeAreaView className="flex-1 bg-blue-800">
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require("../assets/bg3.png")}
        className="absolute inset-0 opacity-30"
        resizeMode="cover"
      />

      <View className="px-6 pt-12 pb-2 z-10 flex-row justify-between items-center">
        <Text className="text-blue-200 font-bold uppercase tracking-widest text-xs">
          Question {currentIndex + 1} of 50
        </Text>
        <View className="bg-yellow-500/20 border border-yellow-500 px-3 py-1 rounded-full">
          <Text className="text-yellow-500 font-bold text-xs uppercase">
            {currentQ.level}
          </Text>
        </View>
      </View>

      {/* PROGRESS BAR */}
      <View className="w-full h-2 bg-blue-950 mb-4">
        <View
          className="h-full bg-yellow-500"
          style={{ width: `${((currentIndex + 1) / 50) * 100}%` }}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View className="bg-blue-950/90 border-2 border-blue-500 p-6 rounded-3xl mb-6 shadow-xl">
            <Text className="text-white font-bold text-xl leading-8">
              {currentQ.q}
            </Text>
          </View>

          {currentQ.opts.map((optText, i) => {
            const isChosen = selectedOption === i;
            const isRightAnswer = currentQ.ans === i;

            let bgColor = "bg-blue-900/60";
            let borderColor = "border-blue-500/50";
            let textColor = "text-blue-100";

            if (isAnswered) {
              if (isRightAnswer) {
                bgColor = "bg-green-500/20";
                borderColor = "border-green-500";
                textColor = "text-green-400";
              } else if (isChosen) {
                bgColor = "bg-red-500/20";
                borderColor = "border-red-500";
                textColor = "text-red-400";
              }
            }

            return (
              <TouchableOpacity
                key={i}
                onPress={() => handleAnswer(i)}
                disabled={isAnswered}
                activeOpacity={0.7}
                className={`p-4 rounded-2xl border-2 mb-3 ${bgColor} ${borderColor}`}
              >
                <Text className={`font-bold text-[15px] ${textColor}`}>
                  {optText}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* INLINE FEEDBACK (Shows only after answering) */}
          {isAnswered && (
            <View
              className={`mt-4 p-5 rounded-2xl border-2 ${isCorrect ? "bg-green-900/40 border-green-500" : "bg-red-900/40 border-red-500"}`}
            >
              <Text
                className={`font-black text-xl mb-2 tracking-widest uppercase ${isCorrect ? "text-green-400" : "text-red-400"}`}
              >
                {isCorrect ? "Correct! +2 Points" : "Incorrect"}
              </Text>
              <Text className="text-white font-medium leading-6">
                {currentQ.exp}
              </Text>
            </View>
          )}

          {isAnswered && (
            <TouchableOpacity
              onPress={nextQuestion}
              activeOpacity={0.8}
              className="mt-8 mb-10 w-full"
            >
              <View className="bg-yellow-500 rounded-2xl py-4 items-center shadow-xl border-b-4 border-yellow-700">
                <Text className="text-blue-950 font-black text-xl tracking-widest uppercase">
                  {currentIndex === 49 ? "Finish Exam" : "Next Question"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FinalQuiz;
