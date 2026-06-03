export interface CallSession {
  id: string;
  roomUuid: string;
  status: string;
  masterFilePath: string | null;
  createdAt: string;
}
