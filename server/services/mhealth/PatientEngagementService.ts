import { v4 as uuidv4 } from 'uuid';

export interface MedicationReminder {
  id: string;
  patientId: string;
  medicationName: string;
  schedule: string;
  enabled: boolean;
  adherenceRate: number;
}

export interface EducationContent {
  id: string;
  title: string;
  category: string;
  content: string;
  active: boolean;
}

export interface PatientMessage {
  id: string;
  patientId: string;
  subject: string;
  message: string;
  sentDate: Date;
  read: boolean;
}

export interface SurveyResponse {
  id: string;
  patientId: string;
  surveyType: string;
  responses: Record<string, any>;
  submittedDate: Date;
}

export class PatientEngagementService {
  private static reminders: Map<string, MedicationReminder> = new Map();
  private static content: Map<string, EducationContent> = new Map();
  private static messages: Map<string, PatientMessage> = new Map();
  private static surveys: Map<string, SurveyResponse> = new Map();

  static createReminder(data: Omit<MedicationReminder, 'id' | 'adherenceRate'>): MedicationReminder {
    const reminder: MedicationReminder = { ...data, id: uuidv4(), adherenceRate: 100 };
    this.reminders.set(reminder.id, reminder);
    return reminder;
  }

  static createContent(data: Omit<EducationContent, 'id' | 'active'>): EducationContent {
    const content: EducationContent = { ...data, id: uuidv4(), active: true };
    this.content.set(content.id, content);
    return content;
  }

  static sendMessage(data: Omit<PatientMessage, 'id' | 'sentDate' | 'read'>): PatientMessage {
    const message: PatientMessage = { ...data, id: uuidv4(), sentDate: new Date(), read: false };
    this.messages.set(message.id, message);
    return message;
  }

  static submitSurvey(data: Omit<SurveyResponse, 'id' | 'submittedDate'>): SurveyResponse {
    const survey: SurveyResponse = { ...data, id: uuidv4(), submittedDate: new Date() };
    this.surveys.set(survey.id, survey);
    return survey;
  }

  static getReminders(patientId: string): MedicationReminder[] {
    return Array.from(this.reminders.values()).filter(r => r.patientId === patientId && r.enabled);
  }

  static getContent(category?: string): EducationContent[] {
    let items = Array.from(this.content.values()).filter(c => c.active);
    if (category) items = items.filter(c => c.category === category);
    return items;
  }

  static getMessages(patientId: string): PatientMessage[] {
    return Array.from(this.messages.values())
      .filter(m => m.patientId === patientId)
      .sort((a, b) => b.sentDate.getTime() - a.sentDate.getTime());
  }

  static getStatistics() {
    return {
      activeReminders: Array.from(this.reminders.values()).filter(r => r.enabled).length,
      contentItems: this.content.size,
      totalMessages: this.messages.size,
      surveyResponses: this.surveys.size
    };
  }
}
