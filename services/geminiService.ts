import { GoogleGenAI, Chat } from "@google/genai";

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

const SYSTEM_INSTRUCTION = `
You are "Wingman", an expert flight instructor and aviation mentor AI for the WingMentor platform. 
Your goal is to assist student pilots with questions about PPL, CPL, IR, and ME ratings, explain aerodynamics, discuss weather patterns (METAR/TAF), and help with simulator scenarios.
Keep answers concise, professional, and safety-oriented. 
Use aviation terminology correctly (e.g., 'Roger', 'Affirm', 'Wilco') where appropriate but remain accessible.
If asked about regulations, assume FAA or EASA standards but specify which one you are referring to if ambiguous.
`;

export const initializeChat = (): Chat => {
  if (chatSession) return chatSession;

  try {
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
    chatSession = genAI.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    return chatSession;
  } catch (error) {
    console.error("Failed to initialize Gemini chat:", error);
    throw error;
  }
};

export const sendMessageToWingman = async (message: string): Promise<string> => {
  if (!chatSession) {
    initializeChat();
  }

  if (!chatSession) {
      return "System Error: Radio failure. Check API configuration.";
  }

  try {
    const response = await chatSession.sendMessage({ message });
    return response.text || "Radio silence... (No text returned)";
  } catch (error) {
    console.error("Error sending message to Wingman:", error);
    return "Transmission unclear. Please say again.";
  }
};
