export interface Message {
  id: string;
  text: string;
  username: string;
  userId: string;
  timestamp: Date;
}

export interface User {
  id: string;
  username: string;
}
