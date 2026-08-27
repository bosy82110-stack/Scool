import { useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View } from "react-native";
import { WebView } from "react-native-webview";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function RouterScreen() {
  const colors = useColors();
  const [routerAddress, setRouterAddress] = useState("192.168.1.1");
  const [scheme, setScheme] = useState<"http" | "https">("http");
  const [reloadKey, setReloadKey] = useState(0);
  const [pageError, setPageError] = useState<string | null>(null);

  const routerUrl = useMemo(() => {
    const cleanAddress = routerAddress.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `${scheme}://${cleanAddress}`;
  }, [routerAddress, scheme]);

  if (Platform.OS === "web") {
    return (
      <ScreenContainer className="p-5">
        <Text className="text-2xl font-bold text-foreground">التحكم المباشر</Text>
        <Text className="mt-3 text-base leading-6 text-muted">
          افتح هذا العنوان من هاتف Android المتصل بشبكة الراوتر. نسخة الويب لا تستطيع الوصول إلى لوحة الراوتر المحلية بنفس طريقة تطبيق Android.
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <View className="mb-4">
        <Text className="text-2xl font-bold text-foreground">التحكم المباشر</Text>
        <Text className="mt-1 text-sm leading-5 text-muted">
          هذه الشاشة تفتح لوحة الراوتر الحقيقية داخل التطبيق. سجّل دخولك ببيانات الراوتر، ثم استخدم WLAN وAccess Control وQoS.
        </Text>
      </View>

      <View className="mb-3 rounded-2xl border border-border bg-surface p-3">
        <Text className="mb-2 text-sm font-semibold text-foreground">عنوان الراوتر المحلي</Text>
        <TextInput
          value={routerAddress}
          onChangeText={(value) => {
            setRouterAddress(value);
            setPageError(null);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="192.168.1.1"
          placeholderTextColor={colors.muted}
          className="rounded-xl border border-border bg-background px-3 py-3 text-foreground"
        />
        <View className="mt-3 flex-row gap-2">
          {(["http", "https"] as const).map((value) => (
            <Pressable
              key={value}
              onPress={() => {
                setScheme(value);
                setPageError(null);
              }}
              style={({ pressed }) => [
                { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: scheme === value ? colors.primary : colors.border, backgroundColor: scheme === value ? colors.primary : colors.background, paddingVertical: 10, alignItems: "center" },
                pressed && { opacity: 0.75 },
              ]}
            >
              <Text style={{ color: scheme === value ? colors.background : colors.foreground, fontWeight: "700" }}>{value.toUpperCase()}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => {
              setPageError(null);
              setReloadKey((current) => current + 1);
            }}
            style={({ pressed }) => [{ borderRadius: 12, backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 10, justifyContent: "center" }, pressed && { opacity: 0.75 }]}
          >
            <Text style={{ color: colors.background, fontWeight: "700" }}>فتح</Text>
          </Pressable>
        </View>
      </View>

      {pageError ? (
        <View className="mb-3 rounded-xl border border-error bg-error/10 p-3">
          <Text className="text-sm leading-5 text-error">تعذر فتح لوحة الراوتر. تأكد أن الهاتف على نفس Wi‑Fi، ثم جرّب HTTP بدل HTTPS أو العكس.</Text>
        </View>
      ) : null}

      <View className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-background">
        <WebView
          key={`${routerUrl}-${reloadKey}`}
          source={{ uri: routerUrl }}
          originWhitelist={["http://*", "https://*"]}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          startInLoadingState
          renderLoading={() => <ActivityIndicator color={colors.primary} size="large" style={{ flex: 1 }} />}
          onLoadStart={() => setPageError(null)}
          onError={() => setPageError("router-unavailable")}
          allowsBackForwardNavigationGestures
          style={{ flex: 1, backgroundColor: colors.background }}
        />
      </View>
    </ScreenContainer>
  );
}
