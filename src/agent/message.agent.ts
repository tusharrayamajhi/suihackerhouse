import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Injectable } from "@nestjs/common";
import { ModelService } from "src/services/model.services";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { PromptServices } from "src/services/prompt.services";
import { OutputParser } from "src/services/outputparser.services";
import { OnEvent } from "@nestjs/event-emitter";
import { ResponseClass } from "src/utils/response";

@Injectable()
export class MessageAgent {

    private readonly model: ChatGoogleGenerativeAI
    private readonly prompt: ChatPromptTemplate;
    private readonly outputParser;

    constructor(
        private readonly modelService: ModelService,
        private readonly promptService: PromptServices,
        private readonly outputParserService: OutputParser,
        private readonly respondService:ResponseClass
    ) {
        this.model = this.modelService.getModel();
        this.prompt = this.promptService.getMessagePrompt();
        this.outputParser = this.outputParserService.getMessageOutputParser();
    }

    @OnEvent('MessageAgent')
    async Message(
        data: {
            customerMessage?:string,
            senderId: string,
            history: any, 
            customerDetails: any, 
            businessDetails:any,
            tone?:string,
            confidence?:number,
            messageToAgent?:string
            time: Date,
            }) {
        try{
            console.log("message agent")
            // console.log(this.outputParser)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const agent = this.prompt.pipe(this.model).pipe(this.outputParser);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            const format_instruction = this.outputParser.getFormatInstructions();
            const response:any = await agent.invoke({
                message:data.customerMessage,
                time:data.time,
                history:[data.history],
                business:[data.businessDetails],
                customer:[data.customerDetails],
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                format_instruction:format_instruction,
                tone:data.tone,
                confidence:data.confidence
            })
            console.log(response)
            
            for(const msg of response){
                
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if(msg.responded){
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
                    await this.respondService.sendTextResponseToCustomer({senderId:data.senderId,textMessage:msg.message})
                }
            }

            
            
        }catch(err){
            console.log("error in message agent")
            console.log(err)
        }
        
    }



}