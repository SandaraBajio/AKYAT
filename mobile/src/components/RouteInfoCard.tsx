import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import { T } from "./T";

/** Small floating card on a trail map: "Summit 706 m, 6.4 km round trip". */
export function RouteInfoCard({ summitM, distanceKm }: { summitM?: number; distanceKm?: number }) {
  if (summitM == null) return null;
  return (
    <View style={styles.info}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Ionicons name="flag" size={14} color={colors.marker} />
        <T variant="small" color={colors.muted}>
          Summit
        </T>
      </View>
      <T variant="statSm" color={colors.light}>
        {summitM.toLocaleString()} m
      </T>
      {distanceKm != null && (
        <T variant="small" color={colors.muted}>
          {distanceKm} km round trip
        </T>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  info: {
    position: "absolute",
    left: 14,
    top: 14,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 2,
  },
});
