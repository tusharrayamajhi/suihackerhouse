import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { Injectable } from "@nestjs/common";
import { z } from "zod";


@Injectable()
export class OutputParser {


    getMessageOutputParser() {
        return StructuredOutputParser.fromZodSchema(
            z.array(z.object({
                agentName: z.string().describe("Name of the agent"),
                responded: z.boolean().describe("Indicates if the agent should respond to the user message, true for response, false for no response"),
                message: z.string().describe("The actual message or answer to be sent to the user"),
                thought: z.string().describe("Thought behind the message response"),
                confidence: z.number().min(0).max(1).describe("Confidence level of the response (0 to 1)"),
                priority: z.number().describe("Priority of the agent response (lower number means higher priority)"),

            })))
    }


    getIntentOutputParser(){
        return StructuredOutputParser.fromZodSchema(z.object({
            tone: z.string().describe("Emotion or tone of the message, like 'angry', 'curious', 'neutral', etc."),
            confidence: z.number().min(0).max(1).describe("Confidence level of the classification between 0 (no confidence) and 1 (maximum confidence)")          
        }))
    }
}