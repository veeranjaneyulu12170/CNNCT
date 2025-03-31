export interface Participant {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  status?: 'Accepted' | 'Rejected' | 'Pending';
  selected?: boolean;
}

export interface Meeting {
  _id: string;
  date: string;
  time: string;
  title: string;
  description: string;
  status: 'Accepted' | 'Rejected' | 'Pending';
  participants: Array<{
    id?: string;
    name?: string;
    email?: string;
    avatar?: string;
    user?: {
      _id: string;
      name: string;
      email: string;
    };
    status?: 'Accepted' | 'Rejected' | 'Pending';
    selected?: boolean;
  }>;
  emails: string[];
  meetingDetails?: {
    date: string;
    time: string;
    duration: string;
    meetingType: string;
    hostName: string;
    eventTopic?: string;
    teamNumber?: string;
  };
}

export type TabType = 'Upcoming' | 'Pending' | 'Canceled' | 'Past';

export interface MeetingGroups {
  [key: string]: Meeting[];
  Upcoming: Meeting[];
  Pending: Meeting[];
  Canceled: Meeting[];
  Past: Meeting[];
} 