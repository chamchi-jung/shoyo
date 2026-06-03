import type { Profile } from "@/data/sampleProfiles";
import { getProfileByUsername, sampleProfiles } from "@/data/sampleProfiles";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase";

type ProfileRow = {
  profile: Profile;
};

const PROFILE_QUERY_TIMEOUT_MS = 1500;

async function withProfileQueryTimeout<T>(query: PromiseLike<T>) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => resolve(null), PROFILE_QUERY_TIMEOUT_MS);
  });

  try {
    return await Promise.race([query, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function isProfile(value: unknown): value is Profile {
  const candidate = value as Partial<Profile>;

  return Boolean(
    candidate &&
      typeof candidate === "object" &&
      typeof candidate.username === "string" &&
      typeof candidate.nickname === "string" &&
      Array.isArray(candidate.blocks) &&
      candidate.theme &&
      typeof candidate.theme === "object"
  );
}

function mergeProfiles(primaryProfiles: Profile[], fallbackProfiles: Profile[]) {
  const seen = new Set<string>();

  return [...primaryProfiles, ...fallbackProfiles].filter((profile) => {
    if (seen.has(profile.username)) {
      return false;
    }

    seen.add(profile.username);
    return true;
  });
}

export async function getPublishedProfileByUsername(username: string) {
  const sampleProfile = getProfileByUsername(username);

  if (process.env.NODE_ENV === "development" && sampleProfile) {
    return sampleProfile;
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const response = await withProfileQueryTimeout(
          supabase.from("profiles").select("profile").eq("username", username).maybeSingle<ProfileRow>()
        );

        if (!response) {
          return sampleProfile;
        }

        const { data, error } = response;

        if (!error && data?.profile && isProfile(data.profile)) {
          return data.profile;
        }
      } catch {
        return sampleProfile;
      }
    }
  }

  return sampleProfile;
}

export async function getPublishedProfiles(limit = 12) {
  if (!isSupabaseConfigured()) {
    return sampleProfiles;
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    return sampleProfiles;
  }

  try {
    const response = await withProfileQueryTimeout(
      supabase.from("profiles").select("profile").order("updated_at", { ascending: false }).limit(limit)
    );

    if (!response) {
      return sampleProfiles;
    }

    const { data, error } = response;

    if (error || !data) {
      return sampleProfiles;
    }

    const publishedProfiles = data.map((row) => row.profile).filter(isProfile);

    return mergeProfiles(publishedProfiles, sampleProfiles);
  } catch {
    return sampleProfiles;
  }
}
