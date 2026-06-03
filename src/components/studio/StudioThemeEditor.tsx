"use client";

import type {
  Profile,
  ProfileBackgroundSize,
  ProfileBlockType,
  ProfileBorderRadius,
  ProfileCardStyle,
  ProfileContentWidth,
  ProfileFontMood,
  ProfileLayout,
  ProfileLayoutDensity,
  ProfilePreset,
  ProfileShadowStyle
} from "@/data/sampleProfiles";
import { isLocalImageDataUrl, readImageFile } from "@/lib/localImage";

type StudioThemeEditorProps = {
  profile: Profile;
  presets: ProfilePreset[];
  onApplyPreset: (preset: ProfilePreset) => void;
  onUpdate: (recipe: (draft: Profile) => void) => void;
};

const layoutOptions = ["shelf", "zine", "room", "homepage"] satisfies ProfileLayout[];
const cardStyleOptions = ["paper", "outline", "tape", "glass"] satisfies ProfileCardStyle[];
const fontMoodOptions = ["serif", "mono", "clean"] satisfies ProfileFontMood[];
const widthOptions = ["narrow", "standard", "wide"] satisfies ProfileContentWidth[];
const radiusOptions = ["sharp", "soft", "rounded"] satisfies ProfileBorderRadius[];
const shadowOptions = ["none", "soft", "offset", "bold"] satisfies ProfileShadowStyle[];
const densityOptions = ["dense", "cozy", "airy"] satisfies ProfileLayoutDensity[];
const backgroundSizeOptions = ["cover", "tile", "contain"] satisfies ProfileBackgroundSize[];
const colorKeys = ["background", "paper", "accent", "ink", "muted", "border"] as const;
const backgroundPresets = [
  { label: "없음", value: "" },
  { label: "밤 방", value: "/samples/midnight-room.svg" },
  { label: "복사 진", value: "/samples/basement-zine.svg" },
  { label: "파스텔 책상", value: "/samples/pastel-desk.svg" },
  { label: "옛 홈페이지", value: "/samples/old-homepage.svg" },
  { label: "휴대용 오후", value: "/samples/pixel-room.svg" }
];
const layoutLabels = {
  shelf: "선반형",
  zine: "진형",
  room: "방형",
  homepage: "홈페이지형"
} satisfies Record<ProfileLayout, string>;
const cardStyleLabels = {
  paper: "종이",
  outline: "테두리",
  tape: "테이프",
  glass: "유리"
} satisfies Record<ProfileCardStyle, string>;
const fontMoodLabels = {
  serif: "세리프",
  mono: "모노",
  clean: "깔끔"
} satisfies Record<ProfileFontMood, string>;
const widthLabels = {
  narrow: "좁게",
  standard: "기본",
  wide: "넓게"
} satisfies Record<ProfileContentWidth, string>;
const radiusLabels = {
  sharp: "각지게",
  soft: "살짝 둥글게",
  rounded: "둥글게"
} satisfies Record<ProfileBorderRadius, string>;
const shadowLabels = {
  none: "없음",
  soft: "부드럽게",
  offset: "밀린 그림자",
  bold: "진하게"
} satisfies Record<ProfileShadowStyle, string>;
const densityLabels = {
  dense: "촘촘하게",
  cozy: "기본",
  airy: "여유롭게"
} satisfies Record<ProfileLayoutDensity, string>;
const backgroundSizeLabels = {
  cover: "꽉 채우기",
  tile: "반복",
  contain: "전체 보이기"
} satisfies Record<ProfileBackgroundSize, string>;
const colorLabels = {
  background: "배경색",
  paper: "종이색",
  accent: "강조색",
  ink: "글자색",
  muted: "보조 글자색",
  border: "테두리색"
} satisfies Record<(typeof colorKeys)[number], string>;

function reorderBlocksByPreset(profile: Profile, order: ProfileBlockType[]) {
  const orderMap = new Map(order.map((type, index) => [type, index]));

  return [...profile.blocks].sort((left, right) => {
    const leftOrder = orderMap.get(left.type) ?? 99;
    const rightOrder = orderMap.get(right.type) ?? 99;
    return leftOrder - rightOrder;
  });
}

export function StudioThemeEditor({ onApplyPreset, onUpdate, presets, profile }: StudioThemeEditorProps) {
  function handleBackgroundFile(file: File | undefined) {
    void readImageFile(file)
      .then((image) => {
        if (!image) {
          return;
        }

        onUpdate((draft) => {
          draft.theme.backgroundImage = image.dataUrl;
          draft.theme.backgroundSize = "cover";
          draft.theme.slug = "custom-local";
        });
      })
      .catch(() => undefined);
  }

  return (
    <div className="grid gap-4">
      <label className="studio-field">
        <span>비주얼 프리셋</span>
        <select
          onChange={(event) => {
            const preset = presets.find((item) => item.slug === event.target.value);

            if (preset) {
              onApplyPreset(preset);
            }
          }}
          value={profile.selectedPreset}
        >
          {presets.map((preset) => (
            <option key={preset.slug} value={preset.slug}>
              {preset.label} - {preset.mood}
            </option>
          ))}
        </select>
      </label>

      <div className="studio-preset-actions">
        {presets.map((preset) => (
          <button key={preset.slug} onClick={() => onApplyPreset(preset)} type="button">
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="studio-field">
          <span>레이아웃 프리셋</span>
          <select
            onChange={(event) =>
              onUpdate((draft) => {
                draft.layout = event.target.value as ProfileLayout;
              })
            }
            value={profile.layout}
          >
            {layoutOptions.map((item) => (
              <option key={item} value={item}>
                {layoutLabels[item]}
              </option>
            ))}
          </select>
        </label>

        <label className="studio-field">
          <span>배경화면 프리셋</span>
          <select
            onChange={(event) =>
              onUpdate((draft) => {
                if (event.target.value === "__custom__") {
                  return;
                }

                draft.theme.backgroundImage = event.target.value;
              })
            }
            value={backgroundPresets.some((item) => item.value === profile.theme.backgroundImage) ? profile.theme.backgroundImage : "__custom__"}
          >
            <option value="__custom__">선택한 파일</option>
            {backgroundPresets.map((item) => (
              <option key={item.label} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="studio-field">
        <span>내 배경 이미지 선택</span>
        <input accept="image/*" onChange={(event) => handleBackgroundFile(event.target.files?.[0])} type="file" />
        {isLocalImageDataUrl(profile.theme.backgroundImage) ? <small className="studio-file-note">선택한 이미지 파일 사용 중</small> : null}
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        {colorKeys.map((key) => (
          <label className="studio-color" key={key}>
            <span>{colorLabels[key]}</span>
            <input
              onChange={(event) =>
                onUpdate((draft) => {
                  draft.theme[key] = event.target.value;
                  draft.theme.slug = "custom-local";
                })
              }
              type="color"
              value={profile.theme[key]}
            />
          </label>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="studio-field">
          <span>카드 스타일</span>
          <select
            onChange={(event) =>
              onUpdate((draft) => {
                draft.theme.cardStyle = event.target.value as ProfileCardStyle;
                draft.theme.slug = "custom-local";
              })
            }
            value={profile.theme.cardStyle}
          >
            {cardStyleOptions.map((item) => (
              <option key={item} value={item}>
                {cardStyleLabels[item]}
              </option>
            ))}
          </select>
        </label>

        <label className="studio-field">
          <span>폰트 느낌</span>
          <select
            onChange={(event) =>
              onUpdate((draft) => {
                draft.theme.fontMood = event.target.value as ProfileFontMood;
                draft.theme.slug = "custom-local";
              })
            }
            value={profile.theme.fontMood}
          >
            {fontMoodOptions.map((item) => (
              <option key={item} value={item}>
                {fontMoodLabels[item]}
              </option>
            ))}
          </select>
        </label>

        <label className="studio-field">
          <span>내용 폭</span>
          <select
            onChange={(event) =>
              onUpdate((draft) => {
                draft.theme.contentWidth = event.target.value as ProfileContentWidth;
                draft.theme.slug = "custom-local";
              })
            }
            value={profile.theme.contentWidth}
          >
            {widthOptions.map((item) => (
              <option key={item} value={item}>
                {widthLabels[item]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="studio-field">
          <span>모서리</span>
          <select
            onChange={(event) =>
              onUpdate((draft) => {
                draft.theme.borderRadius = event.target.value as ProfileBorderRadius;
                draft.theme.slug = "custom-local";
              })
            }
            value={profile.theme.borderRadius}
          >
            {radiusOptions.map((item) => (
              <option key={item} value={item}>
                {radiusLabels[item]}
              </option>
            ))}
          </select>
        </label>

        <label className="studio-field">
          <span>그림자</span>
          <select
            onChange={(event) =>
              onUpdate((draft) => {
                draft.theme.shadowStyle = event.target.value as ProfileShadowStyle;
                draft.theme.slug = "custom-local";
              })
            }
            value={profile.theme.shadowStyle}
          >
            {shadowOptions.map((item) => (
              <option key={item} value={item}>
                {shadowLabels[item]}
              </option>
            ))}
          </select>
        </label>

        <label className="studio-field">
          <span>배치 밀도</span>
          <select
            onChange={(event) =>
              onUpdate((draft) => {
                draft.theme.layoutDensity = event.target.value as ProfileLayoutDensity;
                draft.theme.slug = "custom-local";
              })
            }
            value={profile.theme.layoutDensity}
          >
            {densityOptions.map((item) => (
              <option key={item} value={item}>
                {densityLabels[item]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="studio-field">
          <span>배경 크기</span>
          <select
            onChange={(event) =>
              onUpdate((draft) => {
                draft.theme.backgroundSize = event.target.value as ProfileBackgroundSize;
              })
            }
            value={profile.theme.backgroundSize}
          >
            {backgroundSizeOptions.map((item) => (
              <option key={item} value={item}>
                {backgroundSizeLabels[item]}
              </option>
            ))}
          </select>
        </label>

        <label className="studio-field">
          <span>배경 어둡게</span>
          <input
            max={90}
            min={0}
            onChange={(event) =>
              onUpdate((draft) => {
                draft.theme.backgroundOverlay = Number(event.target.value);
              })
            }
            type="range"
            value={profile.theme.backgroundOverlay}
          />
        </label>

        <label className="studio-field">
          <span>배경 흐림</span>
          <input
            max={8}
            min={0}
            onChange={(event) =>
              onUpdate((draft) => {
                draft.theme.backgroundBlur = Number(event.target.value);
              })
            }
            type="range"
            value={profile.theme.backgroundBlur}
          />
        </label>
      </div>

      <div className="studio-note">
        프리셋은 블록 순서, 테마, 레이아웃, 밀도, 배경화면, 모서리, 그림자를 함께 바꿉니다. customCss는 데이터에만 남겨두고,
        제한 없는 CSS 편집은 이번 MVP에서 일부러 꺼두었습니다.
      </div>
    </div>
  );
}

export { reorderBlocksByPreset };
