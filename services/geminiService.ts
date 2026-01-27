import { GoogleGenAI, Type } from "@google/genai";
import { Member, VoucherType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using a simplified partial type for parsing result
export interface ParsedMemberData {
  name: string;
  phone: string;
  birthdayMonth?: string;
  note?: string;
}

export interface ParsedVoucherData {
  title: string;
  code?: string;
  type: VoucherType;
  notes?: string;
}

export const parseMembersFromText = async (text: string): Promise<ParsedMemberData[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse the following text into a list of members. 
      The input is likely a list where each line contains a Name (Chinese) and a Phone Number.
      
      Extraction Rules:
      1. Name: Extract the person's name.
      2. Phone: Extract the mobile number (e.g., 09xxxxxxxx).
      3. Birthday: If there is a date like (04/25), extract the month "4" as birthdayMonth.
      4. Note: Keep the original date string or extra text in 'note'.
      
      Input Text:
      ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              phone: { type: Type.STRING },
              birthdayMonth: { type: Type.STRING, description: "1-12 without leading zero if possible, or empty" },
              note: { type: Type.STRING }
            },
            required: ["name", "phone"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ParsedMemberData[];
    }
    return [];
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    return [];
  }
};

export const parseVoucherFromText = async (text: string): Promise<ParsedVoucherData | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse the following text into a voucher object.
      
      Input Text:
      ${text}
      
      Extract title, code, type (ELECTRONIC or PAPER), and notes.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            code: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['NONE', 'ELECTRONIC', 'PAPER'] },
            notes: { type: Type.STRING }
          },
          required: ["title"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      if (!Object.values(VoucherType).includes(data.type)) {
        data.type = VoucherType.ELECTRONIC;
      }
      return data as ParsedVoucherData;
    }
    return null;
  } catch (error) {
    console.error("Gemini Voucher Parse Error:", error);
    return null;
  }
};