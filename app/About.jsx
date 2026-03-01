import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const About = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-blue-900">
      <StatusBar barStyle="light-content" />

      {/* BACKGROUND */}
      <View className="absolute inset-0 opacity-40">
        <ImageBackground
          source={require("../assets/bg3.png")}
          className="flex-1"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/60" />
      </View>

      {/* HEADER */}
      <View className="px-6 py-4 flex-row items-center z-10 w-full max-w-[500px] self-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-blue-800/80 p-2.5 mt-5 rounded-full border border-blue-400/50 shadow-md"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white  font-black text-xl ml-4 tracking-widest uppercase">
          About App
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 50,
          alignItems: "center",
          paddingHorizontal: 20,
        }}
        className="z-10 w-full"
      >
        <View className="w-full max-w-[500px]">
          {/* LOGO & TITLE */}
          <View className="items-center mt-2 mb-8 bg-blue-950/40 p-6 rounded-3xl border border-blue-500/30">
            <Image
              source={require("../assets/logo.png")}
              className="w-48 h-24"
              resizeMode="contain"
            />
            <Text className="text-yellow-500 font-black text-2xl tracking-widest mt-4 uppercase text-center">
              Sci-Quiz App
            </Text>
            <View className="bg-yellow-500/20 px-3 py-1 rounded-full mt-2 border border-yellow-500/50">
              <Text className="text-yellow-400 font-bold text-[10px] tracking-widest uppercase">
                Version 1.0
              </Text>
            </View>
          </View>

          {/* CARD 1: PURPOSE */}
          <View className="bg-blue-950/80 border border-blue-500/50 rounded-3xl p-6 mb-5 shadow-xl">
            <View className="flex-row items-center mb-3">
              <Ionicons name="bulb-outline" size={20} color="#facc15" />
              <Text className="text-yellow-400 font-black text-sm uppercase tracking-widest ml-2">
                Purpose
              </Text>
            </View>
            <Text className="text-blue-50 font-medium leading-6 mb-4 text-justify">
              This app is an interactive learning tool designed to help Grade 8
              students understand the basic concepts of genetics and
              inheritance, with a special focus on monohybrid crosses.
            </Text>
            <Text className="text-blue-50 font-medium leading-6 text-justify">
              It was developed to make genetics easier to understand by
              presenting lessons through stories, animations, and interactive
              activities. It aims to help students visualize how traits are
              passed from parents to offspring and apply this knowledge using
              Punnett squares.
            </Text>
          </View>

          {/* CARD 2: TARGET USERS & KEY FEATURES */}
          <View className="bg-blue-950/80 border border-blue-500/50 rounded-3xl p-6 mb-5 shadow-xl">
            <View className="flex-row items-center mb-4">
              <Ionicons name="people-outline" size={20} color="#facc15" />
              <Text className="text-yellow-400 font-black text-sm uppercase tracking-widest ml-2">
                Target Users
              </Text>
            </View>
            <View className="mb-6">
              {[
                "Grade 8 students",
                "Science teachers",
                "Learners studying basic genetics and inheritance",
              ].map((item, index) => (
                <View className="flex-row items-start mb-2" key={index}>
                  <View className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-3 mt-2 shadow-sm" />
                  <Text className="text-blue-50 font-medium leading-5 pr-2">
                    {item}
                  </Text>
                </View>
              ))}
            </View>

            <View className="h-[1px] bg-blue-500/30 w-full mb-5" />

            <View className="flex-row items-center mb-4">
              <Ionicons name="star-outline" size={20} color="#facc15" />
              <Text className="text-yellow-400 font-black text-sm uppercase tracking-widest ml-2">
                Key Features
              </Text>
            </View>
            <View>
              {[
                "Animated story-based lessons",
                "Simple explanations of genetic concepts",
                "Practice problems using Punnett squares",
                "Pre-test and post-test assessments",
                "Engaging activities aligned with the Grade 8 Science curriculum",
              ].map((item, index) => (
                <View className="flex-row items-start mb-3" key={index}>
                  <View className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-3 mt-2 shadow-sm" />
                  <Text className="text-blue-50 font-medium flex-1 leading-6 pr-2">
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* CARD 3: EDUCATIONAL NOTE (HIGHLIGHTED) */}
          <View className="bg-yellow-600/20 border border-yellow-500/60 rounded-3xl p-6 mb-5 shadow-md">
            <View className="flex-row items-center mb-3">
              <Ionicons name="information-circle" size={22} color="#facc15" />
              <Text className="text-yellow-400 font-black text-sm uppercase tracking-widest ml-2">
                Educational Note
              </Text>
            </View>
            <Text className="text-yellow-100/90 font-medium leading-6 italic text-justify">
              The genetic scenarios presented in this app use simplified models
              of inheritance for educational purposes. Real-life genetics can be
              more complex and may involve multiple genes and environmental
              factors.
            </Text>
          </View>

          {/* CARD 4: DEVELOPERS & CREDITS */}
          <View className="bg-blue-950/80 border border-blue-500/50 rounded-3xl p-6 mb-5 shadow-xl">
            <View className="flex-row items-center mb-4">
              <Ionicons name="school-outline" size={20} color="#facc15" />
              <Text className="text-yellow-400 font-black text-sm uppercase tracking-widest ml-2">
                Researchers & Authors
              </Text>
            </View>
            <Text className="text-white font-bold leading-6 mb-2">
              Developed by:
            </Text>
            <View className="ml-2 mb-6 bg-blue-900/40 p-4 rounded-xl border border-blue-500/20">
              <Text className="text-blue-100 font-medium leading-7">
                • Ryza Mae L. Algar
              </Text>
              <Text className="text-blue-100 font-medium leading-7">
                • Krystel Ann S. Cañete
              </Text>
              <Text className="text-blue-100 font-medium leading-7">
                • Christina Mae Y. Padayao
              </Text>
            </View>

            <View className="bg-blue-900/40 p-4 rounded-xl border border-blue-500/20 mb-6">
              <Text className="text-blue-50 font-medium leading-7">
                <Text className="font-bold text-yellow-500">School: </Text>
                Central Philippines State University{"\n"}
                <Text className="font-bold text-yellow-500">Subject: </Text>
                Science 8{"\n"}
                <Text className="font-bold text-yellow-500">School Year: </Text>
                2025–2026
              </Text>
            </View>

            <View className="h-[1px] bg-blue-500/30 w-full mb-5" />

            <View className="flex-row items-center mb-4">
              <Ionicons name="code-slash" size={20} color="#facc15" />
              <Text className="text-yellow-400 font-black text-sm uppercase tracking-widest ml-2">
                Technical Support
              </Text>
            </View>
            <Text className="text-blue-50 font-medium leading-6 mb-4 text-justify">
              This application was developed with the assistance of IT students
              who handled the technical design, programming, and app
              functionality.
            </Text>
            <View className="ml-2 mb-6 bg-blue-900/40 p-4 rounded-xl border border-blue-500/20">
              <Text className="text-blue-100 font-medium leading-7">
                • Venjoneil F. Diasnez
              </Text>
              <Text className="text-blue-100 font-medium leading-7">
                • Ern Basala
              </Text>
              <Text className="text-blue-100 font-medium leading-7">
                • Alvin Anciano
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default About;
