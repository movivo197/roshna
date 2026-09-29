export type Gender = 'male' | 'female' | 'other' | 'unspecified';

export type Member = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatar?: string;
  gender?: Gender;
  age?: number;
  xp: number;
  level: number;
  createdAt: string;
  lastSeenAt: string;
};

export type CommunityPerson = Member & {
  following: boolean;
  friendship: 'none' | 'sent' | 'received' | 'accepted';
  online: boolean;
};

export type CommunityRoom = {
  id: string;
  kind: 'public' | 'group' | 'dm';
  name: string;
  ownerId: string | null;
  memberCount: number;
  updatedAt: string;
  peerId?: string;
  isAnonymous?: boolean;
};

export type CommunityMessage = {
  id: string;
  body: string;
  createdAt: string;
  author: Member;
  own: boolean;
  attachment: { id: string; name: string; mime: string; size: number } | null;
  reactions: { emoji: string; count: number; mine: boolean }[];
};

export type CommunityNotification = {
  id: string;
  kind: string;
  title: string;
  href: string;
  createdAt: string;
  read: boolean;
};

export type AnonymousPeer = {
  gender: Gender;
  age: number;
  displayName?: string;
  avatar?: string;
  revealed?: boolean;
};
