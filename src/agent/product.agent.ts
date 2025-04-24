/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { AttachmentType } from "src/entities/attachment.entities";
import { Product } from "src/entities/Product.entities";
import { ModelService } from "src/services/model.services";
import { OutputParser } from "src/services/outputparser.services";
import { PromptServices } from "src/services/prompt.services";
import { ResponseClass } from "src/utils/response";
import { Repository } from "typeorm";

@Injectable()
export class ProductAgent{

    private readonly model:ChatGoogleGenerativeAI;
    private readonly prompt:ChatPromptTemplate;
    private readonly outputParser:any;

    constructor(
        private readonly modelService:ModelService,
        private readonly promptService:PromptServices,
        private readonly outputParserService:OutputParser,
        @InjectRepository(Product) private readonly productRepo:Repository<Product>,
        private readonly respondService:ResponseClass
    ){
        this.model = this.modelService.getModel()
        this.prompt = this.promptService.getProductAgentPrompt()
        this.outputParser = this.outputParserService.getProductAgentOutputParser()  
    }

    @OnEvent("ProductAgent")
    async Product(
        data:{
            customerMessage?:string,
            senderId: string,
            history: any, 
            customerDetails: any, 
            businessDetails:any,
            tone?:string,
            messageToAgent?:string,
            confidence?:number,
            time: Date,
        }){
            console.log("prduct agent")
            try{
            const products = await this.productRepo.find();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const agent = this.prompt.pipe(this.model).pipe(this.outputParser);
            const response:any = await agent.invoke({
                product:products,
                message:data.customerMessage,
                time:data.time,
                business:[data.businessDetails],
                customer:[data.customerDetails],
                history:[data.history],
                tone:data.tone,
                confidence:data.confidence,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                formatInstructions:this.outputParser.getFormatInstructions()
            })
            console.log(response)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if(response.responded){
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if(response.imageUrl){
                    for(const img of response.imageUrl){
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        await this.respondService.sendAttachmentResponseToCustomer({senderId:data.senderId,attachment:{type:AttachmentType.IMAGE,payload:{url:img}}})
                    }
                }
                if(response.message){
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    await this.respondService.sendTextResponseToCustomer({senderId:data.senderId,textMessage:response.message})
                }
            }
        }catch(err){
            console.log("error in product agent")
            console.log(err)
        }
    }

}