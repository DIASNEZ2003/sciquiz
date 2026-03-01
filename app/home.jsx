import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { onValue, ref, set, update } from "firebase/database";
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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "./Firebase";
import {
  getLocalUser,
  initDB,
  saveLocalUser,
  syncFirebaseToLocal,
} from "./LocalDB";
import { forceSyncNow } from "./SyncManager";

const avatarMap = {
  pp1: require("../assets/pp1.png"),
  pp2: require("../assets/pp2.png"),
  pp3: require("../assets/pp3.png"),
  pp4: require("../assets/pp4.png"),
  pp5: require("../assets/pp5.png"),
};

const borderMap = {
  1: require("../assets/border1.png"),
  2: require("../assets/border2.png"),
  3: require("../assets/border3.png"),
  4: require("../assets/border4.png"),
  5: require("../assets/border5.png"),
  6: require("../assets/border6.png"),
  7: require("../assets/border7.png"),
  8: require("../assets/border8.png"),
};

const Home = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Animations
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const achievementAnim = useRef(new Animated.Value(-150)).current; // For sliding notification

  // Modals
  const [profileDropdownVisible, setProfileDropdownVisible] = useState(false);
  const [fullProfileVisible, setFullProfileVisible] = useState(false);
  const [achievementsVisible, setAchievementsVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [borderModalVisible, setBorderModalVisible] = useState(false);
  const [lockedModalVisible, setLockedModalVisible] = useState(false); // Locked Exam Modal

  // Tutorial & Notification State
  const [tutorialStep, setTutorialStep] = useState(0);
  const [hasShownAchievementPopup, setHasShownAchievementPopup] =
    useState(false);

  // User Data State
  const [userData, setUserData] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [userAvatar, setUserAvatar] = useState(null);
  const [userBorder, setUserBorder] = useState(1);
  const [fullName, setFullName] = useState("");
  const [score, setScore] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  // Badge Collection State
  const [claimedBadges, setClaimedBadges] = useState([]);

  // Name Editing State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  const activeUid = auth.currentUser ? auth.currentUser.uid : params.uid;

  useEffect(() => {
    initDB();
    let localSavedPassword = "";

    if (activeUid) {
      // CHECK IF TUTORIAL HAS BEEN SEEN
      AsyncStorage.getItem(`hasSeenTutorial_${activeUid}`).then((res) => {
        if (!res) {
          setTutorialStep(1);
        }
      });

      const localData = getLocalUser(activeUid);
      if (localData) {
        setUserData(localData);
        setUserEmail(localData.email);
        setUserAvatar(localData.avatarId);
        setFullName(localData.fullName);
        setScore(localData.score);
        localSavedPassword = localData.password;
      }

      AsyncStorage.getItem(`border_${activeUid}`).then((savedBorder) => {
        if (savedBorder) setUserBorder(parseInt(savedBorder));
      });

      AsyncStorage.getItem(`claimedBadges_${activeUid}`).then((res) => {
        if (res) setClaimedBadges(JSON.parse(res));
      });
    }

    let unsubscribeFirebase;
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected);
      if (state.isConnected && activeUid) forceSyncNow();
    });

    const setupRealtimeListener = () => {
      if (auth.currentUser) {
        const userRef = ref(db, `users/${auth.currentUser.uid}`);
        unsubscribeFirebase = onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const currentLocalUser = getLocalUser(auth.currentUser.uid);

            if (currentLocalUser && currentLocalUser.needsSync === 1) {
              forceSyncNow();
              return;
            }

            setUserAvatar(data.avatarId || userAvatar);
            setUserBorder(data.borderId || userBorder);
            setFullName(data.fullName || fullName);
            setScore(data.score !== undefined ? data.score : score);

            saveLocalUser(
              auth.currentUser.uid,
              auth.currentUser.email,
              localSavedPassword,
              data.fullName || fullName,
              data.avatarId || userAvatar,
              data.score !== undefined ? data.score : score,
              0,
            );

            syncFirebaseToLocal(auth.currentUser.uid, data);
            setUserData(getLocalUser(auth.currentUser.uid));
          }
        });
      }
    };

    setupRealtimeListener();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -15,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    return () => {
      if (unsubscribeFirebase) unsubscribeFirebase();
      if (unsubscribeNetInfo) unsubscribeNetInfo();
    };
  }, []);

  // BADGE UNLOCK LOGIC
  const lessonsCompleted = userData && userData.lesson10Completed === 1;
  const geneticsExpertUnlocked =
    userData &&
    userData.lesson10Completed === 1 &&
    userData.finalQuizCompleted === 1;

  const badges = [
    {
      id: 1,
      img: require("../assets/a1.png"),
      title: "Quiz 10 Master",
      desc: "Complete Quiz 10",
      unlocked: userData?.lesson10Completed === 1,
    },
    {
      id: 2,
      img: require("../assets/a2.png"),
      title: "Top Scorer",
      desc: "Score 18 Points in Lessons",
      unlocked: score >= 18,
    },
    {
      id: 3,
      img: require("../assets/a3.png"),
      title: "Secret Badge",
      desc: "Keep Playing",
      unlocked: false,
    },
    {
      id: 4,
      img: require("../assets/a4.png"),
      title: "Genetics Expert",
      desc: "Complete Quiz 10 & Final Exam",
      unlocked: geneticsExpertUnlocked,
    },
  ];

  const userClaimedBadges = badges.filter((b) => claimedBadges.includes(b.id));
  const hasClaimableBadges = badges.some(
    (b) => b.unlocked && !claimedBadges.includes(b.id),
  );

  // SHOW ACHIEVEMENT NOTIFICATION OVERLAY
  useEffect(() => {
    if (hasClaimableBadges && tutorialStep === 0 && !hasShownAchievementPopup) {
      setHasShownAchievementPopup(true);
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(achievementAnim, {
            toValue: 60,
            duration: 800,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.delay(4000), // Hold on screen for 4 seconds
          Animated.timing(achievementAnim, {
            toValue: -150,
            duration: 600,
            easing: Easing.in(Easing.back(1.5)),
            useNativeDriver: true,
          }),
        ]).start();
      }, 1000);
    }
  }, [hasClaimableBadges, tutorialStep, hasShownAchievementPopup]);

  const handleNextTutorial = async () => {
    if (tutorialStep === 3) {
      setTutorialStep(0);
      if (activeUid) {
        await AsyncStorage.setItem(`hasSeenTutorial_${activeUid}`, "true");
      }
    } else {
      setTutorialStep((prev) => prev + 1);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("active_uid");
      if (auth.currentUser) await signOut(auth);
      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSelectAvatar = async (avatarId) => {
    if (!activeUid) return;
    try {
      setUserAvatar(avatarId);
      setAvatarModalVisible(false);
      const localData = getLocalUser(activeUid);
      const savedPass = localData ? localData.password : "";

      if (isOnline && auth.currentUser) {
        await set(ref(db, `users/${activeUid}/avatarId`), avatarId);
        saveLocalUser(
          activeUid,
          userEmail,
          savedPass,
          fullName,
          avatarId,
          score,
          0,
        );
      } else {
        saveLocalUser(
          activeUid,
          userEmail,
          savedPass,
          fullName,
          avatarId,
          score,
          1,
        );
      }
    } catch (error) {
      console.error("Error saving avatar:", error);
    }
  };

  const handleSelectBorder = async (borderId) => {
    if (!activeUid) return;
    try {
      setUserBorder(borderId);
      setBorderModalVisible(false);
      await AsyncStorage.setItem(`border_${activeUid}`, borderId.toString());
      if (isOnline && auth.currentUser) {
        await set(ref(db, `users/${activeUid}/borderId`), borderId);
      }
    } catch (error) {
      console.error("Error saving border:", error);
    }
  };

  const handleSaveName = async () => {
    if (!activeUid) return;
    setFullName(editNameValue);
    setIsEditingName(false);
    try {
      const localData = getLocalUser(activeUid);
      const savedPass = localData ? localData.password : "";
      if (isOnline && auth.currentUser) {
        await update(ref(db, `users/${activeUid}`), {
          fullName: editNameValue,
        });
        saveLocalUser(
          activeUid,
          userEmail,
          savedPass,
          editNameValue,
          userAvatar,
          score,
          0,
        );
      } else {
        saveLocalUser(
          activeUid,
          userEmail,
          savedPass,
          editNameValue,
          userAvatar,
          score,
          1,
        );
      }
      setUserData(getLocalUser(activeUid));
    } catch (error) {
      console.error("Error saving name:", error);
    }
  };

  const collectBadge = async (badgeId) => {
    if (!activeUid) return;
    const newClaimed = [...claimedBadges, badgeId];
    setClaimedBadges(newClaimed);
    await AsyncStorage.setItem(
      `claimedBadges_${activeUid}`,
      JSON.stringify(newClaimed),
    );
  };

  const getUsername = () => (userEmail ? userEmail.split("@")[0] : "User");
  const getUserInitials = () => getUsername().charAt(0).toUpperCase();

  const renderProfilePicture = (
    sizeClasses,
    textClasses,
    overrideBorderId = null,
  ) => {
    let borderSource =
      borderMap[overrideBorderId || userBorder] || borderMap[1];
    return (
      <View className={`${sizeClasses} justify-center items-center`}>
        <View className="w-full h-full rounded-full overflow-hidden absolute">
          {userAvatar && avatarMap[userAvatar] ? (
            <Image
              source={avatarMap[userAvatar]}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full bg-blue-900 justify-center items-center">
              <Text className={`text-yellow-500 font-bold ${textClasses}`}>
                {getUserInitials()}
              </Text>
            </View>
          )}
        </View>
        <Image
          source={borderSource}
          className="absolute w-[130%] h-[130%]"
          resizeMode="contain"
        />
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-blue-800">
      <StatusBar barStyle="light-content" />

      {/* GLOBAL BACKGROUND FOR ALL SCREENS */}
      <View className="absolute inset-0 opacity-35">
        <ImageBackground
          source={require("../assets/bg3.png")}
          className="flex-1"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/50" />
      </View>

      {/* -------------------- IN-GAME ACHIEVEMENT BANNER -------------------- */}
      <Animated.View
        style={{
          transform: [{ translateY: achievementAnim }],
          position: "absolute",
          top: 0,
          left: 20,
          right: 20,
          zIndex: 999,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            // Immediately dismiss banner & open achievements
            Animated.timing(achievementAnim, {
              toValue: -150,
              duration: 300,
              useNativeDriver: true,
            }).start();
            setAchievementsVisible(true);
          }}
          className="bg-blue-950 border-2 border-yellow-500 rounded-2xl p-4 flex-row items-center shadow-2xl shadow-yellow-500/50"
        >
          <View className="bg-yellow-500/20 p-2 rounded-full mr-4 border border-yellow-500/50">
            <Ionicons name="trophy" size={28} color="#eab308" />
          </View>
          <View className="flex-1">
            <Text className="text-yellow-500 font-black tracking-widest text-xs uppercase">
              Achievement Unlocked!
            </Text>
            <Text className="text-white font-medium text-xs mt-1">
              You have new badges to collect. Tap here!
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* -------------------- EXAM LOCKED MODAL -------------------- */}
      <Modal
        transparent={true}
        visible={lockedModalVisible}
        animationType="fade"
        onRequestClose={() => setLockedModalVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center p-6 z-[100]">
          <View className="bg-blue-950/90 w-full max-w-[400px] rounded-3xl p-8 border-4 border-red-500 shadow-2xl shadow-red-500/50 items-center">
            <View className="bg-red-500/20 p-4 rounded-full mb-4">
              <Ionicons name="lock-closed" size={48} color="#ef4444" />
            </View>
            <Text className="text-red-500 text-2xl font-black tracking-widest uppercase mb-4 text-center">
              Exam Locked
            </Text>
            <Text className="text-white text-center font-medium leading-6 mb-8 text-base">
              You must complete all lessons and Practice Quiz 10 to unlock the
              Final Exam. Keep learning!
            </Text>
            <TouchableOpacity
              className="bg-red-500 py-4 w-full rounded-2xl items-center border-b-4 border-red-800 shadow-lg"
              onPress={() => setLockedModalVisible(false)}
            >
              <Text className="text-white font-black tracking-widest uppercase text-lg">
                Understood
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* -------------------- TUTORIAL OVERLAY -------------------- */}
      {tutorialStep > 0 && (
        <View className="absolute inset-0 bg-black/80 z-[100] justify-center items-center">
          {/* STEP 1: Profile Highlight */}
          {tutorialStep === 1 && (
            <View className="absolute top-32 right-6 w-72 bg-blue-950 border-4 border-yellow-500 rounded-3xl p-5 shadow-2xl">
              <View className="absolute -top-5 right-6 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[16px] border-l-transparent border-r-transparent border-b-yellow-500" />
              <View className="flex-row items-center mb-3">
                <Image
                  source={require("../assets/m.png")}
                  className="w-12 h-12 mr-3"
                  resizeMode="contain"
                />
                <Text className="text-yellow-500 font-black text-lg flex-1 uppercase">
                  Your Profile
                </Text>
              </View>
              <Text className="text-white font-medium mb-4 leading-6">
                Welcome! Tap your picture up here to change your avatar,
                customize borders, and claim your unlocked badges!
              </Text>
              <TouchableOpacity
                onPress={handleNextTutorial}
                className="bg-yellow-500 py-3 rounded-xl items-center shadow-lg border-b-4 border-yellow-700"
              >
                <Text className="text-blue-950 font-black uppercase tracking-widest">
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Lessons Highlight */}
          {tutorialStep === 2 && (
            <View className="absolute top-[25%] self-center w-80 bg-blue-950 border-4 border-yellow-500 rounded-3xl p-5 shadow-2xl">
              <View className="absolute -bottom-10 right-1/2 translate-x-3 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-yellow-500" />
              <View className="flex-row items-center mb-3">
                <Image
                  source={require("../assets/m.png")}
                  className="w-12 h-12 mr-3"
                  resizeMode="contain"
                />
                <Text className="text-yellow-500 font-black text-lg flex-1 uppercase">
                  Learn & Enjoy
                </Text>
              </View>
              <Text className="text-white font-medium mb-4 leading-6">
                Start your Genetics lessons here! Complete them all to unlock
                the ultimate Final Exam.
              </Text>
              <TouchableOpacity
                onPress={handleNextTutorial}
                className="bg-yellow-500 py-3 rounded-xl items-center shadow-lg border-b-4 border-yellow-700"
              >
                <Text className="text-blue-950 font-black uppercase tracking-widest">
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: About Highlight */}
          {tutorialStep === 3 && (
            <View className="absolute bottom-41 self-center w-80 bg-blue-950 border-4 border-yellow-500 rounded-3xl p-5 shadow-2xl">
              <View className="absolute -bottom-5 right-1/2 translate-x-3 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-yellow-500" />
              <View className="flex-row items-center mb-3">
                <Image
                  source={require("../assets/m.png")}
                  className="w-12 h-12 mr-3"
                  resizeMode="contain"
                />
                <Text className="text-yellow-500 font-black text-lg flex-1 uppercase">
                  About the App
                </Text>
              </View>
              <Text className="text-white font-medium mb-4 leading-6">
                Tap 'About' anytime to learn more about the creators of this
                app. Have fun learning!
              </Text>
              <TouchableOpacity
                onPress={handleNextTutorial}
                className="bg-green-500 py-3 rounded-xl items-center shadow-lg border-b-4 border-green-700"
              >
                <Text className="text-white font-black uppercase tracking-widest">
                  Finish Tour
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* -------------------- AVATAR MODAL -------------------- */}
      <Modal
        transparent={true}
        visible={avatarModalVisible}
        animationType="slide"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center p-6">
          <View className="bg-blue-950/90 w-full max-w-[400px] rounded-3xl p-6 border-2 border-yellow-500 shadow-2xl">
            <Text className="text-yellow-500 text-[12px] font-bold tracking-[4px] uppercase mb-6 text-center">
              SELECT LAB AVATAR
            </Text>
            <View className="flex-row flex-wrap justify-center gap-6 mb-8">
              {Object.keys(avatarMap).map((avatarKey) => (
                <TouchableOpacity
                  key={avatarKey}
                  onPress={() => handleSelectAvatar(avatarKey)}
                  className={`border-4 rounded-full p-1 ${userAvatar === avatarKey ? "border-yellow-500 bg-yellow-500/20" : "border-blue-800"}`}
                >
                  <Image
                    source={avatarMap[avatarKey]}
                    className="w-20 h-20 rounded-full"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              className="bg-blue-800 border-2 border-blue-500 py-4 rounded-2xl items-center"
              onPress={() => setAvatarModalVisible(false)}
            >
              <Text className="text-blue-200 font-bold uppercase">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* -------------------- BORDER MODAL -------------------- */}
      <Modal
        transparent={true}
        visible={borderModalVisible}
        animationType="slide"
        onRequestClose={() => setBorderModalVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center p-6">
          <View className="bg-blue-950/90 w-full max-w-[400px] rounded-3xl p-6 border-2 border-yellow-500 shadow-2xl max-h-[80%]">
            <Text className="text-yellow-500 text-[12px] font-bold tracking-[4px] uppercase mb-6 text-center">
              CHOOSE BORDER
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap justify-center gap-6 mb-8">
                {Object.keys(borderMap).map((borderKey) => (
                  <TouchableOpacity
                    key={borderKey}
                    onPress={() => handleSelectBorder(borderKey)}
                    className={`rounded-full p-2 ${userBorder.toString() === borderKey.toString() ? "bg-yellow-500/20" : ""}`}
                  >
                    {renderProfilePicture("w-16 h-16", "text-2xl", borderKey)}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity
              className="bg-blue-800 border-2 border-blue-500 py-4 rounded-2xl items-center mt-2"
              onPress={() => setBorderModalVisible(false)}
            >
              <Text className="text-blue-200 font-bold uppercase">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* -------------------- FULL PROFILE MODAL -------------------- */}
      <Modal
        transparent={false}
        visible={fullProfileVisible}
        animationType="slide"
        onRequestClose={() => setFullProfileVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-blue-800">
          <View className="absolute inset-0 opacity-35">
            <ImageBackground
              source={require("../assets/bg3.png")}
              className="flex-1"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-black/50" />
          </View>

          <View className="px-6 py-6 flex-[0.6] justify-center z-10">
            <View className="flex-row items-center mb-6 mt-4">
              <TouchableOpacity
                onPress={() => setFullProfileVisible(false)}
                className="bg-blue-600/50 p-3 rounded-full border border-blue-400"
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <Text className="text-white font-black text-2xl ml-4 tracking-widest">
                My Profile
              </Text>
            </View>

            <View className="flex-row items-center bg-blue-950/80 p-4 rounded-3xl border-2 border-blue-400">
              <TouchableOpacity
                onPress={() => setAvatarModalVisible(true)}
                className="w-24 h-24 mr-5"
              >
                {renderProfilePicture("w-24 h-24", "text-3xl")}
              </TouchableOpacity>

              <View className="flex-1">
                <View className="bg-yellow-500 px-4 py-2 rounded-xl mb-3 border-2 border-yellow-600 self-start">
                  <Text className="text-blue-950 font-black text-lg shadow-sm">
                    {getUsername()}
                  </Text>
                </View>

                {isEditingName ? (
                  <View className="flex-row items-center">
                    <TextInput
                      className="bg-white px-3 py-2 rounded-lg flex-1 mr-2 text-blue-950 font-bold"
                      value={editNameValue}
                      onChangeText={setEditNameValue}
                      placeholder="Enter Full Name"
                      placeholderTextColor="#94a3b8"
                      maxLength={20}
                    />
                    <TouchableOpacity
                      className="bg-green-500 px-4 py-3 rounded-lg border-b-4 border-green-700"
                      onPress={handleSaveName}
                    >
                      <Text className="text-white font-bold text-xs">Save</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="flex-row items-center justify-between bg-blue-900/60 p-3 rounded-xl border border-blue-400/50">
                    <Text
                      className="text-blue-100 font-bold text-sm tracking-wider uppercase flex-1"
                      numberOfLines={1}
                    >
                      {fullName || "No Name Set"}
                    </Text>
                    <TouchableOpacity
                      className="bg-blue-600 px-3 py-2 rounded-lg border-b-2 border-blue-800 ml-2"
                      onPress={() => {
                        setEditNameValue(fullName);
                        setIsEditingName(true);
                      }}
                    >
                      <Text className="text-white text-[10px] font-black uppercase">
                        EDIT
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View className="bg-slate-100 flex-1 rounded-t-[40px] pt-8 px-6 shadow-2xl border-t-4 border-blue-400 z-10">
            <View className="bg-blue-500 py-2 px-6 rounded-full self-start mb-6 shadow-sm border-2 border-blue-600">
              <Text className="text-white font-black tracking-widest text-lg uppercase">
                My Badges
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {userClaimedBadges.length > 0 ? (
                <View className="flex-row flex-wrap justify-between gap-y-8">
                  {userClaimedBadges.map((badge) => (
                    <View
                      key={badge.id}
                      className="w-[45%] items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-200"
                    >
                      <Image
                        source={badge.img}
                        className="w-20 h-20 mb-3"
                        resizeMode="contain"
                      />
                      <Text className="text-center font-black text-sm text-blue-950">
                        {badge.title}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="items-center justify-center py-10">
                  <Text className="text-slate-400 font-bold text-center text-lg">
                    No badges collected yet!
                  </Text>
                  <Text className="text-slate-400 text-center mt-2">
                    Go to the Achievements menu to collect them.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* -------------------- ACHIEVEMENTS MODAL -------------------- */}
      <Modal
        transparent={false}
        visible={achievementsVisible}
        animationType="slide"
        onRequestClose={() => setAchievementsVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-blue-800">
          <View className="absolute inset-0 opacity-35">
            <ImageBackground
              source={require("../assets/bg3.png")}
              className="flex-1"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-black/50" />
          </View>

          <View className="px-6 py-6 border-b-4 border-yellow-500 bg-blue-950/80 z-10">
            <View className="flex-row items-center mb-2 mt-4">
              <TouchableOpacity
                onPress={() => setAchievementsVisible(false)}
                className="bg-blue-600 p-3 rounded-full border border-blue-400"
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <Text className="text-yellow-500 font-black text-2xl ml-4 tracking-widest uppercase">
                Achievements
              </Text>
            </View>
            <Text className="text-blue-200 font-bold ml-16 text-sm">
              Unlock and collect your badges here!
            </Text>
          </View>

          <View className="flex-1 pt-8 px-6 z-10">
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {badges.map((badge) => {
                const isClaimed = claimedBadges.includes(badge.id);
                const canClaim = badge.unlocked && !isClaimed;

                return (
                  <View
                    key={badge.id}
                    className={`flex-row items-center p-4 rounded-3xl border-2 mb-4 shadow-lg ${canClaim ? "bg-yellow-500/10 border-yellow-500" : "bg-blue-950/80 border-blue-500"}`}
                  >
                    <View
                      className={`w-20 h-20 mr-4 ${!badge.unlocked ? "opacity-30" : ""}`}
                    >
                      <Image
                        source={badge.img}
                        className="w-full h-full"
                        resizeMode="contain"
                      />
                      {!badge.unlocked && (
                        <View className="absolute inset-0 justify-center items-center rounded-full bg-black/40">
                          <Text className="text-2xl">🔒</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`font-black text-lg ${badge.unlocked ? (canClaim ? "text-yellow-500" : "text-white") : "text-slate-500"}`}
                      >
                        {badge.title}
                      </Text>
                      <Text className="text-blue-200 text-xs mb-3">
                        {badge.desc}
                      </Text>

                      {isClaimed ? (
                        <View className="bg-green-500/20 px-3 py-1 rounded-full self-start border border-green-500">
                          <Text className="text-green-400 font-bold text-xs uppercase">
                            ✓ Collected
                          </Text>
                        </View>
                      ) : canClaim ? (
                        <TouchableOpacity
                          onPress={() => collectBadge(badge.id)}
                          className="bg-yellow-500 px-4 py-2 rounded-full self-start shadow-md border-b-2 border-yellow-700"
                        >
                          <Text className="text-blue-950 font-black text-xs uppercase">
                            Collect Badge!
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <View className="bg-slate-700/50 px-3 py-1 rounded-full self-start border border-slate-600">
                          <Text className="text-slate-400 font-bold text-xs uppercase">
                            Locked
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* -------------------- DROPDOWN MENU -------------------- */}
      <Modal
        transparent={true}
        visible={profileDropdownVisible}
        animationType="fade"
        onRequestClose={() => setProfileDropdownVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/40"
          activeOpacity={1}
          onPress={() => setProfileDropdownVisible(false)}
        >
          <View className="absolute top-24 right-6 w-64 bg-blue-950 rounded-2xl border-2 border-yellow-500 overflow-hidden shadow-2xl">
            <View className="p-4 border-b border-blue-800">
              <View className="flex-row items-center">
                <View>{renderProfilePicture("w-14 h-14", "text-xl")}</View>
                <View className="ml-4 flex-1">
                  <Text
                    className="text-yellow-500 font-bold text-lg"
                    numberOfLines={1}
                  >
                    {getUsername()}
                  </Text>
                  <Text
                    className="text-blue-300 text-[10px] mt-1 tracking-wider uppercase"
                    numberOfLines={1}
                  >
                    {fullName || "No Name Set"}
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-blue-900/50">
              <TouchableOpacity
                className="px-5 py-4 border-b border-blue-800"
                onPress={() => {
                  setProfileDropdownVisible(false);
                  setAvatarModalVisible(true);
                }}
              >
                <Text className="text-blue-100 font-bold tracking-widest text-xs uppercase">
                  Choose Avatar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="px-5 py-4 border-b border-blue-800"
                onPress={() => {
                  setProfileDropdownVisible(false);
                  setBorderModalVisible(true);
                }}
              >
                <Text className="text-blue-100 font-bold tracking-widest text-xs uppercase">
                  Choose Border
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="px-5 py-4 border-b border-blue-800"
                onPress={() => {
                  setProfileDropdownVisible(false);
                  setFullProfileVisible(true);
                }}
              >
                <Text className="text-blue-100 font-bold tracking-widest text-xs uppercase">
                  Profile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="px-5 py-4 border-b border-blue-800 flex-row justify-between items-center"
                onPress={() => {
                  setProfileDropdownVisible(false);
                  setAchievementsVisible(true);
                }}
              >
                <Text className="text-yellow-400 font-bold tracking-widest text-xs uppercase">
                  Achievements
                </Text>
                {hasClaimableBadges && (
                  <View className="w-3 h-3 bg-red-500 rounded-full" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="px-5 py-4 bg-blue-950"
                onPress={handleLogout}
              >
                <Text className="text-red-400 font-black tracking-widest text-xs uppercase text-center">
                  Log Out
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* -------------------- MAIN HOME DASHBOARD -------------------- */}
      <Animated.View style={{ opacity: fadeAnim }} className="flex-1">
        <View className="absolute top-1/4 -right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <View className="flex-row justify-between items-center px-8 pt-11 z-10">
          <View className="flex-1 pr-4">
            <Text className="text-blue-200 text-[10px] font-bold tracking-[3px] uppercase mb-1">
              Welcome,
            </Text>
            <Text
              className="text-yellow-500 font-black text-2xl uppercase tracking-wider"
              numberOfLines={1}
            >
              {getUsername()}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setProfileDropdownVisible(true)}
            className="justify-center items-center shadow-lg relative"
            activeOpacity={0.8}
          >
            {renderProfilePicture("w-16 h-16", "text-2xl")}
            {hasClaimableBadges && (
              <View className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-blue-800" />
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-1 justify-center items-center px-8 pb-10 z-10">
          <Animated.Image
            source={require("../assets/logo.png")}
            className="w-full h-32 mb-4 mt-6"
            resizeMode="contain"
            style={{ transform: [{ translateY: floatAnim }] }}
          />
          <Text className="text-blue-300 tracking-[6px] text-center text-[10px] font-bold uppercase mb-12">
            Genetics Learning System
          </Text>

          <View className="w-full max-w-[450px]">
            {/* START EXAM (DISABLED IF LESSONS ARE NOT COMPLETED) */}
            <TouchableOpacity
              onPress={() => {
                if (lessonsCompleted) {
                  router.push("/FinalQuiz");
                } else {
                  setLockedModalVisible(true);
                }
              }}
              activeOpacity={0.8}
              className={`mb-5 ${!lessonsCompleted ? "opacity-60" : ""}`}
            >
              <View
                className={`rounded-2xl py-4 items-center shadow-2xl ${lessonsCompleted ? "bg-yellow-500" : "bg-gray-600"}`}
                style={{
                  borderBottomWidth: 5,
                  borderBottomColor: lessonsCompleted ? "#a16207" : "#374151",
                }}
              >
                <Text
                  className={`font-black text-xl tracking-widest uppercase ${lessonsCompleted ? "text-[#020617]" : "text-gray-300"}`}
                >
                  {lessonsCompleted ? "Start Exam" : "Exam Locked"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* START LESSONS (PULSES IF LESSONS ARE INCOMPLETE) */}
            <Animated.View
              style={
                !lessonsCompleted ? { transform: [{ scale: pulseAnim }] } : {}
              }
            >
              <TouchableOpacity
                onPress={() => router.push("/quiz1")}
                activeOpacity={0.8}
                className="mb-5"
              >
                <View
                  className="bg-blue-600 rounded-2xl py-4 items-center shadow-2xl"
                  style={{ borderBottomWidth: 5, borderBottomColor: "#1e3a8a" }}
                >
                  <Text className="text-white font-black text-xl tracking-widest uppercase">
                    {lessonsCompleted ? "Review Lessons" : "Start Lessons"}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              onPress={() => router.push("/About")}
              activeOpacity={0.8}
              className="mb-5 w-full"
            >
              <View
                className="bg-blue-950 border-2 border-yellow-500 rounded-2xl py-4 items-center justify-center w-full"
                style={{ borderBottomWidth: 5, borderBottomColor: "#ca8a04" }}
              >
                <Text className="text-yellow-500 font-black text-md tracking-widest uppercase px-2 text-center">
                  About
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default Home;
