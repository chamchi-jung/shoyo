"use client";

import { useMemo, useState } from "react";
import type { MediaProfileBlock, Profile } from "@/data/sampleProfiles";

type ProfileShareCardProps = {
  profile: Profile;
};

function isMediaBlock(block: Profile["blocks"][number]): block is MediaProfileBlock {
  return block.type === "album" || block.type === "movie" || block.type === "book";
}

export function ProfileShareCard({ profile }: ProfileShareCardProps) {
  const [copyStatus, setCopyStatus] = useState("프로필 링크 복사");
  const favoriteItems = useMemo(() => profile.blocks.filter(isMediaBlock).slice(0, 3), [profile.blocks]);

  async function copyProfileLink() {
    const fallbackUrl = `https://shoyo.local/profile/${profile.username}`;
    const url = typeof window === "undefined" ? fallbackUrl : `${window.location.origin}/profile/${profile.username}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus("복사됨");
      window.setTimeout(() => setCopyStatus("프로필 링크 복사"), 1600);
    } catch {
      setCopyStatus("복사 실패");
      window.setTimeout(() => setCopyStatus("프로필 링크 복사"), 1600);
    }
  }

  return (
    <section className="share-card" aria-label="프로필 공유 카드">
      <div>
        <p className="archive-label mb-3">공유 카드</p>
        <h2>{profile.nickname}</h2>
        <p>{profile.bio}</p>
      </div>
      <div className="share-card-tags">
        {profile.curationTags.slice(0, 4).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="share-card-picks">
        {favoriteItems.map((item) => (
          <span key={item.id}>
            {item.coverLabel} {item.title}
          </span>
        ))}
      </div>
      <button className="profile-copy-button" onClick={copyProfileLink} type="button">
        {copyStatus}
      </button>
    </section>
  );
}
