// app/lessons.jsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import {
    ImageBackground,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "./Firebase";

const Lessons = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const activeUid = auth.currentUser ? auth.currentUser.uid : params.uid;

  // Progress States
  const [lesson1Done, setLesson1Done] = useState(false);
  const [lesson2Done, setLesson2Done] = useState(false);
  const [lesson3Done, setLesson3Done] = useState(false);

  useEffect(() => {
    // --- FETCH USER PROGRESS FROM FIREBASE ---
    if (activeUid) {
      const userRef = ref(db, `users/${activeUid}`);
      const unsubscribe = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();

          // Check if completed is true OR status is "done"
          const isL1Done =
            data?.lesson1?.completed === true ||
            data?.lesson1?.Completed === true ||
            data?.lesson1?.status === "done";

          const isL2Done =
            data?.gene_genius?.completed === true ||
            data?.gene_genius?.Completed === true ||
            data?.gene_genius?.status === "done";

          const isL3Done =
            data?.curious_case?.completed === true ||
            data?.curious_case?.Completed === true ||
            data?.curious_case?.status === "done";

          setLesson1Done(isL1Done);
          setLesson2Done(isL2Done);
          setLesson3Done(isL3Done);
        } else {
          // If the data is deleted from Firebase, lock everything immediately!
          setLesson1Done(false);
          setLesson2Done(false);
          setLesson3Done(false);
        }
      });
      return () => unsubscribe();
    }
  }, [activeUid]);

  const handleModulePress = (moduleNum) => {
    // Add a tiny delay to ensure Router doesn't get overwhelmed
    setTimeout(() => {
      if (moduleNum === 1) {
        router.push({ pathname: "/quiz1", params: { uid: activeUid } });
      } else if (moduleNum === 2 && lesson1Done) {
        router.push({ pathname: "/quiz2", params: { uid: activeUid } });
      } else if (moduleNum === 3 && lesson2Done) {
        router.push({ pathname: "/quiz3", params: { uid: activeUid } });
      }
    }, 50);
  };

  return (
    <SafeAreaView className="flex-1 bg-blue-800">
      <StatusBar barStyle="light-content" />

      {/* Background with Grid Overlay */}
      <View className="absolute inset-0 opacity-40">
        <ImageBackground
          source={require("../assets/bg3.png")}
          className="flex-1"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/60" />
      </View>

      {/* --- STANDARD VIEW (NO ANIMATIONS TO CAUSE CRASHES) --- */}
      <View className="flex-1 w-full">
        <View className="flex-1 px-8 justify-center">
          <Text className="text-yellow-500 font-black text-center text-3xl tracking-[4px] uppercase mb-10 mt-14">
            Lessons
          </Text>

          {/* --- MODULE LIST --- */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            className="space-y-6 w-full max-w-[500px] self-center"
          >
            {/* MODULE 1: WHAT WILL YOU LEARN */}
            <TouchableOpacity
              onPress={() => handleModulePress(1)}
              activeOpacity={0.8}
              className="mb-4"
            >
              <View
                className={`border-2 rounded-3xl p-5 ${lesson1Done ? "border-yellow-500 bg-yellow-500/10" : "border-blue-400 bg-blue-950/80"}`}
              >
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-blue-300 font-black text-[10px] tracking-widest uppercase">
                    Lesson 01
                  </Text>
                  {lesson1Done && (
                    <View className="bg-yellow-500 px-2 py-0.5 rounded-md">
                      <Text className="text-blue-950 font-black text-[9px] tracking-widest uppercase">
                        COMPLETED
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-white font-bold text-lg mb-1">
                  What Will You Learn Today?
                </Text>
                <Text className="text-blue-200 text-xs font-medium leading-5 opacity-80">
                  Discover the objectives of the genetics lab, including Punnett
                  squares and observable traits.
                </Text>
              </View>
            </TouchableOpacity>

            {/* MODULE 2: GENE GENIUS */}
            <TouchableOpacity
              onPress={() => handleModulePress(2)}
              activeOpacity={0.8}
              disabled={!lesson1Done}
              className="mb-4"
            >
              <View
                className={`border-2 rounded-3xl p-5 ${
                  !lesson1Done
                    ? "border-blue-900 bg-black/40"
                    : lesson2Done
                      ? "border-yellow-500 bg-yellow-500/10"
                      : "border-yellow-500 bg-blue-950/80 shadow-lg shadow-yellow-500/20"
                }`}
              >
                <View className="flex-row justify-between items-center mb-2">
                  <Text
                    className={`font-black text-[10px] tracking-widest uppercase ${!lesson1Done ? "text-blue-900" : "text-blue-300"}`}
                  >
                    Lesson 02
                  </Text>
                  {!lesson1Done ? (
                    <View className="bg-blue-900 px-2 py-0.5 rounded-md flex-row items-center">
                      <Text className="text-blue-400 font-black text-[9px] tracking-widest uppercase">
                        LOCKED 🔒
                      </Text>
                    </View>
                  ) : lesson2Done ? (
                    <View className="bg-yellow-500 px-2 py-0.5 rounded-md">
                      <Text className="text-blue-950 font-black text-[9px] tracking-widest uppercase">
                        PASSED
                      </Text>
                    </View>
                  ) : (
                    <View className="bg-green-500 px-2 py-0.5 rounded-md">
                      <Text className="text-blue-950 font-black text-[9px] tracking-widest uppercase">
                        UNLOCKED
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  className={`font-bold text-lg mb-1 ${!lesson1Done ? "text-blue-900" : "text-white"}`}
                >
                  Gene Genius
                </Text>
                <Text
                  className={`text-xs font-medium leading-5 ${!lesson1Done ? "text-blue-900/50" : "text-blue-200 opacity-80"}`}
                >
                  Test your basic genetics knowledge. Identify phenotypes and
                  unlock your first points!
                </Text>
              </View>
            </TouchableOpacity>

            {/* MODULE 3: A CURIOUS CASE */}
            <TouchableOpacity
              onPress={() => handleModulePress(3)}
              activeOpacity={0.8}
              disabled={!lesson2Done}
              className="mb-4"
            >
              <View
                className={`border-2 rounded-3xl p-5 ${
                  !lesson2Done
                    ? "border-blue-900 bg-black/40"
                    : lesson3Done
                      ? "border-yellow-500 bg-yellow-500/10"
                      : "border-yellow-500 bg-blue-950/80 shadow-lg shadow-yellow-500/20"
                }`}
              >
                <View className="flex-row justify-between items-center mb-2">
                  <Text
                    className={`font-black text-[10px] tracking-widest uppercase ${!lesson2Done ? "text-blue-900" : "text-blue-300"}`}
                  >
                    Lesson 03
                  </Text>
                  {!lesson2Done ? (
                    <View className="bg-blue-900 px-2 py-0.5 rounded-md flex-row items-center">
                      <Text className="text-blue-400 font-black text-[9px] tracking-widest uppercase">
                        LOCKED 🔒
                      </Text>
                    </View>
                  ) : lesson3Done ? (
                    <View className="bg-yellow-500 px-2 py-0.5 rounded-md">
                      <Text className="text-blue-950 font-black text-[9px] tracking-widest uppercase">
                        COMPLETED
                      </Text>
                    </View>
                  ) : (
                    <View className="bg-green-500 px-2 py-0.5 rounded-md">
                      <Text className="text-blue-950 font-black text-[9px] tracking-widest uppercase">
                        UNLOCKED
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  className={`font-bold text-lg mb-1 ${!lesson2Done ? "text-blue-900" : "text-white"}`}
                >
                  A Curious Case
                </Text>
                <Text
                  className={`text-xs font-medium leading-5 ${!lesson2Done ? "text-blue-900/50" : "text-blue-200 opacity-80"}`}
                >
                  Analyze Baby Volty's genetics to solve a family mystery.
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>

          {/* Return Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 mb-12 bg-blue-950 border-2 border-blue-500 py-4 rounded-2xl items-center"
            style={{ borderBottomWidth: 4, borderBottomColor: "#1e3a8a" }}
          >
            <Text className="text-blue-200 font-black tracking-widest text-xs uppercase">
              Return to Dashboard
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Lessons;
