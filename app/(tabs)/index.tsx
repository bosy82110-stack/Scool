import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";

type SubjectKey = "arabic" | "english" | "math" | "mental";
type Question = { prompt: string; options: string[]; answer: string; hint: string };
type Subject = { key: SubjectKey; title: string; subtitle: string; color: string; icon: string; questions: Question[] };

const subjects: Subject[] = [
  {
    key: "arabic",
    title: "العربي",
    subtitle: "حروف وكلمات",
    color: "#12B886",
    icon: "أ",
    questions: [
      { prompt: "اختاري الحرف الذي تبدأ به كلمة «أسد»", options: ["أ", "ب", "م"], answer: "أ", hint: "أَسَد يبدأ بحرف الألف" },
      { prompt: "أي كلمة تبدأ بحرف م؟", options: ["موز", "بيت", "قلم"], answer: "موز", hint: "موز تبدأ بحرف الميم" },
      { prompt: "اختاري المد الصحيح: بَـ ...", options: ["بُ", "بِ", "بَ"], answer: "بَ", hint: "صوت الفتحة هو بَ" },
    ],
  },
  {
    key: "english",
    title: "English",
    subtitle: "Letters & words",
    color: "#7950F2",
    icon: "A",
    questions: [
      { prompt: "Which letter starts the word Apple?", options: ["A", "B", "C"], answer: "A", hint: "Apple starts with A" },
      { prompt: "Choose the word for a cat", options: ["sun", "cat", "pen"], answer: "cat", hint: "A cat is a small animal" },
      { prompt: "Complete: C _ T", options: ["A", "O", "E"], answer: "A", hint: "C + A + T = CAT" },
    ],
  },
  {
    key: "math",
    title: "الحساب",
    subtitle: "أرقام وجمع",
    color: "#F08C00",
    icon: "١",
    questions: [
      { prompt: "كم تفاحة؟ 🍎 🍎 🍎", options: ["٢", "٣", "٤"], answer: "٣", hint: "عدّي التفاحات واحدة واحدة" },
      { prompt: "٢ + ٣ = ؟", options: ["٤", "٥", "٦"], answer: "٥", hint: "ابدئي من ٢ وأضيفي ٣" },
      { prompt: "أي رقم أكبر؟", options: ["٧", "٤", "٢"], answer: "٧", hint: "٧ يأتي بعد ٤ و٢" },
    ],
  },
  {
    key: "mental",
    title: "الحساب الذهني",
    subtitle: "فكّري بسرعة",
    color: "#37B24D",
    icon: "⚡",
    questions: [
      { prompt: "ما الرقم الناقص؟ ٢، ٤، __، ٨", options: ["٥", "٦", "٧"], answer: "٦", hint: "نزيد ٢ كل مرة" },
      { prompt: "لديك ٥ نجوم وأضفنا نجمة، أصبحوا؟", options: ["٥", "٦", "٧"], answer: "٦", hint: "٥ + ١ يساوي ٦" },
      { prompt: "أي نتيجة أسرع؟ ١ + ١", options: ["١", "٢", "٣"], answer: "٢", hint: "واحد زائد واحد يساوي اثنين" },
    ],
  },
];

export default function HomeScreen() {
  const [started, setStarted] = useState(false);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [completed, setCompleted] = useState<SubjectKey[]>([]);

  useEffect(() => {
    AsyncStorage.getItem("basmala-progress").then((value) => {
      if (!value) return;
      try {
        const saved = JSON.parse(value) as { stars?: number; completed?: SubjectKey[] };
        if (typeof saved.stars === "number") setStars(saved.stars);
        if (Array.isArray(saved.completed)) setCompleted(saved.completed);
      } catch {
        // Ignore invalid local data and start fresh.
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("basmala-progress", JSON.stringify({ stars, completed })).catch(() => undefined);
  }, [stars, completed]);

  const question = activeSubject?.questions[questionIndex];
  const progressLabel = useMemo(() => `${questionIndex + 1} / ${activeSubject?.questions.length ?? 0}`, [questionIndex, activeSubject]);

  const openSubject = (subject: Subject) => {
    setActiveSubject(subject);
    setQuestionIndex(0);
    setFeedback("idle");
  };

  const chooseAnswer = async (option: string) => {
    if (!question || feedback === "correct") return;
    if (option === question.answer) {
      setFeedback("correct");
      setStars((value) => value + 1);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setFeedback("wrong");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const nextQuestion = () => {
    if (!activeSubject) return;
    if (questionIndex >= activeSubject.questions.length - 1) {
      setCompleted((items) => items.includes(activeSubject.key) ? items : [...items, activeSubject.key]);
      setActiveSubject(null);
      setFeedback("idle");
      return;
    }
    setQuestionIndex((value) => value + 1);
    setFeedback("idle");
  };

  if (!started) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#17324D]" className="flex-1">
        <View style={styles.loginOverlay}>
          <View style={styles.loginTop}>
            <View style={styles.logoBadge}><Text style={styles.logoBook}>✦</Text></View>
            <Text style={styles.brand}>بسملة</Text>
            <Text style={styles.tagline}>نتعلم ونلعب ونكبر كل يوم</Text>
          </View>
          <View style={styles.loginBottom}>
            <Text style={styles.welcome}>أهلًا يا بسملة</Text>
            <Text style={styles.loginCopy}>جاهزة نبدأ مغامرة جديدة؟</Text>
            <Pressable style={({ pressed }) => [styles.startButton, pressed && styles.pressed]} onPress={() => setStarted(true)}>
              <Text style={styles.startButtonText}>ابدئي التعلم  ←</Text>
            </Pressable>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  if (activeSubject && question) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#FFF9F0]">
        <ScrollView contentContainerStyle={styles.quizScroll}>
          <View style={styles.quizHeader}>
            <Pressable onPress={() => setActiveSubject(null)} style={styles.backButton}><Text style={styles.backText}>→</Text></Pressable>
            <View style={styles.quizProgress}><Text style={styles.quizProgressText}>{progressLabel}</Text><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${((questionIndex + 1) / activeSubject.questions.length) * 100}%`, backgroundColor: activeSubject.color }]} /></View></View>
            <Text style={styles.starCount}>★ {stars}</Text>
          </View>
          <View style={[styles.subjectPill, { backgroundColor: activeSubject.color }]}><Text style={styles.subjectPillText}>{activeSubject.icon}  {activeSubject.title}</Text></View>
          <Text style={styles.questionPrompt}>{question.prompt}</Text>
          <View style={styles.optionsList}>
            {question.options.map((option) => {
              const isSelectedCorrect = feedback === "correct" && option === question.answer;
              const isSelectedWrong = feedback === "wrong" && option !== question.answer;
              return <Pressable key={option} onPress={() => chooseAnswer(option)} style={({ pressed }) => [styles.option, pressed && styles.pressed, isSelectedCorrect && styles.correctOption, isSelectedWrong && styles.wrongOption]}><Text style={styles.optionText}>{option}</Text></Pressable>;
            })}
          </View>
          {feedback !== "idle" && <View style={[styles.feedbackCard, feedback === "correct" ? styles.successCard : styles.tryCard]}><Text style={styles.feedbackTitle}>{feedback === "correct" ? "برافووو يا بسملة! 🎉" : "قريبة جدًا!"}</Text><Text style={styles.feedbackHint}>{feedback === "correct" ? "إجابة ممتازة، كمّلي بنفس الحماس" : question.hint}</Text>{feedback === "correct" ? <Pressable style={styles.nextButton} onPress={nextQuestion}><Text style={styles.nextButtonText}>{questionIndex === activeSubject.questions.length - 1 ? "إنهاء النشاط" : "السؤال التالي  ←"}</Text></Pressable> : <Pressable style={styles.tryButton} onPress={() => setFeedback("idle")}><Text style={styles.tryButtonText}>حاولي مرة تانية</Text></Pressable>}</View>}
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-[#FFF9F0]" edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.homeScroll}>
        <View style={styles.homeHeader}><View><Text style={styles.hello}>أهلًا يا بسملة 👋</Text><Text style={styles.homeSubtitle}>اختاري مغامرتك التعليمية اليوم</Text></View><View style={styles.soundButton}><Text style={styles.soundIcon}>🌟</Text></View></View>
        <View style={styles.starsCard}><View><Text style={styles.starsLabel}>نجومك اليوم</Text><Text style={styles.starsValue}>★ {stars}</Text></View><Text style={styles.trophy}>🏆</Text><View style={styles.miniProgress}><View style={[styles.miniProgressFill, { width: `${Math.min((stars / 12) * 100, 100)}%` }]} /></View></View>
        <Text style={styles.sectionTitle}>اختاري مادة</Text>
        <View style={styles.subjectGrid}>{subjects.map((subject) => <Pressable key={subject.key} onPress={() => openSubject(subject)} style={({ pressed }) => [styles.subjectCard, { borderColor: subject.color }, pressed && styles.pressed]}><View style={[styles.subjectIcon, { backgroundColor: subject.color }]}><Text style={styles.subjectIconText}>{subject.icon}</Text></View><Text style={styles.subjectTitle}>{subject.title}</Text><Text style={styles.subjectSubtitle}>{subject.subtitle}</Text><Text style={[styles.subjectStatus, { color: subject.color }]}>{completed.includes(subject.key) ? "اكتمل ✓" : "ابدئي الآن  →"}</Text></Pressable>)}</View>
        <View style={styles.encouragement}><Text style={styles.encouragementEmoji}>🌟</Text><View><Text style={styles.encouragementTitle}>كل إجابة بتخليكي أشطر!</Text><Text style={styles.encouragementText}>خدي وقتك وفكّري بهدوء</Text></View></View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loginBackground: { flex: 1, backgroundColor: "#17324D" }, loginOverlay: { flex: 1, backgroundColor: "rgba(9, 32, 48, 0.45)", paddingHorizontal: 24, paddingTop: 72, paddingBottom: 38, justifyContent: "space-between" }, loginTop: { alignItems: "center" }, logoBadge: { width: 74, height: 74, borderRadius: 24, backgroundColor: "#F59F00", alignItems: "center", justifyContent: "center", marginBottom: 12 }, logoBook: { color: "#FFF9F0", fontSize: 42, fontWeight: "900" }, brand: { color: "#FFFFFF", fontSize: 44, fontWeight: "900", letterSpacing: 1 }, tagline: { color: "#FFF9F0", fontSize: 17, marginTop: 8 }, loginBottom: { backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 28, padding: 22, alignItems: "center" }, welcome: { color: "#17324D", fontSize: 25, fontWeight: "900" }, loginCopy: { color: "#687076", fontSize: 16, marginTop: 6, marginBottom: 18 }, startButton: { width: "100%", backgroundColor: "#0B7285", paddingVertical: 17, borderRadius: 18, alignItems: "center" }, startButtonText: { color: "#FFFFFF", fontSize: 19, fontWeight: "800" }, pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] }, homeScroll: { padding: 20, paddingBottom: 34 }, homeHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }, hello: { color: "#17324D", fontSize: 26, fontWeight: "900", textAlign: "right" }, homeSubtitle: { color: "#687076", fontSize: 15, marginTop: 4, textAlign: "right" }, soundButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5E7EB" }, soundIcon: { fontSize: 23 }, starsCard: { backgroundColor: "#17324D", borderRadius: 24, padding: 19, flexDirection: "row-reverse", alignItems: "center", marginBottom: 27, position: "relative" }, starsLabel: { color: "#BBD7DF", fontSize: 14, textAlign: "right" }, starsValue: { color: "#FFFFFF", fontSize: 28, fontWeight: "900", marginTop: 2 }, trophy: { fontSize: 42, marginLeft: "auto", marginRight: 12 }, miniProgress: { position: "absolute", bottom: 0, left: 18, right: 18, height: 5, backgroundColor: "#31536C", borderRadius: 4, overflow: "hidden" }, miniProgressFill: { height: "100%", backgroundColor: "#F59F00", borderRadius: 4 }, sectionTitle: { color: "#17324D", fontSize: 21, fontWeight: "900", textAlign: "right", marginBottom: 14 }, subjectGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 }, subjectCard: { width: "48%", minHeight: 173, backgroundColor: "#FFFFFF", borderRadius: 22, borderWidth: 2, padding: 14, alignItems: "flex-end", shadowColor: "#17324D", shadowOpacity: 0.06, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 2 }, subjectIcon: { width: 54, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center", alignSelf: "flex-end", marginBottom: 10 }, subjectIconText: { color: "#FFFFFF", fontSize: 28, fontWeight: "900" }, subjectTitle: { color: "#17324D", fontSize: 19, fontWeight: "900" }, subjectSubtitle: { color: "#687076", fontSize: 12, marginTop: 3 }, subjectStatus: { fontSize: 12, fontWeight: "800", marginTop: "auto" }, encouragement: { marginTop: 22, backgroundColor: "#E7F5EC", borderRadius: 20, padding: 16, flexDirection: "row-reverse", alignItems: "center" }, encouragementEmoji: { fontSize: 31, marginLeft: 12 }, encouragementTitle: { color: "#2F6B3A", fontSize: 15, fontWeight: "900", textAlign: "right" }, encouragementText: { color: "#5B8364", fontSize: 13, marginTop: 3, textAlign: "right" }, quizScroll: { padding: 20, paddingBottom: 36 }, quizHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }, backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center" }, backText: { fontSize: 24, color: "#17324D" }, quizProgress: { flex: 1, marginHorizontal: 16, alignItems: "center" }, quizProgressText: { color: "#687076", fontWeight: "800", marginBottom: 6 }, progressTrack: { width: "100%", height: 7, backgroundColor: "#E5E7EB", borderRadius: 5, overflow: "hidden" }, progressFill: { height: "100%", borderRadius: 5 }, starCount: { color: "#F59F00", fontSize: 17, fontWeight: "900" }, subjectPill: { alignSelf: "flex-end", borderRadius: 14, paddingHorizontal: 15, paddingVertical: 8, marginBottom: 20 }, subjectPillText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" }, questionPrompt: { color: "#17324D", fontSize: 27, lineHeight: 37, fontWeight: "900", textAlign: "right", marginBottom: 24 }, optionsList: { gap: 12 }, option: { backgroundColor: "#FFFFFF", borderRadius: 19, borderWidth: 2, borderColor: "#E5E7EB", paddingVertical: 18, paddingHorizontal: 16, minHeight: 66, justifyContent: "center", alignItems: "center" }, optionText: { color: "#17324D", fontSize: 22, fontWeight: "800" }, correctOption: { backgroundColor: "#D3F9D8", borderColor: "#2F9E44" }, wrongOption: { backgroundColor: "#FFF5F5", borderColor: "#FFA8A8" }, feedbackCard: { marginTop: 22, borderRadius: 22, padding: 18, alignItems: "center" }, successCard: { backgroundColor: "#D3F9D8" }, tryCard: { backgroundColor: "#FFF3BF" }, feedbackTitle: { color: "#17324D", fontSize: 23, fontWeight: "900" }, feedbackHint: { color: "#4D636B", fontSize: 14, marginTop: 6, textAlign: "center" }, nextButton: { backgroundColor: "#2F9E44", borderRadius: 15, paddingVertical: 13, paddingHorizontal: 25, marginTop: 14 }, nextButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" }, tryButton: { backgroundColor: "#F08C00", borderRadius: 15, paddingVertical: 13, paddingHorizontal: 25, marginTop: 14 }, tryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
});
