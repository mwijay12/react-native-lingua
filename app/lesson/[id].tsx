import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LessonIcon } from "@/components/LessonIcon";
import { MotionSticker } from "@/components/MotionSticker";
import { QuestionInput } from "@/components/QuestionInput";
import { images } from "@/constants/images";
import { LESSONS } from "@/data/lessons";
import { useLearningHydrated } from "@/hooks/useLearningHydrated";
import { isCorrectAnswer } from "@/lib/practice";
import { useLearningStore } from "@/store/learningStore";

type Phase = "review" | "practice" | "finished";
type Feedback = "correct" | "incorrect" | null;

// Lessons are local text practice. They never start a microphone or AI session.
export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const lesson = LESSONS.find((item) => item.id === id);
  const { completeLesson, addMistake, reviewItems } = useLearningStore();
  const hydrated = useLearningHydrated();
  const [phase, setPhase] = useState<Phase>("review");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [attempts, setAttempts] = useState(0);
  const [earnedXp, setEarnedXp] = useState(false);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const answeredCorrectly = useRef(false);
  const finished = useRef(false);

  useEffect(() => {
    setPhase("review");
    setQuestionIndex(0);
    setAnswer("");
    setFeedback(null);
    setAttempts(0);
    setEarnedXp(false);
    setFirstTryCorrect(0);
    answeredCorrectly.current = false;
    finished.current = false;
  }, [id]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/learn");
  };

  if (!hydrated) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#14675D" /></View>;
  }

  if (!lesson) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FBF8F1" }}>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="h3 text-center">Lesson not found</Text>
          <TouchableOpacity onPress={goBack} className="bg-lingua-teal rounded-xl px-5 py-3 mt-5" accessibilityRole="button">
            <Text className="font-poppins-semibold text-white">Back to lessons</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const activity = lesson.activities[questionIndex];
  const updateAnswer = (value: string) => {
    setAnswer(value);
    if (feedback === "incorrect") setFeedback(null);
  };
  const checkAnswer = () => {
    if (!activity || !answer.trim() || answeredCorrectly.current) return;
    if (isCorrectAnswer(answer, activity.correctAnswer)) {
      answeredCorrectly.current = true;
      if (attempts === 0) setFirstTryCorrect((count) => count + 1);
      setFeedback("correct");
    } else {
      addMistake(lesson.id, activity.id);
      setAttempts((count) => count + 1);
      setFeedback("incorrect");
    }
  };
  const advance = () => {
    if (!answeredCorrectly.current || finished.current) return;
    if (questionIndex + 1 < lesson.activities.length) {
      answeredCorrectly.current = false;
      setQuestionIndex((index) => index + 1);
      setAnswer("");
      setFeedback(null);
      setAttempts(0);
      return;
    }
    finished.current = true;
    const alreadyCompleted = useLearningStore.getState().completedLessonIds.includes(lesson.id);
    completeLesson(lesson.id);
    setEarnedXp(!alreadyCompleted);
    setPhase("finished");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FBF8F1" }}>
      <View className="w-full max-w-[720px] self-center flex-row items-center px-5 py-3 border-b border-border">
        <TouchableOpacity onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color="#183B37" />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-poppins-semibold text-base text-text-primary" numberOfLines={1}>
          {phase === "practice" ? "Practice" : phase === "finished" ? "Well done!" : "Lesson"}
        </Text>
        <View style={{ width: 24 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          key={phase === "practice" ? `${phase}-${questionIndex}` : phase}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {phase === "review" && (
            <>
              <View className="flex-row items-center mb-3">
                <View className="w-14 h-14 rounded-2xl bg-[#E5F3ED] items-center justify-center mr-3">
                  <LessonIcon icon={lesson.icon} size={50} />
                </View>
                <View className="flex-1">
                  <Text className="font-poppins-semibold text-xl text-text-primary">{lesson.title}</Text>
                  <Text className="caption mt-1">{lesson.activities.length} questions · {lesson.xpReward} XP</Text>
                </View>
              </View>
              <Text className="body-sm text-text-secondary mb-5">{lesson.description}</Text>
              <View className="rounded-2xl bg-[#E5F3ED] p-4 mb-5">
                <Text className="font-poppins-semibold text-sm text-text-primary">How to use this lesson</Text>
                <Text className="body-sm text-text-secondary mt-1">
                  Read the key ideas, words and phrases, then answer the questions. Pronunciations are approximate guides.
                </Text>
              </View>
              {!!lesson.notes?.length && (
                <View className="mb-6" testID="lesson-notes">
                  <Text className="font-poppins-semibold text-[10px] tracking-[1px] text-lingua-teal mb-2">UNDERSTAND THE IDEA</Text>
                  {lesson.notes.map((note) => (
                    <View key={note.title} className="bg-white border border-border rounded-2xl p-4 mb-2">
                      <Text className="font-poppins-semibold text-base text-text-primary">{note.title}</Text>
                      <Text className="body-sm text-text-secondary mt-2">{note.body}</Text>
                      {note.example && <Text className="font-poppins-medium text-sm text-lingua-teal mt-3">{note.example}</Text>}
                    </View>
                  ))}
                </View>
              )}
              <Text className="font-poppins-semibold text-lg text-text-primary mb-2">Words to learn</Text>
              {lesson.vocabulary.map((item) => (
                <View key={item.word} className="border-b border-border py-3">
                  <Text className="font-poppins-semibold text-base text-text-primary">
                    {item.word}
                  </Text>
                  <Text className="body-sm text-text-secondary mt-1">{item.translation}</Text>
                  <Text className="caption mt-1">Say it: {item.pronunciation}</Text>
                </View>
              ))}
              {lesson.phrases.length > 0 && (
                <>
                  <Text className="font-poppins-semibold text-lg text-text-primary mt-6 mb-2">Useful phrases</Text>
                  {lesson.phrases.map((phrase) => (
                    <View key={phrase.text} className="bg-surface rounded-2xl p-4 mt-2">
                      <Text className="font-poppins-semibold text-sm text-text-primary">{phrase.text}</Text>
                      <Text className="body-sm text-text-secondary mt-1">{phrase.translation}</Text>
                      <Text className="caption mt-1">Say it: {phrase.pronunciation}</Text>
                    </View>
                  ))}
                </>
              )}
              {lesson.activities.length > 0 ? (
                <TouchableOpacity onPress={() => setPhase("practice")} className="bg-lingua-teal rounded-2xl items-center py-4 mt-6" accessibilityRole="button" testID="start-practice-button">
                  <Text className="font-poppins-semibold text-base text-white">Start practice</Text>
                </TouchableOpacity>
              ) : (
                <Text className="body-sm text-text-secondary mt-6">Practice questions are not available for this lesson yet.</Text>
              )}
            </>
          )}

          {phase === "practice" && activity && (
            <>
              <Text className="caption mb-2">QUESTION {questionIndex + 1} OF {lesson.activities.length}</Text>
              <View className="h-2 bg-surface rounded-full overflow-hidden mb-6" accessibilityRole="progressbar" accessibilityLabel="Lesson question progress" accessibilityValue={{ min: 0, max: lesson.activities.length, now: questionIndex }}>
                <View className="h-2 bg-lingua-teal rounded-full" style={{ width: `${Math.round((questionIndex / lesson.activities.length) * 100)}%` }} />
              </View>
              <Text className="font-poppins-semibold text-xl text-text-primary mb-2">{activity.question}</Text>
              <Text className="body-sm text-text-secondary mb-5">
                {activity.type === "multiple-choice" ? "Choose one answer." : "Type your answer below."}
              </Text>
              <QuestionInput
                activity={activity}
                answer={answer}
                disabled={feedback === "correct"}
                onChange={updateAnswer}
                onSubmit={checkAnswer}
              />
              {activity.hint && feedback !== "correct" && (
                <Text className="body-sm text-text-secondary mt-4">Hint: {activity.hint}</Text>
              )}
              {feedback && (
                <View className={`rounded-2xl p-4 mt-4 ${feedback === "correct" ? "bg-[#EDF8F1]" : "bg-[#FFF1F0]"}`} accessibilityLiveRegion="polite" testID="answer-feedback">
                  <Text className="font-poppins-semibold text-sm text-text-primary">
                    {feedback === "correct" ? "Correct!" : "Not quite. Try again."}
                  </Text>
                  {feedback === "incorrect" && (
                    <Text className="body-sm text-text-secondary mt-1">Saved for a separate review, even after you retry.</Text>
                  )}
                  {feedback === "incorrect" && attempts >= 2 && (
                    <Text className="body-sm text-text-secondary mt-1">Answer: {activity.correctAnswer}</Text>
                  )}
                  {feedback === "correct" && activity.explanation && (
                    <Text className="body-sm text-text-secondary mt-1">{activity.explanation}</Text>
                  )}
                </View>
              )}
              {feedback === "correct" ? (
                <TouchableOpacity onPress={advance} className="bg-lingua-teal rounded-2xl items-center py-4 mt-6" accessibilityRole="button" testID={questionIndex + 1 === lesson.activities.length ? "finish-lesson-button" : "next-question-button"}>
                  <Text className="font-poppins-semibold text-base text-white">
                    {questionIndex + 1 === lesson.activities.length ? "Finish lesson" : "Next question"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={checkAnswer} disabled={!answer.trim()} className={`rounded-2xl items-center py-4 mt-6 ${answer.trim() ? "bg-lingua-teal" : "bg-[#9EBDB5]"}`} accessibilityRole="button" accessibilityState={{ disabled: !answer.trim() }} testID="check-answer-button">
                  <Text className="font-poppins-semibold text-base text-white">Check answer</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {phase === "finished" && (
            <View className="items-center py-8">
              <View className="flex-row items-end mb-5">
                <View className="w-32 h-32 rounded-full bg-lingua-sand items-center justify-center">
                  <Image source={images.mascotCat} style={styles.finishCat} resizeMode="contain" accessible={false} />
                </View>
                <View className="-ml-3">
                  <MotionSticker kind="medal" size={72} testID="lesson-complete-sticker" />
                </View>
              </View>
              <Text className="h2 text-center">Lesson complete!</Text>
              <Text className="body-md text-text-secondary text-center mt-3" testID="lesson-result">
                {earnedXp ? `You earned ${lesson.xpReward} XP.` : "You have already earned XP for this lesson. Keep practising!"}
              </Text>
              <Text className="body-sm text-text-secondary text-center mt-2" testID="lesson-first-try">
                {firstTryCorrect} of {lesson.activities.length} correct on the first try.
              </Text>
              <Text className="body-sm text-text-secondary text-center mt-2">Your progress is saved on this device.</Text>
              {reviewItems.some((item) => item.lessonId === lesson.id) && (
                <TouchableOpacity onPress={() => router.replace("/review")} className="border border-lingua-teal rounded-2xl items-center py-3 px-6 mt-5" accessibilityRole="button" testID="lesson-review-button">
                  <Text className="font-poppins-semibold text-sm text-lingua-teal">Review missed questions</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={goBack} className="bg-lingua-teal rounded-2xl items-center py-4 px-8 mt-7" accessibilityRole="button" testID="lesson-done-button">
                <Text className="font-poppins-semibold text-base text-white">Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FBF8F1" },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, flexGrow: 1 },
  finishCat: { width: 105, height: 120 },

});
