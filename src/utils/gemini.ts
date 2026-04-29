import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiClient) {
    // Check multiple possible locations for the API key to ensure compatibility across different environments (AI Studio, Wasmer, local Vite).
    // Vite's 'define' in vite.config.ts should replace process.env.GEMINI_API_KEY at build time.
    const key = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

    if (!key) {
      console.error("GEMINI_API_KEY not found in process.env or import.meta.env.");
      throw new Error("GEMINI_API_KEY is missing. If you are using Wasmer, please set it as a Secret named VITE_GEMINI_API_KEY and re-deploy/re-build your app.");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export interface UserProfile {
  educationStage: string;
  interests: string;
  workEnvironment: string;
  skills: string;
}

export interface CareerRecommendation {
  title: string;
  description: string;
  whyItsAGoodFit: string;
  educationNeeded: string;
  salaryRange: string;
}

export interface SkillTranslation {
  ed: string;
  corp: string;
}

export interface CareerMapStep {
  title: string;
  description: string;
}

export async function getSkillTranslations(profile: UserProfile): Promise<SkillTranslation[]> {
  const prompt = `Based on the user's skills: "${profile.skills}" and education stage "${profile.educationStage}", extract 4 key skills and translate them into corporate/professional equivalents.`;
  try {
    const response = await getAI().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ed: { type: Type.STRING, description: "Educational / General skill term" },
                  corp: { type: Type.STRING, description: "Professional / Corporate equivalent term" }
                },
                required: ["ed", "corp"]
              }
            }
          },
          required: ["translations"]
        }
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    return data.translations || [];
  } catch (error) {
    console.error("Failed to fetch skill translations:", error);
    return [];
  }
}

export async function getCareerMap(profile: UserProfile, targetCareer: string): Promise<CareerMapStep[]> {
  const prompt = `Create a 3-step career pathway map for someone whose profile is: Education: "${profile.educationStage}", Interests: "${profile.interests}", Skills: "${profile.skills}". Their target career is "${targetCareer}". 
Step 1 should be their "Current Stage". 
Step 2 should be "Transitional Growth" (what to learn/experience next). 
Step 3 should be "Target Role".`;

  try {
    const response = await getAI().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Step title" },
                  description: { type: Type.STRING, description: "Step description" }
                },
                required: ["title", "description"]
              }
            }
          },
          required: ["steps"]
        }
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    return data.steps || [];
  } catch (error) {
    console.error("Failed to fetch career map:", error);
    return [];
  }
}

export async function getCareerRecommendations(profile: UserProfile): Promise<CareerRecommendation[]> {
  const prompt = `
You are an expert career counselor. Analyze the following user profile and recommend 4 distinct, highly suitable career paths.

User Profile:
- Current Education Stage: ${profile.educationStage}
- Interests & Passions: ${profile.interests}
- Preferred Work Environment: ${profile.workEnvironment}
- Key Skills & Strengths: ${profile.skills}

For each career, provide the title, a brief description, exactly why it's a great fit for this user, the required education or training, and an estimated starting to mid-level salary range. Make sure the options are varied but realistic for their stage and interests.
  `;

  try {
    const response = await getAI().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            careers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Job title" },
                  description: { type: Type.STRING, description: "Brief description of the job role" },
                  whyItsAGoodFit: { type: Type.STRING, description: "Detailed explanation of why this fits the user's profile" },
                  educationNeeded: { type: Type.STRING, description: "Required degrees, certifications, or training" },
                  salaryRange: { type: Type.STRING, description: "Estimated salary range" }
                },
                required: ["title", "description", "whyItsAGoodFit", "educationNeeded", "salaryRange"]
              }
            }
          },
          required: ["careers"]
        }
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    return data.careers || [];
  } catch (error) {
    console.error("Failed to fetch recommendations:", error);
    throw error;
  }
}
