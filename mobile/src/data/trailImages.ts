import type { ImageSourcePropType } from "react-native";
import type { Trail } from "../types";

/**
 * WHERE TO PUT YOUR PHOTOS
 * ------------------------
 * 1. Copy the image into  mobile/assets/trails/   (e.g. mt-maculot.jpg, mt-maculot-2.jpg)
 * 2. Add a line below, using the trail's id as the key. The first image is the cover photo;
 *    the rest fill the Gallery tab.
 * 3. Save. The app reloads and the placeholder is replaced by your photo.
 *
 * Tip: keep each photo under ~500 KB (about 1600 px wide) so the app loads fast.
 *
 * Later, when photos live in Firebase Cloud Storage, put their download URLs in the trail's
 * `photoUrls` field and delete the lines here. photoUrls takes priority over this file.
 */
export const trailImages: Record<string, ImageSourcePropType[]> = {
  // "mt-maculot": [
  //   require("../../assets/trails/mt-maculot.jpg"),
  //   require("../../assets/trails/mt-maculot-2.jpg"),
  // ],
  // "mt-batulao": [require("../../assets/trails/mt-batulao.jpg")],
  // "taal-view": [require("../../assets/trails/taal-view.jpg")],
};

/** All photos for a trail: Firestore URLs first, then local files. Empty array = show the placeholder. */
export function trailPhotos(trail: Pick<Trail, "id" | "photoUrls">): ImageSourcePropType[] {
  const remote = (trail.photoUrls ?? []).map((uri) => ({ uri }));
  return remote.length > 0 ? remote : (trailImages[trail.id] ?? []);
}
