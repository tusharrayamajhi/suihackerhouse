import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Product } from "src/entities/Product.entities";
import { ModelService } from "src/services/model.services";
import { OutputParser } from "src/services/outputparser.services";
import { PromptServices } from "src/services/prompt.services";
import { Repository } from "typeorm";

@Injectable()
export class SuperAgent {

    private readonly model: ChatGoogleGenerativeAI;
    private readonly prompt: ChatPromptTemplate;
    private readonly outputParser: any;

    constructor(
        private readonly modelService: ModelService,
        private readonly promptService: PromptServices,
        private readonly outputParserService: OutputParser,
        @InjectRepository(Product) private  productRepo:Repository<Product>
    ) {
        this.model = this.modelService.getModel()
        this.prompt = this.promptService.getSuperAgentPrompt()
        this.outputParser = this.outputParserService.getSuperAgentOutputParser()
    }


    async superAgent(data:{business:any,message?:string,time:Date,tone?:string,confidence?:number,history:any,customer:any}){
        try{
            const products = await this.productRepo.find();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const superAgent = this.prompt.pipe(this.model).pipe(this.outputParser)
            const response = await superAgent.invoke({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                business:data.business,
                message:data.message,
                time:data.time,
                tone:data.tone,
                confidence:data.confidence,
                history:[data.history],
                products:products,
                customer:[data.customer],
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                format_instruction:this.outputParser.getFormatInstructions()
            })
            console.log(response)
            return response
        }catch(err){
            console.log("supper agent error")
            console.log(err)
        }
    }

}