import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

const subjects = [
  { id: "arabic", title: "اللغة العربية", subtitle: "حروف وكلمات", icon: "أ", color: "#FF8A7A", progress: 58 },
  { id: "english", title: "English", subtitle: "Letters & words", icon: "A", color: "#4F9CF9", progress: 42 },
  { id: "math", title: "الحساب", subtitle: "أرقام وعمليات", icon: "١٢", color: "#7BDCB5", progress: 36 },
  { id: "mental", title: "الحساب الذهني", subtitle: "فكّر بسرعة", icon: "؟", color: "#FFD166", progress: 24 },
];

export default function HomeScreen() {
  const [streak] = useState(3);
  const greeting = useMemo(() => "أهلاً يا بطل!", []);

  return (
    <ScreenContainer edges={["top", "left", "right"]} className="px-5 pt-3">
      <FlatList
        data={subjects}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <View style={styles.topRow}>
              <View>
                <Text style={styles.eyebrow}>تأسيس Kids</Text>
                <Text style={styles.title}>{greeting}</Text>
                <Text style={styles.subtitle}>ماذا سنتعلم اليوم؟</Text>
              </View>
              <Pressable onPress={() => router.push("/profile" as any)} style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
                <Text style={styles.avatarText}>م</Text>
              </Pressable>
            </View>
            <View style={styles.streakCard}>
              <View style={styles.streakIcon}><Text style={styles.streakEmoji}>★</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.streakTitle}>سلسلة التعلم: {streak} أيام</Text>
                <Text style={styles.streakText}>أكمل نشاطًا اليوم لتحافظ على تقدمك</Text>
              </View>
              <Text style={styles.streakCount}>{streak}</Text>
            </View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>المواد التعليمية</Text>
              <Pressable onPress={() => router.push("/progress" as any)}><Text style={styles.link}>تقدمي</Text></Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: "/activity" as any, params: { subject: item.id } })} style={({ pressed }) => [styles.subjectCard, pressed && styles.pressed]}>
            <View style={[styles.subjectIcon, { backgroundColor: item.color }]}><Text style={styles.subjectIconText}>{item.icon}</Text></View>
            <Text style={styles.subjectTitle}>{item.title}</Text>
            <Text style={styles.subjectSubtitle}>{item.subtitle}</Text>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${item.progress}%`, backgroundColor: item.color }]} /></View>
            <Text style={styles.progressText}>{item.progress}% مكتمل</Text>
          </Pressable>
        )}
        ListFooterComponent={
          <Pressable onPress={() => router.push({ pathname: "/activity" as any, params: { subject: "daily" } })} style={({ pressed }) => [styles.dailyCard, pressed && styles.pressed]}>
            <View style={styles.dailyBadge}><IconSymbol name="chevron.right" size={20} color="#18324B" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dailyTitle}>نشاط اليوم</Text>
              <Text style={styles.dailyText}>5 دقائق من التعلم الممتع</Text>
            </View>
            <Text style={styles.dailyNumber}>5</Text>
          </Pressable>
        }
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28, gap: 14 },
  column: { gap: 14 },
  topRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  eyebrow: { color: "#4F9CF9", fontSize: 14, fontWeight: "800", textAlign: "right" },
  title: { color: "#18324B", fontSize: 28, fontWeight: "900", textAlign: "right", marginTop: 2 },
  subtitle: { color: "#6D7C8C", fontSize: 15, textAlign: "right", marginTop: 4 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#FFD166", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#FFFFFF" },
  avatarText: { fontSize: 24, fontWeight: "900", color: "#18324B" },
  streakCard: { flexDirection: "row-reverse", alignItems: "center", gap: 12, backgroundColor: "#18324B", borderRadius: 22, padding: 16, marginBottom: 22 },
  streakIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#FFD166", alignItems: "center", justifyContent: "center" },
  streakEmoji: { fontSize: 22, color: "#18324B" },
  streakTitle: { color: "#FFFFFF", textAlign: "right", fontSize: 16, fontWeight: "800" },
  streakText: { color: "#C7D5E1", textAlign: "right", fontSize: 12, marginTop: 3 },
  streakCount: { color: "#FFD166", fontSize: 28, fontWeight: "900" },
  sectionHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { color: "#18324B", fontSize: 20, fontWeight: "900" },
  link: { color: "#4F9CF9", fontSize: 14, fontWeight: "800" },
  subjectCard: { flex: 1, minHeight: 190, backgroundColor: "#FFFFFF", borderRadius: 22, padding: 14, borderWidth: 1, borderColor: "#E9E1D6", shadowColor: "#18324B", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  subjectIcon: { width: 52, height: 52, borderRadius: 17, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  subjectIconText: { color: "#18324B", fontSize: 22, fontWeight: "900" },
  subjectTitle: { color: "#18324B", fontSize: 16, fontWeight: "900", textAlign: "right" },
  subjectSubtitle: { color: "#6D7C8C", fontSize: 12, textAlign: "right", marginTop: 4 },
  progressTrack: { height: 7, backgroundColor: "#F0ECE6", borderRadius: 5, marginTop: 16, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 5 },
  progressText: { color: "#6D7C8C", fontSize: 11, textAlign: "right", marginTop: 6 },
  dailyCard: { flexDirection: "row-reverse", alignItems: "center", gap: 12, backgroundColor: "#E9F4FF", borderRadius: 22, padding: 16, marginTop: 4 },
  dailyBadge: { width: 40, height: 40, borderRadius: 14, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", transform: [{ rotate: "180deg" }] },
  dailyTitle: { color: "#18324B", textAlign: "right", fontSize: 16, fontWeight: "900" },
  dailyText: { color: "#587086", textAlign: "right", fontSize: 13, marginTop: 3 },
  dailyNumber: { color: "#4F9CF9", fontSize: 28, fontWeight: "900" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
