import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Injectable } from "@nestjs/common";

@Injectable()
export class PromptServices {

    getMessagePrompt(): ChatPromptTemplate {
        return ChatPromptTemplate.fromTemplate(`
            you are help full assistance
            `)
    }

    getIntentCalculationPrompt(): ChatPromptTemplate {
        return ChatPromptTemplate.fromTemplate(`
            You are an tone classification agent for a conversational AI assistant.

        Analyze the following user message and return the  TONE, and CONFIDENCE score.

        ### Message:
        {message}

        ### Instructions:
        - TONE should describe the emotion or style (e.g., "angry", "curious", "happy", "neutral", "rude", "excited", "frustrated").
        - CONFIDENCE is a number between 0 and 1 that indicates how sure you are about the intent classification.

        ### Example Output (JSON):
        {{
            "tone": "curious",
            "confidence": 0.92
        }}

        Now respond with the intent analysis in JSON format only.
            `)
    }

}