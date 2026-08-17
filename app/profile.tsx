import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";

export default function ProfileScreen() {
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5 pt-4">
    <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><Text style={styles.headerTitle}>حساب الطفل</Text><View style={{ width: 30 }} /></View>
    <View style={styles.avatar}><Text style={styles.avatarText}>م</Text></View>
    <Text style={styles.name}>ملف التعلم</Text>
    <Text style={styles.helper}>يمكنك تعديل الاسم والمرحلة في أي وقت</Text>
    <Text style={styles.label}>اسم الطفل</Text>
    <TextInput defaultValue="مريم" placeholder="اكتب الاسم" placeholderTextColor="#9AA9B6" style={styles.input} textAlign="right" />
    <Text style={styles.label}>المرحلة</Text>
    <View style={styles.levelRow}><View style={[styles.level, styles.levelActive]}><Text style={styles.levelTitle}>التأسيس</Text><Text style={styles.levelText}>الحروف والأرقام</Text></View><View style={styles.level}><Text style={styles.levelTitle}>أولى ابتدائي</Text><Text style={styles.levelText}>مهارات متقدمة</Text></View></View>
    <Pressable onPress={() => router.replace("/")} style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}><Text style={styles.buttonText}>حفظ والعودة</Text></Pressable>
  </ScreenContainer>;
}
const styles = StyleSheet.create({ header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, back: { fontSize: 34, color: "#18324B" }, headerTitle: { fontSize: 20, fontWeight: "900", color: "#18324B" }, avatar: { alignSelf: "center", width: 86, height: 86, borderRadius: 30, backgroundColor: "#FFD166", alignItems: "center", justifyContent: "center", marginTop: 28 }, avatarText: { fontSize: 38, fontWeight: "900", color: "#18324B" }, name: { textAlign: "center", fontSize: 23, fontWeight: "900", color: "#18324B", marginTop: 12 }, helper: { textAlign: "center", color: "#6D7C8C", marginTop: 5, marginBottom: 28 }, label: { textAlign: "right", color: "#18324B", fontWeight: "800", marginBottom: 8, marginTop: 12 }, input: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E9E1D6", borderRadius: 16, minHeight: 54, paddingHorizontal: 16, color: "#18324B", fontSize: 17 }, levelRow: { flexDirection: "row-reverse", gap: 10 }, level: { flex: 1, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E9E1D6", borderRadius: 18, padding: 14 }, levelActive: { backgroundColor: "#E9F4FF", borderColor: "#4F9CF9" }, levelTitle: { textAlign: "right", color: "#18324B", fontWeight: "900" }, levelText: { textAlign: "right", color: "#6D7C8C", fontSize: 12, marginTop: 5 }, button: { marginTop: "auto", marginBottom: 18, minHeight: 56, borderRadius: 18, backgroundColor: "#4F9CF9", alignItems: "center", justifyContent: "center" }, buttonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" } });
