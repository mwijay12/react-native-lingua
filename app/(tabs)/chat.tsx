import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MotionSticker } from "@/components/MotionSticker";
import { images } from "@/constants/images";
import { LANGUAGES } from "@/data/languages";
import { useChatConversation } from "@/hooks/useChatConversation";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";
import { CHAT_MESSAGE_LIMIT } from "@/lib/chatClient";
import { useLanguageStore } from "@/store/languageStore";
import type { LanguageCode } from "@/types/learning";

const STARTERS: Partial<Record<LanguageCode, string[]>> = {
  sw: ["Teach me a Kiswahili greeting", "Help me introduce myself", "Practise a short conversation"],
  en: ["Teach me an English greeting", "Help me introduce myself", "Practise a short conversation"],
  fr: ["Teach me a French greeting", "Help me introduce myself", "Practise a short conversation"],
};

export default function ChatScreen() {
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  const language = LANGUAGES.find((item) => item.code === selectedLanguage);
  const chat = useChatConversation(language?.code ?? null);
  const keyboardVisible = useKeyboardVisible();
  const { height } = useWindowDimensions();
  const compact = keyboardVisible || height < 440;
  const [confirmAction, setConfirmAction] = useState<"clear" | "course" | null>(null);
  const scroll = useRef<ScrollView>(null);
  const hasContent = chat.messages.length > 0 || chat.draft.length > 0;
  const canSend = !!chat.draft.trim() && !chat.sending;

  const changeCourse = () => {
    Keyboard.dismiss();
    if (hasContent) setConfirmAction("course");
    else router.push("/language-select");
  };

  return (
    // Mark this view for PostHog exclusion in addition to route-level safeguards.
    <View
      style={styles.root}
      {...{ "ph-no-capture": true }}
      accessibilityLabel="ph-no-capture"
      importantForAccessibility="no"
      accessible={false}
      collapsable={false}
    >
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* Edge-to-edge Android can draw beneath the keyboard without resizing. */}
        <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "web" ? undefined : "padding"}>
          <View className="w-full max-w-[720px] self-center flex-1">
            <View className={`px-5 ${compact ? "pt-2 pb-2" : "pt-4 pb-3"}`}>
              {!compact && (
                <Text className="font-poppins-semibold text-[10px] tracking-[1.4px] text-lingua-teal">YOUR PRACTICE SPACE</Text>
              )}
              <View className={`flex-row items-center ${compact ? "" : "mt-1"}`}>
                <Text className="h2 flex-1">Chat with Lingua</Text>
                {hasContent ? (
                  <TouchableOpacity
                    onPress={() => { Keyboard.dismiss(); setConfirmAction("clear"); }}
                    accessibilityRole="button"
                    accessibilityLabel="Clear conversation"
                    className="w-11 h-11 rounded-full items-center justify-center bg-white border border-border"
                    testID="chat-clear-button"
                  >
                    <Ionicons name="refresh-outline" size={20} color="#14675D" />
                  </TouchableOpacity>
                ) : !compact && <MotionSticker kind="talk" size={38} testID="chat-sticker" />}
              </View>
              <View className="flex-row items-center mt-1">
                <View className={`w-2 h-2 rounded-full mr-2 ${chat.status === "Connected" ? "bg-[#21A96B]" : "bg-[#D99B4B]"}`} />
                <Text className="caption" accessibilityLiveRegion="polite" testID="chat-connection-status">{chat.status}</Text>
                {compact && (
                  <TouchableOpacity
                    onPress={changeCourse}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={language ? `Change course, currently ${language.name}` : "Choose a course"}
                    className="ml-auto py-1 pl-2"
                    testID="chat-course-button"
                  >
                    <Text className="font-poppins-semibold text-xs text-lingua-teal">{language?.name ?? "Choose course"} ›</Text>
                  </TouchableOpacity>
                )}
              </View>
              {!compact && (
                <TouchableOpacity
                  className="flex-row items-center bg-white border border-border rounded-2xl px-3 py-2.5 mt-4"
                  accessibilityRole="button"
                  accessibilityLabel={language ? `Change course, currently ${language.name}` : "Choose a course"}
                  onPress={changeCourse}
                  testID="chat-course-button"
                >
                  {language ? (
                    <Image source={language.flag} style={styles.flag} accessible={false} />
                  ) : (
                    <View className="w-10 h-10 rounded-full bg-lingua-mint items-center justify-center">
                      <Ionicons name="globe-outline" size={20} color="#14675D" />
                    </View>
                  )}
                  <View className="flex-1 ml-3">
                    <Text className="font-poppins-semibold text-[10px] tracking-[1px] text-text-secondary">PRACTISING</Text>
                    <Text className="font-poppins-semibold text-sm text-text-primary">{language?.name ?? "Choose a course"}</Text>
                  </View>
                  <Text className="font-poppins-semibold text-xs text-lingua-teal mr-1">Change</Text>
                  <Ionicons name="chevron-forward" size={16} color="#14675D" />
                </TouchableOpacity>
              )}
            </View>

            {confirmAction && hasContent && (
              <View className="mx-5 mb-2 rounded-2xl bg-[#FFF5E8] px-4 py-3" accessibilityLiveRegion="polite">
                <Text className="font-poppins-semibold text-sm text-text-primary">
                  {confirmAction === "clear" ? "Clear this conversation and draft?" : "Choosing a different course clears this conversation and draft."}
                </Text>
                <View className="flex-row justify-end mt-2">
                  <TouchableOpacity onPress={() => setConfirmAction(null)} accessibilityRole="button" className="px-3 min-h-11 justify-center">
                    <Text className="font-poppins-semibold text-sm text-text-secondary">Keep</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      if (confirmAction === "clear") chat.clear();
                      else router.push("/language-select");
                      setConfirmAction(null);
                    }}
                    accessibilityRole="button"
                    className="px-3 min-h-11 justify-center"
                    testID={confirmAction === "clear" ? "chat-confirm-clear" : "chat-confirm-course"}
                  >
                    <Text className="font-poppins-semibold text-sm text-lingua-teal">{confirmAction === "clear" ? "Clear" : "Choose course"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <ScrollView
              ref={scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.conversation}
              onContentSizeChange={() => { if (chat.messages.length) scroll.current?.scrollToEnd({ animated: false }); }}
            >
              <View className="rounded-[24px] bg-lingua-sand px-4 py-4 flex-row items-center">
                <Image source={images.mascotParrot} style={styles.mascot} resizeMode="contain" accessible={false} />
                <View className="flex-1 ml-3">
                  <Text className="font-poppins-semibold text-base text-text-primary">A little practice, together.</Text>
                  <Text className="body-sm text-text-secondary mt-1">
                    {chat.status === "Connected" ? "Keep going at your own pace." : "Your AI tutor will be here once the secure chat service is connected."}
                  </Text>
                </View>
              </View>

              {chat.messages.length === 0 && !chat.draft.trim() && (
                <View className="mt-6">
                  <Text className="font-poppins-semibold text-[10px] tracking-[1.2px] text-text-secondary">START WITH AN IDEA</Text>
                  <Text className="body-sm text-text-secondary mt-1 mb-3">Choose a prompt or write your own message.</Text>
                  {(language ? STARTERS[language.code] ?? ["Help me practise a greeting"] : ["Help me practise a greeting"]).map((prompt) => (
                    <TouchableOpacity
                      key={prompt}
                      onPress={() => chat.changeDraft(prompt)}
                      disabled={chat.sending}
                      accessibilityRole="button"
                      accessibilityLabel={`Use prompt: ${prompt}`}
                      className="flex-row items-center bg-white border border-border rounded-2xl px-4 py-3 mb-2"
                    >
                      <View className="w-8 h-8 rounded-xl bg-lingua-mint items-center justify-center mr-3">
                        <Ionicons name="sparkles-outline" size={16} color="#14675D" />
                      </View>
                      <Text className="font-poppins-medium text-sm text-text-primary flex-1 pr-2">{prompt}</Text>
                      <Ionicons name="arrow-forward" size={17} color="#80918A" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {chat.messages.length === 0 && !!chat.draft.trim() && (
                <View className="mt-6">
                  <Text className="font-poppins-semibold text-[10px] tracking-[1.2px] text-text-secondary">YOUR DRAFT</Text>
                  <Text className="body-sm text-text-secondary mt-1">Edit your message below, or clear it to see more ideas.</Text>
                </View>
              )}

              {chat.messages.map((message, index) => (
                <View key={`${index}-${message.role}`} className={`max-w-[88%] rounded-[22px] px-4 py-3 mt-3 ${message.role === "user" ? "self-end bg-lingua-teal" : "self-start bg-white border border-border"}`}>
                  <Text className={`font-poppins-semibold text-[10px] tracking-[1px] mb-1 ${message.role === "user" ? "text-[#D5EBE2]" : "text-lingua-teal"}`}>
                    {message.role === "user" ? "YOU" : "LINGUA TUTOR"}
                  </Text>
                  <Text selectable className={`font-poppins text-sm leading-6 ${message.role === "user" ? "text-white" : "text-text-primary"}`}>
                    {message.content}
                  </Text>
                </View>
              ))}
              {chat.sending && (
                <Text className="caption mt-3" accessibilityLiveRegion="polite" testID="chat-sending">Waiting for a reply…</Text>
              )}
            </ScrollView>

            <View className="px-5 pt-2 pb-3 bg-background">
              {chat.error && (
                <View className="flex-row items-start rounded-2xl bg-[#FFF5E8] px-3 py-2 mb-2" accessibilityLiveRegion="polite" testID="chat-error">
                  <Ionicons name="information-circle-outline" size={19} color="#A46C20" />
                  <Text className="body-sm text-text-primary flex-1 ml-2">{chat.error}</Text>
                </View>
              )}
              <View className="flex-row items-end bg-white border border-border rounded-[22px] px-3 py-2">
                <TextInput
                  style={styles.input}
                  placeholder="Write a message..."
                  placeholderTextColor="#6F837B"
                  accessibilityLabel="Message for the AI tutor"
                  value={chat.draft}
                  onChangeText={chat.changeDraft}
                  editable={!chat.sending}
                  multiline
                  maxLength={CHAT_MESSAGE_LIMIT}
                  testID="chat-message-input"
                />
                <TouchableOpacity
                  onPress={() => { void chat.send(); }}
                  disabled={!canSend}
                  accessibilityRole="button"
                  accessibilityLabel="Send message"
                  accessibilityState={{ disabled: !canSend }}
                  className={`w-11 h-11 rounded-2xl items-center justify-center ml-2 ${canSend ? "bg-lingua-teal" : "bg-[#C8D9D2]"}`}
                  testID="chat-send-button"
                >
                  <Ionicons name="arrow-up" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
              {!compact && (
                <Text className="caption text-center mt-2">Chat is not saved between sessions and clears when you change course. Avoid sharing sensitive information.</Text>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: "#FBF8F1" },
  conversation: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 20 },
  flag: { width: 40, height: 40, borderRadius: 20 },
  mascot: { width: 62, height: 72 },
  input: { flex: 1, minHeight: 44, maxHeight: 110, paddingHorizontal: 4, paddingVertical: 10, fontFamily: "Poppins-Regular", fontSize: 14, color: "#183B37" },
});
