import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";

const background = require("@/assets/images/login-photo.jpg");

export default function WelcomeScreen() {
  return <ImageBackground source={background} resizeMode="cover" style={styles.background}>
    <View style={styles.overlay} />
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-transparent" className="px-6 py-6 justify-between">
      <View style={styles.brand}><Text style={styles.brandMark}>م</Text><Text style={styles.brandName}>تأسيس Kids</Text></View>
      <View style={styles.bottomCard}>
        <Text style={styles.kicker}>رحلة التعلم تبدأ هنا</Text>
        <Text style={styles.title}>أهلاً يا بسملة!</Text>
        <Text style={styles.subtitle}>نتعلم ونلعب ونكبر كل يوم</Text>
        <Pressable onPress={() => router.replace("/(tabs)" as any)} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Text style={styles.buttonText}>ابدئي التعلم</Text></Pressable>
        <Text style={styles.note}>العربية • English • الحساب • الحساب الذهني</Text>
      </View>
    </ScreenContainer>
  </ImageBackground>;
}

const styles = StyleSheet.create({ background: { flex: 1, backgroundColor: "#18324B" }, overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(24,50,75,0.22)" }, brand: { alignSelf: "flex-end", flexDirection: "row-reverse", alignItems: "center", gap: 10, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 18, paddingVertical: 8, paddingHorizontal: 12 }, brandMark: { width: 30, height: 30, borderRadius: 10, backgroundColor: "#FFD166", color: "#18324B", fontSize: 18, fontWeight: "900", textAlign: "center", textAlignVertical: "center" }, brandName: { color: "#18324B", fontSize: 17, fontWeight: "900" }, bottomCard: { backgroundColor: "rgba(255,255,255,0.94)", borderRadius: 28, padding: 22, marginBottom: 12 }, kicker: { textAlign: "right", color: "#4F9CF9", fontWeight: "800", fontSize: 14 }, title: { textAlign: "right", color: "#18324B", fontWeight: "900", fontSize: 30, marginTop: 5 }, subtitle: { textAlign: "right", color: "#6D7C8C", fontSize: 16, marginTop: 5, marginBottom: 18 }, button: { minHeight: 56, borderRadius: 18, backgroundColor: "#4F9CF9", alignItems: "center", justifyContent: "center" }, buttonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" }, note: { color: "#6D7C8C", textAlign: "center", fontSize: 11, marginTop: 12 }, pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] } });
