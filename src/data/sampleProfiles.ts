export type ProfileLayout = "zine" | "shelf" | "room" | "homepage";

export type ProfileCardStyle = "paper" | "outline" | "tape" | "glass";

export type ProfileFontMood = "serif" | "mono" | "clean";

export type ProfileContentWidth = "narrow" | "standard" | "wide";

export type ProfileBorderRadius = "sharp" | "soft" | "rounded";

export type ProfileShadowStyle = "none" | "soft" | "offset" | "bold";

export type ProfileLayoutDensity = "dense" | "cozy" | "airy";

export type ProfileBackgroundSize = "cover" | "tile" | "contain";

export type ProfileBlockType =
  | "album"
  | "movie"
  | "book"
  | "text"
  | "link"
  | "image"
  | "gallery"
  | "video"
  | "list"
  | "tags";

export type ProfileTheme = {
  slug: string;
  background: string;
  paper: string;
  ink: string;
  muted: string;
  accent: string;
  border: string;
  cardStyle: ProfileCardStyle;
  fontMood: ProfileFontMood;
  contentWidth: ProfileContentWidth;
  borderRadius: ProfileBorderRadius;
  shadowStyle: ProfileShadowStyle;
  layoutDensity: ProfileLayoutDensity;
  backgroundImage: string;
  backgroundSize: ProfileBackgroundSize;
  backgroundOverlay: number;
  backgroundBlur: number;
  customCss?: string;
};

export type ProfileLink = {
  label: string;
  url: string;
};

export type PinnedObject = {
  label: string;
  title: string;
  note: string;
};

export type ProfileComment = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

type ProfileBlockBase = {
  id: string;
  type: ProfileBlockType;
  title?: string;
  note?: string;
  tags?: string[];
  comments?: ProfileComment[];
};

export type MediaProfileBlock = ProfileBlockBase & {
  type: "album" | "movie" | "book";
  title: string;
  creator: string;
  year: string;
  note: string;
  tags: string[];
  coverLabel: string;
  coverTone: [string, string];
  imageUrl?: string;
  link?: string;
};

export type TextProfileBlock = ProfileBlockBase & {
  type: "text";
  title: string;
  body: string;
  tags?: string[];
};

export type LinkProfileBlock = ProfileBlockBase & {
  type: "link";
  title: string;
  url: string;
  description: string;
  tags?: string[];
};

export type ImageProfileBlock = ProfileBlockBase & {
  type: "image";
  title: string;
  imageUrl: string;
  alt: string;
  caption: string;
  tags?: string[];
};

export type GalleryImage = {
  url: string;
  alt: string;
};

export type GalleryProfileBlock = ProfileBlockBase & {
  type: "gallery";
  title: string;
  images: GalleryImage[];
  caption: string;
  tags?: string[];
};

export type VideoProfileBlock = ProfileBlockBase & {
  type: "video";
  title: string;
  youtubeUrl: string;
  description: string;
  tags?: string[];
};

export type TagsProfileBlock = ProfileBlockBase & {
  type: "tags";
  title: string;
  tags: string[];
  note?: string;
};

export type ListProfileBlock = ProfileBlockBase & {
  type: "list";
  title: string;
  items: string[];
  note?: string;
  ordered?: boolean;
  tags?: string[];
};

export type ProfileBlock =
  | MediaProfileBlock
  | TextProfileBlock
  | LinkProfileBlock
  | ImageProfileBlock
  | GalleryProfileBlock
  | VideoProfileBlock
  | ListProfileBlock
  | TagsProfileBlock;

export type Profile = {
  username: string;
  nickname: string;
  avatarUrl: string;
  coverImageUrl: string;
  bio: string;
  statusLine: string;
  heroLine: string;
  selectedPreset: string;
  layout: ProfileLayout;
  theme: ProfileTheme;
  curationTags: string[];
  profileLinks: ProfileLink[];
  pinnedObjects: PinnedObject[];
  guestbook?: ProfileComment[];
  blocks: ProfileBlock[];
};

export type ProfilePreset = {
  slug: string;
  label: string;
  mood: string;
  layout: ProfileLayout;
  theme: ProfileTheme;
  blockOrder: ProfileBlockType[];
};

export const profileBlockTypeLabels = {
  album: "앨범",
  movie: "영화",
  book: "책",
  text: "글",
  link: "링크",
  image: "이미지",
  gallery: "갤러리",
  video: "유튜브",
  list: "리스트",
  tags: "태그"
} satisfies Record<ProfileBlockType, string>;

const darkZineTheme: ProfileTheme = {
  slug: "dark-zine",
  background: "#201f26",
  paper: "#f2ead8",
  ink: "#191512",
  muted: "#655c51",
  accent: "#d56042",
  border: "#17120f",
  cardStyle: "tape",
  fontMood: "mono",
  contentWidth: "wide",
  borderRadius: "sharp",
  shadowStyle: "bold",
  layoutDensity: "dense",
  backgroundImage: "/samples/basement-zine.svg",
  backgroundSize: "cover",
  backgroundOverlay: 72,
  backgroundBlur: 1,
  customCss: ""
};

const cutePastelTheme: ProfileTheme = {
  slug: "cute-pastel",
  background: "#f4cfdf",
  paper: "#fff8dc",
  ink: "#332133",
  muted: "#7b6375",
  accent: "#e2779b",
  border: "#53364f",
  cardStyle: "glass",
  fontMood: "clean",
  contentWidth: "standard",
  borderRadius: "rounded",
  shadowStyle: "soft",
  layoutDensity: "airy",
  backgroundImage: "/samples/pastel-desk.svg",
  backgroundSize: "cover",
  backgroundOverlay: 45,
  backgroundBlur: 0,
  customCss: ""
};

const oldHomepageTheme: ProfileTheme = {
  slug: "old-homepage",
  background: "#23376f",
  paper: "#f5e56b",
  ink: "#141414",
  muted: "#3c3762",
  accent: "#23a6a6",
  border: "#101024",
  cardStyle: "outline",
  fontMood: "serif",
  contentWidth: "wide",
  borderRadius: "soft",
  shadowStyle: "offset",
  layoutDensity: "cozy",
  backgroundImage: "/samples/old-homepage.svg",
  backgroundSize: "tile",
  backgroundOverlay: 35,
  backgroundBlur: 0,
  customCss: ""
};

const minimalArchiveTheme: ProfileTheme = {
  slug: "minimal-archive",
  background: "#ebe7dc",
  paper: "#fffdf6",
  ink: "#1f2320",
  muted: "#646961",
  accent: "#2f6f73",
  border: "#32352f",
  cardStyle: "paper",
  fontMood: "clean",
  contentWidth: "narrow",
  borderRadius: "sharp",
  shadowStyle: "none",
  layoutDensity: "cozy",
  backgroundImage: "",
  backgroundSize: "cover",
  backgroundOverlay: 0,
  backgroundBlur: 0,
  customCss: ""
};

const musicRoomTheme: ProfileTheme = {
  slug: "music-room",
  background: "#2f3640",
  paper: "#f3ead2",
  ink: "#201a18",
  muted: "#665f56",
  accent: "#7c3f35",
  border: "#2a2521",
  cardStyle: "paper",
  fontMood: "serif",
  contentWidth: "standard",
  borderRadius: "soft",
  shadowStyle: "offset",
  layoutDensity: "cozy",
  backgroundImage: "/samples/midnight-room.svg",
  backgroundSize: "cover",
  backgroundOverlay: 58,
  backgroundBlur: 1,
  customCss: ""
};

export const profilePresets: ProfilePreset[] = [
  {
    slug: "dark-zine",
    label: "다크 진",
    mood: "복사된 종이, 노이즈, 벽에 붙인 테이프",
    layout: "zine",
    theme: darkZineTheme,
    blockOrder: ["text", "list", "album", "image", "gallery", "video", "movie", "book", "link", "tags"]
  },
  {
    slug: "cute-pastel",
    label: "파스텔 책상",
    mood: "부드러운 책상, 스티커, 작은 기쁨",
    layout: "room",
    theme: cutePastelTheme,
    blockOrder: ["gallery", "image", "list", "tags", "album", "video", "text", "movie", "book", "link"]
  },
  {
    slug: "old-homepage",
    label: "옛 인터넷 홈",
    mood: "방명록 없는 방명록 감성",
    layout: "homepage",
    theme: oldHomepageTheme,
    blockOrder: ["text", "list", "link", "video", "image", "gallery", "album", "movie", "book", "tags"]
  },
  {
    slug: "minimal-archive",
    label: "미니멀 아카이브",
    mood: "조용한 목록, 신중한 메모",
    layout: "shelf",
    theme: minimalArchiveTheme,
    blockOrder: ["album", "movie", "book", "list", "image", "text", "gallery", "video", "link", "tags"]
  },
  {
    slug: "music-room",
    label: "음악 수납장",
    mood: "레코드, 파란 조명, 늦은 밤의 탭",
    layout: "shelf",
    theme: musicRoomTheme,
    blockOrder: ["gallery", "image", "list", "text", "album", "video", "movie", "book", "link", "tags"]
  }
];

const sampleComment = (id: string, author: string, body: string, createdAt: string): ProfileComment => ({
  id,
  author,
  body,
  createdAt
});

export const sampleProfiles: Profile[] = [
  {
    username: "mira-room",
    nickname: "mira / 밤의 수납장",
    avatarUrl: "/samples/avatar-mira.svg",
    coverImageUrl: "/samples/midnight-room.svg",
    bio: "오래된 블로그 스킨, 중고 음반 가게, 파란 영화 프레임을 모아 둔다. 취향을 랭킹보다 방 안의 물건처럼 기록하는 사람.",
    statusLine: "지금 보관 중: 느린 앨범, 파란 영화, 유령 같은 책",
    heroLine: "취향은 목록이면서 동시에 작은 방이다.",
    selectedPreset: "music-room",
    layout: "shelf",
    theme: musicRoomTheme,
    curationTags: ["드림팝", "느린 영화", "종이 먼지", "조용한 게임"],
    profileLinks: [
      { label: "플레이리스트 기록", url: "https://example.com/mira-playlist" },
      { label: "영화 노트", url: "https://example.com/mira-films" }
    ],
    pinnedObjects: [
      {
        label: "물건 01",
        title: "낡은 헤드폰",
        note: "볼륨을 낮추면 작은 소리의 결들이 더 오래 남는다."
      },
      {
        label: "물건 02",
        title: "파란 VHS 라벨",
        note: "제목보다 빛바랜 스티커가 먼저 기억나는 영화들."
      },
      {
        label: "물건 03",
        title: "반 접힌 지도",
        note: "게임 속 길은 실제 골목보다 자주 찾아간다."
      }
    ],
    guestbook: [
      sampleComment("mira-guestbook-1", "새벽손님", "방에 들어오자마자 조명이 낮아지는 느낌이에요. 플레이리스트 링크도 오래 열어둘게요.", "2026-05-18T14:24:00.000Z"),
      sampleComment("mira-guestbook-2", "유리", "파란 VHS 라벨 설명이 좋아서 제 책상 위 물건도 하나씩 적어보고 싶어졌어요.", "2026-05-25T09:12:00.000Z")
    ],
    blocks: [
      {
        id: "mira-gallery-desk",
        type: "gallery",
        title: "책상 구석, 01:24",
        images: [
          { url: "/samples/midnight-room.svg", alt: "레코드와 책, 파란 램프가 있는 밤의 책상" },
          { url: "/samples/basement-zine.svg", alt: "테이프로 붙인 종이와 음악 메모가 있는 작은 벽" }
        ],
        caption: "밤에는 모든 물건이 표지처럼 보인다.",
        tags: ["방", "파란 조명"],
        comments: [
          sampleComment("mira-gallery-desk-comment-1", "nora", "두 번째 컷이 포스터처럼 보여요. 카드 안에 작은 창문이 생긴 느낌.", "2026-05-19T22:10:00.000Z")
        ]
      },
      {
        id: "mira-image-sleeve",
        type: "image",
        title: "램프 옆에 붙인 레코드 슬리브",
        imageUrl: "/samples/midnight-room.svg",
        alt: "레코드 슬리브처럼 기억되는 늦은 밤의 방 그림",
        caption: "긴 소개글보다 방 전체를 빠르게 설명하는 한 장의 이미지.",
        tags: ["이미지", "슬리브", "파랑"]
      },
      {
        id: "mira-text-manifesto",
        type: "text",
        title: "느린 목록 선언문",
        body: "요즘은 취향을 너무 빨리 설명해야 하는 느낌이 있다. 나는 반대로 천천히 좋아하는 것들을 늘어놓고 싶다.\n\n앨범 하나가 책갈피가 되고, 영화의 조명이 게임의 길처럼 남는 방식. 이 페이지는 그런 연결을 숨기지 않는 작은 방이다.",
        tags: ["선언문", "느린 아카이브"]
      },
      {
        id: "mira-list-night-shelf",
        type: "list",
        title: "밤 선반에 남겨 둔 순서",
        note: "이 방에서 오래 켜두는 것들.",
        items: ["파란 램프 먼저 켜기", "소리가 작은 앨범 한 장 고르기", "영화 프레임을 책갈피처럼 저장하기", "잠들기 전에 링크 하나만 더 열어보기"],
        tags: ["목록", "밤", "선반"]
      },
      {
        id: "mira-album-heaven",
        type: "album",
        title: "Heaven or Las Vegas",
        creator: "Cocteau Twins",
        year: "1990",
        note: "뜻을 몰라도 정확히 기억나는 멜로디. 새벽의 벽지 같은 앨범.",
        tags: ["드림팝", "빛남", "늦은 밤"],
        coverLabel: "CT",
        coverTone: ["#7c3f7c", "#e0a24a"],
        comments: [
          sampleComment("mira-album-heaven-comment-1", "파란귀", "이 앨범을 벽지라고 부르는 말이 너무 정확해서 한 줄 적고 갑니다.", "2026-05-22T01:42:00.000Z")
        ]
      },
      {
        id: "mira-video-lamp",
        type: "video",
        title: "파란 램프 라디오",
        youtubeUrl: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
        description: "공부 방송이라기보다 밤의 방에 틀어 둔 가짜 창문 같은 영상.",
        tags: ["유튜브", "앰비언트", "늦은 밤"]
      },
      {
        id: "mira-movie-chungking",
        type: "movie",
        title: "Chungking Express",
        creator: "Wong Kar-wai",
        year: "1994",
        note: "도시는 빠르게 움직이고 마음은 이상하게 천천히 따라온다.",
        tags: ["네온", "외로움", "도시"],
        coverLabel: "CE",
        coverTone: ["#1e6a83", "#d8a03b"]
      },
      {
        id: "mira-book-cities",
        type: "book",
        title: "Invisible Cities",
        creator: "Italo Calvino",
        year: "1972",
        note: "존재하지 않는 도시가 실제 기억보다 또렷해지는 책.",
        tags: ["도시", "파편", "꿈"],
        coverLabel: "IC",
        coverTone: ["#3d5b4f", "#c0a35b"]
      },
      {
        id: "mira-link-radio",
        type: "link",
        title: "새벽 플레이리스트 메모",
        url: "https://example.com/midnight-radio",
        description: "혼자 듣는 음악을 공개 페이지에 걸어 두는 기분을 테스트하기 위한 링크 블록.",
        tags: ["플레이리스트", "레퍼런스"]
      },
      {
        id: "mira-tags",
        type: "tags",
        title: "이 방의 온도",
        note: "느린 소리, 낮은 조도, 종이 먼지, 작은 게임 저장 파일.",
        tags: ["앰비언트", "종이", "파랑", "저장 지점", "멜랑콜리"]
      }
    ]
  },
  {
    username: "basement-zine",
    nickname: "지하실 진열장",
    avatarUrl: "/samples/avatar-zine.svg",
    coverImageUrl: "/samples/basement-zine.svg",
    bio: "복사기 자국, 라이브하우스 포스터, 접힌 영수증을 수집한다. 완성된 취향보다 덜 마른 잉크가 좋다.",
    statusLine: "지금 보관 중: 시끄러운 레코드, 펑크 영화, 여백 메모",
    heroLine: "좋아하는 것들은 언제나 조금 삐뚤게 붙어 있다.",
    selectedPreset: "dark-zine",
    layout: "zine",
    theme: darkZineTheme,
    curationTags: ["진 벽", "포스트펑크", "주운 종이", "긁힌 매체"],
    profileLinks: [
      { label: "스캔 선반", url: "https://example.com/zine-shelf" },
      { label: "공연 일기", url: "https://example.com/show-diary" }
    ],
    pinnedObjects: [
      {
        label: "물건 01",
        title: "찢어진 공연 전단",
        note: "기억은 입장 시간보다 뒷면의 낙서에 가깝다."
      },
      {
        label: "물건 02",
        title: "빨간 형광펜",
        note: "좋아하는 문장 옆에는 과격한 밑줄이 필요하다."
      },
      {
        label: "물건 03",
        title: "반쯤 죽은 스티커",
        note: "끝이 말려 올라간 채로도 계속 붙어 있는 것들."
      }
    ],
    guestbook: [
      sampleComment("zine-guestbook-1", "복사실 옆자리", "여백까지 취향처럼 보여서 좋았어요. 너무 깨끗하지 않은 페이지가 더 오래 남네요.", "2026-05-11T18:03:00.000Z"),
      sampleComment("zine-guestbook-2", "m.", "전단 조각들이 서로 밀고 있는 느낌. 다음에 공연 일기도 보고 싶어요.", "2026-05-29T20:35:00.000Z")
    ],
    blocks: [
      {
        id: "zine-text-wall",
        type: "text",
        title: "벽에 붙인 설명",
        body: "이 페이지는 깨끗한 포트폴리오가 아니다. 음반, 영화, 책, 링크가 서로 겹쳐 붙은 임시 게시판에 더 가깝다.\n\n잘 정돈된 추천보다 어쩌다 남겨진 메모가 더 오래 간다.",
        tags: ["진", "메모"],
        comments: [
          sampleComment("zine-text-wall-comment-1", "밑줄", "정돈된 추천보다 남겨진 메모가 오래 간다는 문장에 형광펜 긋고 싶어요.", "2026-05-14T13:20:00.000Z")
        ]
      },
      {
        id: "zine-list-found-paper",
        type: "list",
        title: "책상에 계속 남는 종이",
        note: "버리려고 모아두면 더 중요해지는 것들.",
        ordered: true,
        items: ["공연 전단", "영수증 뒷면 낙서", "스캔하다 잘린 사진", "빨간 펜으로 표시한 문장"],
        tags: ["종이", "순서", "메모"]
      },
      {
        id: "zine-album-entertainment",
        type: "album",
        title: "Entertainment!",
        creator: "Gang of Four",
        year: "1979",
        note: "마른 리듬과 날카로운 문장이 벽에 붙은 포스터처럼 흔들린다.",
        tags: ["포스트펑크", "각진 리듬", "정치성"],
        coverLabel: "GF",
        coverTone: ["#d6c33f", "#151515"]
      },
      {
        id: "zine-gallery-board",
        type: "gallery",
        title: "복사 종이 보드",
        images: [
          { url: "/samples/basement-zine.svg", alt: "티켓과 테이프가 붙은 복사 진 보드" },
          { url: "/samples/old-homepage.svg", alt: "밝은 색의 옛 인터넷 홈페이지 배경" }
        ],
        caption: "복사된 종이도 여러 번 붙이면 방의 벽지가 된다.",
        tags: ["종이", "테이프", "벽"],
        comments: [
          sampleComment("zine-gallery-board-comment-1", "no input", "테이프 자국까지 남겨둔 게 좋아요. 진짜 게시판처럼 보여요.", "2026-05-30T07:51:00.000Z")
        ]
      },
      {
        id: "zine-image-ticket",
        type: "image",
        title: "입자가 너무 많은 티켓 스캔",
        imageUrl: "/samples/basement-zine.svg",
        alt: "노이즈 많은 공연 티켓 스캔처럼 보이는 진 벽 그림",
        caption: "페이지가 스프레드시트보다 벽처럼 느껴지도록 크게 남긴 이미지.",
        tags: ["이미지", "스캔", "복사"]
      },
      {
        id: "zine-video-static",
        type: "video",
        title: "연습실 정전기",
        youtubeUrl: "https://youtu.be/5qap5aO4i9A",
        description: "아무것도 하지 않는 시간까지 페이지에 붙여 두는 실험.",
        tags: ["영상", "노이즈", "반복"]
      },
      {
        id: "zine-movie-smithereens",
        type: "movie",
        title: "Smithereens",
        creator: "Susan Seidelman",
        year: "1982",
        note: "도시는 친절하지 않은데, 그래서 더 솔직하게 남는다.",
        tags: ["뉴욕", "펑크", "표류"],
        coverLabel: "SM",
        coverTone: ["#215e73", "#c94739"]
      },
      {
        id: "zine-book-bluets",
        type: "book",
        title: "Bluets",
        creator: "Maggie Nelson",
        year: "2009",
        note: "색 하나만 붙들고도 마음은 충분히 복잡해진다.",
        tags: ["파랑", "파편", "에세이"],
        coverLabel: "BL",
        coverTone: ["#1f4e79", "#b7c3d7"]
      },
      {
        id: "zine-link-scan",
        type: "link",
        title: "스캔한 전단 아카이브",
        url: "https://example.com/zine-shelf",
        description: "언젠가 실제 아카이브가 붙을 자리를 더미 링크로 남겨 둔다.",
        tags: ["아카이브", "스캔"]
      },
      {
        id: "zine-tags",
        type: "tags",
        title: "붙어 있는 단어들",
        note: "정리보다 밀도가 먼저인 샘플 프로필.",
        tags: ["복사", "노이즈", "여백", "티켓", "지하실"]
      }
    ]
  },
  {
    username: "pixel-room",
    nickname: "작은 저장방",
    avatarUrl: "/samples/avatar-pixel.svg",
    coverImageUrl: "/samples/pixel-room.svg",
    bio: "작은 화면 안의 노을, 오래된 게임기의 배터리 경고, 가벼운 책과 반복되는 배경음을 좋아한다.",
    statusLine: "지금 보관 중: 휴대용 게임, 부드러운 책, 작은 반복음",
    heroLine: "작은 화면도 충분히 넓은 세계가 된다.",
    selectedPreset: "cute-pastel",
    layout: "room",
    theme: cutePastelTheme,
    curationTags: ["휴대용", "포근한 이상함", "작은 세계", "부드러운 멜랑콜리"],
    profileLinks: [
      { label: "작은 지도", url: "https://example.com/tiny-map" },
      { label: "저장 노트", url: "https://example.com/save-notes" }
    ],
    pinnedObjects: [
      {
        label: "물건 01",
        title: "스티커 붙은 게임기",
        note: "배터리 칸이 헐거워도 손에 익은 무게."
      },
      {
        label: "물건 02",
        title: "창가의 작은 화분",
        note: "보이지 않는 속도로 배경 그래픽처럼 빛난다."
      },
      {
        label: "물건 03",
        title: "반짝이 스프링 노트",
        note: "중요한 기록은 조금 유치해도 된다."
      }
    ],
    guestbook: [
      sampleComment("pixel-guestbook-1", "세이브러", "작은 세계 지도 링크 이름이 귀여워요. 방 전체가 저장 슬롯처럼 느껴집니다.", "2026-05-21T10:08:00.000Z"),
      sampleComment("pixel-guestbook-2", "낮잠", "태그 구름이 주머니 안에서 굴러다니는 물건 같아요. 잠깐 들렀다 갑니다.", "2026-06-01T16:44:00.000Z")
    ],
    blocks: [
      {
        id: "pixel-gallery-window",
        type: "gallery",
        title: "휴대용 오후",
        images: [
          { url: "/samples/pixel-room.svg", alt: "햇빛 드는 책상 위의 작은 휴대용 게임기" },
          { url: "/samples/pastel-desk.svg", alt: "스티커와 부드러운 색이 있는 파스텔 책상" }
        ],
        caption: "저장 화면을 켜 둔 채로 오후가 지나간다.",
        tags: ["휴대용", "햇빛"],
        comments: [
          sampleComment("pixel-gallery-window-comment-1", "tiny", "햇빛 들어오는 게임기 컷이 제일 먼저 눌러보고 싶은 카드예요.", "2026-05-23T15:12:00.000Z")
        ]
      },
      {
        id: "pixel-image-savepoint",
        type: "image",
        title: "저장 지점 엽서",
        imageUrl: "/samples/pixel-room.svg",
        alt: "저장 지점 엽서처럼 쓰인 작은 픽셀 방 그림",
        caption: "작은 화면이 장소처럼 느껴지기 시작하는 순간을 꽂아둔 이미지.",
        tags: ["이미지", "저장 지점", "휴대용"]
      },
      {
        id: "pixel-tags",
        type: "tags",
        title: "주머니 속 태그",
        note: "따뜻한 색, 짧은 루프, 낮은 난이도, 오래 남는 방.",
        tags: ["휴대용", "포근함", "반복", "정원", "부드러움"],
        comments: [
          sampleComment("pixel-tags-comment-1", "봄비", "낮은 난이도라는 태그가 마음에 남아요. 취향에도 난이도가 있다는 말 같아서.", "2026-05-28T12:36:00.000Z")
        ]
      },
      {
        id: "pixel-list-save-slots",
        type: "list",
        title: "저장 슬롯에 넣어둘 것",
        note: "작지만 다시 불러오고 싶은 장면들.",
        items: ["비 오는 창문 소리", "마을 지도 모서리", "튜토리얼이 끝난 뒤의 조용함", "작은 빵집 앞 불빛"],
        tags: ["저장", "작은 장면"]
      },
      {
        id: "pixel-album-bonito",
        type: "album",
        title: "Bonito Generation",
        creator: "Kero Kero Bonito",
        year: "2016",
        note: "귀엽지만 납작하지 않고, 정면으로 반짝이는 팝.",
        tags: ["팝", "밝음", "장난감"],
        coverLabel: "KB",
        coverTone: ["#f1b34c", "#e76f7c"]
      },
      {
        id: "pixel-video-window",
        type: "video",
        title: "비 오는 창문 반복",
        youtubeUrl: "https://www.youtube.com/watch?v=DWcJFNfaw9c",
        description: "게임을 멈춰 둔 동안에도 방에 남아 있는 작은 소리.",
        tags: ["반복", "창문", "부드러움"]
      },
      {
        id: "pixel-text-save",
        type: "text",
        title: "저장 파일에 남기는 말",
        body: "커다란 세계관보다 손바닥 안에 들어오는 장소가 좋다. 매일 조금씩 바뀌는 마을, 멈춰 있는 듯 보이는 배경음, 너무 작아서 오래 보게 되는 물건들.\n\n취향은 큰 선언보다 작은 버튼 소리에 가깝다.",
        tags: ["저장 파일", "작음"]
      },
      {
        id: "pixel-movie-kiki",
        type: "movie",
        title: "Kiki's Delivery Service",
        creator: "Hayao Miyazaki",
        year: "1989",
        note: "어른이 된다는 말보다 작은 배달을 계속하는 쪽이 믿음직하다.",
        tags: ["비행", "마을", "빵"],
        coverLabel: "KD",
        coverTone: ["#315e81", "#d99556"]
      },
      {
        id: "pixel-book-summer",
        type: "book",
        title: "The Summer Book",
        creator: "Tove Jansson",
        year: "1972",
        note: "여름의 오후처럼 간단하고 깊은 대화들.",
        tags: ["섬", "여름", "작음"],
        coverLabel: "SB",
        coverTone: ["#4d8a7a", "#ecd28a"]
      },
      {
        id: "pixel-link-map",
        type: "link",
        title: "작은 세계 지도",
        url: "https://example.com/tiny-map",
        description: "좋아하는 게임 속 장소를 지도처럼 모아 볼 수 있는 미래 기능의 자리.",
        tags: ["지도", "미래"]
      }
    ]
  }
];

export function getProfileByUsername(username: string) {
  return sampleProfiles.find((profile) => profile.username === username);
}
