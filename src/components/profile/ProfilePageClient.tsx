"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/data/sampleProfiles";
import { ProfileShell } from "./ProfileShell";

const STORAGE_KEY = "shoyo:studio-profile";

type ProfilePageClientProps = {
  initialProfile: Profile;
  profiles: Profile[];
};

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

export function ProfilePageClient({ initialProfile, profiles }: ProfilePageClientProps) {
  const [profile, setProfile] = useState(initialProfile);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const savedProfile = window.localStorage.getItem(STORAGE_KEY);

      if (!savedProfile) {
        return;
      }

      try {
        const parsedProfile = JSON.parse(savedProfile) as unknown;

        if (isProfile(parsedProfile) && (parsedProfile.username === initialProfile.username || initialProfile.username === "mira-room")) {
          setProfile(parsedProfile);
        }
      } catch {
        // Ignore invalid local drafts on the public profile.
      }
    }, 0);

    return () => window.clearTimeout(handle);
  }, [initialProfile]);

  return <ProfileShell profile={profile} profiles={profiles} />;
}
