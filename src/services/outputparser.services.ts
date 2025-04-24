import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { Injectable } from "@nestjs/common";
import { z } from "zod";


@Injectable()
export class OutputParser {
    getSuperAgentOutputParser(){
        return StructuredOutputParser.fromZodSchema(z.array(
            z.object({
                agent: z.string().describe("The name of the selected agent (e.g., 'Product Agent')"),
                messageToAgent: z.string().describe("message to the agent about customer message and guide"),
                customerMessage: z.string().describe("Original message from the customer"),
                CallingAgentThought: z.string().describe("Super Agent's reasoning behind selecting this agent"),
                MessageToAgentThought: z.string().describe("Reason why the specific message was composed for the agent")
            })
        ))
    }


    getMessageOutputParser() {
        return StructuredOutputParser.fromZodSchema(
            z.array(z.object({
                agentName: z.string().describe("Name of the agent"),
                responded: z.boolean().describe("Indicates if the agent should respond to the user message, true for response, false for no response"),
                message: z.string().describe("The actual message or answer to be sent to the user"),
                thought: z.string().describe("Thought behind the message response"),
                confidence: z.number().describe("Confidence level of the response (0 to 1)"),
                priority: z.number().describe("Priority of the agent response (lower number means higher priority)"),

            })))
    }


    getIntentOutputParser() {
        return StructuredOutputParser.fromZodSchema(z.object({
            tone: z.string().describe("Emotion or tone of the message, like 'angry', 'curious', 'neutral', etc."),
            confidence: z.number().min(0).max(1).describe("Confidence level of the classification between 0 (no confidence) and 1 (maximum confidence)")
        }))
    }

    getProductAgentOutputParser() {
        return StructuredOutputParser.fromZodSchema(
            z.object({
                agentName: z.string().describe("Name of the agent, e.g., 'ProductAgent'"),
                responded: z.boolean().describe("Set to true if the user's message is about a product and should receive a response, false otherwise"),
                thought: z.string().describe("Internal reasoning for generating the message based on the product data and user query"),
                confidence: z.number().min(0).max(1).describe("Confidence level in the accuracy of the response, between 0 (low) and 1 (high)"),
                priority: z.number().min(1).max(10).describe("Response priority (1 = highest priority, 10 = lowest), used for agent selection or ranking"),
                imageUrl: z.array(z.string().describe("URL of the product image if available and relevant, otherwise leave empty")),
                message: z.string().describe("Clear and helpful response to the user's product-related question don't send a image url in message send short message about the product"),
            }))
    }

    getQuestionToCustomerOutputParser() {
        return StructuredOutputParser.fromZodSchema(
            z.object({
                message: z.string().describe("asking missing details to customer")
            })
        )
    }

    getOrderAgentOutputParser() {
        return StructuredOutputParser.fromZodSchema(
            z.object({
                // agentName: z.string().describe("Name of the agent, e.g., 'OrderAgent'"),
                // responded: z.boolean().describe("True if the message is related to placing an order"),
                // confirmed: z.boolean().describe("True if all required information is present and user has confirmed order"),
                // confidence: z.number().min(0).max(1).describe("Confidence in the intent and data parsing"),
                // priority: z.number().min(1).max(10).describe("Priority of this response"),
                // message: z.string().describe("asking missing details to customer"),
                
                orders: z.array(z.object({
                    productId: z.string().describe("Unique identifier of the product from the products table or list"),
                    name: z.string().describe("The name of the product being ordered"),
                    quantity: z.number().nullable().describe("The number of units ordered for this product; can be null if unspecified"),
                    size: z.string().nullable().describe("Selected size of the product. Possible values: XS (Extra Small), S (Small), M (Medium), L (Large), XL (Extra Large). Can be null if size is not applicable"),
                  })),
                  
            })
        );
    }
    

}