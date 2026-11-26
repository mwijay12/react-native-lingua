import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
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
import { MotionSticker } from "@/components/MotionSticker";
import { QuestionInput } from "@/components/QuestionInput";
import { SoundEffectsControl } from "@/components/SoundEffectsControl";
import { getCourseUnits } from "@/data/courses";
import { isAvailableLanguage, LANGUAGES } from "@/data/languages";
import { useLearningHydration } from "@/hooks/useLearningHydration";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { isCorrectAnswer } from "@/lib/practice";
import { getReviewQuestions, type ReviewQuestion } from "@/lib/studyProgress";
import { useLanguageStore } from "@/store/languageStore";
import { useLearningSaveStatus, useLearningStore } from "@/store/learningStore";

type Phase = "intro" | "practice" | "finished";
type Feedback = "correct" | "incorrect" | null;
const REVIEW_LIMIT = 10;

// Review is a separate pass: one attempt per question, no additional XP.
export default function ReviewScreen() {
  const router = useRouter();
  const { course } = useLocalSearchParams<{ course?: string }>();
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  // A lesson reached through a link can belong to a different course. Its
  // review action should show that lesson's mistakes without switching courses.
  const reviewLanguage = isAvailableLanguage(course) ? course : selectedLanguage;
  const { reviewItems, clearReviewQuestion, completeReview } = useLearningStore();
  const saveStatus = useLearningSaveStatus((state) => state.status);
  const hydration = useLearningHydration();
  const sounds = useSoundEffects();
  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const checked = useRef(false);
  const finished = useRef(false);

  const lessons = getCourseUnits(reviewLanguage).flatMap((unit) => unit.lessons);
  const availableQuestions = getReviewQuestions(reviewItems, lessons);
  const language = LANGUAGES.find((item) => item.code === reviewLanguage);
  const question = questions[questionIndex];

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };
  const start = () => {
    if (!availableQuestions.length) return;
    setQuestions(availableQuestions.slice(0, REVIEW_LIMIT));
    setPhase("practice");
  };
  const checkAnswer = () => {
    if (!question || !answer.trim() || checked.current) return;
    checked.current = true;
    if (isCorrectAnswer(answer, question.activity.correctAnswer)) {
      clearReviewQuestion(question.lesson.id, question.activity.id);
      setCorrectCount((count) => count + 1);
      setFeedback("correct");
      sounds.correct();
    } else {
      setFeedback("incorrect");
      sounds.wrong();
    }
  };
  const advance = () => {
    if (!checked.current || finished.current) return;
    if (questionIndex + 1 < questions.length) {
      checked.current = false;
      setQuestionIndex((index) => index + 1);
      setAnswer("");
      setFeedback(null);
      return;
    }
    finished.current = true;
    completeReview();
    setPhase("finished");
    sounds.celebrate();
  };

  if (hydration !== "ready") return <LearningHydrationScreen status={hydration} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FBF8F1" }}>
      <View className="w-full max-w-[720px] self-center flex-row items-center px-5 py-3 border-b border-border">
        <TouchableOpacity onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back" className="w-11 h-11 justify-center">
          <Ionicons name="chevron-back" size={24} color="#183B37" />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-poppins-semibold text-base text-text-primary">
          {phase === "practice" ? "Review practice" : "Review"}
        </Text>
        <SoundEffectsControl compact />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          key={phase === "practice" ? `${phase}-${questionIndex}` : phase}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {phase === "intro" && (
            <>
              <Text className="font-poppins-semibold text-[10px] tracking-[1px] text-lingua-teal">FOCUSED PRACTICE · {language?.name.toUpperCase() ?? "NO COURSE"}</Text>
              <View className="flex-row items-center mt-2">
                <View className="flex-1 pr-2">
                  <Text className="h2">Review your mistakes</Text>
                  <Text className="body-md text-text-secondary mt-2">
                    Return to questions you missed in this course. Review is local to this device.
                  </Text>
                </View>
                <MotionSticker kind="review" size={70} testID="review-sticker" />
              </View>
              <View className="rounded-[22px] bg-white border border-border p-5 mt-6">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-2xl bg-lingua-mint items-center justify-center mr-3">
                    <Ionicons name="refresh-outline" size={23} color="#14675D" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-poppins-semibold text-lg text-text-primary" testID="review-count">
                      {availableQuestions.length} {availableQuestions.length === 1 ? "question" : "questions"} {saveStatus === "saved" ? "saved" : "in review"}
                    </Text>
                    <Text className="body-sm text-text-secondary">{language?.name ?? "Selected course"}</Text>
                  </View>
                </View>
                <View className="h-px bg-border my-4" />
                <Text className="font-poppins-semibold text-sm text-text-primary">How review works</Text>
                <Text className="body-sm text-text-secondary mt-2">
                  Practise up to {REVIEW_LIMIT} questions at a time. A correct answer removes a question; a missed one stays for another review.
                </Text>
                <Text className="body-sm text-text-secondary mt-2">
                  Finish a set to count it toward your daily goal. Review does not award extra XP.
                </Text>
              </View>
              {availableQuestions.length > 0 ? (
                <>
                  <Text className="font-poppins-semibold text-base text-text-primary mt-6 mb-2">From your lessons</Text>
                  {[...new Map(availableQuestions.map(({ lesson }) => [lesson.id, lesson])).values()].map((lesson) => (
                    <View key={lesson.id} className="flex-row items-center py-3 border-b border-border">
                      <Ionicons name="book-outline" size={18} color="#60736C" />
                      <Text className="font-poppins-medium text-sm text-text-primary flex-1 ml-3">{lesson.title}</Text>
                      <Text className="caption">{availableQuestions.filter((item) => item.lesson.id === lesson.id).length} {saveStatus === "saved" ? "saved" : "in review"}</Text>
                    </View>
                  ))}
                  <TouchableOpacity onPress={start} className="bg-lingua-teal rounded-2xl items-center py-4 mt-6" accessibilityRole="button" testID="start-review-button">
                    <Text className="font-poppins-semibold text-base text-white">Start review</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View className="rounded-2xl bg-lingua-mint p-4 mt-5">
                  <Text className="font-poppins-semibold text-sm text-text-primary">Nothing to review yet</Text>
                  <Text className="body-sm text-text-secondary mt-1">Missed lesson questions appear here, even if you finish the lesson after retrying.</Text>
                  <TouchableOpacity onPress={() => router.replace("/(tabs)/learn")} className="self-start mt-3 py-2" accessibilityRole="button" testID="review-open-lessons">
                    <Text className="font-poppins-semibold text-sm text-lingua-teal">Open lessons →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {phase === "practice" && question && (
            <>
              <Text className="font-poppins-semibold text-[10px] tracking-[1px] text-lingua-teal mb-2">
                QUESTION {questionIndex + 1} OF {questions.length} · {question.lesson.title.toUpperCase()}
              </Text>
              <View className="h-2 bg-surface rounded-full overflow-hidden mb-6" accessibilityRole="progressbar" accessibilityLabel="Review question progress" accessibilityValue={{ min: 0, max: questions.length, now: questionIndex }}>
                <View className="h-2 bg-lingua-teal rounded-full" style={{ width: `${Math.round((questionIndex / questions.length) * 100)}%` }} />
              </View>
              <Text className="font-poppins-semibold text-xl text-text-primary mb-2">{question.activity.question}</Text>
              <Text className="body-sm text-text-secondary mb-5">
                {question.activity.type === "multiple-choice" ? "Choose one answer." : "Type your answer below."}
              </Text>
              <QuestionInput activity={question.activity} answer={answer} disabled={feedback !== null} onChange={setAnswer} onSelectOption={sounds.option} onSubmit={checkAnswer} />
              {question.activity.hint && !feedback && <Text className="body-sm text-text-secondary mt-4">Hint: {question.activity.hint}</Text>}
              {feedback && (
                <FeedbackPanel kind={feedback} testID="review-feedback">
                  <Text className="font-poppins-semibold text-sm text-text-primary">
                    {feedback === "correct" ? "Correct! Removed from review." : "Not quite. This stays in review."}
                  </Text>
                  {feedback === "incorrect" && <Text className="body-sm text-text-secondary mt-1">Answer: {question.activity.correctAnswer}</Text>}
                  {question.activity.explanation && <Text className="body-sm text-text-secondary mt-1">{question.activity.explanation}</Text>}
                </FeedbackPanel>
              )}
              {feedback ? (
                <TouchableOpacity onPress={advance} className="bg-lingua-teal rounded-2xl items-center py-4 mt-6" accessibilityRole="button" testID={questionIndex + 1 === questions.length ? "finish-review-button" : "next-review-question-button"}>
                  <Text className="font-poppins-semibold text-base text-white">{questionIndex + 1 === questions.length ? "Finish review" : "Next question"}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={checkAnswer} disabled={!answer.trim()} className={`rounded-2xl items-center py-4 mt-6 ${answer.trim() ? "bg-lingua-teal" : "bg-[#9EBDB5]"}`} accessibilityRole="button" accessibilityState={{ disabled: !answer.trim() }} testID="check-review-answer-button">
                  <Text className="font-poppins-semibold text-base text-white">Check answer</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {phase === "finished" && (
            <View className="items-center py-12">
              <View className="mb-5">
                <MotionSticker kind="medal" size={104} testID="review-complete-sticker" />
              </View>
              <Text className="h2 text-center">Review complete</Text>
              <Text className="body-md text-text-secondary text-center mt-3" testID="review-result">
                {correctCount} of {questions.length} answered correctly and removed.
              </Text>
              <Text className="body-sm text-text-secondary text-center mt-2">
                {availableQuestions.length} {availableQuestions.length === 1 ? "question remains" : "questions remain"} in this course. This session counts toward today’s goal.
              </Text>
              <LearningSaveMessage className="text-center mt-2" testID="review-save-status" />
              <TouchableOpacity onPress={goBack} className="bg-lingua-teal rounded-2xl items-center py-4 px-8 mt-7" accessibilityRole="button" testID="review-done-button">
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
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40, flexGrow: 1 },
});
