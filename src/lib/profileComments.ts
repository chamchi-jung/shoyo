import type { ProfileComment } from "@/data/sampleProfiles";
import { getSupabaseBrowserClient } from "./supabase";

type ProfileCommentRow = {
  id: string;
  author: string;
  body: string;
  created_at: string;
  block_id: string | null;
};

function mapCommentRow(row: ProfileCommentRow): ProfileComment {
  return {
    id: row.id,
    author: row.author,
    body: row.body,
    createdAt: row.created_at
  };
}

export async function fetchGuestbookComments(username: string) {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profile_comments")
    .select("id, author, body, created_at, block_id")
    .eq("profile_username", username)
    .eq("scope", "guestbook")
    .is("block_id", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapCommentRow);
}

export async function fetchBlockComments(username: string) {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profile_comments")
    .select("id, author, body, created_at, block_id")
    .eq("profile_username", username)
    .eq("scope", "block")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data.reduce<Record<string, ProfileComment[]>>((comments, row) => {
    if (!row.block_id) {
      return comments;
    }

    comments[row.block_id] = [...(comments[row.block_id] ?? []), mapCommentRow(row)];
    return comments;
  }, {});
}

export async function createGuestbookComment(username: string, comment: ProfileComment) {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profile_comments")
    .insert({
      author: comment.author,
      body: comment.body,
      profile_username: username,
      scope: "guestbook"
    })
    .select("id, author, body, created_at, block_id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapCommentRow(data);
}

export async function createBlockComment(username: string, blockId: string, comment: ProfileComment) {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profile_comments")
    .insert({
      author: comment.author,
      block_id: blockId,
      body: comment.body,
      profile_username: username,
      scope: "block"
    })
    .select("id, author, body, created_at, block_id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapCommentRow(data);
}
