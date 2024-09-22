import { ChatOwner, SupportDepartmentStatus, SupportStatus } from "@enum/support";

export interface SupportDepartment {
  id: string;
  name: string;
  private: SupportDepartmentStatus;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  department_id: string;
  subject: string;
  date: string;
  last_update: string;
  status: SupportStatus;
  replies: string;
  user_fullname: string;
  department_name: string;
}

export interface SupportChat {
  id: string;
  date: string;
  customer: ChatOwner;
  staff_id: ChatOwner;
  message: string;
  clientStatuses: {
    received: boolean;
    pending: boolean;
    sent: boolean;
  };
}

export interface SystemUser {
  id: string;
  name: string;
  avatar: string;
}

export type SupportMessage = {
  type: "text" | "attachment";
  message?: string;
};

export type AddResponseBody = {
  ticketId: string;
  message: string;
  attachment?: string;
};
