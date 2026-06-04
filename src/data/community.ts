export type CommunityCategory = "공지" | "잡담" | "질문" | "정보" | "사진/영상";

export type CommunityImage = {
  id: string;
  name: string;
  dataUrl: string;
};

export type CommunityReply = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export type CommunityPost = {
  id: string;
  category: CommunityCategory;
  title: string;
  author: string;
  body: string;
  createdAt: string;
  views: number;
  youtubeUrl?: string;
  youtubeId?: string;
  images: CommunityImage[];
  replies: CommunityReply[];
};

export const communityCategories: CommunityCategory[] = ["공지", "잡담", "질문", "정보", "사진/영상"];

export const sampleCommunityPosts: CommunityPost[] = [
  {
    id: "notice-plain-board",
    category: "공지",
    title: "해즈세요 임시 공지",
    author: "관리자",
    body: "로그인 없이 글을 쓰고, 사진과 유튜브 링크를 붙여보는 게시판입니다. 지금은 브라우저에만 저장됩니다.",
    createdAt: "2026-06-04T01:00:00.000Z",
    views: 124,
    images: [],
    replies: [
      {
        id: "notice-reply-1",
        author: "ㅇㅇ",
        body: "일단 게시판 형태부터 보는 용도면 충분합니다.",
        createdAt: "2026-06-04T01:10:00.000Z"
      }
    ]
  },
  {
    id: "talk-simple-layout",
    category: "잡담",
    title: "게시판은 표 형태가 제일 편한 듯",
    author: "무명",
    body: "화려한 홈 말고 바로 글 목록이 보이는 구조가 좋습니다. 위에는 커뮤니티 이름, 아래는 글쓰기와 본문.",
    createdAt: "2026-06-03T23:40:00.000Z",
    views: 73,
    images: [],
    replies: []
  },
  {
    id: "question-youtube",
    category: "질문",
    title: "유튜브는 링크만 넣으면 되나요?",
    author: "ㅇㅇ",
    body: "watch, shorts, youtu.be 주소를 넣으면 본문 원하는 위치에 붙는 방식이면 좋겠습니다.\n\n[youtube]\n\n이렇게 본문 중간에도 넣을 수 있습니다.",
    createdAt: "2026-06-03T22:12:00.000Z",
    views: 51,
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtubeId: "dQw4w9WgXcQ",
    images: [],
    replies: [
      {
        id: "question-youtube-reply-1",
        author: "테스터",
        body: "주소 형식만 맞으면 임베드로 보입니다.",
        createdAt: "2026-06-03T22:30:00.000Z"
      }
    ]
  }
];
