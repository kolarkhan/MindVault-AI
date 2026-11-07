import { Feather } from "@expo/vector-icons";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import * as Speech from "expo-speech";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { TextField } from "@/components/ui/TextField";
import { useAppTheme } from "@/hooks/useAppTheme";
import { getApiErrorMessage } from "@/services/api/client";
import * as searchApi from "@/services/api/search";
import { spacing, typography } from "@/constants/theme";
import type { SearchResponse } from "@/types/api";

const SUGGESTIONS = [
  "How much money have I lent someone?",
  "What did I save this week?",
  "Show me anything about travel",
];

/** Combines the spec's "AI Search Assistant" and "Search Results" screens into one
 * conversational view: the answer is always grounded in retrieved memory cards below
 * it, and the fixed fallback message appears verbatim when nothing reliable is found —
 * never a fabricated answer. */
export default function SearchScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const spokenTranscriptRef = useRef("");

  const runSearch = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    Speech.stop();
    setLoading(true);
    setError(null);
    try {
      const response = await searchApi.searchMemories(trimmed);
      setResult(response);
    } catch (e) {
      setError(getApiErrorMessage(e, "Couldn't complete that search."));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useSpeechRecognitionEvent("start", () => setIsListening(true));
  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
    if (spokenTranscriptRef.current.trim()) {
      runSearch(spokenTranscriptRef.current);
    }
  });
  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript ?? "";
    spokenTranscriptRef.current = transcript;
    setQuery(transcript);
  });
  useSpeechRecognitionEvent("error", (event) => {
    setIsListening(false);
    if (event.error !== "no-speech") {
      setError(
        event.error === "not-allowed"
          ? "Enable microphone and speech recognition permissions to ask by voice."
          : "Couldn't hear that. Please try again."
      );
    }
  });

  useEffect(() => {
    return () => {
      Speech.stop();
      ExpoSpeechRecognitionModule.stop();
    };
  }, []);

  const startListening = async () => {
    Speech.stop();
    setIsSpeaking(false);
    setError(null);
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setError("Enable microphone and speech recognition permissions to ask by voice.");
      return;
    }
    spokenTranscriptRef.current = "";
    setQuery("");
    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: true,
      continuous: false,
    });
  };

  const toggleListening = () => {
    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
    } else {
      startListening();
    }
  };

  const toggleAnswerSpeech = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    if (!result?.answer) return;
    setIsSpeaking(true);
    Speech.speak(result.answer, {
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  useEffect(() => {
    if (result?.answer) {
      Speech.stop();
      setIsSpeaking(true);
      Speech.speak(result.answer, {
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Ask MindVault</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Answers are always grounded in your own saved memories.
      </Text>

      <View style={styles.micArea}>
        <Pressable
          onPress={toggleListening}
          disabled={loading}
          style={[
            styles.micButton,
            {
              backgroundColor: isListening ? colors.accent : colors.accentSoft,
              borderColor: colors.accent,
            },
          ]}
        >
          <Feather name="mic" size={30} color={isListening ? colors.textInverted : colors.accent} />
        </Pressable>
        <Text style={[styles.micLabel, { color: colors.textSecondary }]}>
          {isListening ? "Listening… tap to stop" : loading ? "Thinking…" : "Tap to ask by voice"}
        </Text>
      </View>

      <View style={styles.searchRow}>
        <TextField
          value={query}
          onChangeText={setQuery}
          placeholder="Or type your question"
          onSubmitEditing={() => runSearch(query)}
          returnKeyType="search"
          style={styles.searchInput}
        />
        <Pressable
          onPress={() => runSearch(query)}
          style={[styles.searchButton, { backgroundColor: colors.accent }]}
        >
          <Feather name="arrow-up" size={18} color={colors.textInverted} />
        </Pressable>
      </View>

      {!result && !loading && !error ? (
        <View style={styles.suggestions}>
          {SUGGESTIONS.map((s) => (
            <Pressable
              key={s}
              onPress={() => {
                setQuery(s);
                runSearch(s);
              }}
              style={[styles.suggestionChip, { backgroundColor: colors.surfaceMuted }]}
            >
              <Text style={{ color: colors.textSecondary }}>{s}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {error ? <ErrorBanner message={error} /> : null}

      {loading ? (
        <Card style={styles.answerCard}>
          <Text style={{ color: colors.textSecondary }}>Thinking…</Text>
        </Card>
      ) : null}

      {result ? (
        <>
          <Card style={[styles.answerCard, { backgroundColor: colors.accentSoft, borderColor: "transparent" }]}>
            <View style={styles.answerHeader}>
              <Feather name="cpu" size={14} color={colors.accent} />
              <Text style={[styles.answerHeaderText, { color: colors.accent, flex: 1 }]}>
                {result.grounded ? "Grounded answer" : "No match found"}
                {result.provider === "mock" ? " · mock AI mode" : ""}
              </Text>
              <Pressable onPress={toggleAnswerSpeech} hitSlop={8}>
                <Feather name={isSpeaking ? "volume-x" : "volume-2"} size={16} color={colors.accent} />
              </Pressable>
            </View>
            <Text style={[styles.answerText, { color: colors.textPrimary }]}>{result.answer}</Text>
          </Card>

          {result.sources.length > 0 ? (
            <FlatList
              data={result.sources}
              keyExtractor={(item) => item.memory_id}
              scrollEnabled={false}
              ListHeaderComponent={
                <Text style={[styles.sourcesLabel, { color: colors.textMuted }]}>Source memories</Text>
              }
              renderItem={({ item }) => (
                <Pressable onPress={() => router.push(`/memory/${item.memory_id}`)}>
                  <Card style={styles.sourceCard}>
                    <View style={styles.sourceHeader}>
                      <Text style={[styles.sourceTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Badge label={item.category} tone="accent" />
                    </View>
                    <Text style={[styles.sourceSnippet, { color: colors.textSecondary }]} numberOfLines={2}>
                      {item.snippet}
                    </Text>
                  </Card>
                </Pressable>
              )}
            />
          ) : null}
        </>
      ) : null}

      {!result && !loading && !error ? (
        <EmptyState icon="message-circle" title="Ask anything about your memories" />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.displayMd, marginTop: spacing.md },
  subtitle: { ...typography.body, marginBottom: spacing.lg },
  micArea: { alignItems: "center", marginBottom: spacing.lg },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  micLabel: { ...typography.bodySmall, marginTop: spacing.sm },
  searchRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  searchInput: { flex: 1 },
  searchButton: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  suggestions: { gap: spacing.sm, marginTop: spacing.md },
  suggestionChip: { padding: spacing.md, borderRadius: 14 },
  answerCard: { marginTop: spacing.md },
  answerHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.xs },
  answerHeaderText: { ...typography.caption, fontWeight: "700", textTransform: "uppercase" },
  answerText: { ...typography.body },
  sourcesLabel: { ...typography.caption, marginTop: spacing.md, marginBottom: spacing.xs, textTransform: "uppercase" },
  sourceCard: { marginBottom: spacing.sm },
  sourceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4, gap: spacing.sm },
  sourceTitle: { ...typography.subtitle, flex: 1 },
  sourceSnippet: { ...typography.bodySmall },
});
