import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Injectable } from "@nestjs/common";
import { ModelService } from "src/services/model.services";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { PromptServices } from "src/services/prompt.services";
import { Customer } from "src/entities/Customer.entities";

@Injectable()
export class MessageAgent{

    private readonly model:ChatGoogleGenerativeAI
    private readonly prompt:ChatPromptTemplate;
    constructor(
        private readonly modelService:ModelService,
        private readonly promptService:PromptServices
    ){
        this.model = this.modelService.getModel();
        this.prompt = this.promptService.getMessagePrompt();
    }

    async Message(data:{senderId:string,history:any,customer:Customer,time:Date,}){
        
    }



}