import { Timestamp } from "firebase/firestore";

export type ClientPhase = "diagnosis" | "design" | "implementation" | "growth" | "analytics";
export type ClientStatus = "active" | "frozen";
export type WorkType = "technical" | "semantic" | "content" | "analytics" | "communication";

export interface Client {
  id: string;
  name: string;
  budget: number;
  rate: number;
  hoursPerMonth: number;
  reportDay: number;
  status: ClientStatus;
  phase: ClientPhase;
  carryOverHours: number;
  totalHoursMonth: number;
  createdAt: Timestamp | Date;
  notes: string;
}

export interface Task {
  id: string;
  clientId: string;
  clientName: string;
  date: string; // Storing as "YYYY-MM-DD" for simplicity, or timestamp
  description: string;
  workType: WorkType;
  hours: number;
  month: string;
  weekStart: string;
}

export interface WeekPlan {
  id: string;
  weekStart: string;
  clientId: string;
  clientName: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  totalPlanned: number;
}

export interface GlobalSettings {
  defaultRate: number;
  dailyHoursLimit: number;
  weeklyHoursLimit: number;
}
