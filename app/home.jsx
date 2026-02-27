// home.jsx
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { onValue, ref, set } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "./Firebase";

// Map your local images to keys
const avatarMap = {
  pp1: require("../assets/pp1.png"),
  pp2: require("../assets/pp2.png"),
  pp3: require("../assets/pp3.png"),
  pp4: require("../assets/pp4.png"),
  pp5: require("../assets/pp5.png"),
};

const Home = () => {
  const router = useRouter();
  const floatAnim = useRef(new Animated.Value(0)).current;

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  const [userEmail, setUserEmail] = useState("");
  const [userAvatar, setUserAvatar] = useState(null);
  const [fullName, setFullName] = useState("");
  const [score, setScore] = useState(0);

  useEffect(() => {
    let unsubscribe;

    // Set up the real-time listener for user data
    const setupRealtimeListener = () => {
      const user = auth.currentUser;
      if (user) {
        setUserEmail(user.email);

        const userRef = ref(db, `users/${user.uid}`);

        // onValue listens for changes continuously
        unsubscribe = onValue(
          userRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.val();

              if (data.avatarId) {
                setUserAvatar(data.avatarId);
              }
              if (data.fullName) {
                setFullName(data.fullName);
              }
              if (data.score !== undefined) {
                setScore(data.score); // Instantly updates when score changes
              }
            }
          },
          (error) => {
            console.error("Error with real-time fetch:", error);
          },
        );
      }
    };

    setupRealtimeListener();

    // Floating animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          easing: Easing.easeInOut,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.easeInOut,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Cleanup function: stop listening when component unmounts
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSelectAvatar = async (avatarId) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setUserAvatar(avatarId);
      setAvatarModalVisible(false);

      const userRef = ref(db, `users/${user.uid}/avatarId`);
      await set(userRef, avatarId);
    } catch (error) {
      console.error("Error saving avatar:", error);
    }
  };

  const getUsername = () => {
    if (userEmail) {
      return userEmail.split("@")[0];
    }
    return "User";
  };

  const getUserInitials = () => {
    return getUsername().charAt(0).toUpperCase();
  };

  // Renders the profile picture with the expanded dynamic borders
  const renderProfilePicture = (sizeClasses, textClasses) => {
    let borderSource;

    // Check score from highest to lowest
    if (score >= 55) {
      borderSource = require("../assets/border12.png");
    } else if (score >= 50) {
      borderSource = require("../assets/border11.png");
    } else if (score >= 45) {
      borderSource = require("../assets/border10.png");
    } else if (score >= 40) {
      borderSource = require("../assets/border9.png");
    } else if (score >= 35) {
      borderSource = require("../assets/border8.png");
    } else if (score >= 30) {
      borderSource = require("../assets/border7.png");
    } else if (score >= 25) {
      borderSource = require("../assets/border6.png");
    } else if (score >= 20) {
      borderSource = require("../assets/border5.png");
    } else if (score >= 15) {
      borderSource = require("../assets/border4.png");
    } else if (score >= 10) {
      borderSource = require("../assets/border3.png");
    } else if (score >= 5) {
      borderSource = require("../assets/border2.png");
    } else {
      borderSource = require("../assets/border1.png"); // 0 to 4 points
    }

    return (
      <View className={`${sizeClasses} justify-center items-center`}>
        {/* Inner Avatar or Initials */}
        <View className="w-full h-full rounded-full overflow-hidden absolute">
          {userAvatar && avatarMap[userAvatar] ? (
            <Image
              source={avatarMap[userAvatar]}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full bg-gradient-to-b from-green-400 to-blue-500 justify-center items-center">
              <Text className={`text-white font-bold ${textClasses}`}>
                {getUserInitials()}
              </Text>
            </View>
          )}
        </View>

        {/* Dynamic Image Border Overlay */}
        <Image
          source={borderSource}
          className="absolute w-[130%] h-[130%]"
          resizeMode="contain"
        />
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-blue-950">
      {/* Background Image */}
      <View className="absolute bottom-[100px] left-0">
        <Image
          source={require("../assets/bg.png")}
          className="w-[500px] h-[500px] opacity-15"
          resizeMode="contain"
        />
      </View>

      {/* Avatar Selection Modal */}
      <Modal
        transparent={true}
        visible={avatarModalVisible}
        animationType="slide"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <View className="flex-1 bg-black/70 justify-center items-center p-6">
          <View className="bg-blue-900 w-full rounded-3xl p-6 border-2 border-blue-400">
            <Text className="text-white text-xl font-bold text-center mb-6">
              Select an Avatar
            </Text>

            <View className="flex-row flex-wrap justify-center gap-4">
              {Object.keys(avatarMap).map((avatarKey) => (
                <TouchableOpacity
                  key={avatarKey}
                  onPress={() => handleSelectAvatar(avatarKey)}
                  className={`border-4 rounded-full ${userAvatar === avatarKey ? "border-green-400" : "border-transparent"}`}
                >
                  <Image
                    source={avatarMap[avatarKey]}
                    className="w-20 h-20 rounded-full"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              className="mt-8 bg-blue-600/70 py-3 rounded-full"
              onPress={() => setAvatarModalVisible(false)}
            >
              <Text className="text-white text-center font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Profile Modal */}
      <Modal
        transparent={true}
        visible={profileModalVisible}
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={() => setProfileModalVisible(false)}
        >
          <View className="flex-1 bg-black/50">
            <View className="absolute top-20 right-6 w-56 bg-blue-900 rounded-2xl border-2 border-blue-400 overflow-hidden">
              {/* Profile Info */}
              <View className="p-4 border-b border-blue-400/30">
                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={() => {
                      setProfileModalVisible(false);
                      setAvatarModalVisible(true);
                    }}
                  >
                    {renderProfilePicture("w-12 h-12", "text-xl")}
                  </TouchableOpacity>

                  <View className="ml-4 flex-1">
                    <Text className="text-white font-bold text-base">
                      {getUsername()}
                    </Text>
                    <Text className="text-blue-200 font-medium text-sm mt-0.5">
                      {fullName || "No Name"}
                    </Text>
                    <Text className="text-blue-300 text-xs mt-0.5">
                      {userEmail || "No email"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Menu Items */}
              <View>
                <TouchableOpacity
                  className="px-4 py-3 border-b border-blue-400/30"
                  onPress={() => {
                    setProfileModalVisible(false);
                    setAvatarModalVisible(true);
                  }}
                >
                  <Text className="text-white">Choose Avatar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="px-4 py-3 border-b border-blue-400/30"
                  onPress={() => {
                    setProfileModalVisible(false);
                    // Achievements option
                  }}
                >
                  <Text className="text-white">Achievements</Text>
                </TouchableOpacity>

                {/* Logout Button */}
                <TouchableOpacity className="px-4 py-3" onPress={handleLogout}>
                  <Text className="text-red-400 font-semibold">Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Main Content */}
      <View className="flex-1">
        {/* Header with Profile Picture */}
        <View className="flex-row justify-end px-6 pt-4">
          <TouchableOpacity
            onPress={() => setProfileModalVisible(true)}
            className="mt-6 justify-center items-center"
            activeOpacity={0.8}
          >
            {renderProfilePicture("w-14 h-14", "text-2xl")}
          </TouchableOpacity>
        </View>

        <View className="flex-1 mt-10 px-6 left-5">
          <Animated.Image
            source={require("../assets/logo.png")}
            className="w-[300px] h-[60px] mb-8"
            resizeMode="contain"
            style={{
              transform: [{ translateY: floatAnim }],
            }}
          />
          <Text className="text-white -tracking-tighter text-center text-lg ">
            Genetics Learning Game
          </Text>
        </View>

        <View className="w-full px-6 mb-8">
          <TouchableOpacity
            className="w-full bg-green-600/70 rounded-full py-4 mb-4 shadow-lg shadow-green-500/50 border-2 border-green-500"
            activeOpacity={0.8}
          >
            <Text className="text-white text-center font-semibold text-lg">
              Start Quiz
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full bg-yellow-600/70 rounded-full py-4 mb-4 shadow-lg shadow-yellow-500/50 border-2 border-yellow-500"
            activeOpacity={0.8}
          >
            <Text className="text-white text-center font-semibold text-lg">
              Review Lessons
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full bg-blue-600/70 rounded-full py-4 shadow-lg mb-10 shadow-blue-500/50 border-2 border-blue-500"
            activeOpacity={0.8}
          >
            <Text className="text-white text-center font-semibold text-lg ">
              About
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Home;
