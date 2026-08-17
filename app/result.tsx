import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";

export default function ResultScreen() {
  const params = useLocalSearchParams<{ correct?: string; total?: string; subject?: string }>();
  const correct = Math.max(0, Number(params.correct ?? 0));
  const total = Math.max(1, Number(params.total ?? 5));
  const ratio = correct / total;
  const stars = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;
  const title = stars === 3 ? "ممتازة يا بسملة!" : stars === 2 ? "شغل رائع يا بسملة!" : "أحسنتِ المحاولة يا بسملة!";
  const subtitle = stars === 3 ? "أجبتِ عن معظم الأسئلة بشكل صحيح" : stars === 2 ? "أنتِ على الطريق الصحيح، واصلي التدريب" : "كل محاولة جديدة تجعلكِ أقوى";

  return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5 py-5 justify-center">
    <View style={styles.card}>
      <View style={styles.confetti}><Text style={styles.confettiText}>🎉</Text></View>
      <Text style={styles.eyebrow}>نتيجة النشاط</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.stars}>{[1, 2, 3].map((star) => <Text key={star} style={[styles.star, star <= stars ? styles.activeStar : styles.inactiveStar]}>★</Text>)}</View>
      <View style={styles.scoreBox}><Text style={styles.score}>{correct} / {total}</Text><Text style={styles.scoreLabel}>إجابات صحيحة</Text></View>
      <View style={styles.actions}><Pressable onPress={() => router.replace({ pathname: "/activity", params: { subject: params.subject ?? "daily" } } as any)} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryText}>أعيدي النشاط</Text></Pressable><Pressable onPress={() => router.replace("/(tabs)" as any)} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryText}>العودة إلى المواد</Text></Pressable></View>
    </View>
  </ScreenContainer>;
}

const styles = StyleSheet.create({ card: { backgroundColor: "#FFFFFF", borderRadius: 30, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#E9E1D6" }, confetti: { width: 80, height: 80, borderRadius: 26, backgroundColor: "#FFF4CD", alignItems: "center", justifyContent: "center", marginBottom: 14 }, confettiText: { fontSize: 42 }, eyebrow: { color: "#4F9CF9", fontSize: 14, fontWeight: "900" }, title: { color: "#18324B", fontSize: 27, fontWeight: "900", textAlign: "center", marginTop: 6 }, subtitle: { color: "#6D7C8C", fontSize: 15, textAlign: "center", lineHeight: 23, marginTop: 7 }, stars: { flexDirection: "row", gap: 8, marginVertical: 20 }, star: { fontSize: 48 }, activeStar: { color: "#FFD166" }, inactiveStar: { color: "#E7E1D7" }, scoreBox: { width: "100%", backgroundColor: "#F5FAFF", borderRadius: 18, paddingVertical: 14, alignItems: "center", marginBottom: 20 }, score: { color: "#18324B", fontSize: 31, fontWeight: "900" }, scoreLabel: { color: "#6D7C8C", fontSize: 13, marginTop: 2 }, actions: { width: "100%", gap: 10 }, primaryButton: { minHeight: 54, borderRadius: 17, backgroundColor: "#4F9CF9", justifyContent: "center", alignItems: "center" }, primaryText: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" }, secondaryButton: { minHeight: 52, borderRadius: 17, backgroundColor: "#FFF4CD", justifyContent: "center", alignItems: "center" }, secondaryText: { color: "#18324B", fontSize: 16, fontWeight: "900" }, pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] } });
