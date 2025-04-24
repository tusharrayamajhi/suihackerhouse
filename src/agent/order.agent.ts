import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Customer } from "src/entities/Customer.entities";
import { Orders } from "src/entities/Order.entities";
import { OrderItem } from "src/entities/OrderItem.entities";
import { Product } from "src/entities/Product.entities";
import { ModelService } from "src/services/model.services";
import { OutputParser } from "src/services/outputparser.services";
import { PaymentService } from "src/services/payment.services";
import { PromptServices } from "src/services/prompt.services";
import { ResponseClass } from "src/utils/response";
import { Equal, Repository } from "typeorm";

@Injectable()
export class OrderAgent{

    private readonly model:ChatGoogleGenerativeAI;
    private readonly prompt:ChatPromptTemplate;
    private readonly outputParser:any;

    constructor(
        private readonly modelService:ModelService,
        private readonly promptService:PromptServices,
        private readonly outputService:OutputParser,
        private readonly responseService:ResponseClass,
        private readonly paymentService:PaymentService,
        @InjectRepository(Product) private readonly productRepo:Repository<Product>,
        @InjectRepository(Orders) private readonly OrderRepo:Repository<Orders>,
        @InjectRepository(OrderItem) private readonly OrderItemRepo:Repository<OrderItem>,
        @InjectRepository(Customer) private readonly customerRepo:Repository<Customer>,

    ){
        this.model = this.modelService.getModel()
        this.prompt = this.promptService.getOrderAgentPrompt()
        this.outputParser = this.outputService.getOrderAgentOutputParser()
    }

    @OnEvent("OrderAgent")
    async OrderAgent( 
        data:{
        customerMessage?:string,
        senderId: string,
        history: any, 
        customerDetails: any, 
        businessDetails:any,
        tone?:string,
        messageToAgent?:string
        confidence?:number,
        time: Date,
    }){
        try{
            const products = await this.productRepo.find();
            const agent = this.prompt.pipe(this.model).pipe(this.outputParser)
            const response:any = await agent.invoke({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                // customer:data.customerDetails,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                // business:data.businessDetails,
                // message:data.customerMessage,
                // time:data.time,
                product:products,
                messageToAgent:data.messageToAgent,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                history:data.history,
                // tone:data.tone,
                // confidence:data.confidence,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                formatInstructions:this.outputParser.getFormatInstructions()
            })
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-floating-promises, @typescript-eslint/no-unsafe-member-access
            // await this.responseService.sendTextResponseToCustomer({senderId:data.senderId,textMessage:response.message})
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            // await this.responseService.sendTextResponseToCustomer({senderId:data.senderId,textMessage:response.orders})
            console.log(response)
            // eslint-disable-next-line prefer-const
            let orderItem:any = []
            let total:number = 0;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            for(const order of response.orders){
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                const product = await this.productRepo.findOne({ where: { id: Equal(order.productId) } });
                if (product) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    const item = this.OrderItemRepo.create({ product: product, price: product.price, size: order.size, quantity: order.quantity });
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    orderItem.push(item);
                    total += (+item.price)
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    console.log(`Product with ID ${order.productId} not found.`);
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const customer = await this.customerRepo.findOne({where:{CustomerId:data.senderId}})
            if(customer){
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const order = this.OrderRepo.create({orderItem:orderItem,customer:customer,status:'pending',total_amount:total})
                const result = await this.OrderRepo.save(order)
                await this.responseService.sendTextResponseToCustomer({senderId:data.senderId,textMessage:"successfully saved order"})
                // eslint-disable-next-line no-loss-of-precision
                // await this.responseService.sendTextResponseToCustomer({senderId:data.senderId,textMessage:`https://sui-hackethon1.onrender.com/?wallet=0xd8f629993378cfb6186ae030b9e405c8681177a74635d227a7b8ab7e073e7a19&amount=${3}&order_id=${result.id}`})
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                // const esewaLink:any = await this.paymentService.getEsewaPaymentLink({orderId:result.id,senderId:data.senderId,total:total})
                // console.log(esewaLink)
                const suipaymentLink:any = `https://sui-hackethon1.onrender.com/?wallet=0xd8f629993378cfb6186ae030b9e405c8681177a74635d227a7b8ab7e073e7a19&amount=${3}&order_id=${result.id}`
                // const suipaymentLink:any = `https://wallet.sui.io/open?dapp=https://sui-hackethon1.onrender.com/?wallet=0xd8f629993378cfb6186ae030b9e405c8681177a74635d227a7b8ab7e073e7a19&amount=${3}&order_id=${result.id}`
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                await this.responseService.sendPaymentLink({senderId:data.senderId,suilink:suipaymentLink})
            }
        }catch(err){
            console.log("error in order")
            console.log(err)
        }
    }
}