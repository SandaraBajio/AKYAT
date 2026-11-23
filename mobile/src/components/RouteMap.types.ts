import type { StyleProp, ViewStyle } from "react-native";
import type { LatLng } from "../types";

export interface RouteMapProps {
  /** The planned or recorded track, start to end. */
  route?: LatLng[];
  /** Where the hiker is right now (live hike). */
  current?: LatLng | null;
  /** Peak height to show on the info card (trail preview). */
  summitM?: number;
  /** Total distance label for the info card. */
  distanceKm?: number;
  height?: number;
  /** Rounded card corners. Turn off for full-bleed maps. */
  rounded?: boolean;
  /** Keep the map centred on `current` as it moves (live hike). */
  follow?: boolean;
  style?: StyleProp<ViewStyle>;
}
