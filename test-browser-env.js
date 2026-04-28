import { GoogleGenAI } from "@google/genai";
console.log("running");
const originalProcess = process;
globalThis.process = undefined;
try {
  const ai = new GoogleGenAI({ apiKey: undefined });
  console.log("success");
} catch(e) {
  console.log("failed:", e.message);
}
globalThis.process = originalProcess;
