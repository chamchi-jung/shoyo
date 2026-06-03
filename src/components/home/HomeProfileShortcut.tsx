"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Profile } from "@/data/sampleProfiles";

const STORAGE_KEY = "shoyo:studio-profile";

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

export function HomeProfileShortcut() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const savedProfile = window.localStorage.getItem(STORAGE_KEY);

      if (!savedProfile) {
        return;
      }

      try {
        const parsedProfile = JSON.parse(savedProfile) as unknown;

        if (isProfile(parsedProfile)) {
          setProfile(parsedProfile);
        }
      } catch {
        // Ignore invalid local drafts.
      }
    }, 0);

    return () => window.clearTimeout(handle);
  }, []);

  if (!profile) {
    return (
      <div className="landing-my-profile" data-has-profile="false">
        <div>
          <p className="landing-eyebrow">내 프로필</p>
          <strong>아직 홈에 연결된 초안이 없습니다.</strong>
          <span>스튜디오에서 저장하면 바로 여기에 나타납니다.</span>
        </div>
        <Link className="landing-my-profile-link" href="/studio/profile">
          내 프로필 만들기
        </Link>
      </div>
    );
  }

  return (
    <div className="landing-my-profile" data-has-profile="true">
      <div className="landing-my-profile-owner">
        <span aria-hidden="true" className="landing-my-profile-avatar" style={{ backgroundImage: `url("${profile.avatarUrl}")` }} />
        <div>
          <p className="landing-eyebrow">내 프로필</p>
          <strong>{profile.nickname}</strong>
          <span>@{profile.username}</span>
        </div>
      </div>
      <div className="landing-my-profile-actions">
        <Link className="landing-my-profile-link" href={`/profile/${profile.username}`}>
          내 프로필 보기
        </Link>
        <Link className="landing-my-profile-link secondary" href="/studio/profile">
          계속 편집
        </Link>
      </div>
    </div>
  );
}
