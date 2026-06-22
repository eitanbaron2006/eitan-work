export interface Project {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  longDescription: string;
  category: "enterprise" | "modern" | "ai";
  categoryLabel: string;
  tags: string[];
  role: string;
  period: string;
  iconName: string;
  colorScheme: {
    primary: string;
    bg: string;
    text: string;
    border: string;
    gradient: string;
  };
  link?: string;
  features: string[];
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

export type ActiveTab = "home" | "portfolio" | "resume" | "chat";
