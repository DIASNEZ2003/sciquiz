import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { signOut } from "firebase/auth";
import { onValue, ref, remove, update } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
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
import * as XLSX from "xlsx";
import { auth, db } from "./Firebase";

// --- AVATAR & BORDER MAPS ---
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

const HomeAdmin = () => {
  const router = useRouter();

  // Animations
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // State
  const [isOnline, setIsOnline] = useState(true);
  const [users, setUsers] = useState({});
  const [currentView, setCurrentView] = useState("menu");

  // User Management State
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editScore, setEditScore] = useState("0");

  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });

    const usersRef = ref(db, "users");
    const unsubscribeFirebase = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        setUsers(snapshot.val());
      }
    });

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
      if (unsubscribeNetInfo) unsubscribeNetInfo();
      if (unsubscribeFirebase) unsubscribeFirebase();
    };
  }, []);

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to exit the Admin Panel?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            const uid =
              auth.currentUser?.uid ||
              (await AsyncStorage.getItem("active_uid"));
            await AsyncStorage.removeItem("active_uid");
            if (uid) await AsyncStorage.removeItem(`role_${uid}`);

            if (auth.currentUser) await signOut(auth);
            router.replace("/");
          } catch (error) {
            console.error("Logout error:", error);
          }
        },
      },
    ]);
  };

  // --- DATA & STATS LOGIC ---
  const getStudents = () => {
    return Object.entries(users).filter(([uid, data]) => data.role !== "admin");
  };

  // Calculate an individual student's progress percentage
  const getStudentProgress = (data) => {
    let completed = 0;
    const totalLessons = 12; // 10 lessons + 5.5 + Final Exam
    if (data.lesson1?.completed) completed++;
    if (data.gene_genius?.completed) completed++;
    if (data.curious_case?.completed) completed++;
    if (data.lesson4?.completed) completed++;
    if (data.lesson5?.completed) completed++;
    if (data.lesson5_5?.completed) completed++;
    if (data.lesson6?.completed) completed++;
    if (data.lesson7?.completed) completed++;
    if (data.lesson8?.completed) completed++;
    if (data.lesson9?.completed) completed++;
    if (data.lesson10?.completed) completed++;
    if (data.finalquiz?.completed || data.final_quiz?.completed) completed++;

    return Math.round((completed / totalLessons) * 100);
  };

  const calculateLessonStats = () => {
    const students = getStudents();
    const total = students.length || 1;
    const stats = {
      L1: 0,
      L2: 0,
      L3: 0,
      L4: 0,
      L5: 0,
      L5_5: 0,
      L6: 0,
      L7: 0,
      L8: 0,
      L9: 0,
      L10: 0,
      Final: 0,
    };

    students.forEach(([uid, data]) => {
      if (data.lesson1?.completed) stats.L1++;
      if (data.gene_genius?.completed) stats.L2++;
      if (data.curious_case?.completed) stats.L3++;
      if (data.lesson4?.completed) stats.L4++;
      if (data.lesson5?.completed) stats.L5++;
      if (data.lesson5_5?.completed) stats.L5_5++;
      if (data.lesson6?.completed) stats.L6++;
      if (data.lesson7?.completed) stats.L7++;
      if (data.lesson8?.completed) stats.L8++;
      if (data.lesson9?.completed) stats.L9++;
      if (data.lesson10?.completed) stats.L10++;
      if (data.finalquiz?.completed || data.final_quiz?.completed)
        stats.Final++;
    });

    Object.keys(stats).forEach((key) => {
      stats[key] = Math.round((stats[key] / total) * 100);
    });

    return stats;
  };

  // Automated System Recommendations
  const getRecommendations = () => {
    const students = getStudents();
    const recommendations = [];

    students.forEach(([uid, data]) => {
      const name = data.fullName || data.username || "Unknown Student";
      const finalDone = data.finalquiz?.completed || data.final_quiz?.completed;
      const l10Done = data.lesson10?.completed;
      const l1Done = data.lesson1?.completed;

      if (l10Done && !finalDone) {
        recommendations.push({
          type: "exam",
          icon: "alert-circle",
          color: "text-red-400",
          border: "border-red-500",
          text: `${name} has finished all lessons but needs to take the Final Exam!`,
        });
      } else if (!l1Done) {
        recommendations.push({
          type: "start",
          icon: "walk",
          color: "text-orange-400",
          border: "border-orange-500",
          text: `${name} hasn't started Lesson 1 yet. Encourage them to begin!`,
        });
      } else if (!l10Done && l1Done) {
        recommendations.push({
          type: "progress",
          icon: "trending-up",
          color: "text-cyan-400",
          border: "border-cyan-500",
          text: `${name} is currently working through the lessons. Keep them motivated!`,
        });
      }
    });

    return recommendations;
  };

  // --- REAL EXCEL (.XLSX) EXPORT LOGIC ---
  const exportToExcel = async (studentList, fileName) => {
    try {
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert(
          "Unsupported Device",
          "Sharing files is not supported on this device/simulator.",
        );
        return;
      }

      const excelData = studentList.map(([uid, data]) => ({
        UID: uid,
        "Full Name": data.fullName || "N/A",
        Username: data.username || "N/A",
        Email: data.email || "N/A",
        "Total Progress %": `${getStudentProgress(data)}%`,
        "Total Score": data.score || 0,
        "L1 Done": data.lesson1?.completed ? "Yes" : "No",
        "L2 Done": data.gene_genius?.completed ? "Yes" : "No",
        "L2 Score": data.gene_genius?.score || 0,
        "L3 Done": data.curious_case?.completed ? "Yes" : "No",
        "L4 Done": data.lesson4?.completed ? "Yes" : "No",
        "L5 Done": data.lesson5?.completed ? "Yes" : "No",
        "L5.5 Done": data.lesson5_5?.completed ? "Yes" : "No",
        "L6 Done": data.lesson6?.completed ? "Yes" : "No",
        "L7 Done": data.lesson7?.completed ? "Yes" : "No",
        "L8 Done": data.lesson8?.completed ? "Yes" : "No",
        "L8 Score": data.lesson8?.score || 0,
        "L9 Done": data.lesson9?.completed ? "Yes" : "No",
        "L9 Score": data.lesson9?.score || 0,
        "L10 Done": data.lesson10?.completed ? "Yes" : "No",
        "L10 Score": data.lesson10?.score || 0,
        "Final Exam Done":
          data.finalquiz?.completed || data.final_quiz?.completed
            ? "Yes"
            : "No",
        "Final Exam Score":
          data.finalquiz?.finalscore || data.final_quiz?.score || 0,
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

      const base64 = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });

      const fileUri = FileSystem.documentDirectory + `${fileName}.xlsx`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: "base64",
      });

      await Sharing.shareAsync(fileUri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Download Excel Report",
        UTI: "com.microsoft.excel.xls",
      });
    } catch (error) {
      Alert.alert("Export Error", "Failed to generate Excel document.");
      console.error(error);
    }
  };

  // --- USER MANAGEMENT LOGIC ---
  const openUserModal = (uid, data) => {
    setSelectedUser({ uid, ...data });
    setEditFullName(data.fullName || "");
    setEditScore(data.score !== undefined ? String(data.score) : "0");
    setUserModalVisible(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      await update(ref(db, `users/${selectedUser.uid}`), {
        fullName: editFullName,
        score: Number(editScore),
      });
      Alert.alert("Success", "User data updated successfully.");
      setUserModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to update user.");
    }
  };

  const handleDeleteUser = () => {
    Alert.alert(
      "Delete User",
      "Are you sure you want to permanently delete this student's data?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await remove(ref(db, `users/${selectedUser.uid}`));
              Alert.alert("Deleted", "Student data erased.");
              setUserModalVisible(false);
            } catch (error) {
              Alert.alert("Error", "Failed to delete user.");
            }
          },
        },
      ],
    );
  };

  // --- UI RENDERERS ---
  const renderStudentProfilePicture = (avatarId, borderId) => {
    let aSrc = avatarMap[avatarId] || avatarMap["pp1"];
    let bSrc = borderMap[borderId] || borderMap["1"];

    return (
      <View className="w-14 h-14 justify-center items-center mr-4">
        <View className="w-full h-full rounded-full overflow-hidden absolute">
          <Image source={aSrc} className="w-full h-full" resizeMode="cover" />
        </View>
        <Image
          source={bSrc}
          className="absolute w-[130%] h-[130%]"
          resizeMode="contain"
        />
      </View>
    );
  };

  const renderHeader = (title) => (
    <View className="flex-row justify-between items-center px-8 pt-11 z-10 mb-6">
      <View className="flex-row items-center flex-1">
        {currentView !== "menu" && (
          <TouchableOpacity
            onPress={() => setCurrentView("menu")}
            className="bg-blue-900 p-2 rounded-full mr-4 border border-blue-400"
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
        )}
        <View>
          <Text className="text-blue-200 text-[10px] font-bold tracking-[3px] uppercase mb-1">
            Admin Panel
          </Text>
          <Text
            className="text-yellow-500 font-black text-2xl uppercase tracking-wider"
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      </View>
      <View
        className={`flex-row items-center px-3 py-2 rounded-full border-2 shadow-lg ${isOnline ? "bg-green-500/20 border-green-500/50 shadow-green-500/20" : "bg-red-500/20 border-red-500/50 shadow-red-500/20"}`}
      >
        <View
          className={`w-2.5 h-2.5 rounded-full mr-2 ${isOnline ? "bg-green-500" : "bg-red-500"}`}
        />
        <Text
          className={`font-black text-[10px] uppercase tracking-widest ${isOnline ? "text-green-400" : "text-red-400"}`}
        >
          {isOnline ? "ONLINE" : "OFFLINE"}
        </Text>
      </View>
    </View>
  );

  const renderMenu = () => (
    <View className="flex-1 justify-center items-center px-8 pb-10 z-10 w-full max-w-[450px] self-center">
      <Animated.Image
        source={require("../assets/logo.png")}
        className="w-full h-32 mb-4 mt-6"
        resizeMode="contain"
        style={{ transform: [{ translateY: floatAnim }] }}
      />
      <Text className="text-blue-300 tracking-[6px] text-center text-[10px] font-bold uppercase mb-12">
        Database Control Center
      </Text>

      <TouchableOpacity
        onPress={() => setCurrentView("users")}
        activeOpacity={0.8}
        className="mb-5 w-full"
      >
        <View
          className="bg-yellow-500 rounded-2xl py-4 flex-row items-center justify-center shadow-2xl"
          style={{ borderBottomWidth: 5, borderBottomColor: "#a16207" }}
        >
          <Ionicons name="people" size={24} color="#020617" className="mr-3" />
          <Text className="text-[#020617] font-black text-xl tracking-widest uppercase ml-2">
            Manage Users
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setCurrentView("stats")}
        activeOpacity={0.8}
        className="mb-5 w-full"
      >
        <View
          className="bg-blue-600 rounded-2xl py-4 flex-row items-center justify-center shadow-2xl"
          style={{ borderBottomWidth: 5, borderBottomColor: "#1e3a8a" }}
        >
          <Ionicons name="bar-chart" size={24} color="white" className="mr-3" />
          <Text className="text-white font-black text-xl tracking-widest uppercase ml-2">
            System Stats
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => exportToExcel(getStudents(), "All_Students_Report")}
        activeOpacity={0.8}
        className="mb-10 w-full"
      >
        <View
          className="bg-green-600 rounded-2xl py-4 flex-row items-center justify-center shadow-2xl"
          style={{ borderBottomWidth: 5, borderBottomColor: "#14532d" }}
        >
          <Ionicons name="download" size={24} color="white" className="mr-3" />
          <Text className="text-white font-black text-xl tracking-widest uppercase ml-2">
            Export Data (.xlsx)
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleLogout}
        activeOpacity={0.8}
        className="w-full mt-4"
      >
        <View
          className="bg-blue-950 border-2 border-red-500 rounded-2xl py-4 items-center justify-center w-full"
          style={{ borderBottomWidth: 5, borderBottomColor: "#7f1d1d" }}
        >
          <Text className="text-red-500 font-black text-md tracking-widest uppercase px-2 text-center">
            Log Out
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => {
    const stats = calculateLessonStats();
    const students = getStudents();
    const recommendations = getRecommendations();

    return (
      <ScrollView
        className="flex-1 w-full px-6"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-blue-950/80 border border-blue-500 rounded-3xl p-6 shadow-xl mb-6 items-center flex-row justify-between">
          <View>
            <Text className="text-blue-300 font-bold uppercase tracking-widest text-xs mb-1">
              Total Enrolled
            </Text>
            <Text className="text-yellow-500 font-black text-4xl">
              {students.length}
            </Text>
          </View>
          <Ionicons name="school" size={48} color="#3b82f6" opacity={0.5} />
        </View>

        {/* CUSTOM BAR GRAPH - OVERALL LESSON COMPLETION */}
        <View className="bg-blue-950/80 border border-blue-500 rounded-3xl p-6 shadow-xl mb-6">
          <Text className="text-yellow-400 font-black uppercase tracking-widest text-sm mb-6 text-center">
            Lesson Completion Graph
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 10, paddingRight: 20 }}
          >
            <View className="flex-row items-end h-56 pt-6 border-b-2 border-blue-800">
              {Object.entries(stats).map(([lesson, percentage]) => (
                <View key={lesson} className="items-center mx-3 w-10">
                  <Text className="text-blue-200 font-bold text-[10px] mb-2">
                    {percentage}%
                  </Text>
                  <View
                    className="w-full bg-blue-900 rounded-t-lg justify-end overflow-hidden"
                    style={{ height: 150 }}
                  >
                    <Animated.View
                      className="w-full bg-yellow-500 rounded-t-lg"
                      style={{ height: `${percentage}%` }}
                    />
                  </View>
                  <Text className="text-white font-bold text-[10px] mt-3 uppercase">
                    {lesson === "Final" ? "Exam" : lesson.replace("_", ".")}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* ACTIONABLE RECOMMENDATIONS */}
        <View className="bg-blue-950/80 border border-blue-500 rounded-3xl p-6 shadow-xl mb-6">
          <View className="flex-row items-center justify-center mb-5">
            <Ionicons name="sparkles" size={20} color="#facc15" />
            <Text className="text-yellow-400 font-black uppercase tracking-widest text-sm ml-2">
              Recommendations
            </Text>
          </View>

          {recommendations.length > 0 ? (
            recommendations.map((rec, idx) => (
              <View
                key={idx}
                className={`flex-row items-center bg-blue-900/50 p-4 rounded-xl border-l-4 ${rec.border} mb-3`}
              >
                <Ionicons
                  name={rec.icon}
                  size={24}
                  color={
                    rec.color === "text-red-400"
                      ? "#f87171"
                      : rec.color === "text-orange-400"
                        ? "#fb923c"
                        : "#22d3ee"
                  }
                />
                <Text
                  className={`ml-3 flex-1 text-xs font-bold leading-5 ${rec.color}`}
                >
                  {rec.text}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-blue-200 text-center text-xs italic">
              All students have completed the entire course!
            </Text>
          )}
        </View>

        {/* INDIVIDUAL STUDENT PROGRESS BARS */}
        <View className="bg-blue-950/80 border border-blue-500 rounded-3xl p-6 shadow-xl">
          <Text className="text-yellow-400 font-black uppercase tracking-widest text-sm mb-6 text-center">
            Individual Student Progress
          </Text>
          {students.map(([uid, data]) => {
            const progress = getStudentProgress(data);
            return (
              <View key={uid} className="mb-5">
                <View className="flex-row justify-between mb-2 items-center">
                  <Text
                    className="text-white font-bold text-sm w-[75%]"
                    numberOfLines={1}
                  >
                    {data.fullName || "Unknown"}
                  </Text>
                  <Text className="text-yellow-500 font-bold text-xs">
                    {progress}%
                  </Text>
                </View>
                <View className="w-full h-3 bg-blue-900 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  const renderUsers = () => {
    const students = getStudents();

    return (
      <ScrollView
        className="flex-1 w-full px-6"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <TouchableOpacity
          onPress={() => exportToExcel(students, "All_Students_Report")}
          className="bg-green-600/20 border border-green-500 p-4 rounded-xl flex-row justify-center items-center mb-6"
        >
          <Ionicons name="document-text" size={20} color="#4ade80" />
          <Text className="text-green-400 font-bold ml-2 uppercase tracking-widest">
            Download Database (.xlsx)
          </Text>
        </TouchableOpacity>

        {students.map(([uid, data]) => {
          const progress = getStudentProgress(data);
          return (
            <View
              key={uid}
              className="bg-blue-950/80 border border-blue-500 rounded-3xl p-4 mb-4 shadow-lg flex-row items-center"
            >
              {/* RENDER ACTUAL AVATAR & BORDER */}
              {renderStudentProfilePicture(data.avatarId, data.borderId)}

              <View className="flex-1">
                <Text
                  className="text-white font-bold text-lg mb-1"
                  numberOfLines={1}
                >
                  {data.fullName || "Unknown"}
                </Text>

                {/* User Mini Progress Bar */}
                <View className="w-11/12 h-1.5 bg-blue-900 rounded-full mb-2 overflow-hidden mt-1">
                  <View
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </View>

                {/* Username and Score placed side-by-side */}
                <View className="flex-row items-center justify-between pr-4 mt-1">
                  <Text className="text-blue-300 text-xs font-bold tracking-wider">
                    @{data.username || "user"}
                  </Text>
                  <View className="bg-yellow-500/20 px-2 py-1 rounded border border-yellow-500/50">
                    <Text className="text-yellow-400 font-black text-[10px] uppercase tracking-widest">
                      Score: {data.score || 0}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-row gap-2 ml-2">
                {/* INDIVIDUAL EXPORT BUTTON */}
                <TouchableOpacity
                  onPress={() =>
                    exportToExcel(
                      [[uid, data]],
                      `${(data.fullName || "Student").replace(/\s+/g, "_")}_Report`,
                    )
                  }
                  className="bg-green-600 p-3 rounded-xl border-b-2 border-green-800"
                >
                  <Ionicons name="download" size={20} color="white" />
                </TouchableOpacity>
                {/* EDIT USER BUTTON */}
                <TouchableOpacity
                  onPress={() => openUserModal(uid, data)}
                  className="bg-blue-600 p-3 rounded-xl border-b-2 border-blue-800"
                >
                  <Ionicons name="pencil" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-blue-800">
      <StatusBar barStyle="light-content" />

      {/* BACKGROUND */}
      <View className="absolute inset-0 opacity-35">
        <ImageBackground
          source={require("../assets/bg3.png")}
          className="flex-1"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/50" />
      </View>

      {/* EDIT USER MODAL */}
      <Modal transparent visible={userModalVisible} animationType="slide">
        <View className="flex-1 bg-black/80 justify-center items-center p-6 z-[100]">
          <View className="bg-blue-950 w-full max-w-[400px] rounded-3xl p-6 border-2 border-yellow-500 shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-yellow-500 font-black text-xl uppercase tracking-widest">
                Edit Student
              </Text>
              <TouchableOpacity onPress={() => setUserModalVisible(false)}>
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
            </View>

            <Text className="text-blue-300 font-bold text-xs uppercase mb-2">
              Full Name
            </Text>
            <TextInput
              value={editFullName}
              onChangeText={setEditFullName}
              className="bg-blue-900 border border-blue-500 text-white p-4 rounded-xl mb-4 font-bold"
            />

            <Text className="text-blue-300 font-bold text-xs uppercase mb-2">
              Total Score
            </Text>
            <TextInput
              value={editScore}
              onChangeText={setEditScore}
              keyboardType="numeric"
              className="bg-blue-900 border border-blue-500 text-white p-4 rounded-xl mb-6 font-bold"
            />

            {/* PROGRESS OVERVIEW */}
            <Text className="text-yellow-400 font-bold text-xs uppercase mb-2 text-center">
              Student Progress Details
            </Text>
            <ScrollView className="max-h-32 bg-blue-900/50 p-4 rounded-xl border border-blue-500/30 mb-6">
              <Text className="text-white text-xs mb-2">
                L1: {selectedUser?.lesson1?.completed ? "✅" : "❌"}
              </Text>
              <Text className="text-white text-xs mb-2">
                L2 (Gene Genius):{" "}
                {selectedUser?.gene_genius?.completed ? "✅" : "❌"} (Score:{" "}
                {selectedUser?.gene_genius?.score || 0})
              </Text>
              <Text className="text-white text-xs mb-2">
                L3 (Curious Case):{" "}
                {selectedUser?.curious_case?.completed ? "✅" : "❌"}
              </Text>
              <Text className="text-white text-xs mb-2">
                L4: {selectedUser?.lesson4?.completed ? "✅" : "❌"}
              </Text>
              <Text className="text-white text-xs mb-2">
                L5: {selectedUser?.lesson5?.completed ? "✅" : "❌"}
              </Text>
              <Text className="text-white text-xs mb-2">
                L5.5: {selectedUser?.lesson5_5?.completed ? "✅" : "❌"}
              </Text>
              <Text className="text-white text-xs mb-2">
                L6: {selectedUser?.lesson6?.completed ? "✅" : "❌"}
              </Text>
              <Text className="text-white text-xs mb-2">
                L7: {selectedUser?.lesson7?.completed ? "✅" : "❌"}
              </Text>
              <Text className="text-white text-xs mb-2">
                L8: {selectedUser?.lesson8?.completed ? "✅" : "❌"} (Score:{" "}
                {selectedUser?.lesson8?.score || 0})
              </Text>
              <Text className="text-white text-xs mb-2">
                L9: {selectedUser?.lesson9?.completed ? "✅" : "❌"} (Score:{" "}
                {selectedUser?.lesson9?.score || 0})
              </Text>
              <Text className="text-white text-xs mb-2">
                L10: {selectedUser?.lesson10?.completed ? "✅" : "❌"} (Score:{" "}
                {selectedUser?.lesson10?.score || 0})
              </Text>
              <Text className="text-white text-xs font-bold mt-2 text-yellow-500">
                Final Exam:{" "}
                {selectedUser?.finalquiz?.completed ||
                selectedUser?.final_quiz?.completed
                  ? "✅ Passed"
                  : "❌ Pending"}{" "}
                (Score:{" "}
                {selectedUser?.finalquiz?.finalscore ||
                  selectedUser?.final_quiz?.score ||
                  0}
                )
              </Text>
            </ScrollView>

            <TouchableOpacity
              onPress={handleUpdateUser}
              className="bg-yellow-500 py-4 rounded-xl items-center mb-3 shadow-lg border-b-4 border-yellow-700"
            >
              <Text className="text-blue-950 font-black uppercase tracking-widest">
                Save Changes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeleteUser}
              className="bg-red-500 py-4 rounded-xl items-center shadow-lg border-b-4 border-red-800"
            >
              <Text className="text-white font-black uppercase tracking-widest">
                Delete Student
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Animated.View style={{ opacity: fadeAnim }} className="flex-1">
        {renderHeader(
          currentView === "menu"
            ? "Dashboard"
            : currentView === "stats"
              ? "Statistics"
              : "Users",
        )}
        {currentView === "menu" && renderMenu()}
        {currentView === "stats" && renderStats()}
        {currentView === "users" && renderUsers()}
      </Animated.View>
    </SafeAreaView>
  );
};

export default HomeAdmin;
