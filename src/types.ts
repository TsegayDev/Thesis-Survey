export type Language = "en" | "am" | "ti";

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: string;
  translations?: Record<string, {
    title: string;
    description: string;
    questions: Record<string, {
      text: string;
      options?: string[];
    }>;
  }>;
}

export type QuestionType = "text" | "multiple-choice" | "rating" | "boolean" | "checkbox" | "location";

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  options?: string[]; // For multiple choice
}

export interface Submission {
  id: string;
  surveyId: string;
  answers: Record<string, any>;
  submittedAt: string;
}
