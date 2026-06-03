"use client";

import type { DragEvent } from "react";
import { useMemo, useState } from "react";
import type {
  GalleryProfileBlock,
  ImageProfileBlock,
  ListProfileBlock,
  MediaProfileBlock,
  Profile,
  ProfileBlock,
  ProfileBlockType
} from "@/data/sampleProfiles";
import { profileBlockTypeLabels } from "@/data/sampleProfiles";
import { isLocalImageDataUrl, readImageFile, readImageFiles } from "@/lib/localImage";

type StudioBlockEditorProps = {
  profile: Profile;
  onUpdate: (recipe: (draft: Profile) => void) => void;
};

const blockTypes = ["album", "movie", "book", "text", "list", "image", "gallery", "video", "link", "tags"] satisfies ProfileBlockType[];
const dragMimeType = "application/x-shoyo-block";
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

function listToText(values?: string[]) {
  return values?.join(", ") ?? "";
}

function textToList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function linesToText(values?: string[]) {
  return values?.join("\n") ?? "";
}

function textToLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function makeBlockId(type: ProfileBlockType) {
  return `draft-${type}-${Date.now().toString(36)}`;
}

function duplicateProfileBlock(block: ProfileBlock): ProfileBlock {
  return {
    ...JSON.parse(JSON.stringify(block)),
    id: makeBlockId(block.type),
    title: `${block.title ?? profileBlockTypeLabels[block.type]} 복사본`
  } as ProfileBlock;
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

function getBlockSummary(block: ProfileBlock) {
  if (block.type === "album" || block.type === "movie" || block.type === "book") {
    return `${block.creator} / ${block.year}`;
  }

  if (block.type === "text") {
    return block.body;
  }

  if (block.type === "gallery") {
    return block.caption;
  }

  if (block.type === "image") {
    return block.caption;
  }

  if (block.type === "video") {
    return block.youtubeUrl;
  }

  if (block.type === "link") {
    return block.url;
  }

  if (block.type === "list") {
    return `${block.items.length}개 항목`;
  }

  return block.tags.join(", ");
}

function DropSlot({
  active,
  index,
  onDropBlock
}: {
  active: boolean;
  index: number;
  onDropBlock: (event: DragEvent<HTMLButtonElement>, index: number) => void;
}) {
  return (
    <button
      className="studio-drop-slot"
      data-active={active}
      onDragEnter={(event) => {
        event.preventDefault();
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => onDropBlock(event, index)}
      type="button"
    >
      여기에 블록 놓기
    </button>
  );
}

function BlockThumbnail({ block, index }: { block: ProfileBlock; index: number }) {
  let background = "";
  let label = profileBlockTypeLabels[block.type];

  if (block.type === "album" || block.type === "movie" || block.type === "book") {
    background = block.imageUrl
      ? `linear-gradient(rgba(0, 0, 0, 0.14), rgba(0, 0, 0, 0.46)), url("${block.imageUrl}") center / cover`
      : `linear-gradient(135deg, ${block.coverTone[0]}, ${block.coverTone[1]})`;
    label = block.coverLabel;
  } else if (block.type === "image") {
    background = `linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.42)), url("${block.imageUrl}") center / cover`;
  } else if (block.type === "gallery") {
    const firstImage = block.images[0]?.url;
    background = firstImage
      ? `linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.42)), url("${firstImage}") center / cover`
      : "linear-gradient(135deg, #dfb95e, #7cc4b8)";
  } else if (block.type === "video") {
    background = "linear-gradient(135deg, #d56042, #202826)";
    label = "YT";
  } else if (block.type === "link") {
    background = "linear-gradient(135deg, #23a6a6, #202826)";
    label = "URL";
  } else if (block.type === "text") {
    background = "linear-gradient(135deg, #f6edd8, #7c3f35)";
    label = "TXT";
  } else if (block.type === "list") {
    background = "linear-gradient(135deg, #dfb95e, #2f6f73)";
    label = "LIST";
  } else {
    background = "linear-gradient(135deg, #e2779b, #202826)";
    label = "#";
  }

  return (
    <span className="studio-block-thumb" data-type={block.type} style={{ background }}>
      <small>{label}</small>
      <b>{String(index + 1).padStart(2, "0")}</b>
    </span>
  );
}

function MediaFields({
  block,
  onReplace
}: {
  block: MediaProfileBlock;
  onReplace: (nextBlock: ProfileBlock) => void;
}) {
  function handleCoverFile(file: File | undefined) {
    void readImageFile(file)
      .then((image) => {
        if (!image) {
          return;
        }

        onReplace({ ...block, imageUrl: image.dataUrl });
      })
      .catch(() => undefined);
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="studio-field">
          <span>제목</span>
          <input onChange={(event) => onReplace({ ...block, title: event.target.value })} value={block.title} />
        </label>
        <label className="studio-field">
          <span>만든 사람</span>
          <input onChange={(event) => onReplace({ ...block, creator: event.target.value })} value={block.creator} />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="studio-field">
          <span>연도</span>
          <input onChange={(event) => onReplace({ ...block, year: event.target.value })} value={block.year} />
        </label>
        <label className="studio-field">
          <span>커버 글자</span>
          <input
            maxLength={3}
            onChange={(event) => onReplace({ ...block, coverLabel: event.target.value.toUpperCase() })}
            value={block.coverLabel}
          />
        </label>
        <label className="studio-field">
          <span>태그</span>
          <input onChange={(event) => onReplace({ ...block, tags: textToList(event.target.value) })} value={listToText(block.tags)} />
        </label>
      </div>

      <div className="studio-field">
        <span>커버 이미지 파일</span>
        <input accept="image/*" onChange={(event) => handleCoverFile(event.target.files?.[0])} type="file" />
        {isLocalImageDataUrl(block.imageUrl ?? "") ? <small className="studio-file-note">선택한 이미지 파일 사용 중</small> : null}
        {block.imageUrl ? (
          <button className="studio-mini-button" onClick={() => onReplace({ ...block, imageUrl: undefined })} type="button">
            이미지 제거
          </button>
        ) : null}
      </div>

      <label className="studio-field">
        <span>메모</span>
        <textarea onChange={(event) => onReplace({ ...block, note: event.target.value })} rows={3} value={block.note} />
      </label>

      <label className="studio-field">
        <span>선택 링크</span>
        <input onChange={(event) => onReplace({ ...block, link: event.target.value })} value={block.link ?? ""} />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="studio-color">
          <span>커버색 A</span>
          <input
            onChange={(event) => onReplace({ ...block, coverTone: [event.target.value, block.coverTone[1]] })}
            type="color"
            value={block.coverTone[0]}
          />
        </label>
        <label className="studio-color">
          <span>커버색 B</span>
          <input
            onChange={(event) => onReplace({ ...block, coverTone: [block.coverTone[0], event.target.value] })}
            type="color"
            value={block.coverTone[1]}
          />
        </label>
      </div>
    </>
  );
}

function ImageFields({
  block,
  onReplace
}: {
  block: ImageProfileBlock;
  onReplace: (nextBlock: ProfileBlock) => void;
}) {
  function handleLocalFile(file: File | undefined) {
    void readImageFile(file)
      .then((image) => {
        if (!image) {
          return;
        }

        onReplace({ ...block, imageUrl: image.dataUrl, alt: block.alt || image.name });
      })
      .catch(() => undefined);
  }

  return (
    <>
      <label className="studio-field">
        <span>제목</span>
        <input onChange={(event) => onReplace({ ...block, title: event.target.value })} value={block.title} />
      </label>
      <label className="studio-field">
        <span>이미지 파일</span>
        <input accept="image/*" onChange={(event) => handleLocalFile(event.target.files?.[0])} type="file" />
        {isLocalImageDataUrl(block.imageUrl) ? <small className="studio-file-note">선택한 이미지 파일 사용 중</small> : null}
      </label>
      <label className="studio-field">
        <span>대체 텍스트</span>
        <input onChange={(event) => onReplace({ ...block, alt: event.target.value })} value={block.alt} />
      </label>
      <label className="studio-field">
        <span>캡션</span>
        <textarea onChange={(event) => onReplace({ ...block, caption: event.target.value })} rows={3} value={block.caption} />
      </label>
      <label className="studio-field">
        <span>태그</span>
        <input onChange={(event) => onReplace({ ...block, tags: textToList(event.target.value) })} value={listToText(block.tags)} />
      </label>
    </>
  );
}

function GalleryFields({
  block,
  onReplace
}: {
  block: GalleryProfileBlock;
  onReplace: (nextBlock: ProfileBlock) => void;
}) {
  const firstImage = block.images[0] ?? { url: "", alt: "" };

  function updateFirstImage(nextImage: { url: string; alt: string }) {
    onReplace({ ...block, images: [nextImage, ...block.images.slice(1)] });
  }

  function handleLocalFiles(files: FileList | null | undefined) {
    void readImageFiles(files)
      .then((images) => {
        if (!images.length) {
          return;
        }

        onReplace({
          ...block,
          images: images.map((image, index) => ({
            url: image.dataUrl,
            alt: block.images[index]?.alt || image.name
          }))
        });
      })
      .catch(() => undefined);
  }

  return (
    <>
      <label className="studio-field">
        <span>제목</span>
        <input onChange={(event) => onReplace({ ...block, title: event.target.value })} value={block.title} />
      </label>
      <label className="studio-field">
        <span>갤러리 이미지 파일</span>
        <input accept="image/*" multiple onChange={(event) => handleLocalFiles(event.target.files)} type="file" />
        {block.images.some((image) => isLocalImageDataUrl(image.url)) ? (
          <small className="studio-file-note">{block.images.length}장 선택한 이미지 파일 사용 중</small>
        ) : null}
      </label>
      <label className="studio-field">
        <span>첫 이미지 대체 텍스트</span>
        <input onChange={(event) => updateFirstImage({ ...firstImage, alt: event.target.value })} value={firstImage.alt} />
      </label>
      <label className="studio-field">
        <span>캡션</span>
        <textarea onChange={(event) => onReplace({ ...block, caption: event.target.value })} rows={3} value={block.caption} />
      </label>
      <label className="studio-field">
        <span>태그</span>
        <input onChange={(event) => onReplace({ ...block, tags: textToList(event.target.value) })} value={listToText(block.tags)} />
      </label>
    </>
  );
}

function ListFields({
  block,
  onReplace
}: {
  block: ListProfileBlock;
  onReplace: (nextBlock: ProfileBlock) => void;
}) {
  const [itemsText, setItemsText] = useState(() => linesToText(block.items));

  function updateItems(nextText: string) {
    setItemsText(nextText);
    onReplace({ ...block, items: textToLines(nextText) });
  }

  return (
    <>
      <label className="studio-field">
        <span>제목</span>
        <input onChange={(event) => onReplace({ ...block, title: event.target.value })} value={block.title} />
      </label>
      <label className="studio-field">
        <span>항목</span>
        <textarea onChange={(event) => updateItems(event.target.value)} rows={6} value={itemsText} />
      </label>
      <label className="studio-field">
        <span>목록 형식</span>
        <select
          onChange={(event) => onReplace({ ...block, ordered: event.target.value === "ordered" })}
          value={block.ordered ? "ordered" : "unordered"}
        >
          <option value="unordered">점 목록</option>
          <option value="ordered">번호 목록</option>
        </select>
      </label>
      <label className="studio-field">
        <span>메모</span>
        <textarea onChange={(event) => onReplace({ ...block, note: event.target.value })} rows={2} value={block.note ?? ""} />
      </label>
      <label className="studio-field">
        <span>태그</span>
        <input onChange={(event) => onReplace({ ...block, tags: textToList(event.target.value) })} value={listToText(block.tags)} />
      </label>
    </>
  );
}

function BlockFields({
  block,
  onReplace
}: {
  block: ProfileBlock;
  onReplace: (nextBlock: ProfileBlock) => void;
}) {
  if (block.type === "album" || block.type === "movie" || block.type === "book") {
    return <MediaFields block={block} onReplace={onReplace} />;
  }

  if (block.type === "text") {
    return (
      <>
        <label className="studio-field">
          <span>제목</span>
          <input onChange={(event) => onReplace({ ...block, title: event.target.value })} value={block.title} />
        </label>
        <label className="studio-field">
          <span>본문</span>
          <textarea onChange={(event) => onReplace({ ...block, body: event.target.value })} rows={5} value={block.body} />
        </label>
        <label className="studio-field">
          <span>태그</span>
          <input onChange={(event) => onReplace({ ...block, tags: textToList(event.target.value) })} value={listToText(block.tags)} />
        </label>
      </>
    );
  }

  if (block.type === "gallery") {
    return <GalleryFields block={block} onReplace={onReplace} />;
  }

  if (block.type === "image") {
    return <ImageFields block={block} onReplace={onReplace} />;
  }

  if (block.type === "video") {
    return (
      <>
        <label className="studio-field">
          <span>제목</span>
          <input onChange={(event) => onReplace({ ...block, title: event.target.value })} value={block.title} />
        </label>
        <label className="studio-field">
          <span>유튜브 주소</span>
          <input onChange={(event) => onReplace({ ...block, youtubeUrl: event.target.value })} value={block.youtubeUrl} />
        </label>
        <label className="studio-field">
          <span>설명</span>
          <textarea onChange={(event) => onReplace({ ...block, description: event.target.value })} rows={3} value={block.description} />
        </label>
        <label className="studio-field">
          <span>태그</span>
          <input onChange={(event) => onReplace({ ...block, tags: textToList(event.target.value) })} value={listToText(block.tags)} />
        </label>
      </>
    );
  }

  if (block.type === "link") {
    return (
      <>
        <label className="studio-field">
          <span>제목</span>
          <input onChange={(event) => onReplace({ ...block, title: event.target.value })} value={block.title} />
        </label>
        <label className="studio-field">
          <span>URL</span>
          <input onChange={(event) => onReplace({ ...block, url: event.target.value })} value={block.url} />
        </label>
        <label className="studio-field">
          <span>설명</span>
          <textarea onChange={(event) => onReplace({ ...block, description: event.target.value })} rows={3} value={block.description} />
        </label>
        <label className="studio-field">
          <span>태그</span>
          <input onChange={(event) => onReplace({ ...block, tags: textToList(event.target.value) })} value={listToText(block.tags)} />
        </label>
      </>
    );
  }

  if (block.type === "list") {
    return <ListFields block={block} key={block.id} onReplace={onReplace} />;
  }

  return (
    <>
      <label className="studio-field">
        <span>제목</span>
        <input onChange={(event) => onReplace({ ...block, title: event.target.value })} value={block.title} />
      </label>
      <label className="studio-field">
        <span>메모</span>
        <textarea onChange={(event) => onReplace({ ...block, note: event.target.value })} rows={2} value={block.note ?? ""} />
      </label>
      <label className="studio-field">
        <span>태그</span>
        <input onChange={(event) => onReplace({ ...block, tags: textToList(event.target.value) })} value={listToText(block.tags)} />
      </label>
    </>
  );
}

export function StudioBlockEditor({ onUpdate, profile }: StudioBlockEditorProps) {
  const [selectedBlockId, setSelectedBlockId] = useState(profile.blocks[0]?.id ?? "");
  const [draggingPayload, setDraggingPayload] = useState("");

  const selectedIndex = useMemo(
    () => profile.blocks.findIndex((block) => block.id === selectedBlockId),
    [profile.blocks, selectedBlockId]
  );
  const selectedBlock = selectedIndex >= 0 ? profile.blocks[selectedIndex] : profile.blocks[0];
  const selectedBlockIndex = selectedIndex >= 0 ? selectedIndex : 0;

  function addBlock(type: ProfileBlockType, index = profile.blocks.length) {
    const nextBlock = makeNewBlock(type, profile);
    onUpdate((draft) => {
      draft.blocks.splice(index, 0, nextBlock);
    });
    setSelectedBlockId(nextBlock.id);
  }

  function addRecipe(types: ProfileBlockType[]) {
    const nextBlocks = types.map((type) => makeNewBlock(type, profile));

    onUpdate((draft) => {
      draft.blocks.push(...nextBlocks);
    });
    setSelectedBlockId(nextBlocks.at(-1)?.id ?? "");
  }

  function replaceBlock(index: number, block: ProfileBlock) {
    onUpdate((draft) => {
      draft.blocks[index] = block;
    });
  }

  function removeBlock(index: number) {
    const fallbackBlock = profile.blocks[index + 1] ?? profile.blocks[index - 1];

    onUpdate((draft) => {
      draft.blocks = draft.blocks.filter((_, blockIndex) => blockIndex !== index);
    });

    setSelectedBlockId(fallbackBlock?.id ?? "");
  }

  function duplicateBlock(index: number) {
    const sourceBlock = profile.blocks[index];

    if (!sourceBlock) {
      return;
    }

    const nextBlock = duplicateProfileBlock(sourceBlock);
    onUpdate((draft) => {
      draft.blocks.splice(index + 1, 0, nextBlock);
    });
    setSelectedBlockId(nextBlock.id);
  }

  function moveBlock(fromIndex: number, insertIndex: number) {
    if (fromIndex === insertIndex || fromIndex + 1 === insertIndex) {
      return;
    }

    onUpdate((draft) => {
      const [movingBlock] = draft.blocks.splice(fromIndex, 1);
      const nextIndex = fromIndex < insertIndex ? insertIndex - 1 : insertIndex;
      draft.blocks.splice(nextIndex, 0, movingBlock);
    });
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>, index: number) {
    event.preventDefault();
    const payload = event.dataTransfer.getData(dragMimeType);
    setDraggingPayload("");

    if (payload.startsWith("new:")) {
      addBlock(payload.replace("new:", "") as ProfileBlockType, index);
      return;
    }

    if (payload.startsWith("move:")) {
      moveBlock(Number(payload.replace("move:", "")), index);
    }
  }

  function setDragPayload(event: DragEvent<HTMLElement>, payload: string) {
    event.dataTransfer.effectAllowed = payload.startsWith("new:") ? "copy" : "move";
    event.dataTransfer.setData(dragMimeType, payload);
    setDraggingPayload(payload);
  }

  return (
    <div className="studio-block-builder">
      {selectedBlock ? (
        <div className="studio-item studio-selected-editor">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="studio-eyebrow">
                블록 편집 #{String(selectedBlockIndex + 1).padStart(2, "0")} / {profileBlockTypeLabels[selectedBlock.type]}
              </p>
              <h3 className="studio-item-title">{selectedBlock.title}</h3>
            </div>
            <button className="studio-mini-button danger" onClick={() => removeBlock(selectedBlockIndex)} type="button">
              삭제
            </button>
            <button className="studio-mini-button" onClick={() => duplicateBlock(selectedBlockIndex)} type="button">
              복사
            </button>
          </div>

          <BlockFields block={selectedBlock} onReplace={(nextBlock) => replaceBlock(selectedBlockIndex, nextBlock)} />
        </div>
      ) : (
        <div className="studio-empty-state">
          <strong>아직 블록이 없습니다.</strong>
          <span>아래 팔레트에서 블록을 클릭하거나 끌어와 페이지를 시작하세요.</span>
        </div>
      )}

      <div className="studio-toolbelt">
        <div className="studio-toolbelt-label">
          <p className="studio-eyebrow">블록 스티커</p>
          <strong>클릭하면 추가되고, 끌면 원하는 위치에 놓을 수 있습니다.</strong>
        </div>
        <div className="studio-block-palette" aria-label="블록 팔레트">
          {blockTypes.map((type) => (
            <button
              draggable
              key={type}
              onClick={() => addBlock(type)}
              onDragEnd={() => setDraggingPayload("")}
              onDragStart={(event) => setDragPayload(event, `new:${type}`)}
              type="button"
            >
              <span>+ {profileBlockTypeLabels[type]}</span>
              <small>끌어서 넣기</small>
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

      <div className="studio-arrange-board">
        <div className="studio-arrange-header">
          <p className="studio-eyebrow">페이지 순서</p>
          <span>{profile.blocks.length}개 블록</span>
        </div>
        <div className="studio-block-map" aria-label="현재 페이지 블록">
          <DropSlot active={Boolean(draggingPayload)} index={0} onDropBlock={handleDrop} />
          {profile.blocks.map((block, index) => (
            <div className="studio-block-row" key={block.id}>
              <div
                className="studio-block-tile"
                data-selected={block.id === selectedBlock?.id}
                onClick={() => setSelectedBlockId(block.id)}
              >
                <BlockThumbnail block={block} index={index} />
                <span
                  className="studio-block-grip"
                  draggable
                  onClick={(event) => event.stopPropagation()}
                  onDragEnd={() => setDraggingPayload("")}
                  onDragStart={(event) => setDragPayload(event, `move:${index}`)}
                >
                  이동
                </span>
                <button className="studio-block-select" onClick={() => setSelectedBlockId(block.id)} type="button">
                  <small>
                    #{String(index + 1).padStart(2, "0")} / {profileBlockTypeLabels[block.type]}
                  </small>
                  <strong>{block.title}</strong>
                  <em>{getBlockSummary(block)}</em>
                </button>
                <div className="studio-block-actions">
                  <button
                    className="studio-mini-button"
                    disabled={index === 0}
                    onClick={(event) => {
                      event.stopPropagation();
                      moveBlock(index, index - 1);
                    }}
                    type="button"
                  >
                    위로
                  </button>
                  <button
                    className="studio-mini-button"
                    disabled={index === profile.blocks.length - 1}
                    onClick={(event) => {
                      event.stopPropagation();
                      moveBlock(index, index + 2);
                    }}
                    type="button"
                  >
                    아래로
                  </button>
                  <button
                    className="studio-mini-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      duplicateBlock(index);
                    }}
                    type="button"
                  >
                    복사
                  </button>
                  <button
                    className="studio-mini-button danger"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeBlock(index);
                    }}
                    type="button"
                  >
                    삭제
                  </button>
                </div>
              </div>
              <DropSlot active={Boolean(draggingPayload)} index={index + 1} onDropBlock={handleDrop} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
