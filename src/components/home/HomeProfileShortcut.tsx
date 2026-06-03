"use client";

import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Profile } from "@/data/sampleProfiles";
import { loadMyPublishedProfile } from "@/lib/profilePersistence";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function HomeProfileShortcut() {
  const supabase = getSupabaseBrowserClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    async function loadProfileForSession(nextSession: Session | null) {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      setProfile(null);

      if (!nextSession) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const savedProfile = await loadMyPublishedProfile();

        if (isMounted) {
          setProfile(savedProfile);
        }
      } catch {
        if (isMounted) {
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      void loadProfileForSession(data.session);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void loadProfileForSession(nextSession);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="landing-my-profile" data-has-profile="false">
        <div>
          <p className="landing-eyebrow">내 프로필</p>
          <strong>계정 상태를 확인하는 중입니다.</strong>
          <span>저장된 공개 프로필이 있으면 여기에서 바로 열 수 있습니다.</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="landing-my-profile" data-has-profile="false">
        <div>
          <p className="landing-eyebrow">내 프로필</p>
          <strong>로그인하면 내 공개 프로필이 보입니다.</strong>
          <span>로컬 초안은 스튜디오 안에만 남겨두고, 홈에서는 계정 상태만 보여줍니다.</span>
        </div>
        <Link className="landing-my-profile-link" href="/studio/profile">
          로그인 / 만들기
        </Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="landing-my-profile" data-has-profile="false">
        <div>
          <p className="landing-eyebrow">내 프로필</p>
          <strong>아직 공개 저장된 프로필이 없습니다.</strong>
          <span>스튜디오에서 프로필을 만든 뒤 공개 저장하면 홈에 표시됩니다.</span>
        </div>
        <Link className="landing-my-profile-link" href="/studio/profile">
          공개 프로필 만들기
        </Link>
      </div>
    );
  }

  return (
    <div className="landing-my-profile" data-has-profile="true">
      <div className="landing-my-profile-owner">
        <span aria-hidden="true" className="landing-my-profile-avatar" style={{ backgroundImage: `url("${profile.avatarUrl}")` }} />
        <div>
          <p className="landing-eyebrow">내 공개 프로필</p>
          <strong>{profile.nickname}</strong>
          <span>@{profile.username}</span>
        </div>
      </div>
      <div className="landing-my-profile-actions">
        <Link className="landing-my-profile-link" href={`/profile/${profile.username}`}>
          프로필 보기
        </Link>
        <Link className="landing-my-profile-link secondary" href="/studio/profile">
          계속 편집
        </Link>
      </div>
    </div>
  );
}
