import type { CSSProperties } from "react";
import Link from "next/link";
import type { Profile } from "@/data/sampleProfiles";
import type { ProfileBlock } from "@/data/sampleProfiles";
import { ProfileBlockList } from "./ProfileBlockList";
import { ProfileGuestbook } from "./ProfileGuestbook";
import { ProfileShareCard } from "./ProfileShareCard";

type ProfileShellProps = {
  blockEditor?: {
    selectedBlockId: string;
    onDuplicateBlock: (index: number) => void;
    onMoveBlock: (fromIndex: number, toIndex: number) => void;
    onRemoveBlock: (index: number) => void;
    onSelectBlock: (blockId: string) => void;
    onUpdateBlock: (index: number, block: ProfileBlock) => void;
  };
  profile: Profile;
  profiles: Array<Pick<Profile, "username" | "nickname" | "theme" | "avatarUrl">>;
  preview?: boolean;
};

const layoutClass = {
  homepage: "lg:grid-cols-[20rem_1fr]",
  room: "lg:grid-cols-[21rem_1fr]",
  shelf: "lg:grid-cols-[19rem_1fr]",
  zine: "lg:grid-cols-[17rem_1fr]"
} satisfies Record<Profile["layout"], string>;
const layoutLabels = {
  homepage: "홈페이지형",
  room: "방형",
  shelf: "선반형",
  zine: "진형"
} satisfies Record<Profile["layout"], string>;
const cardStyleLabels = {
  glass: "유리 카드",
  outline: "테두리 카드",
  paper: "종이 카드",
  tape: "테이프 카드"
} satisfies Record<Profile["theme"]["cardStyle"], string>;
const densityLabels = {
  airy: "여유로운 밀도",
  cozy: "기본 밀도",
  dense: "촘촘한 밀도"
} satisfies Record<Profile["theme"]["layoutDensity"], string>;
const presetLabels: Record<string, string> = {
  "cute-pastel": "파스텔 책상",
  "dark-zine": "다크 진",
  "minimal-archive": "미니멀 아카이브",
  "music-room": "음악 수납장",
  "old-homepage": "옛 인터넷 홈"
};

export function ProfileShell({ blockEditor, preview = false, profile, profiles }: ProfileShellProps) {
  const neighborProfiles = profiles.filter((item) => item.username !== profile.username);

  const themeVars = {
    "--profile-bg": profile.theme.background,
    "--profile-paper": profile.theme.paper,
    "--profile-ink": profile.theme.ink,
    "--profile-muted": profile.theme.muted,
    "--profile-accent": profile.theme.accent,
    "--profile-border": profile.theme.border,
    "--profile-bg-image": profile.theme.backgroundImage ? `url("${profile.theme.backgroundImage}")` : "none",
    "--profile-overlay": `${profile.theme.backgroundOverlay / 100}`,
    "--profile-blur": `${profile.theme.backgroundBlur}px`
  } as CSSProperties;

  return (
    <main
      className={
        preview
          ? "profile-page min-h-full px-4 py-5 text-[var(--profile-ink)] lg:px-5"
          : "profile-page min-h-screen px-4 py-4 text-[var(--profile-ink)] sm:px-6 lg:px-8 lg:py-6"
      }
      data-profile-layout={profile.layout}
      data-profile-card={profile.theme.cardStyle}
      data-profile-density={profile.theme.layoutDensity}
      data-profile-font={profile.theme.fontMood}
      data-profile-radius={profile.theme.borderRadius}
      data-profile-preview={preview ? "true" : "false"}
      data-profile-shadow={profile.theme.shadowStyle}
      data-profile-size={profile.theme.backgroundSize}
      data-profile-theme={profile.theme.slug}
      data-profile-width={profile.theme.contentWidth}
      style={themeVars}
    >
      <div className={preview ? "profile-canvas mx-auto max-w-none" : "profile-canvas mx-auto"}>
        {!preview ? (
          <Link className="profile-floating-edit" href="/studio/profile">
            편집하기
          </Link>
        ) : null}

        <div className="profile-topline mb-4 flex flex-wrap items-end justify-between gap-3 border-b pb-3">
          <p className="font-mono text-xs uppercase">취향 아카이브 / @{profile.username}</p>
          <div className="flex flex-wrap gap-2">
            {!preview ? (
              <Link className="profile-edit-link" href="/studio/profile">
                스튜디오에서 편집
              </Link>
            ) : null}
            <p className="profile-stamp">{layoutLabels[profile.layout]}</p>
            <p className="profile-stamp">{presetLabels[profile.theme.slug] ?? presetLabels[profile.selectedPreset] ?? "사용자 테마"}</p>
            <p className="profile-stamp">{cardStyleLabels[profile.theme.cardStyle]}</p>
            <p className="profile-stamp">{densityLabels[profile.theme.layoutDensity]}</p>
          </div>
        </div>

        <div className={`grid gap-4 ${layoutClass[profile.layout]}`}>
          <aside className="profile-sidebar">
            <div className="profile-owner-card border-b border-[var(--profile-border)] pb-5">
              <div className="profile-cover" style={{ backgroundImage: `url("${profile.coverImageUrl}")` }}>
                <img alt={`${profile.nickname} 아바타`} className="profile-avatar" src={profile.avatarUrl} />
              </div>
              <p className="archive-label mb-4 mt-4">주인장 카드</p>
              <h1 className="text-4xl font-black leading-none sm:text-5xl">{profile.nickname}</h1>
              <p className="mt-3 font-mono text-sm text-[var(--profile-muted)]">@{profile.username}</p>
            </div>

            <p className="mt-5 text-base leading-7 text-[var(--profile-muted)]">{profile.bio}</p>

            <div className="mt-6 border border-[var(--profile-border)] bg-[color-mix(in_srgb,var(--profile-accent)_12%,transparent)] p-3">
              <p className="font-mono text-[0.7rem] uppercase text-[var(--profile-muted)]">지금</p>
              <p className="mt-2 text-sm leading-6">{profile.statusLine}</p>
            </div>

            <div className="mt-6">
              <p className="font-mono text-[0.7rem] uppercase text-[var(--profile-muted)]">무드 태그</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.curationTags.map((tag) => (
                  <span className="taste-tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="profile-badge-board mt-6" aria-label="프로필 배지">
              <span>{presetLabels[profile.selectedPreset] ?? "사용자 테마"}</span>
              <span>{profile.blocks.length}개 블록</span>
              <span>상단 취향장</span>
              <span>로컬 방</span>
            </div>

            <div className="mt-6 grid gap-2">
              <p className="font-mono text-[0.7rem] uppercase text-[var(--profile-muted)]">프로필 링크</p>
              {profile.profileLinks.map((item) => (
                <a className="profile-link" href={item.url} key={item.url} rel="noreferrer" target="_blank">
                  <span>{item.label}</span>
                  <small>{item.url.replace(/^https?:\/\//, "")}</small>
                </a>
              ))}
            </div>

            <div className="mt-6 grid gap-3">
              <p className="font-mono text-[0.7rem] uppercase text-[var(--profile-muted)]">방 안의 물건</p>
              {profile.pinnedObjects.map((object) => (
                <article className="room-object" key={object.title}>
                  <p className="font-mono text-[0.65rem] uppercase text-[var(--profile-muted)]">{object.label}</p>
                  <h2 className="mt-1 text-base font-black leading-tight">{object.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--profile-muted)]">{object.note}</p>
                </article>
              ))}
            </div>

            <nav className="mt-6 grid gap-2 border-t border-[var(--profile-border)] pt-5" aria-label="샘플 프로필">
              <p className="font-mono text-[0.7rem] uppercase text-[var(--profile-muted)]">샘플 방</p>
              {neighborProfiles.map((item) => (
                <Link className="profile-link compact" href={`/profile/${item.username}`} key={item.username}>
                  <img alt="" src={item.avatarUrl} />
                  <span>{item.nickname}</span>
                  <small>@{item.username}</small>
                </Link>
              ))}
            </nav>
          </aside>

          <div className="grid gap-4">
            <section className="profile-hero">
              <div className="profile-hero-cover" style={{ backgroundImage: `url("${profile.coverImageUrl}")` }} />
              <div className="relative">
                <div>
                  <p className="archive-label mb-3">shoyo 개인 페이지</p>
                  <h2 className="max-w-3xl text-3xl font-black leading-none sm:text-5xl">{profile.heroLine}</h2>
                </div>
              </div>
            </section>

            <ProfileBlockList blocks={profile.blocks} editor={blockEditor} preview={preview} username={profile.username} />
            <ProfileGuestbook preview={preview} profile={profile} />
            <ProfileShareCard profile={profile} />
          </div>
        </div>
      </div>
    </main>
  );
}
