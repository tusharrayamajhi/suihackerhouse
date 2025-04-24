import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Product } from "src/entities/Product.entities";
import { ModelService } from "src/services/model.services";
import { OutputParser } from "src/services/outputparser.services";
import { PromptServices } from "src/services/prompt.services";
import { ResponseClass } from "src/utils/response";
import { Repository } from "typeorm";


@Injectable()
export class AskAgent {


    private readonly model: ChatGoogleGenerativeAI;
    private readonly prompt: ChatPromptTemplate;
    private readonly outputParser: any;

    constructor(
        private readonly modelService: ModelService,
        private readonly promptService: PromptServices,
        private readonly outputService: OutputParser,
        private readonly responseService: ResponseClass,
        @InjectRepository(Product) private readonly productRepo: Repository<Product>
    ) {
        this.model = this.modelService.getModel()
        this.prompt = this.promptService.askQuestiomToCustomer()
        this.outputParser = this.outputService.getQuestionToCustomerOutputParser()
    }
    @OnEvent("AskAgent")
    async AskQuestion(data:{senderId:string,history:any,message:string,messageToAgent?:string}){
        try{
            const product = await this.productRepo.find();
            const agent = this.prompt.pipe(this.model).pipe(this.outputParser)
            const response:any = await agent.invoke({
                history:[data.history],
                message:data.message,
                product:product,
                messageToAgent:data.messageToAgent,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                format_instruction:this.outputParser.getFormatInstructions()
            })
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            await this.responseService.sendTextResponseToCustomer({senderId:data.senderId,textMessage:response.message})

            console.log(response)
        }catch(err){
            console.log("error in ask agent")
            console.log(err)
        }
    }


}