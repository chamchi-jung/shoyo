import type { CSSProperties } from "react";
import Link from "next/link";
import { HomeProfileShortcut } from "@/components/home/HomeProfileShortcut";
import { profileBlockTypeLabels, profilePresets, sampleProfiles } from "@/data/sampleProfiles";

export const dynamic = "force-dynamic";

const featuredProfile = sampleProfiles[0];
const featuredBlocks = featuredProfile.blocks.slice(0, 5);

const featureCards = [
  {
    title: "취향 블록",
    body: "앨범, 영화, 책, 긴 글, 사진, 유튜브, 링크, 태그를 한 페이지에 천천히 쌓아둘 수 있습니다."
  },
  {
    title: "방 같은 프로필",
    body: "커버 이미지, 아바타, 배지, 작은 오브젝트, 배경화면으로 표가 아니라 누군가의 방처럼 보이게 합니다."
  },
  {
    title: "노코드 스튜디오",
    body: "코드를 건드리지 않고 프리셋을 바꾸고, 블록을 편집하고, 바로 미리 볼 수 있습니다."
  },
  {
    title: "안전한 꾸미기",
    body: "색, 배경, 카드, 폰트 느낌은 충분히 바꾸되 임의 HTML, 자바스크립트, 무제한 CSS는 넣지 않습니다."
  }
];

export default function Home() {
  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow">shoyo / 개인 취향 페이지</p>
          <h1>좋아하는 것들로 작은 홈페이지를 엮어 보세요.</h1>
          <p>
            shoyo는 앨범, 영화, 책, 사진, 유튜브, 링크, 태그, 취향 선언문을 한 장의 개인 페이지에 쌓아두는 도구입니다.
            소셜 대시보드보다 개인 방, 진 벽, 오래된 홈페이지에 가까운 분위기를 지향합니다.
          </p>
          <div className="landing-actions">
            <Link className="landing-button" href="/studio/profile">
              스튜디오 열기
            </Link>
            <Link className="landing-button secondary" href="/community">
              자유게시판
            </Link>
          </div>
          <HomeProfileShortcut />
        </div>

        <div className="landing-profile-preview" aria-label="샘플 shoyo 프로필 미리보기">
          <div className="landing-preview-cover" />
          <div className="landing-preview-profile">
            <span aria-hidden="true" className="landing-preview-avatar" />
            <div>
              <p className="landing-eyebrow">샘플 방 미리보기</p>
              <strong>{featuredProfile.nickname}의 샘플 프로필</strong>
            </div>
          </div>
          <div className="landing-preview-stack">
            {featuredBlocks.map((block) => (
              <article
                className="landing-mini-card"
                key={block.id}
                style={
                  {
                    "--mini-accent": featuredProfile.theme.accent,
                    "--mini-paper": featuredProfile.theme.paper,
                    "--mini-border": featuredProfile.theme.border
                  } as CSSProperties
                }
              >
                <span>{profileBlockTypeLabels[block.type]}</span>
                <strong>{block.title}</strong>
                <small>샘플 블록</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-heading">
          <p className="landing-eyebrow">무엇을 보관하나</p>
          <h2>목록보다 방에 가까운 취향 페이지.</h2>
        </div>
        <div className="landing-feature-card-grid">
          {featureCards.map((card) => (
            <article className="landing-feature-card" key={card.title}>
              <p className="landing-eyebrow">{card.title}</p>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section alt">
        <div className="landing-section-heading">
          <p className="landing-eyebrow">템플릿</p>
          <h2>분위기에서 시작해 자기 방처럼 바꿔 보세요.</h2>
        </div>
        <div className="landing-preset-grid">
          {profilePresets.map((preset) => (
            <article
              className="landing-preset-card"
              key={preset.slug}
              style={
                {
                  "--profile-bg": preset.theme.background,
                  "--profile-paper": preset.theme.paper,
                  "--profile-ink": preset.theme.ink,
                  "--profile-muted": preset.theme.muted,
                  "--profile-accent": preset.theme.accent,
                  "--profile-border": preset.theme.border
                } as CSSProperties
              }
            >
              <div className="landing-profile-swatch">
                <span />
                <span />
                <span />
              </div>
              <p className="landing-eyebrow">{preset.slug}</p>
              <h3>{preset.label}</h3>
              <p>{preset.mood}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
