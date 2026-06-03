export type CommunityCategory = "잡담" | "질문" | "추천" | "공지";

export type CommunityReply = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export type CommunityPost = {
  id: string;
  title: string;
  author: string;
  body: string;
  category: CommunityCategory;
  createdAt: string;
  views: number;
  tags: string[];
  replies?: CommunityReply[];
};

export const communityCategories: CommunityCategory[] = ["잡담", "질문", "추천", "공지"];

export const sampleCommunityPosts: CommunityPost[] = [
  {
    id: "notice-welcome",
    title: "shoyo 자유게시판 열어둡니다",
    author: "관리자",
    body: "프로필 만들다가 생각나는 것, 요즘 꽂힌 것, 사이트에 붙이고 싶은 기능을 가볍게 남겨주세요. 아직은 로컬에 저장되는 작은 게시판입니다.",
    category: "공지",
    createdAt: "2026-06-03T09:30:00.000Z",
    views: 128,
    tags: ["안내", "자유게시판"],
    replies: [
      {
        id: "notice-welcome-reply-1",
        author: "mira",
        body: "일단 방명록처럼 편하게 남기면 되는 느낌이라 좋네요.",
        createdAt: "2026-06-03T10:02:00.000Z"
      }
    ]
  },
  {
    id: "talk-first-room",
    title: "프로필 방에 넣으면 좋은 첫 블록 뭐가 있을까요?",
    author: "lsg1946",
    body: "앨범, 영화, 책 말고도 첫 화면에서 사람 취향이 바로 보이는 블록이 있으면 좋겠어요. 저는 리스트 블록이 생각보다 마음에 듭니다.",
    category: "질문",
    createdAt: "2026-06-02T22:14:00.000Z",
    views: 74,
    tags: ["프로필", "블록", "아이디어"],
    replies: [
      {
        id: "talk-first-room-reply-1",
        author: "blue note",
        body: "요즘 반복 재생 중인 것 5개 같은 리스트가 제일 빨리 읽히는 듯해요.",
        createdAt: "2026-06-02T23:01:00.000Z"
      },
      {
        id: "talk-first-room-reply-2",
        author: "paper",
        body: "방 배경 이미지랑 같이 보이면 첫인상이 꽤 또렷해질 것 같아요.",
        createdAt: "2026-06-03T00:18:00.000Z"
      }
    ]
  },
  {
    id: "recommend-night-radio",
    title: "밤에 켜두기 좋은 유튜브 추천",
    author: "slowroom",
    body: "공부 방송보다 방에 창문 하나 더 생기는 느낌의 영상이 좋습니다. 앰비언트, 도시 소음, 오래된 라디오 같은 것 위주로 모으는 중.",
    category: "추천",
    createdAt: "2026-06-01T19:45:00.000Z",
    views: 46,
    tags: ["유튜브", "앰비언트", "밤"]
  },
  {
    id: "talk-skin-memory",
    title: "옛날 블로그 스킨 감성이 왜 계속 좋을까요",
    author: "zine",
    body: "너무 매끈한 화면보다 작은 테두리, 이상한 배경, 직접 고른 글꼴이 있는 쪽이 오래 남는 것 같습니다. 취향 사이트는 약간 어설퍼도 자기 손때가 보여야 하는 듯.",
    category: "잡담",
    createdAt: "2026-05-31T16:20:00.000Z",
    views: 92,
    tags: ["블로그", "스킨", "취향"]
  }
];
