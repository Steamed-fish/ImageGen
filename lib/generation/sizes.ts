import type { AspectRatio } from "@/lib/types";

const SIZE_BY_RATIO: Record<AspectRatio, string> = {
  "1:1": "1024x1024",
  "4:5": "1024x1280",
  "16:9": "1536x864",
  "9:16": "864x1536",
  "3:2": "1536x1024"
};

export function getImageSizeForAspectRatio(aspectRatio: AspectRatio) {
  return SIZE_BY_RATIO[aspectRatio];
}
