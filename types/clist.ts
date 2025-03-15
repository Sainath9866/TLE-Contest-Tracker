export interface CListContest {
  id: number;
  event: string;
  resource: string;
  href: string;
  start: string;
  end: string;
}

export interface CListResponse {
  objects: CListContest[];
}
