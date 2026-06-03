"use client";

import type { Profile, ProfileBlock, ProfileBlockType } from "@/data/sampleProfiles";
import { profileBlockTypeLabels } from "@/data/sampleProfiles";

type StudioBlockEditorProps = {
  profile: Profile;
  onBlockAdded?: (blockId: string) => void;
  onUpdate: (recipe: (draft: Profile) => void) => void;
};

const blockTypes = ["album", "movie", "book", "text", "list", "image", "gallery", "video", "link", "tags"] satisfies ProfileBlockType[];
const blockRecipes = [
  {
    label: "상단 취향장",
    types: ["album", "movie", "book"]
  },
  {
    label: "이미지 벽",
    types: ["image", "gallery", "text"]
  },
  {
    label: "목록 방",
    types: ["list", "text", "tags"]
  },
  {
    label: "링크 방",
    types: ["video", "link", "tags"]
  }
] satisfies Array<{ label: string; types: ProfileBlockType[] }>;

function makeBlockId(type: ProfileBlockType) {
  return `draft-${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function makeNewBlock(type: ProfileBlockType, profile: Profile): ProfileBlock {
  const base = {
    id: makeBlockId(type),
    type
  };

  if (type === "album" || type === "movie" || type === "book") {
    return {
      ...base,
      type,
      title: `새 ${profileBlockTypeLabels[type]}`,
      creator: "이름 없는 제작자",
      year: "2026",
      note: "아직 메모를 기다리는 새 취향 항목입니다.",
      tags: ["새 블록", "초안"],
      coverLabel: profileBlockTypeLabels[type].slice(0, 2).toUpperCase(),
      coverTone: [profile.theme.accent, profile.theme.background]
    };
  }

  if (type === "text") {
    return {
      ...base,
      type,
      title: "새 글 블록",
      body: "이 페이지의 분위기를 짧게 적어보세요.",
      tags: ["메모"]
    };
  }

  if (type === "link") {
    return {
      ...base,
      type,
      title: "새 링크",
      url: "https://example.com",
      description: "레퍼런스, 플레이리스트, 리뷰, 상점, 작은 인터넷 흔적을 붙여두세요.",
      tags: ["링크"]
    };
  }

  if (type === "image") {
    return {
      ...base,
      type,
      title: "새 이미지",
      imageUrl: profile.coverImageUrl || "/samples/pastel-desk.svg",
      alt: "새 이미지 블록",
      caption: "포스터처럼 크게 이미지 한 장을 꽂아두세요.",
      tags: ["이미지"]
    };
  }

  if (type === "gallery") {
    return {
      ...base,
      type,
      title: "새 갤러리",
      images: [{ url: profile.coverImageUrl || "/samples/midnight-room.svg", alt: "샘플 갤러리 이미지" }],
      caption: "이번 편집에서 쓸 이미지 파일을 골라 갤러리를 채워보세요.",
      tags: ["갤러리"]
    };
  }

  if (type === "video") {
    return {
      ...base,
      type,
      title: "새 유튜브 블록",
      youtubeUrl: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
      description: "유튜브 주소를 붙여넣으세요. shoyo는 주소만 저장하고 안전한 임베드로 보여줍니다.",
      tags: ["영상"]
    };
  }

  if (type === "list") {
    return {
      ...base,
      type,
      title: "새 리스트 블록",
      note: "좋아하는 것, 사고 싶은 것, 자주 반복하는 것들을 한 줄씩 적어보세요.",
      items: ["요즘 자주 듣는 것", "다시 보고 싶은 장면", "책상 위에 남겨 둘 물건"],
      ordered: false,
      tags: ["리스트", "초안"]
    };
  }

  return {
    ...base,
    type,
    title: "새 태그 묶음",
    note: "이 방을 설명하는 느슨한 단어들.",
    tags: ["태그", "초안", "방"]
  };
}

export function StudioBlockEditor({ onBlockAdded, onUpdate, profile }: StudioBlockEditorProps) {
  function addBlock(type: ProfileBlockType) {
    const nextBlock = makeNewBlock(type, profile);

    onUpdate((draft) => {
      draft.blocks.push(nextBlock);
    });
    onBlockAdded?.(nextBlock.id);
  }

  function addRecipe(types: ProfileBlockType[]) {
    const nextBlocks = types.map((type) => makeNewBlock(type, profile));

    onUpdate((draft) => {
      draft.blocks.push(...nextBlocks);
    });
    onBlockAdded?.(nextBlocks.at(-1)?.id ?? "");
  }

  return (
    <div className="studio-block-builder compact">
      <div className="studio-toolbelt">
        <div className="studio-toolbelt-label">
          <p className="studio-eyebrow">블록 추가</p>
          <strong>새 블록만 여기서 붙이고, 수정과 이동은 오른쪽 미리보기 카드 안에서 합니다.</strong>
        </div>
        <div className="studio-block-palette" aria-label="블록 팔레트">
          {blockTypes.map((type) => (
            <button key={type} onClick={() => addBlock(type)} type="button">
              <span>+ {profileBlockTypeLabels[type]}</span>
              <small>끝에 추가</small>
            </button>
          ))}
        </div>
        <div className="studio-recipe-strip" aria-label="블록 묶음">
          <p className="studio-eyebrow">블록 묶음</p>
          <div>
            {blockRecipes.map((recipe) => (
              <button key={recipe.label} onClick={() => addRecipe(recipe.types)} type="button">
                <strong>{recipe.label}</strong>
                <small>{recipe.types.map((type) => profileBlockTypeLabels[type]).join(" + ")}</small>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
