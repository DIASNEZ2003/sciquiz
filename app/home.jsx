// app/home.jsx
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
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "./Firebase";
import {
  getLocalUser,
  getUnsyncedUsers,
  initDB,
  markUserSynced,
  saveLocalUser,
} from "./LocalDB";

const avatarMap = {
  pp1: require("../assets/pp1.png"),
  pp2: require("../assets/pp2.png"),
  pp3: require("../assets/pp3.png"),
  pp4: require("../assets/pp4.png"),
  pp5: require("../assets/pp5.png"),
};

// Static map for user-selectable borders (1 through 8 only!)
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

  // Modals
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [borderModalVisible, setBorderModalVisible] = useState(false);

  // User Data
  const [userEmail, setUserEmail] = useState("");
  const [userAvatar, setUserAvatar] = useState(null);
  const [userBorder, setUserBorder] = useState(1);
  const [fullName, setFullName] = useState("");
  const [score, setScore] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  const activeUid = auth.currentUser ? auth.currentUser.uid : params.uid;

  useEffect(() => {
    initDB();
    let localSavedPassword = "";

    if (activeUid) {
      const localData = getLocalUser(activeUid);
      if (localData) {
        setUserEmail(localData.email);
        setUserAvatar(localData.avatarId);
        setFullName(localData.fullName);
        setScore(localData.score);
        localSavedPassword = localData.password;
      }

      // Load locally saved custom border (if offline/reloading)
      AsyncStorage.getItem(`border_${activeUid}`).then((savedBorder) => {
        if (savedBorder) setUserBorder(parseInt(savedBorder));
      });
    }

    let unsubscribeFirebase;

    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected);
      if (state.isConnected && activeUid) {
        syncLocalToFirebase(activeUid);
      }
    });

    const setupRealtimeListener = () => {
      if (auth.currentUser) {
        const userRef = ref(db, `users/${auth.currentUser.uid}`);
        unsubscribeFirebase = onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
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
          }
        });
      }
    };

    setupRealtimeListener();

    // UI Animations
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

    return () => {
      if (unsubscribeFirebase) unsubscribeFirebase();
      if (unsubscribeNetInfo) unsubscribeNetInfo();
    };
  }, []);

  const syncLocalToFirebase = async (uid) => {
    try {
      const unsyncedUsers = getUnsyncedUsers();
      for (const unsyncedUser of unsyncedUsers) {
        if (unsyncedUser.uid === uid) {
          const userRef = ref(db, `users/${uid}`);
          await update(userRef, {
            avatarId: unsyncedUser.avatarId,
            fullName: unsyncedUser.fullName,
            score: unsyncedUser.score,
          });
          markUserSynced(uid);
        }
      }
    } catch (error) {
      console.error("Error syncing to Firebase:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("active_uid");

      if (auth.currentUser) {
        await signOut(auth);
      }
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
        const userRef = ref(db, `users/${activeUid}/avatarId`);
        await set(userRef, avatarId);
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
        alert("Avatar saved locally! Will update online when you reconnect.");
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
        const userRef = ref(db, `users/${activeUid}/borderId`);
        await set(userRef, borderId);
      } else {
        alert("Border saved locally! Will update online when you reconnect.");
      }
    } catch (error) {
      console.error("Error saving border:", error);
    }
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

      {/* --- BACKGROUND IMAGE LAYER --- */}
      <View className="absolute inset-0 opacity-35">
        <ImageBackground
          source={require("../assets/bg3.png")}
          className="flex-1"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/50" />
      </View>

      {/* --- MODALS OMITTED FOR BREVITY, NO CHANGES THERE --- */}
      <Modal
        transparent={true}
        visible={avatarModalVisible}
        animationType="slide"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center p-6">
          <View className="bg-blue-950/90 w-full max-w-[400px] rounded-3xl p-6 border-2 border-yellow-500 shadow-2xl shadow-yellow-500/20">
            <Text className="text-yellow-500 text-[12px] font-bold tracking-[4px] uppercase mb-6 text-center">
              SELECT LAB AVATAR
            </Text>
            <View className="flex-row flex-wrap justify-center gap-6 mb-8">
              {Object.keys(avatarMap).map((avatarKey) => (
                <TouchableOpacity
                  key={avatarKey}
                  onPress={() => handleSelectAvatar(avatarKey)}
                  className={`border-4 rounded-full p-1 ${
                    userAvatar === avatarKey
                      ? "border-yellow-500 bg-yellow-500/20"
                      : "border-blue-800"
                  }`}
                  activeOpacity={0.7}
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
              <Text className="text-blue-200 font-bold tracking-wider text-sm uppercase">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        transparent={true}
        visible={borderModalVisible}
        animationType="slide"
        onRequestClose={() => setBorderModalVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center p-6">
          <View className="bg-blue-950/90 w-full max-w-[400px] rounded-3xl p-6 border-2 border-yellow-500 shadow-2xl shadow-yellow-500/20 max-h-[80%]">
            <Text className="text-yellow-500 text-[12px] font-bold tracking-[4px] uppercase mb-6 text-center">
              CHOOSE BORDER
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap justify-center gap-6 mb-8">
                {Object.keys(borderMap).map((borderKey) => (
                  <TouchableOpacity
                    key={borderKey}
                    onPress={() => handleSelectBorder(borderKey)}
                    className={`rounded-full p-2 ${
                      userBorder.toString() === borderKey.toString()
                        ? "bg-yellow-500/20"
                        : ""
                    }`}
                    activeOpacity={0.7}
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
              <Text className="text-blue-200 font-bold tracking-wider text-sm uppercase">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        transparent={true}
        visible={profileModalVisible}
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/40"
          activeOpacity={1}
          onPress={() => setProfileModalVisible(false)}
        >
          <View className="absolute top-24 right-6 w-64 bg-blue-950 rounded-2xl border-2 border-yellow-500 overflow-hidden shadow-2xl shadow-yellow-500/20">
            <View className="p-4 border-b border-blue-800">
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => {
                    setProfileModalVisible(false);
                    setAvatarModalVisible(true);
                  }}
                >
                  {renderProfilePicture("w-14 h-14", "text-xl")}
                </TouchableOpacity>
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
                className="px-5 py-4 border-b border-blue-800 flex-row items-center justify-between"
                onPress={() => {
                  setProfileModalVisible(false);
                  setAvatarModalVisible(true);
                }}
              >
                <Text className="text-blue-100 font-bold tracking-widest text-xs uppercase">
                  Choose Avatar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="px-5 py-4 border-b border-blue-800 flex-row items-center justify-between"
                onPress={() => {
                  setProfileModalVisible(false);
                  setBorderModalVisible(true);
                }}
              >
                <Text className="text-blue-100 font-bold tracking-widest text-xs uppercase">
                  Choose Border
                </Text>
              </TouchableOpacity>

              <TouchableOpacity className="px-5 py-4 border-b border-blue-800 flex-row items-center justify-between">
                <Text className="text-blue-100 font-bold tracking-widest text-xs uppercase">
                  Profile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity className="px-5 py-4 border-b border-blue-800 flex-row items-center justify-between">
                <Text className="text-blue-100 font-bold tracking-widest text-xs uppercase">
                  Achievements
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="px-5 py-4 bg-blue-950"
                onPress={handleLogout}
              >
                <Text className="text-yellow-500 font-black tracking-widest text-xs uppercase text-center">
                  Log Out
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- MAIN DASHBOARD CONTENT --- */}
      {/* ANTI-CRASH FIX: Removed className from Animated.View */}
      <Animated.View style={{ opacity: fadeAnim, flex: 1, width: "100%" }}>
        {/* Wrapper View handles Tailwind */}
        <View className="flex-1 w-full">
          <View className="absolute top-1/4 -right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />

          {/* --- TOP BAR (WELCOME & AVATAR) --- */}
          <View className="flex-row justify-between items-center px-8 pt-11">
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
              onPress={() => setProfileModalVisible(true)}
              className="justify-center items-center shadow-lg shadow-yellow-500/20"
              activeOpacity={0.8}
            >
              {renderProfilePicture("w-16 h-16", "text-2xl")}
            </TouchableOpacity>
          </View>

          <View className="flex-1 justify-center items-center px-8 pb-10">
            {/* Logo */}
            {/* ANTI-CRASH FIX: Removed className from Animated.Image */}
            <Animated.View
              style={{
                transform: [{ translateY: floatAnim }],
                width: "100%",
                alignItems: "center",
              }}
            >
              {/* Image handles the styling natively */}
              <Image
                source={require("../assets/logo.png")}
                className="w-full h-32 mb-4 mt-6"
                resizeMode="contain"
              />
            </Animated.View>

            <Text className="text-blue-300 tracking-[6px] text-center text-[10px] font-bold uppercase mb-12 mt-2">
              Genetics Learning System
            </Text>

            <View className="w-full max-w-[450px]">
              {/* Button 1: Start Quiz (Yellow) */}
              <TouchableOpacity activeOpacity={0.8} className="mb-5">
                <View
                  className="bg-yellow-500 rounded-2xl py-4 items-center shadow-2xl shadow-yellow-500/30"
                  style={{ borderBottomWidth: 5, borderBottomColor: "#a16207" }}
                >
                  <Text className="text-[#020617] font-black text-xl tracking-widest uppercase">
                    Start Quiz
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Button 2: Review Lessons (Blue) */}
              <TouchableOpacity
                onPress={() => router.push("/lessons")}
                activeOpacity={0.8}
                className="mb-5"
              >
                <View
                  className="bg-blue-600 rounded-2xl py-4 items-center shadow-2xl shadow-blue-600/30"
                  style={{ borderBottomWidth: 5, borderBottomColor: "#1e3a8a" }}
                >
                  <Text className="text-white font-black text-xl tracking-widest uppercase">
                    Review Lessons
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Button 3: About (Hollow Yellow) */}
              <TouchableOpacity activeOpacity={0.8} className="mb-5 w-full">
                <View
                  className="bg-blue-950 border-2 border-yellow-500 rounded-2xl py-4 items-center justify-center w-full"
                  style={{ borderBottomWidth: 5, borderBottomColor: "#ca8a04" }}
                >
                  <Text className="text-yellow-500 font-black text-md tracking-widest uppercase px-2 text-center">
                    ABOUT
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default Home;
