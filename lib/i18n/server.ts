import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  getDictionary,
  LOCALE_COOKIE,
  normalizeLocale
} from "@/lib/i18n/config";

export async function getRequestLocale() {
  try {
    const cookieStore = await cookies();
    return normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  } catch (error) {
    if (process.env.NODE_ENV === "test") {
      return DEFAULT_LOCALE;
    }

    throw error;
  }
}

export async function getRequestDictionary() {
  return getDictionary(await getRequestLocale());
}
