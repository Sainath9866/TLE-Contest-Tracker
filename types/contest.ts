export interface Contest {
  id: number;
  name: string;
  platform: string;
  url: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: 'upcoming' | 'ongoing' | 'past';
}
