import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
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

import { FeedbackPanel } from "@/components/FeedbackPanel";
import { LearningHydrationScreen } from "@/components/LearningHydrationScreen";
import { LearningSaveMessage } from "@/components/LearningSaveMessage";
import { LessonIcon } from "@/components/LessonIcon";
import { MotionPressable } from "@/components/MotionPressable";
import { MotionSticker } from "@/components/MotionSticker";
import { PronunciationSample } from "@/components/PronunciationSample";
import { QuestionInput } from "@/components/QuestionInput";
import { SoundEffectsControl } from "@/components/SoundEffectsControl";
import { pronunciationSamples } from "@/constants/audio";
import { images, unitScenes } from "@/constants/images";
import { isAvailableLanguage } from "@/data/languages";
import { LESSONS } from "@/data/lessons";
import { UNITS } from "@/data/units";
import { useLearningHydration } from "@/hooks/useLearningHydration";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { isCorrectAnswer } from "@/lib/practice";
import { useLearningStore } from "@/store/learningStore";

type Phase = "review" | "practice" | "finished";
type Feedback = "correct" | "incorrect" | null;

// Lessons use local practice and selected recordings, never a microphone or AI session.
export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const lesson = LESSONS.find((item) => item.id === id);
  const { completeLesson, addMistake, reviewItems } = useLearningStore();
  const hydration = useLearningHydration();
  const sounds = useSoundEffects();
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

  if (hydration !== "ready") return <LearningHydrationScreen status={hydration} />;

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

  const unit = UNITS.find((item) => item.id === lesson.unitId);
  const lessonCourse = unit?.languageCode;
  const sample = pronunciationSamples[lesson.id];
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
      sounds.correct();
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
    sounds.celebrate();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FBF8F1" }}>
      <View className="w-full max-w-[720px] self-center flex-row items-center px-5 py-3 border-b border-border">
        <TouchableOpacity onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back" className="w-11 h-11 justify-center">
          <Ionicons name="chevron-back" size={24} color="#183B37" />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-poppins-semibold text-base text-text-primary" numberOfLines={1}>
          {phase === "practice" ? "Practice" : phase === "finished" ? "Well done!" : "Lesson"}
        </Text>
        <SoundEffectsControl compact />
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
              {unit && (
                <View className="rounded-[22px] overflow-hidden mb-5" testID="lesson-scene">
                  <Image source={unitScenes[(unit.order - 1) % unitScenes.length]} style={styles.lessonScene} resizeMode="cover" accessible={false} />
                </View>
              )}
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
              {sample && <PronunciationSample sample={sample} />}
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
                <MotionPressable onPress={() => setPhase("practice")} className="bg-lingua-teal rounded-2xl items-center px-4 py-4 mt-6" accessibilityRole="button" testID="start-practice-button">
                  <Text className="font-poppins-semibold text-base text-white text-center shrink">Start practice</Text>
                </MotionPressable>
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
                <FeedbackPanel kind={feedback} testID="answer-feedback">
                  <Text className="font-poppins-semibold text-sm text-text-primary">
                    {feedback === "correct" ? "Correct!" : "Not quite. Try again."}
                  </Text>
                  {feedback === "incorrect" && (
                    <Text className="body-sm text-text-secondary mt-1">Added for a separate review, even after you retry.</Text>
                  )}
                  {feedback === "incorrect" && attempts >= 2 && (
                    <Text className="body-sm text-text-secondary mt-1">Answer: {activity.correctAnswer}</Text>
                  )}
                  {feedback === "correct" && activity.explanation && (
                    <Text className="body-sm text-text-secondary mt-1">{activity.explanation}</Text>
                  )}
                </FeedbackPanel>
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
              <LearningSaveMessage className="text-center mt-2" testID="lesson-save-status" />
              {reviewItems.some((item) => item.lessonId === lesson.id) && (
                <TouchableOpacity
                  onPress={() => isAvailableLanguage(lessonCourse)
                    ? router.replace({ pathname: "/review", params: { course: lessonCourse } })
                    : router.replace("/review")}
                  className="border border-lingua-teal rounded-2xl items-center py-3 px-6 mt-5"
                  accessibilityRole="button"
                  testID="lesson-review-button"
                >
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
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, flexGrow: 1 },
  lessonScene: { width: "100%", aspectRatio: 2.4, maxHeight: 160 },
  finishCat: { width: 105, height: 120 },
});
