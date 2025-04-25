// import { StructuredOutputParser } from "@langchain/core/output_parsers";
// import { Injectable } from "@nestjs/common";
// import { z } from "zod";


// @Injectable()
// export class OutputParser {
//     getSuperAgentOutputParser(){
//         return StructuredOutputParser.fromZodSchema(z.array(
//             z.object({
//                 agent: z.string().describe("The name of the selected agent (e.g., 'Product Agent, ask agent, message agent, order agent')"),
//                 messageToAgent: z.string().describe("message to the agent about customer message and guide"),
//                 customerMessage: z.string().describe("Original message from the customer"),
//                 CallingAgentThought: z.string().describe("Super Agent's reasoning behind selecting this agent"),
//                 MessageToAgentThought: z.string().describe("Reason why the specific message was composed for the agent")
//             })
//         ))
//     }


//     getMessageOutputParser() {
//         return StructuredOutputParser.fromZodSchema(
//             z.array(z.object({
//                 agentName: z.string().describe("Name of the agent"),
//                 responded: z.boolean().describe("Indicates if the agent should respond to the user message, true for response, false for no response"),
//                 message: z.string().describe("The actual message or answer to be sent to the user"),
//                 thought: z.string().describe("Thought behind the message response"),
//                 confidence: z.number().describe("Confidence level of the response (0 to 1)"),
//                 priority: z.number().describe("Priority of the agent response (lower number means higher priority)"),

//             })))
//     }


//     getIntentOutputParser() {
//         return StructuredOutputParser.fromZodSchema(z.object({
//             tone: z.string().describe("Emotion or tone of the message, like 'angry', 'curious', 'neutral', etc."),
//             confidence: z.number().min(0).max(1).describe("Confidence level of the classification between 0 (no confidence) and 1 (maximum confidence)")
//         }))
//     }

//     getProductAgentOutputParser() {
//         return StructuredOutputParser.fromZodSchema(
//             z.object({
//                 agentName: z.string().describe("Name of the agent, e.g., 'ProductAgent'"),
//                 responded: z.boolean().describe("Set to true if the user's message is about a product and should receive a response, false otherwise"),
//                 thought: z.string().describe("Internal reasoning for generating the message based on the product data and user query"),
//                 confidence: z.number().min(0).max(1).describe("Confidence level in the accuracy of the response, between 0 (low) and 1 (high)"),
//                 priority: z.number().min(1).max(10).describe("Response priority (1 = highest priority, 10 = lowest), used for agent selection or ranking"),
//                 image: z.array(z.object({
//                     imageUrl: z.string().describe("URL of the product image if available and relevant, otherwise leave empty"),
//                     message:z.string().describe("about the product only provide name size price quantity and short description")
//                 })
//                 ),
//                 message: z.string().describe("message to the customer so that customer can take further action"),
//             }))
//     }

//     getQuestionToCustomerOutputParser() {
//         return StructuredOutputParser.fromZodSchema(
//             z.object({
//                 message: z.string().describe("asking missing details to customer")
//             })
//         )
//     }

//     getOrderAgentOutputParser() {
//         return StructuredOutputParser.fromZodSchema(
//             z.object({
//                 // agentName: z.string().describe("Name of the agent, e.g., 'OrderAgent'"),
//                 // responded: z.boolean().describe("True if the message is related to placing an order"),
//                 // confirmed: z.boolean().describe("True if all required information is present and user has confirmed order"),
//                 // confidence: z.number().min(0).max(1).describe("Confidence in the intent and data parsing"),
//                 // priority: z.number().min(1).max(10).describe("Priority of this response"),
//                 // message: z.string().describe("asking missing details to customer"),
                
//                 orders: z.array(z.object({
//                     productId: z.string().describe("Unique identifier of the product from the products table or list"),
//                     name: z.string().describe("The name of the product being ordered"),
//                     quantity: z.number().nullable().describe("The number of units ordered for this product; can be null if unspecified"),
//                     size: z.string().nullable().describe("Selected size of the product. Possible values: XS (Extra Small), S (Small), M (Medium), L (Large), XL (Extra Large). Can be null if size is not applicable"),
//                   })),
                  
//             })
//         );
//     }
    

// }

import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { Injectable } from "@nestjs/common";
import { z } from "zod";

@Injectable()
export class OutputParser {
  /**
   * Parser for SuperAgent, which routes customer messages to specialized agents.
   * AI Guidance:
   * - Output an array of objects, each specifying an agent and the message part it should handle.
   * - Use 'agent' to select from: MessageAgent, ProductAgent, AskAgent, OrderAgent, AdminMessageAgent.
   * - 'messageToAgent' guides the selected agent on how to process the customer message.
   * - 'customerMessage' is the original or split portion of the customer’s message.
   * - Provide clear reasoning in 'callingAgentThought' and 'messageToAgentThought'.
   * - For multi-intent messages, split into multiple objects (e.g., greeting + product query).
   * - If intent is unclear, route to AdminMessageAgent with a note.
   */
  getSuperAgentOutputParser() {
    return StructuredOutputParser.fromZodSchema(
      z.array(
        z.object({
          agent: z
            .enum([
              "MessageAgent",
              "ProductAgent",
              "AskAgent",
              "OrderAgent",
              "AdminMessageAgent",
            ])
            .describe(
              "Name of the selected agent to handle the message part (e.g., 'ProductAgent' for product queries)"
            ),
          messageToAgent: z
            .string()
            .describe(
              "Instructions to the selected agent on how to handle the customer message (e.g., 'Answer product query')"
            ),
          customerMessage: z
            .string()
            .describe(
              "Original or split portion of the customer’s message assigned to this agent"
            ),
          callingAgentThought: z
            .string()
            .describe(
              "Reasoning for selecting this agent (e.g., 'Detected product query')"
            ),
          messageToAgentThought: z
            .string()
            .describe(
              "Reasoning for the specific instructions in messageToAgent (e.g., 'Clear product intent')"
            ),
        })
      ).describe("Array of agent assignments for routing customer messages")
    );
  }

  /**
   * Parser for MessageAgent, which handles greetings and polite messages.
   * AI Guidance:
   * - Output an array with one object (multiple for batched messages).
   * - Set 'responded: true' for in-scope messages (e.g., 'Hi!', 'Thanks!').
   * - Set 'responded: false' for out-of-scope messages (e.g., product queries) with an empty 'message'.
   * - 'message' should be a friendly response with a product redirect if responded: true.
   * - 'thought' explains the decision and response logic.
   * - 'confidence' is 0.8–1.0 for clear greetings, 0.5–0.7 for vague, 0.0–0.4 for out-of-scope.
   * - 'priority' is typically 1; adjust only if multiple agents respond simultaneously.
   */
  getMessageOutputParser() {
    return StructuredOutputParser.fromZodSchema(
      z.array(
        z.object({
          agentName: z
            .literal("MessageAgent")
            .describe("Name of the agent, always 'MessageAgent'"),
          responded: z
            .boolean()
            .describe(
              "True if the message is in-scope (e.g., greetings) and should be answered, false otherwise"
            ),
          message: z
            .string()
            .describe(
              "Response to the customer if responded: true; empty string if responded: false"
            ),
          thought: z
            .string()
            .describe(
              "Explanation of why the agent responded or not (e.g., 'Clear greeting' or 'Product query, out-of-scope')"
            ),
          confidence: z
            .number()
            .min(0)
            .max(1)
            .describe(
              "Confidence in the response decision (0.8–1.0 for clear, 0.5–0.7 for vague, 0.0–0.4 for out-of-scope)"
            ),
          priority: z
            .number()
            .min(1)
            .max(10)
            .describe(
              "Response priority (1 = highest, typically 1 for MessageAgent unless competing with other agents)"
            ),
        })
      ).describe("Array of MessageAgent responses for polite or emotional messages")
    );
  }

  /**
   * Parser for IntentCalculation, which analyzes message tone and confidence.
   * AI Guidance:
   * - Output a single object with 'tone' and 'confidence'.
   * - 'tone' is a descriptive emotion (e.g., 'happy', 'curious', 'frustrated').
   * - Use common tones: happy, curious, neutral, angry, frustrated, grateful.
   * - 'confidence' is 0.8–1.0 for clear tones, 0.5–0.7 for mixed, 0.0–0.4 for ambiguous.
   * - If tone is unclear, default to 'neutral' with low confidence.
   */
  getIntentOutputParser() {
    return StructuredOutputParser.fromZodSchema(
      z.object({
        tone: z
          .string()
          .describe(
            "Emotion or style of the message (e.g., 'happy', 'curious', 'neutral', 'frustrated')"
          ),
        confidence: z
          .number()
          .min(0)
          .max(1)
          .describe(
            "Confidence in tone classification (0.8–1.0 for clear, 0.5–0.7 for mixed, 0.0–0.4 for ambiguous)"
          ),
      }).describe("Tone and confidence analysis of the customer message")
    );
  }

  /**
   * Parser for ProductAgent, which handles product queries (e.g., T-shirts).
   * AI Guidance:
   * - Output a single object for the product query response.
   * - Set 'responded: true' for product-related queries with available data.
   * - Set 'responded: false' for out-of-scope (e.g., orders) or unavailable products.
   * - 'message' includes product details (name, size, price in NPR, stock) and an order prompt if responded: true.
   * - 'image' array includes product image URLs and details if available; empty if not.
   * - 'thought' explains the response logic (e.g., 'Found product in data').
   * - 'confidence' is 0.8–1.0 for clear queries, 0.5–0.7 for ambiguous, 0.0–0.4 for out-of-scope.
   * - 'priority' is typically 1; adjust if multiple agents respond.
   */
  getProductAgentOutputParser() {
    return StructuredOutputParser.fromZodSchema(
      z.object({
        agentName: z
          .literal("ProductAgent")
          .describe("Name of the agent, always 'ProductAgent'"),
        responded: z
          .boolean()
          .describe(
            "True if the message is a product query with available data, false otherwise"
          ),
        thought: z
          .string()
          .describe(
            "Reasoning for the response (e.g., 'Clear query about T-shirt' or 'Product unavailable')"
          ),
        confidence: z
          .number()
          .min(0)
          .max(1)
          .describe(
            "Confidence in the response accuracy (0.8–1.0 for clear, 0.5–0.7 for ambiguous, 0.0–0.4 for out-of-scope)"
          ),
        priority: z
          .number()
          .min(1)
          .max(10)
          .describe(
            "Response priority (1 = highest, typically 1 unless competing with other agents)"
          ),
        image: z
          .array(
            z.object({
              imageUrl: z
                .string()
                .describe(
                  "URL of the product image if available; empty string if not"
                ),
              message: z
                .string()
                .describe(
                  "Product details: name, size, price (NPR), quantity available, short description"
                ),
            })
          )
          .describe(
            "Array of product images and details; empty if no images available"
          ),
        message: z
          .string()
          .describe(
            "Message to the customer with product details and order prompt if responded: true; empty if responded: false"
          ),
      }).describe("ProductAgent response for product-related queries")
    );
  }

  /**
   * Parser for AskAgent, which asks customers for missing order details.
   * AI Guidance:
   * - Output a single object with a 'message' field.
   * - 'message' asks one clear question for the first missing detail (quantity, size, confirmation).
   * - Prioritize: quantity, then size, then confirmation.
   * - Keep the question concise and context-specific (e.g., 'How many T-shirts?').
   * - If no details are missing, ask for order confirmation.
   */
  getQuestionToCustomerOutputParser() {
    return StructuredOutputParser.fromZodSchema(
      z.object({
        message: z
          .string()
          .describe(
            "Question to the customer for missing order details (e.g., 'How many T-shirts would you like?')"
          ),
      }).describe("AskAgent question for missing order details")
    );
  }

  /**
   * Parser for OrderAgent, which saves complete orders.
   * AI Guidance:
   * - Output a single object with an 'orders' array.
   * - Each order includes 'productId', 'name', 'quantity', and 'size' from verified product data.
   * - Only include complete orders (all details provided and confirmed).
   * - Set 'orders' to empty array if details are missing or unconfirmed.
   * - 'quantity' and 'size' are nullable only if explicitly unconfirmed in the latest message.
   * - Use 'productId' and 'name' exactly as provided in product data.
   */
  getOrderAgentOutputParser() {
    return StructuredOutputParser.fromZodSchema(
      z.object({
        orders: z
          .array(
            z.object({
              productId: z
                .string()
                .describe(
                  "Unique identifier of the product from the product data"
                ),
              name: z
                .string()
                .describe("Name of the product being ordered (e.g., 'Blue T-shirt')"),
              quantity: z
                .number()
                .nullable()
                .describe(
                  "Number of units ordered; null only if unconfirmed in latest message"
                ),
              size: z
                .string()
                .nullable()
                .describe(
                  "Size of the product (e.g., 'XS', 'S', 'M', 'L', 'XL'); null only if unconfirmed or not applicable"
                ),
            })
          )
          .describe(
            "Array of complete orders; empty if details are missing or unconfirmed"
          ),
      }).describe("OrderAgent output for saving complete orders")
    );
  }
}
