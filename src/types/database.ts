export interface AnonUser {
  id: string;
  username: string;
  created_at: string;
  last_seen_at: string | null;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  invite_code: string;
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
