export interface AnonUser {
  id: string;
  username: string;
  created_at: string;
  last_seen_at: string | null;
  bio?: string | null;
  birthday?: string | null;
  links?: string[];
  security_question?: string | null;
  avatar_url?: string | null;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  invite_code: string;
  custom_code?: string | null;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
}

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface GroupWithMemberCount extends Group {
  member_count: number;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  member_count: number;
}

export interface ChannelMember {
  id: string;
  channel_id: string;
  user_id: string;
  joined_at: string;
}

export interface ChannelMessage {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
}
