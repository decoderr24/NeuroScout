import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ProjectIdea, DifficultyLevel, ArchitecturePlan, ResourceData } from "../types";

// Helper to get fresh instance with current key
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Generates a list of structured project ideas based on user interests.
 * Uses gemini-2.5-flash for speed and JSON structure.
 * Increased limit to 6.
 */
export const generateProjectIdeas = async (
  topic: string,
  userLevel: string
): Promise<ProjectIdea[]> => {
  const ai = getAiClient();
  const model = "gemini-2.5-flash";
  
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        oneLiner: { type: Type.STRING, description: "A catchy 10-word summary" },
        description: { type: Type.STRING, description: "A 2-sentence description focusing on user value" },
        difficulty: { type: Type.STRING, enum: [DifficultyLevel.Beginner, DifficultyLevel.Intermediate, DifficultyLevel.Advanced] },
        domain: { type: Type.STRING },
        keyFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
        techStack: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["title", "oneLiner", "description", "difficulty", "domain", "keyFeatures", "techStack"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Generate 6 distinct, modern Machine Learning final year project ideas related to: "${topic}". 
      Target audience level: ${userLevel}. 
      Focus on projects that solve real user problems and have a web interface component.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.8
      }
    });

    const rawData = JSON.parse(response.text || "[]");
    return rawData.map((item: any) => ({ ...item, id: generateId() }));
  } catch (error) {
    console.error("Error generating ideas:", error);
    throw new Error("Failed to generate project ideas.");
  }
};

/**
 * Generates a deep-dive architectural plan using the Thinking model.
 * Includes fallback to Flash if Pro fails (handling 500 errors).
 */
export const generateArchitecturePlan = async (projectTitle: string, projectDesc: string): Promise<ArchitecturePlan> => {
  const ai = getAiClient();
  const prompt = `Create a comprehensive technical architectural plan for a final year project titled "${projectTitle}".
      Context: ${projectDesc}
      
      Please provide the output in clean Markdown format (do not use code blocks for the main text) including:
      1. **System Architecture**: High-level description (Frontend, Backend, ML Model, Database).
      2. **Data Pipeline**: How data is collected, preprocessed, and fed to the model.
      3. **Model Selection**: Recommend specific algorithms/architectures and justify why.
      4. **UI/UX Strategy**: How the user interacts with the ML component.
      5. **Potential Challenges**: Technical risks and mitigation.
      `;

  try {
    // Try with Gemini 3.0 Pro first
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 4096 },
        maxOutputTokens: 8192,
      }
    });

    return {
      markdownContent: response.text || "No plan generated."
    };
  } catch (error) {
    console.warn("Gemini 3.0 Pro failed, falling back to Gemini 2.5 Flash:", error);
    
    // Fallback to Gemini 2.5 Flash (no thinking config)
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      return {
        markdownContent: response.text || "No plan generated."
      };
    } catch (fallbackError) {
      console.error("Error architecting plan (Fallback):", fallbackError);
      throw new Error("Failed to generate architecture plan.");
    }
  }
};

/**
 * Generates starter code structure and snippets.
 */
export const generateStarterCode = async (projectTitle: string, techStack: string[]): Promise<string> => {
  const ai = getAiClient();
  const prompt = `Act as a Senior Principal Software Engineer. Write a production-ready starter codebase for a Machine Learning project: "${projectTitle}".
      Tech Stack: ${techStack.join(', ')}.

      Provide the output as a comprehensive technical guide in Markdown.
      
      Structure:
      1. **Project Structure**: A complete ASCII file tree.
      2. **Dependencies**: A production-grade \`requirements.txt\` (or package.json) with pinned versions for stability.
      3. **Data Pipeline**:
         - **Data Loading**: Specific function to load data (e.g., using pandas, numpy, or image libraries) based on the project type.
         - **Preprocessing**: Reusable classes/functions for data cleaning and transformation (e.g., normalization, resizing, tokenization) tailored to the tech stack.
      4. **Model Development**: The main training/inference script (e.g., \`model.py\`). Use professional coding standards, type hinting, and error handling.
      5. **Evaluation**: Code snippet for evaluating model performance (e.g., Accuracy, F1-Score, RMSE) and generating reports/plots.
      6. **API Interface**: A robust backend entry point (e.g., \`main.py\` using FastAPI or Flask). Include pydantic models or equivalent validation.
      
      Ensure code is commented, follows best practices (SOLID principles where applicable), and looks like it belongs in a serious GitHub repository.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 4096 },
        maxOutputTokens: 16384, // Increased for larger code context
      }
    });
    
    return response.text || "Failed to generate code.";
  } catch (error) {
    console.warn("Gemini 3.0 Pro code gen failed, falling back to Flash:", error);
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text || "Failed to generate code.";
    } catch (fallbackError) {
        console.error("Error generating code:", fallbackError);
        throw new Error("Failed to generate starter code.");
    }
  }
}

/**
 * Uses Search Grounding to find real datasets and references.
 * Returns descriptive text instead of just links.
 */
export const findResources = async (projectTitle: string): Promise<ResourceData> => {
  const ai = getAiClient();
  const model = "gemini-2.5-flash";
  const prompt = `For the ML project "${projectTitle}", please:
      1. Recommend 3 specific real-world datasets (from Kaggle, HuggingFace, UCI, or Government portals). Describe what each dataset contains and why it's good for this project.
      2. Recommend 2 relevant research topics or search terms for papers.
      
      Provide the output as a Markdown list.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3,
      }
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const text = response.text || "";
    
    const groundingLinks = chunks
        .filter(c => c.web?.uri)
        .map(c => ({ title: c.web?.title || "Resource", uri: c.web?.uri || "" }));

    return {
        datasetsContent: text, 
        papersContent: "", 
        groundingLinks
    };
  } catch (error) {
    console.warn("Google Search grounding failed, using internal knowledge fallback:", error);
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt + " (Use your internal knowledge as search is unavailable.)",
        });
        return { 
            datasetsContent: response.text || "No resources found.", 
            papersContent: "", 
            groundingLinks: [] 
        };
    } catch (fallbackError) {
        return { datasetsContent: "Could not retrieve resources.", papersContent: "", groundingLinks: [] };
    }
  }
};

/**
 * Generates a UI mockup image for the project using high-quality Imagen 3 model.
 * Falls back to Flash Image if access is denied.
 */
export const generateProjectImage = async (projectTitle: string, projectDesc: string): Promise<string | null> => {
    const ai = getAiClient();
    const prompt = `Generate a photorealistic, high-fidelity UI mockup of a web application dashboard for: "${projectTitle}".
            Context: ${projectDesc}.
            The design should look like a real SaaS product screenshot running on a high-res display.
            Use a dark mode aesthetic with refined, professional color palettes (slate, indigo, subtle gradients).
            Avoid cartoonish, abstract, or "AI-art" styles. Focus on usability, data visualization components, and clean typography.
            Perspective: Front-facing or slightly angled laptop screen view.`;

    try {
        // Upgrading to Pro Image model for "mature" look
        const model = "gemini-3-pro-image-preview";
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                imageConfig: {
                    aspectRatio: "16:9",
                    imageSize: "2K" // requesting higher resolution for "mature" look
                }
            }
        });

        // Loop through parts to find the image
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (error) {
        // Silently catch the error (likely 403) and fallback without warning to console
        // This fixes the user complaint about the warning message
        
        try {
            // Fallback to standard model
            const fallbackModel = "gemini-2.5-flash-image";
            const response = await ai.models.generateContent({
                model: fallbackModel,
                contents: prompt,
                config: {
                     imageConfig: {
                        aspectRatio: "16:9" // imageSize is not supported in Flash Image
                    }
                }
            });

             // Loop through parts to find the image
            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }
            return null;
        } catch (fallbackError) {
            // Only log if fallback also fails
            console.error("Error generating image (fallback):", fallbackError);
            return null;
        }
    }
}

/**
 * Creates a chat session for a specific project architecture deep-dive.
 */
export const createChatSession = (projectTitle: string, projectDesc: string) => {
    const ai = getAiClient();
    const model = "gemini-2.5-flash";
    return ai.chats.create({
        model,
        config: {
            systemInstruction: `You are an expert Machine Learning Architect. You are assisting a student with their final year project titled "${projectTitle}". 
            Project Description: ${projectDesc}.
            Answer their technical questions, provide python code snippets if asked, and help them solve specific implementation details. 
            Keep answers concise and helpful.`
        }
    });
}

/**
 * Creates a chat session for the main dashboard guide.
 */
export const createGuideSession = (topic: string, ideas: ProjectIdea[]) => {
    const ai = getAiClient();
    const model = "gemini-2.5-flash";
    const ideasContext = ideas.map((i, idx) => `${idx + 1}. ${i.title}: ${i.oneLiner} (${i.difficulty})`).join('\n');
    
    return ai.chats.create({
        model,
        config: {
            systemInstruction: `You are a friendly Machine Learning expert advisor helping a student choose a final year project.
            
            Current Search Topic: "${topic || 'General'}"
            
            Generated Project Options found so far:
            ${ideasContext || "No ideas generated yet."}
            
            Your goal is to help the user understand these options, compare them, or suggest refinements. 
            If the user asks for new ideas, suggest they use the search bar, but you can brainstorm with them.
            Keep responses concise, encouraging, and academic.`
        }
    });
}