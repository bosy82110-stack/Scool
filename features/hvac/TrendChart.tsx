import Svg, { Circle, Line, Polyline } from "react-native-svg";
import { Text, View } from "react-native";
import type { Reading, ReadingMetric } from "./types";
import { metricLabels } from "./insights";

export function TrendChart({ readings, metric }: { readings: Reading[]; metric: ReadingMetric }) {
  const values = readings
    .filter((reading) => typeof reading[metric] === "number")
    .map((reading) => ({ date: reading.timestamp, value: reading[metric] as number }));
  if (values.length < 2) {
    return (
      <View style={{ minHeight: 190, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text style={{ color: "#738295", fontSize: 14, textAlign: "center", lineHeight: 22 }}>
          أضف قراءتين على الأقل لهذا المؤشر لعرض اتجاهه ومقارنته بمرور الوقت.
        </Text>
      </View>
    );
  }

  const width = 320;
  const height = 164;
  const padX = 14;
  const padY = 16;
  const rawMin = Math.min(...values.map((point) => point.value));
  const rawMax = Math.max(...values.map((point) => point.value));
  const range = rawMax - rawMin || Math.max(Math.abs(rawMax) * 0.1, 1);
  const min = rawMin - range * 0.12;
  const max = rawMax + range * 0.12;
  const points = values.map((point, index) => {
    const x = padX + (index / (values.length - 1)) * (width - padX * 2);
    const y = height - padY - ((point.value - min) / (max - min)) * (height - padY * 2);
    return { x, y, value: point.value };
  });
  const pointString = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const unit = metricLabels[metric].unit;
  const firstLabel = new Date(values[0].date).toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
  const lastLabel = new Date(values[values.length - 1].date).toLocaleDateString("ar-EG", { month: "short", day: "numeric" });

  return (
    <View>
      <View style={{ flexDirection: "row-reverse", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={{ color: "#10283F", fontSize: 17, fontWeight: "800" }}>{metricLabels[metric].label}</Text>
        <Text style={{ color: "#087E8B", fontSize: 20, fontWeight: "900" }}>{values[values.length - 1].value} {unit}</Text>
      </View>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {[0, 1, 2, 3].map((row) => {
          const y = padY + row * ((height - padY * 2) / 3);
          return <Line key={row} x1={padX} x2={width - padX} y1={y} y2={y} stroke="#E8EEF1" strokeWidth={1} />;
        })}
        <Polyline points={pointString} fill="none" stroke="#087E8B" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point, index) => (
          <Circle key={`${index}-${point.x}`} cx={point.x} cy={point.y} r={4} fill="#FFFFFF" stroke="#087E8B" strokeWidth={2.5} />
        ))}
      </Svg>
      <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", paddingHorizontal: 3 }}>
        <Text style={{ color: "#738295", fontSize: 11 }}>{lastLabel}</Text>
        <Text style={{ color: "#738295", fontSize: 11 }}>{firstLabel}</Text>
      </View>
      <Text style={{ color: "#9BA7B2", fontSize: 11, textAlign: "center", marginTop: 9 }}>{values.length} قراءات محفوظة · المحور الرأسي حسب وحدة المؤشر</Text>
    </View>
  );
}
