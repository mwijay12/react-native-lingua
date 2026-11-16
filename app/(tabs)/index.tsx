import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LearningHydrationScreen } from "@/components/LearningHydrationScreen";
import { LearningSticker } from "@/components/LearningSticker";
import { LessonIcon } from "@/components/LessonIcon";
import { MotionSticker } from "@/components/MotionSticker";
import { images } from "@/constants/images";
import { getCourseUnits } from "@/data/courses";
import { LANGUAGES } from "@/data/languages";
import { useLearningHydration } from "@/hooks/useLearningHydration";
import { useStudyDate } from "@/hooks/useStudyDate";
import { getReviewQuestions, lastSevenDays, localDateKey, sessionCount, type DailyGoal } from "@/lib/studyProgress";
import { useLanguageStore } from "@/store/languageStore";
import { useLearningStore } from "@/store/learningStore";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const GOALS: DailyGoal[] = [1, 2, 3];

export default function HomeScreen() {
  const { user } = useUser();
  const { selectedLanguage } = useLanguageStore();
  const { totalXp, completedLessonIds, dailyGoal, setDailyGoal, activityByDate, reviewItems } = useLearningStore();
  const hydration = useLearningHydration();
  const now = useStudyDate();
  const firstName = user?.firstName ?? "Learner";

  const language = LANGUAGES.find((item) => item.code === selectedLanguage);
  const units = getCourseUnits(selectedLanguage);
  const lessons = units.flatMap((unit) => unit.lessons);
  const completedCount = lessons.filter((lesson) => completedLessonIds.includes(lesson.id)).length;
  const nextLesson = lessons.find((lesson) => !completedLessonIds.includes(lesson.id));
  const courseProgress = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;
  const todaySessions = sessionCount(activityByDate[localDateKey(now)]);
  const goalProgress = Math.min(100, Math.round((todaySessions / dailyGoal) * 100));
  const week = lastSevenDays(activityByDate, now);
  const activeDays = week.filter((day) => day.sessions > 0).length;
  const reviewCount = getReviewQuestions(reviewItems, lessons).length;

  if (hydration !== "ready") return <LearningHydrationScreen status={hydration} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FBF8F1" }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-1 pr-3">
            <Text className="font-poppins-semibold text-[10px] tracking-[1.4px] text-lingua-teal">LINGUA · STUDY DASHBOARD</Text>
            <Text className="font-poppins-semibold text-[24px] text-text-primary mt-1">Hello, {firstName}</Text>
            <Text className="body-sm text-text-secondary mt-1">Build a steady learning habit.</Text>
          </View>
          <View className="w-14 h-14 rounded-full bg-lingua-mint items-center justify-center">
            <Image source={images.mascotParrot} style={styles.headerParrot} resizeMode="contain" accessible={false} />
          </View>
        </View>

        <View className="bg-lingua-deep-teal rounded-[24px] overflow-hidden p-5 mb-5">
          <View className="flex-row items-center justify-between">
            <Text className="font-poppins-semibold text-[10px] tracking-[1.2px] text-[#CBE8DE]">CURRENT COURSE</Text>
            <TouchableOpacity onPress={() => router.push("/language-select")} accessibilityRole="button" accessibilityLabel="Change language" testID="home-change-language">
              <Text className="font-poppins-medium text-xs text-[#E3F3EC]">Change</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center mt-3">
            {language && <Image source={language.flag} style={styles.flag} />}
            <View className="flex-1">
              <Text className="font-poppins-semibold text-[22px] text-white" testID="home-course-title">{language?.name ?? "Choose a language"}</Text>
              <Text className="font-poppins text-xs text-[#D2E9E1] mt-1">{completedCount} of {lessons.length} lessons completed</Text>
            </View>
            <View className="w-20 h-20 rounded-full bg-[#2B7468] items-center justify-center ml-2">
              <Image source={images.mascotCat} style={styles.courseCat} resizeMode="contain" accessible={false} />
            </View>
          </View>
          {lessons.length > 0 && (
            <View className="h-2 bg-white/25 rounded-full overflow-hidden mt-4" accessibilityRole="progressbar" accessibilityLabel="Course progress" accessibilityValue={{ min: 0, max: 100, now: courseProgress }}>
              <View className="h-2 bg-[#D7EBDC] rounded-full" style={{ width: `${courseProgress}%` }} />
            </View>
          )}
          <TouchableOpacity
            className="bg-[#FFFDF8] rounded-xl py-3 px-4 self-start mt-4"
            activeOpacity={0.85}
            accessibilityRole="button"
            testID="continue-learning-button"
            onPress={() => units.length ? router.navigate("/(tabs)/learn") : router.push("/language-select")}
          >
            <Text className="font-poppins-semibold text-sm text-lingua-deep-teal">{units.length ? "Continue learning" : "Choose a course"}  →</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="flex-row items-center rounded-[22px] border border-[#E6D9B7] bg-[#FFF7E3] p-4 mb-5"
          onPress={() => router.push("/play")}
          accessibilityRole="button"
          accessibilityLabel="Play Quick Mix and collect stickers"
          activeOpacity={0.8}
          testID="home-play-button"
        >
          <LearningSticker kind="numbers" size={58} />
          <View className="flex-1 ml-3 pr-2">
            <Text className="font-poppins-semibold text-[10px] tracking-[0.8px] text-lingua-teal">PLAY & COLLECT</Text>
            <Text className="font-poppins-semibold text-base text-text-primary mt-1">Quick Mix</Text>
            <Text className="caption mt-1">A little quiz and a sticker book.</Text>
          </View>
          <Ionicons name="arrow-forward" size={19} color="#14675D" />
        </TouchableOpacity>

        <View className="rounded-[24px] border border-border bg-white p-5 mb-5" testID="daily-goal-card">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-2">
              <Text className="font-poppins-semibold text-[10px] tracking-[1px] text-lingua-teal">TODAY’S STUDY</Text>
              <Text className="font-poppins-semibold text-lg text-text-primary mt-1">Daily goal</Text>
            </View>
            <View className="flex-row items-center">
              <MotionSticker kind="medal" size={46} testID="goal-sticker" />
              <Text className="font-poppins-semibold text-base text-text-primary ml-1" testID="daily-goal-progress">
                {todaySessions} / {dailyGoal}
              </Text>
            </View>
          </View>
          <View className="h-2 bg-[#EDF2EE] rounded-full overflow-hidden mt-3" accessibilityRole="progressbar" accessibilityLabel="Daily study goal" accessibilityValue={{ min: 0, max: dailyGoal, now: Math.min(todaySessions, dailyGoal), text: `${todaySessions} of ${dailyGoal} sessions` }}>
            <View className="h-2 bg-lingua-teal rounded-full" style={{ width: `${goalProgress}%` }} />
          </View>
          <Text className="body-sm text-text-secondary mt-2">
            {todaySessions >= dailyGoal ? "Goal reached. Keep learning at your pace." : `${dailyGoal - todaySessions} more ${dailyGoal - todaySessions === 1 ? "session" : "sessions"} to reach your goal.`}
          </Text>
          <Text className="caption mt-2">A finished lesson or review counts, including replays. Across all courses.</Text>
          <Text className="font-poppins-semibold text-[10px] tracking-[0.8px] text-text-secondary mt-4 mb-2">SET SESSIONS PER DAY</Text>
          <View className="flex-row gap-2">
            {GOALS.map((goal) => (
              <TouchableOpacity
                key={goal}
                onPress={() => setDailyGoal(goal)}
                accessibilityRole="radio"
                accessibilityLabel={`${goal} ${goal === 1 ? "session" : "sessions"} per day`}
                accessibilityState={{ checked: dailyGoal === goal }}
                aria-checked={dailyGoal === goal}
                testID={`daily-goal-${goal}`}
                className={`flex-1 rounded-xl border items-center py-2.5 ${dailyGoal === goal ? "bg-lingua-mint border-lingua-teal" : "bg-white border-border"}`}
              >
                <Text className={`font-poppins-medium text-xs ${dailyGoal === goal ? "text-lingua-teal" : "text-text-secondary"}`}>{goal} {goal === 1 ? "session" : "sessions"}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-poppins-semibold text-lg text-text-primary">Study plan</Text>
          <Text className="caption">{language?.name ?? "YOUR COURSE"}</Text>
        </View>
        <TouchableOpacity
          className="flex-row items-center rounded-[20px] border border-border bg-white p-4 mb-3"
          accessibilityRole="button"
          activeOpacity={0.8}
          onPress={() => nextLesson ? router.push(`/lesson/${nextLesson.id}`) : router.navigate("/(tabs)/learn")}
          testID="home-next-lesson"
        >
          <View className="w-12 h-12 rounded-2xl bg-lingua-mint items-center justify-center mr-3">
            <LessonIcon icon={nextLesson?.icon} />
          </View>
          <View className="flex-1">
            <Text className="font-poppins-semibold text-[10px] tracking-[0.7px] text-lingua-teal">{nextLesson ? "UP NEXT" : "YOUR LESSONS"}</Text>
            <Text className="font-poppins-semibold text-sm text-text-primary mt-1">{nextLesson?.title ?? "Revisit your lessons"}</Text>
            <Text className="caption mt-1">{nextLesson ? `${nextLesson.activities.length} questions · ${nextLesson.xpReward} XP` : "Practise a lesson again anytime."}</Text>
          </View>
          <Ionicons name="arrow-forward" size={19} color="#14675D" />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center rounded-[20px] border border-border bg-white p-4 mb-6"
          accessibilityRole="button"
          activeOpacity={0.8}
          onPress={() => router.push("/review")}
          testID="home-review-button"
        >
          <View className="w-12 h-12 rounded-2xl bg-[#F9F4E8] items-center justify-center mr-3">
            <LearningSticker kind="review" size={42} />
          </View>
          <View className="flex-1">
            <Text className="font-poppins-semibold text-sm text-text-primary">Review missed questions</Text>
            <Text className="caption mt-1" testID="home-review-count">
              {reviewCount === 0 ? "No questions saved for this course" : `${reviewCount} ${reviewCount === 1 ? "question" : "questions"} saved for this course`}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={19} color="#14675D" />
        </TouchableOpacity>

        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-poppins-semibold text-lg text-text-primary">Your progress</Text>
          <Text className="caption">SAVED ON DEVICE</Text>
        </View>
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-white border border-border rounded-[20px] p-4">
            <Ionicons name="star-outline" size={20} color="#A66F31" />
            <Text className="font-poppins-semibold text-xl text-text-primary mt-2" testID="home-total-xp">{totalXp} XP</Text>
            <Text className="caption mt-1">Total earned</Text>
          </View>
          <View className="flex-1 bg-white border border-border rounded-[20px] p-4">
            <Ionicons name="checkmark-circle-outline" size={21} color="#14675D" />
            <Text className="font-poppins-semibold text-xl text-text-primary mt-2" testID="home-completed-count">{completedLessonIds.length}</Text>
            <Text className="caption mt-1">Lessons completed</Text>
          </View>
        </View>
        <View className="bg-white border border-border rounded-[20px] p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-poppins-semibold text-sm text-text-primary">Last 7 days</Text>
            <Text className="caption" testID="active-days">{activeDays} active {activeDays === 1 ? "day" : "days"}</Text>
          </View>
          <View className="flex-row justify-between mt-4">
            {week.map((day, index) => (
              <View key={day.key} className="items-center flex-1" accessible accessibilityLabel={`${day.key}: ${day.sessions} ${day.sessions === 1 ? "session" : "sessions"}`}>
                <View className={`w-8 h-8 rounded-full items-center justify-center ${day.sessions ? "bg-lingua-teal" : "bg-[#EDF2EE]"}`}>
                  {day.sessions > 0 && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </View>
                <Text className="caption mt-2">{index === 6 ? "Today" : DAY_LABELS[day.date.getDay()]}</Text>
              </View>
            ))}
          </View>
          <Text className="caption mt-4">Study history starts with this version. Past lessons aren’t assigned dates.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 20, paddingTop: 18, paddingBottom: 36 },
  headerParrot: { width: 48, height: 48 },
  flag: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  courseCat: { width: 75, height: 78 },
});
