import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FeedbackPanel } from "@/components/FeedbackPanel";
import { LearningHydrationScreen } from "@/components/LearningHydrationScreen";
import { MotionSticker } from "@/components/MotionSticker";
import { QuestionInput } from "@/components/QuestionInput";
import { RewardAlbum } from "@/components/RewardAlbum";
import { SoundEffectsControl } from "@/components/SoundEffectsControl";
import { images } from "@/constants/images";
import { getCourseUnits } from "@/data/courses";
import { LANGUAGES } from "@/data/languages";
import { useLearningHydration } from "@/hooks/useLearningHydration";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { isCorrectAnswer } from "@/lib/practice";
import { getMixPool, getRewardBadges, makeQuickMix, MIX_QUESTION_LIMIT, type MixQuestion } from "@/lib/quickMix";
import { useLanguageStore } from "@/store/languageStore";
import { useLearningStore } from "@/store/learningStore";
import { retryPlaySave, usePlayHydrationStatus, usePlaySaveStatus, usePlayStore } from "@/store/playStore";

type Phase = "intro" | "playing" | "finished";
type Feedback = "correct" | "incorrect" | null;

export default function PlayScreen() {
  const router = useRouter();
  const learningHydration = useLearningHydration();
  const sounds = useSoundEffects();
  const playHydration = usePlayHydrationStatus((state) => state.status);
  const saveStatus = usePlaySaveStatus((state) => state.status);
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  const { completedLessonIds, activityByDate } = useLearningStore();
  const { roundsCompleted, perfectRounds, completeMix } = usePlayStore();
  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<MixQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [roundCourse, setRoundCourse] = useState("");
  const [previousBadges, setPreviousBadges] = useState<string[]>([]);
  const checked = useRef(false);
  const finished = useRef(false);

  const language = LANGUAGES.find((item) => item.code === selectedLanguage);
  const lessons = language ? getCourseUnits(language.code).flatMap((unit) => unit.lessons) : [];
  const pool = getMixPool(lessons, completedLessonIds);
  const courses = LANGUAGES.map((item) => getCourseUnits(item.code).flatMap((unit) => unit.lessons));
  const badges = getRewardBadges(courses, completedLessonIds, activityByDate, { roundsCompleted, perfectRounds });
  const newBadges = badges.filter((badge) => badge.unlocked && !previousBadges.includes(badge.id));
  const question = questions[questionIndex];
  const questionCount = Math.min(pool.questions.length, MIX_QUESTION_LIMIT);
  const completedQuestions = questionIndex + (feedback ? 1 : 0);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };
  const start = () => {
    const next = makeQuickMix(pool.questions);
    if (!next.length || !language) return;
    setPreviousBadges(badges.filter((badge) => badge.unlocked).map((badge) => badge.id));
    setRoundCourse(language.name);
    setQuestions(next);
    setQuestionIndex(0);
    setAnswer("");
    setFeedback(null);
    setCorrectCount(0);
    checked.current = false;
    finished.current = false;
    setPhase("playing");
  };
  const check = () => {
    if (!question || !answer || checked.current) return;
    checked.current = true;
    if (isCorrectAnswer(answer, question.activity.correctAnswer)) {
      setCorrectCount((value) => value + 1);
      setFeedback("correct");
      sounds.correct();
    } else {
      setFeedback("incorrect");
    }
  };
  const advance = () => {
    if (!checked.current || finished.current) return;
    if (questionIndex + 1 < questions.length) {
      checked.current = false;
      setQuestionIndex((value) => value + 1);
      setAnswer("");
      setFeedback(null);
      return;
    }
    finished.current = true;
    completeMix(correctCount, questions.length);
    setPhase("finished");
    sounds.celebrate();
  };

  if (learningHydration !== "ready") return <LearningHydrationScreen status={learningHydration} />;
  if (playHydration !== "ready") return <LearningHydrationScreen status={playHydration} storage="play" onBack={goBack} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FBF8F1" }}>
      <View className="w-full max-w-[720px] self-center flex-row items-center px-5 py-3 border-b border-border">
        <TouchableOpacity onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back" className="w-11 h-11 justify-center">
          <Ionicons name="chevron-back" size={24} color="#183B37" />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-poppins-semibold text-base text-text-primary">{phase === "playing" ? "Quick Mix" : "Play & collect"}</Text>
        <SoundEffectsControl compact />
      </View>
      <ScrollView key={phase === "playing" ? `${phase}-${questionIndex}` : phase} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {saveStatus === "error" && phase !== "playing" && (
          <View className="rounded-2xl bg-[#FFF1E8] p-4 mb-4" accessibilityLiveRegion="polite" testID="play-save-error">
            <Text className="font-poppins-semibold text-sm text-text-primary">Your latest mix could not be saved yet.</Text>
            <Text className="body-sm text-text-secondary mt-1">Keep the app open and try saving again.</Text>
            <TouchableOpacity onPress={retryPlaySave} className="border border-lingua-teal rounded-xl items-center py-3 mt-3" accessibilityRole="button" testID="retry-play-save">
              <Text className="font-poppins-semibold text-sm text-lingua-teal">Retry saving</Text>
            </TouchableOpacity>
          </View>
        )}
        {phase === "intro" && (
          <>
            <View className="rounded-[24px] bg-[#FAE8BD] p-5">
              <Text className="font-poppins-semibold text-[10px] tracking-[1px] text-lingua-teal">A LITTLE PLAY, A LOT OF LEARNING</Text>
              <View className="flex-row items-center mt-2">
                <View className="flex-1 pr-2">
                  <Text className="h2">Quick Mix</Text>
                  <Text className="body-sm text-text-secondary mt-1">A tiny quiz with your language-learning friends.</Text>
                </View>
                <Image source={images.mascotParrot} style={styles.parrot} resizeMode="contain" accessible={false} />
              </View>
              <View className="flex-row flex-wrap gap-2 mt-3">
                <Text className="font-poppins-semibold text-xs text-lingua-deep-teal bg-white/70 rounded-full px-3 py-2">UP TO 3 QUESTIONS</Text>
                <Text className="font-poppins-semibold text-xs text-lingua-deep-teal bg-white/70 rounded-full px-3 py-2">NO TIMER</Text>
              </View>
              <Text className="body-sm text-text-secondary mt-4" testID="mix-source">
                {!language ? "Choose a course to start playing." : questionCount === 0
                  ? "There are no Quick Mix questions in this course yet."
                  : pool.preview
                    ? `Try a preview from your first ${language.name} lesson. Finished lessons add more questions.`
                    : `Mix questions from your completed ${language.name} lessons.`}
              </Text>
              <Text className="caption mt-2">Round stars are just for fun: no extra XP, daily sessions or changes to your review list.</Text>
              <Text className="caption mt-2">Use the speaker above to turn feedback sounds on or off.</Text>
              {questionCount > 0 && language ? (
                <TouchableOpacity onPress={start} className="bg-lingua-teal rounded-2xl items-center py-4 mt-4" accessibilityRole="button" testID="start-mix-button">
                  <Text className="font-poppins-semibold text-base text-white">Play {questionCount}-question mix</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => router.push("/language-select")} className="bg-lingua-teal rounded-2xl items-center py-4 mt-4" accessibilityRole="button" testID="mix-choose-course">
                  <Text className="font-poppins-semibold text-base text-white">Choose a course</Text>
                </TouchableOpacity>
              )}
            </View>
            <RewardAlbum badges={badges} />
          </>
        )}

        {phase === "playing" && question && (
          <>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="font-poppins-semibold text-[10px] tracking-[1px] text-lingua-teal">QUESTION {questionIndex + 1} OF {questions.length}</Text>
              <View className="flex-row items-center" accessible accessibilityLabel={`${correctCount} of ${questions.length} round stars`}>
                <Ionicons name="star" size={18} color="#A66A20" />
                <Text className="font-poppins-semibold text-sm text-text-primary ml-1">{correctCount} / {questions.length}</Text>
              </View>
            </View>
            <View className="h-2 bg-surface rounded-full overflow-hidden mb-5" accessibilityRole="progressbar" accessibilityLabel="Quick Mix progress" accessibilityValue={{ min: 0, max: questions.length, now: completedQuestions }} aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={completedQuestions}>
              <View className="h-2 bg-lingua-teal rounded-full" style={{ width: `${Math.round((completedQuestions / questions.length) * 100)}%` }} />
            </View>
            <Text className="caption mb-2">{roundCourse} · {question.lessonTitle}</Text>
            <Text className="font-poppins-semibold text-xl text-text-primary mb-2" testID="mix-question">{question.activity.question}</Text>
            <Text className="body-sm text-text-secondary mb-5">Choose one answer. Take your time.</Text>
            <QuestionInput activity={question.activity} answer={answer} disabled={feedback !== null} onChange={setAnswer} onSubmit={check} />
            {feedback && (
              <FeedbackPanel kind={feedback} testID="mix-feedback">
                <Text className="font-poppins-semibold text-sm text-text-primary">{feedback === "correct" ? "Lovely work! You found it." : "Good try! Here is the answer."}</Text>
                {feedback === "incorrect" && <Text className="body-sm text-text-secondary mt-1">Answer: {question.activity.correctAnswer}</Text>}
                {question.activity.explanation && <Text className="body-sm text-text-secondary mt-1">{question.activity.explanation}</Text>}
              </FeedbackPanel>
            )}
            {feedback ? (
              <TouchableOpacity onPress={advance} className="bg-lingua-teal rounded-2xl items-center py-4 mt-6" accessibilityRole="button" testID={questionIndex + 1 === questions.length ? "finish-mix-button" : "next-mix-button"}>
                <Text className="font-poppins-semibold text-base text-white">{questionIndex + 1 === questions.length ? "Finish mix" : "Next question"}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={check} disabled={!answer} className={`rounded-2xl items-center py-4 mt-6 ${answer ? "bg-lingua-teal" : "bg-[#9EBDB5]"}`} accessibilityRole="button" accessibilityState={{ disabled: !answer }} testID="check-mix-button">
                <Text className="font-poppins-semibold text-base text-white">Check answer</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {phase === "finished" && (
          <>
            <View className="items-center pt-5">
              <MotionSticker kind="medal" size={100} testID="mix-finish-sticker" />
              <Text className="h2 text-center mt-4">{correctCount === questions.length ? "A brilliant mix!" : "Nice exploring!"}</Text>
              <Text className="font-poppins-semibold text-lg text-text-primary text-center mt-2" testID="mix-result">{correctCount} / {questions.length} round stars</Text>
              <Text className="body-sm text-text-secondary text-center mt-2">Each correct answer earns a star for this round. Every try is practice.</Text>
              {saveStatus !== "error" && (
                <Text className="caption text-center mt-2" accessibilityLiveRegion="polite" testID="play-save-status">
                  {saveStatus === "saving" ? "Saving your stickers…" : saveStatus === "saved"
                    ? "Play rewards saved on this device." : "Play rewards stay on this device."}
                </Text>
              )}
              {newBadges.length > 0 && (
                <View className="bg-[#FAE8BD] rounded-2xl p-4 mt-5 w-full" accessibilityLiveRegion="polite" testID="mix-new-rewards">
                  <Text className="font-poppins-semibold text-sm text-text-primary">New {newBadges.length === 1 ? "sticker" : "stickers"} for your book!</Text>
                  <Text className="body-sm text-text-secondary mt-1">{newBadges.map((badge) => badge.title).join(" · ")}</Text>
                </View>
              )}
              <TouchableOpacity onPress={start} className="bg-lingua-teal rounded-2xl items-center py-4 mt-6 w-full" accessibilityRole="button" testID="play-mix-again">
                <Text className="font-poppins-semibold text-base text-white">Play another mix</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={goBack} className="border border-lingua-teal rounded-2xl items-center py-4 mt-3 w-full" accessibilityRole="button" testID="mix-done-button">
                <Text className="font-poppins-semibold text-base text-lingua-teal">Done</Text>
              </TouchableOpacity>
            </View>
            <RewardAlbum badges={badges} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, flexGrow: 1 },
  parrot: { width: 88, height: 92 },
});
