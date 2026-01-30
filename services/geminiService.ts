import { GoogleGenAI } from "@google/genai";
import { CyclePhase } from '../types';

export const getDailyInsight = async (
  phase: CyclePhase,
  dayOfCycle: number,
  symptoms: string[],
  moods: string[]
): Promise<string> => {
  // Use the API key directly from process.env.API_KEY as per guidelines.
  // Create a new instance right before the call to ensure the latest key is used.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const symptomStr = symptoms.length > 0 ? `她今天感觉：${symptoms.join(', ')}。` : '';
  const moodStr = moods.length > 0 ? `她今天的心情：${moods.join(', ')}。` : '';

  const prompt = `
    你是一个贴心、知识渊博且温柔的女性健康伴侣。
    
    背景信息:
    - 当前阶段: ${phase}
    - 周期第几天: ${dayOfCycle} (第1天是经期开始)
    - ${symptomStr}
    - ${moodStr}

    任务:
    写一段简短、温暖且令人感到安慰的“每日悄悄话”（不超过2句话，使用中文）。
    如果她在月经期，重点关注休息和保暖。
    如果她在卵泡期/排卵期，赞美她的活力。
    如果她在黄体期，安抚她的情绪，建议做些让自己舒服的事。
    不要像医生那样临床，要像一个体贴的伴侣或闺蜜。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // response.text is a property that directly returns the generated string output.
    return response.text?.trim() || "深呼吸，今天也要好好爱自己。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "记得对自己温柔一点。";
  }
};