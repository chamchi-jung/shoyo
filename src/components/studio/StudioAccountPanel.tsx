"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { sampleProfiles, type Profile } from "@/data/sampleProfiles";
import { getSignInErrorMessage } from "@/lib/authMessages";
import { loadMyPublishedProfile, normalizeUsername, saveMyPublishedProfile } from "@/lib/profilePersistence";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type StudioAccountPanelProps = {
  profile: Profile;
  onLoadProfile: (profile: Profile) => void;
  onSaveProfile: (profile: Profile) => void;
  onStatus: (message: string) => void;
  onUpdateProfile: (recipe: (draft: Profile) => void) => void;
};

const sampleUsernames = new Set(sampleProfiles.map((profile) => profile.username));

function getStarterUsername(session: Session) {
  const emailName = session.user.email?.split("@")[0] ?? "";
  const username = normalizeUsername(emailName);

  return username || `user-${session.user.id.slice(0, 8)}`;
}

export function StudioAccountPanel({ onLoadProfile, onSaveProfile, onStatus, onUpdateProfile, profile }: StudioAccountPanelProps) {
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [accountMessage, setAccountMessage] = useState("");
  const initializedUserIdRef = useRef("");

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!session || initializedUserIdRef.current === session.user.id) {
      return;
    }

    initializedUserIdRef.current = session.user.id;

    void loadMyPublishedProfile()
      .then((savedProfile) => {
        if (savedProfile) {
          onLoadProfile(savedProfile);
          setAccountMessage("저장된 공개 프로필을 불러왔습니다.");
          onStatus("저장된 공개 프로필을 불러왔습니다.");
          return;
        }

        const starterUsername = getStarterUsername(session);

        onUpdateProfile((draft) => {
          if (sampleUsernames.has(draft.username)) {
            draft.username = starterUsername;
            draft.nickname = starterUsername;
            draft.heroLine = `${starterUsername}의 취향 방`;
            draft.bio = "좋아하는 것들을 하나씩 모으는 중입니다.";
            draft.statusLine = "지금 막 shoyo 방을 만드는 중";
          }
        });

        setAccountMessage("첫 프로필을 시작했습니다. 주소와 닉네임을 확인한 뒤 공개 저장해 주세요.");
        onStatus("첫 프로필을 시작했습니다. 주소와 닉네임을 확인한 뒤 공개 저장해 주세요.");
      })
      .catch(() => {
        const starterUsername = getStarterUsername(session);

        onUpdateProfile((draft) => {
          if (sampleUsernames.has(draft.username)) {
            draft.username = starterUsername;
            draft.nickname = starterUsername;
          }
        });
      });
  }, [onLoadProfile, onStatus, onUpdateProfile, session]);

  function reportStatus(message: string) {
    setAccountMessage(message);
    onStatus(message);
  }

  async function runAuthAction(action: () => Promise<void>) {
    setIsBusy(true);
    setAccountMessage("");

    try {
      await action();
    } catch (error) {
      reportStatus(error instanceof Error ? error.message : "계정 작업 중 오류가 났습니다.");
    } finally {
      setIsBusy(false);
    }
  }

  function signUp() {
    if (!supabase) {
      return;
    }

    void runAuthAction(async () => {
      const { error } = await supabase.auth.signUp({ email, password });

      if (error) {
        throw error;
      }

      reportStatus("가입 요청이 완료됐습니다. Supabase 설정에 따라 메일 확인 후 로그인해 주세요.");
    });
  }

  function signIn() {
    if (!supabase) {
      return;
    }

    void runAuthAction(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        const message = getSignInErrorMessage(error);
        window.alert(message);
        throw new Error(message);
      }

      reportStatus("로그인했습니다.");
    });
  }

  function signOut() {
    if (!supabase) {
      return;
    }

    void runAuthAction(async () => {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      initializedUserIdRef.current = "";
      setSession(null);
      reportStatus("로그아웃했습니다.");
    });
  }

  function loadPublishedProfile() {
    void runAuthAction(async () => {
      const savedProfile = await loadMyPublishedProfile();

      if (!savedProfile) {
        reportStatus("아직 공개 저장된 프로필이 없습니다.");
        return;
      }

      onLoadProfile(savedProfile);
      reportStatus("공개 프로필을 불러왔습니다.");
    });
  }

  function savePublishedProfile() {
    void runAuthAction(async () => {
      const savedProfile = await saveMyPublishedProfile(profile);

      onSaveProfile(savedProfile);
      reportStatus(`공개 프로필을 저장했습니다. /profile/${savedProfile.username}`);
    });
  }

  function updateUsername(value: string) {
    onUpdateProfile((draft) => {
      draft.username = normalizeUsername(value);
    });
  }

  function updateNickname(value: string) {
    onUpdateProfile((draft) => {
      draft.nickname = value;
    });
  }

  if (!supabase) {
    return (
      <section className="studio-account-panel">
        <div>
          <p className="studio-eyebrow">계정</p>
          <h2>Supabase 연결이 필요합니다.</h2>
        </div>
        <p>
          `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 설정하면 여기에서 가입, 로그인, 공개 저장을 할 수 있습니다.
        </p>
      </section>
    );
  }

  return (
    <section className="studio-account-panel">
      <div className="studio-account-header">
        <div>
          <p className="studio-eyebrow">계정</p>
          <h2>{session ? "공개 프로필 저장" : "가입하고 프로필 만들기"}</h2>
        </div>
        {session ? (
          <button className="studio-mini-button" disabled={isBusy} onClick={signOut} type="button">
            로그아웃
          </button>
        ) : null}
      </div>

      {session ? (
        <div className="grid gap-3">
          <p className="studio-account-copy">{session.user.email} 계정으로 로그인 중입니다.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="studio-field">
              <span>주소</span>
              <input onChange={(event) => updateUsername(event.target.value)} value={profile.username} />
              <small className="studio-file-note">/profile/{profile.username}</small>
            </label>
            <label className="studio-field">
              <span>닉네임</span>
              <input onChange={(event) => updateNickname(event.target.value)} value={profile.nickname} />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="studio-button" disabled={isBusy} onClick={savePublishedProfile} type="button">
              공개 프로필 저장
            </button>
            <button className="studio-button secondary" disabled={isBusy} onClick={loadPublishedProfile} type="button">
              내 공개 프로필 불러오기
            </button>
            <a className="studio-button secondary" href={`/profile/${profile.username}`}>
              공개 페이지 보기
            </a>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="studio-field">
              <span>이메일</span>
              <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
            </label>
            <label className="studio-field">
              <span>비밀번호</span>
              <input
                autoComplete="current-password"
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="studio-button" disabled={isBusy || !email || password.length < 6} onClick={signUp} type="button">
              가입하기
            </button>
            <button
              className="studio-button secondary"
              disabled={isBusy || !email || !password}
              onClick={signIn}
              type="button"
            >
              로그인
            </button>
          </div>
        </div>
      )}

      {accountMessage ? (
        <p className="studio-account-message" role="status">
          {accountMessage}
        </p>
      ) : null}
    </section>
  );
}
