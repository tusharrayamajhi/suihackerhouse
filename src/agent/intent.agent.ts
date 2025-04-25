import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Injectable } from "@nestjs/common";
import { ModelService } from "src/services/model.services";
import { OutputParser } from "src/services/outputparser.services";
import { PromptServices } from "src/services/prompt.services";

@Injectable()
export class IntentAgent{
    private readonly model:ChatGoogleGenerativeAI;

    constructor(
        private readonly  modelService:ModelService,
        private readonly promptServices:PromptServices,
        private readonly outputParserServices:OutputParser
    ){
        this.model = this.modelService.getModel();
    }
    
    async calculateIntent(data:{message?:string}){
        try{
            const Prompt:ChatPromptTemplate = this.promptServices.getIntentCalculationPrompt();
            const outputParser = this.outputParserServices.getIntentOutputParser();
            const agent = Prompt.pipe(this.model).pipe(outputParser) 
            const response = await agent.invoke({message:data,format_instruction:outputParser.getFormatInstructions()})
            return response
        }catch(err){
            console.log("something went wrong in intent calculation")
            console.log(err)
        }
    }
}