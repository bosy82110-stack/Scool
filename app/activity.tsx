import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";


type Lesson = { title: string; prompt: string; options: string[]; answer: string; color: string };
const content: Record<string, Lesson[]> = {
  arabic: [
    { title: "اللغة العربية", prompt: "اختر الحرف الذي تبدأ به كلمة أسد", options: ["أ", "ب", "ت"], answer: "أ", color: "#FF8A7A" },
    { title: "اللغة العربية", prompt: "اختر الكلمة التي تبدأ بحرف م", options: ["موز", "باب", "تفاح"], answer: "موز", color: "#FF8A7A" },
    { title: "اللغة العربية", prompt: "ما الحرف الأخير في كلمة بيت؟", options: ["ب", "ي", "ت"], answer: "ت", color: "#FF8A7A" },
    { title: "اللغة العربية", prompt: "اختر الكلمة المطابقة للصورة: 🐱", options: ["قطة", "كلب", "سمكة"], answer: "قطة", color: "#FF8A7A" },
    { title: "اللغة العربية", prompt: "كم مقطعًا في كلمة بابا؟", options: ["1", "2", "3"], answer: "2", color: "#FF8A7A" },
  ],
  english: [
    { title: "English", prompt: "Which letter does Apple start with?", options: ["A", "B", "C"], answer: "A", color: "#4F9CF9" },
    { title: "English", prompt: "Choose the word for 🐱", options: ["Cat", "Dog", "Sun"], answer: "Cat", color: "#4F9CF9" },
    { title: "English", prompt: "What comes after B?", options: ["A", "C", "D"], answer: "C", color: "#4F9CF9" },
    { title: "English", prompt: "Which word starts with S?", options: ["Sun", "Ball", "Cat"], answer: "Sun", color: "#4F9CF9" },
    { title: "English", prompt: "How many letters are in CAT?", options: ["2", "3", "4"], answer: "3", color: "#4F9CF9" },
  ],
  math: [
    { title: "الحساب", prompt: "كم عدد النجوم؟  ⭐ ⭐ ⭐", options: ["2", "3", "4"], answer: "3", color: "#7BDCB5" },
    { title: "الحساب", prompt: "ما الرقم الذي يأتي بعد 4؟", options: ["3", "5", "6"], answer: "5", color: "#7BDCB5" },
    { title: "الحساب", prompt: "احسب: 2 + 3 = ؟", options: ["4", "5", "6"], answer: "5", color: "#7BDCB5" },
    { title: "الحساب", prompt: "أي رقم أكبر؟", options: ["2", "7", "4"], answer: "7", color: "#7BDCB5" },
    { title: "الحساب", prompt: "احسب: 6 - 2 = ؟", options: ["3", "4", "5"], answer: "4", color: "#7BDCB5" },
  ],
  mental: [
    { title: "الحساب الذهني", prompt: "احسب بسرعة: 5 + 2 = ؟", options: ["6", "7", "8"], answer: "7", color: "#FFD166" },
    { title: "الحساب الذهني", prompt: "احسب بسرعة: 9 - 3 = ؟", options: ["5", "6", "7"], answer: "6", color: "#FFD166" },
    { title: "الحساب الذهني", prompt: "أكمل النمط: 2، 4، 6، ؟", options: ["7", "8", "9"], answer: "8", color: "#FFD166" },
    { title: "الحساب الذهني", prompt: "لديك 3 تفاحات وأضفت 1، كم أصبحوا؟", options: ["3", "4", "5"], answer: "4", color: "#FFD166" },
    { title: "الحساب الذهني", prompt: "ما نصف العدد 6؟", options: ["2", "3", "4"], answer: "3", color: "#FFD166" },
  ],
  daily: [
    { title: "نشاط اليوم", prompt: "كم عدد التفاحات؟  🍎 🍎 🍎 🍎", options: ["3", "4", "5"], answer: "4", color: "#4F9CF9" },
    { title: "نشاط اليوم", prompt: "اختر الحرف الأول في كلمة باب", options: ["ب", "ت", "م"], answer: "ب", color: "#4F9CF9" },
    { title: "نشاط اليوم", prompt: "احسب: 1 + 1 = ؟", options: ["1", "2", "3"], answer: "2", color: "#4F9CF9" },
    { title: "نشاط اليوم", prompt: "Which color is the sun? ☀️", options: ["Blue", "Yellow", "Green"], answer: "Yellow", color: "#4F9CF9" },
    { title: "نشاط اليوم", prompt: "كم نجمة تستحق؟ ⭐", options: ["1", "2", "3"], answer: "3", color: "#4F9CF9" },
  ],
};

export default function ActivityScreen() {
  const params = useLocalSearchParams<{ subject?: string }>();
  const lessonSet = content[params.subject ?? "daily"] ?? content.daily;
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const lesson = lessonSet[questionIndex];
  const isCorrect = selected === lesson.answer;
  const message = useMemo(() => showSuccess ? "ممتاز! استعدي للسؤال التالي" : selected ? "اقتربت! جرّبي مرة أخرى" : "اختاري إجابة واحدة", [selected, showSuccess]);

  const chooseAnswer = (option: string) => {
    if (showSuccess) return;
    setSelected(option);
    if (option === lesson.answer) {
      setShowSuccess(true);
      setCorrectCount((current) => current + 1);
      setTimeout(() => {
        if (questionIndex < lessonSet.length - 1) {
          setQuestionIndex((current) => current + 1);
          setSelected(null);
          setShowSuccess(false);
        } else {
          router.replace({ pathname: "/result", params: { correct: String(correctCount + 1), total: String(lessonSet.length), subject: params.subject ?? "daily" } } as any);
        }
      }, 1500);
    }
  };

  return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5 pt-3">
    <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><View><Text style={styles.kicker}>نشاط قصير</Text><Text style={styles.title}>{lesson.title}</Text></View><Text style={styles.step}>{questionIndex + 1} / {lessonSet.length}</Text></View>
    <View style={[styles.progress, { backgroundColor: lesson.color, width: `${((questionIndex + 1) / lessonSet.length) * 100}%` }]} />
    <View style={styles.questionCard}><View style={[styles.icon, { backgroundColor: lesson.color }]}><Text style={styles.iconText}>؟</Text></View><Text style={styles.prompt}>{lesson.prompt}</Text></View>
    <View style={styles.options}>{lesson.options.map((option) => { const active = selected === option; return <Pressable key={option} onPress={() => chooseAnswer(option)} style={[styles.option, active && { borderColor: isCorrect ? "#7BDCB5" : "#FF8A7A", backgroundColor: isCorrect ? "#ECFBF4" : "#FFF1EE" }]}><Text style={styles.optionText}>{option}</Text>{active && <Text style={[styles.feedbackMark, { color: isCorrect ? "#39A97A" : "#E96D5D" }]}>{isCorrect ? "✓" : "×"}</Text>}</Pressable>; })}</View>
    <View style={styles.bottom}><Text style={[styles.message, { color: showSuccess ? "#39A97A" : selected ? "#E96D5D" : "#6D7C8C" }]}>{message}</Text>{!showSuccess && <Pressable onPress={() => setSelected(null)} style={({ pressed }) => [styles.next, { backgroundColor: lesson.color }, pressed && styles.pressed]}><Text style={styles.nextText}>تحقق</Text></Pressable>}</View>
  </ScreenContainer>;
}

const styles = StyleSheet.create({ header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }, back: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }, backText: { color: "#18324B", fontSize: 34, lineHeight: 36 }, kicker: { textAlign: "center", color: "#6D7C8C", fontSize: 12 }, title: { textAlign: "center", color: "#18324B", fontSize: 20, fontWeight: "900", marginTop: 2 }, step: { color: "#6D7C8C", fontWeight: "800" }, progress: { height: 8, borderRadius: 8, marginBottom: 26 }, questionCard: { backgroundColor: "#FFFFFF", borderRadius: 26, padding: 26, minHeight: 230, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#E9E1D6" }, icon: { width: 66, height: 66, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 20 }, iconText: { color: "#18324B", fontWeight: "900", fontSize: 32 }, prompt: { color: "#18324B", textAlign: "center", fontWeight: "900", fontSize: 22, lineHeight: 32 }, options: { gap: 12, marginTop: 20 }, option: { backgroundColor: "#FFFFFF", minHeight: 62, borderRadius: 18, borderWidth: 2, borderColor: "#E9E1D6", alignItems: "center", justifyContent: "center" }, optionText: { color: "#18324B", fontSize: 24, fontWeight: "900" }, feedbackMark: { position: "absolute", right: 18, fontSize: 24, fontWeight: "900" }, bottom: { marginTop: "auto", paddingTop: 22 }, message: { textAlign: "center", fontSize: 15, fontWeight: "800", marginBottom: 12 }, next: { minHeight: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" }, nextText: { color: "#18324B", fontSize: 17, fontWeight: "900" }, pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] } });
