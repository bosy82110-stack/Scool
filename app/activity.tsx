import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";

const content = {
  arabic: { title: "اللغة العربية", prompt: "اختر الحرف الذي تبدأ به كلمة أسد", options: ["أ", "ب", "ت"], answer: "أ", color: "#FF8A7A" },
  english: { title: "English", prompt: "Which letter does Apple start with?", options: ["A", "B", "C"], answer: "A", color: "#4F9CF9" },
  math: { title: "الحساب", prompt: "كم عدد النجوم؟  ⭐ ⭐ ⭐", options: ["2", "3", "4"], answer: "3", color: "#7BDCB5" },
  mental: { title: "الحساب الذهني", prompt: "احسب بسرعة: 5 + 2 = ؟", options: ["6", "7", "8"], answer: "7", color: "#FFD166" },
  daily: { title: "نشاط اليوم", prompt: "كم عدد التفاحات؟  🍎 🍎 🍎 🍎", options: ["3", "4", "5"], answer: "4", color: "#4F9CF9" },
} as const;

export default function ActivityScreen() {
  const params = useLocalSearchParams<{ subject?: string }>();
  const key = (params.subject && params.subject in content ? params.subject : "daily") as keyof typeof content;
  const lesson = content[key];
  const [selected, setSelected] = useState<string | null>(null);
  const isCorrect = selected === lesson.answer;
  const message = useMemo(() => selected ? (isCorrect ? "أحسنت! إجابة صحيحة" : "اقتربت! جرّب مرة أخرى") : "اختر إجابة واحدة", [selected, isCorrect]);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5 pt-3">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
        <View><Text style={styles.kicker}>نشاط قصير</Text><Text style={styles.title}>{lesson.title}</Text></View>
        <Text style={styles.step}>1 / 5</Text>
      </View>
      <View style={[styles.progress, { backgroundColor: lesson.color }]} />
      <View style={styles.questionCard}>
        <View style={[styles.icon, { backgroundColor: lesson.color }]}><Text style={styles.iconText}>؟</Text></View>
        <Text style={styles.prompt}>{lesson.prompt}</Text>
      </View>
      <View style={styles.options}>
        {lesson.options.map((option) => {
          const active = selected === option;
          const correct = active && isCorrect;
          return <Pressable key={option} onPress={() => setSelected(option)} style={[styles.option, active && { borderColor: correct ? "#7BDCB5" : "#FF8A7A", backgroundColor: correct ? "#ECFBF4" : "#FFF1EE" }]}>
            <Text style={styles.optionText}>{option}</Text>
            {active && <Text style={[styles.feedbackMark, { color: correct ? "#39A97A" : "#E96D5D" }]}>{correct ? "✓" : "×"}</Text>}
          </Pressable>;
        })}
      </View>
      <View style={styles.bottom}>
        <Text style={[styles.message, { color: selected ? (isCorrect ? "#39A97A" : "#E96D5D") : "#6D7C8C" }]}>{message}</Text>
        <Pressable onPress={() => isCorrect ? router.replace("/") : setSelected(null)} style={({ pressed }) => [styles.next, { backgroundColor: lesson.color }, pressed && styles.pressed]}>
          <Text style={styles.nextText}>{isCorrect ? "إنهاء النشاط" : "تحقق"}</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  back: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  backText: { color: "#18324B", fontSize: 34, lineHeight: 36 },
  kicker: { textAlign: "center", color: "#6D7C8C", fontSize: 12 },
  title: { textAlign: "center", color: "#18324B", fontSize: 20, fontWeight: "900", marginTop: 2 },
  step: { color: "#6D7C8C", fontWeight: "800" },
  progress: { height: 8, borderRadius: 8, width: "22%", marginBottom: 26 },
  questionCard: { backgroundColor: "#FFFFFF", borderRadius: 26, padding: 26, minHeight: 230, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#E9E1D6" },
  icon: { width: 66, height: 66, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  iconText: { color: "#18324B", fontWeight: "900", fontSize: 32 },
  prompt: { color: "#18324B", textAlign: "center", fontWeight: "900", fontSize: 22, lineHeight: 32 },
  options: { gap: 12, marginTop: 20 },
  option: { backgroundColor: "#FFFFFF", minHeight: 62, borderRadius: 18, borderWidth: 2, borderColor: "#E9E1D6", alignItems: "center", justifyContent: "center" },
  optionText: { color: "#18324B", fontSize: 24, fontWeight: "900" },
  feedbackMark: { position: "absolute", right: 18, fontSize: 24, fontWeight: "900" },
  bottom: { marginTop: "auto", paddingTop: 22 },
  message: { textAlign: "center", fontSize: 15, fontWeight: "800", marginBottom: 12 },
  next: { minHeight: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  nextText: { color: "#18324B", fontSize: 17, fontWeight: "900" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
