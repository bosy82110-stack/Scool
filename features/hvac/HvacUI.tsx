import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { KeyboardTypeOptions } from "react-native";

export const C = {
  bg: "#F3F6F7",
  ink: "#10283F",
  muted: "#718092",
  line: "#E5ECEF",
  white: "#FFFFFF",
  teal: "#087E8B",
  tealDeep: "#08646F",
  mint: "#DDF4F1",
  navy: "#10283F",
  amber: "#D79536",
  amberBg: "#FFF3DB",
  red: "#B8473E",
  redBg: "#FCE9E7",
  green: "#2D7A5B",
  greenBg: "#E5F4EB",
};

export function Page({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1, backgroundColor: C.bg }}>{children}</View>;
}

export function Header({
  title,
  subtitle,
  onBack,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable accessibilityRole="button" accessibilityLabel="رجوع" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
      ) : (
        <View style={styles.brandBadge}><Text style={styles.brandMark}>م</Text></View>
      )}
      <View style={styles.headerCopy}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.headerAction}>
          <Text style={styles.headerActionText}>{actionLabel}</Text>
        </Pressable>
      ) : <View style={{ width: 40 }} />}
    </View>
  );
}

export function SectionTitle({ title, note, action, onAction }: { title: string; note?: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      {action && onAction ? <Pressable onPress={onAction}><Text style={styles.sectionAction}>{action}</Text></Pressable> : <View />}
      <View style={{ alignItems: "flex-end", flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {note ? <Text style={styles.sectionNote}>{note}</Text> : null}
      </View>
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({ title, onPress, secondary = false, disabled = false }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} style={({ pressed }) => [
      styles.primaryButton,
      secondary && styles.secondaryButton,
      disabled && { opacity: 0.55 },
      pressed && !disabled && { opacity: 0.84, transform: [{ scale: 0.99 }] },
    ]}>
      <Text style={[styles.primaryButtonText, secondary && styles.secondaryButtonText]}>{title}</Text>
    </Pressable>
  );
}

export function SmallButton({ title, onPress, tone = "teal" }: { title: string; onPress: () => void; tone?: "teal" | "neutral" | "amber" | "danger" }) {
  const toneStyle = tone === "danger" ? { backgroundColor: C.redBg, color: C.red } : tone === "amber" ? { backgroundColor: C.amberBg, color: C.amber } : tone === "neutral" ? { backgroundColor: "#EFF3F5", color: C.ink } : { backgroundColor: C.mint, color: C.tealDeep };
  return <Pressable onPress={onPress} style={[styles.smallButton, { backgroundColor: toneStyle.backgroundColor }]}><Text style={{ color: toneStyle.color, fontWeight: "800", fontSize: 13 }}>{title}</Text></Pressable>;
}

export function CircleStat({ label, value, accent = C.teal, background = C.mint, size = 76 }: { label: string; value: string | number; accent?: string; background?: string; size?: number }) {
  return (
    <View style={{ flex: 1, minWidth: 0, alignItems: "center", gap: 7 }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: background, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: accent, fontSize: 23, fontWeight: "900" }}>{value}</Text>
      </View>
      <Text numberOfLines={2} style={{ color: C.ink, fontSize: 11, fontWeight: "800", textAlign: "center", lineHeight: 16 }}>{label}</Text>
    </View>
  );
}

export function StatusPill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "red" | "amber" | "green" }) {
  const background = tone === "red" ? C.redBg : tone === "amber" ? C.amberBg : tone === "green" ? C.greenBg : "#EEF2F4";
  const color = tone === "red" ? C.red : tone === "amber" ? C.amber : tone === "green" ? C.green : C.muted;
  return <View style={{ backgroundColor: background, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}><Text style={{ color, fontSize: 11, fontWeight: "800" }}>{label}</Text></View>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}><Text style={{ color: C.teal, fontSize: 24, fontWeight: "900" }}>＋</Text></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

export type EntryField = {
  key: string;
  label: string;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  required?: boolean;
};

export function EntrySheet({
  visible,
  title,
  subtitle,
  fields,
  values,
  onChange,
  onSubmit,
  onCancel,
  onPickPhoto,
  photoUri,
  saving = false,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  fields: EntryField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onPickPhoto?: () => void;
  photoUri?: string;
  saving?: boolean;
}) {
  const [error, setError] = useState("");
  const submit = () => {
    const missing = fields.find((field) => field.required && !values[field.key]?.trim());
    if (missing) {
      setError(`أدخل ${missing.label} للمتابعة.`);
      return;
    }
    setError("");
    onSubmit();
  };
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <KeyboardAvoidingView style={styles.modalShade} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel="إغلاق النافذة" />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetTitleRow}>
            <Pressable onPress={onCancel} style={styles.closeButton}><Text style={{ color: C.muted, fontSize: 20 }}>×</Text></Pressable>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={styles.sheetTitle}>{title}</Text>
              {subtitle ? <Text style={styles.sheetSubtitle}>{subtitle}</Text> : null}
            </View>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
            {fields.map((field) => (
              <View key={field.key} style={styles.formGroup}>
                <Text style={styles.formLabel}>{field.label}{field.required ? <Text style={{ color: C.red }}> *</Text> : null}</Text>
                <TextInput
                  value={values[field.key] ?? ""}
                  onChangeText={(value) => onChange(field.key, value)}
                  placeholder={field.placeholder ?? "اكتب هنا"}
                  placeholderTextColor="#9AA7B3"
                  keyboardType={field.keyboardType ?? "default"}
                  multiline={field.multiline}
                  textAlign="right"
                  style={[styles.input, field.multiline && styles.multilineInput]}
                  accessibilityLabel={field.label}
                />
              </View>
            ))}
            {onPickPhoto ? (
              <Pressable onPress={onPickPhoto} style={styles.photoPick}>
                <Text style={{ fontSize: 18, color: C.teal }}>▧</Text>
                <Text style={styles.photoPickText}>{photoUri ? "تغيير صورة القطعة" : "إضافة صورة للقطعة (اختياري)"}</Text>
              </Pressable>
            ) : null}
            {error ? <Text style={styles.formError}>{error}</Text> : null}
            <View style={{ marginTop: 18 }}>
              <PrimaryButton title={saving ? "جارٍ الحفظ…" : "حفظ السجل"} onPress={submit} disabled={saving} />
            </View>
            <Pressable onPress={onCancel} style={{ paddingVertical: 14, alignItems: "center" }}><Text style={{ color: C.muted, fontWeight: "700" }}>إلغاء</Text></Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function LoadingView() {
  return <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg }}><ActivityIndicator color={C.teal} size="large" /><Text style={{ color: C.muted, marginTop: 12 }}>جارٍ تحميل سجل التكييف…</Text></View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row-reverse", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 10 },
  brandBadge: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.navy, alignItems: "center", justifyContent: "center" },
  brandMark: { color: "#80DBD7", fontSize: 24, fontWeight: "900" },
  backButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" },
  backGlyph: { color: C.ink, fontSize: 30, lineHeight: 34, marginTop: -3 },
  headerCopy: { flex: 1, alignItems: "flex-end" },
  headerTitle: { color: C.ink, fontSize: 19, fontWeight: "900", textAlign: "right" },
  headerSubtitle: { color: C.muted, fontSize: 12, marginTop: 2, textAlign: "right" },
  headerAction: { backgroundColor: C.mint, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12 },
  headerActionText: { color: C.tealDeep, fontSize: 12, fontWeight: "800" },
  sectionHeader: { flexDirection: "row-reverse", alignItems: "center", marginBottom: 12, gap: 10 },
  sectionTitle: { color: C.ink, fontSize: 16, fontWeight: "900", textAlign: "right" },
  sectionNote: { color: C.muted, fontSize: 11, marginTop: 3, textAlign: "right" },
  sectionAction: { color: C.teal, fontSize: 12, fontWeight: "800" },
  card: { backgroundColor: C.white, borderRadius: 19, borderWidth: 1, borderColor: C.line, padding: 16 },
  primaryButton: { minHeight: 50, borderRadius: 15, backgroundColor: C.teal, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  primaryButtonText: { color: C.white, fontSize: 15, fontWeight: "900" },
  secondaryButton: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  secondaryButtonText: { color: C.ink },
  smallButton: { borderRadius: 11, paddingHorizontal: 11, paddingVertical: 8 },
  emptyState: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 20, padding: 24, alignItems: "center" },
  emptyIcon: { width: 48, height: 48, backgroundColor: C.mint, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { color: C.ink, fontWeight: "900", fontSize: 15, textAlign: "center" },
  emptyDescription: { color: C.muted, fontSize: 12, lineHeight: 19, textAlign: "center", marginTop: 6, maxWidth: 280 },
  modalShade: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(7, 24, 39, 0.48)" },
  sheet: { maxHeight: "91%", minHeight: 260, backgroundColor: C.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 9, paddingBottom: 16 },
  sheetHandle: { width: 42, height: 4, borderRadius: 4, backgroundColor: "#C7D2D8", alignSelf: "center", marginBottom: 12 },
  sheetTitleRow: { flexDirection: "row-reverse", alignItems: "center", gap: 12, marginBottom: 16 },
  closeButton: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#E9EEF0" },
  sheetTitle: { color: C.ink, fontSize: 18, fontWeight: "900", textAlign: "right" },
  sheetSubtitle: { color: C.muted, fontSize: 11, marginTop: 3, textAlign: "right" },
  formGroup: { marginTop: 10 },
  formLabel: { color: C.ink, fontSize: 12, fontWeight: "800", textAlign: "right", marginBottom: 6 },
  input: { minHeight: 46, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, color: C.ink, fontSize: 14, writingDirection: "rtl" },
  multilineInput: { minHeight: 86, textAlignVertical: "top" },
  photoPick: { flexDirection: "row-reverse", alignItems: "center", gap: 8, marginTop: 14, padding: 12, backgroundColor: C.mint, borderRadius: 13 },
  photoPickText: { color: C.tealDeep, fontSize: 12, fontWeight: "800" },
  formError: { color: C.red, fontSize: 12, textAlign: "right", marginTop: 12 },
});
