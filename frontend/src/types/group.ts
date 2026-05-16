export type GroupMember = {
  id: string;
  userId: string;
  groupId: string;
  user: {
    id: string;
    email: string;
  };
};

export type Group = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  members: GroupMember[];
  owner?: {
    id: string;
    email: string;
  };
};
