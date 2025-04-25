import { IntentAgent } from './../agent/intent.agent';
import { customerService } from './../services/customer.services';
import { Body, Controller, Get, Post, Query, Req, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from '@nestjs/typeorm';
import { MessageAgent } from 'src/agent/message.agent';
import { Customer } from 'src/entities/Customer.entities';
import { MessageEventListener } from 'src/event/message.events';
import { MessageServices } from 'src/services/message.services';
import {  Message, MessagingEvent, WebhookEvent } from 'src/utils/meta';
import { Response ,Request} from 'express';
import { Repository } from 'typeorm';
import { BusinessDetails } from 'src/entities/business.entities';
import { ProductAgent } from 'src/agent/product.agent';
import { Product } from 'src/entities/Product.entities';
import { SuperAgent } from 'src/agent/superAgent';
import { EventEmitter2 } from '@nestjs/event-emitter';
@Controller()
export class WebhookController {


    constructor(
        private readonly config:ConfigService,
        @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
        @InjectRepository(BusinessDetails) private readonly businessRepo:Repository<BusinessDetails>,
        @InjectRepository(Product) private readonly productRepo:Repository<Product>,
        private readonly CustomerService:customerService,
        private readonly MessageEvent:MessageEventListener,
        private readonly messageServices:MessageServices,
        private readonly messageAgent:MessageAgent,
        private readonly superAgent:SuperAgent,
        private readonly productAgent:ProductAgent,
        private readonly intentAgent:IntentAgent,
        private readonly eventEmitter:EventEmitter2
    ){}

    @Get("/webhook")
    getWebhook(@Res() res: Response, @Query('hub.mode') mode: string, @Query('hub.verify_token') token: string, @Query('hub.challenge') challenge: string) {
        try {

            // Check if a token and mode is in the query string of the request
            console.log(this.config.get("verifyToken"))
            if (mode && token) {
                // Check the mode and token sent is correct
                if (mode === "subscribe" && token === this.config.get("verifyToken")) {
                    // Respond with the challenge token from the request
                    console.log("WEBHOOK_VERIFIED");
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    res.status(200).send(challenge);
                } else {
                    // Respond with '403 Forbidden' if verify tokens do not match
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                    res.sendStatus(403);
                }
            }
        } catch (err) {
            console.log(err)
        }

    }


    @Post("/webhook")
    async postWebhook(@Req() req: Request, @Res() res: Response, @Body() body: WebhookEvent) {
        if (body.object === "page") {
            for (const entry of body.entry) {
                // console.log(body)

                const webhookEvent:MessagingEvent = entry.messaging[0];
                const senderPsid = webhookEvent.sender.id;

                const customer = await this.customerRepo.findOneBy({ CustomerId: senderPsid })
                if (!customer) {
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        const customer = await this.CustomerService.GetUserData(senderPsid)
                        if (customer) {
                           await this.CustomerService.SaveCustomer(customer)
                        }
                    } catch (err) {
                        console.log(err)
                    }
                }

                

                if (webhookEvent.message) {
                    try {

                        console.log(webhookEvent.message)
                        // await this.llmEvent.handelMessage(senderPsid);
                        const customerMessage:Message = webhookEvent.message;
                        const [history,intent,customerDetails] = await Promise.all([
                            await this.messageServices.getHistoryMessage({senderId:senderPsid}),
                            await this.intentAgent.calculateIntent({message:customerMessage.text}),
                            await this.customerRepo.findOneBy({CustomerId:senderPsid}),
                            // await this.productRepo.find()
                            // await this.businessRepo.fin
                        ])
                        await this.MessageEvent.handelMessage({payload:webhookEvent.message,senderId:senderPsid});
                        const business = {
                            name:"P&P Clothing ",
                            description:"we sales a cloth in nepal since 10 years we mainly sales cloth for both mens and women",
                            category:"clothing",
                            website:"www.ppclothing.com.np",
                            contactEmail:"tusharrayamajhi6@gmail.com",
                            contactPhone:"9745440380",
                            address:"shitalnagar 7 devdaha rupandehi",
                            payment:"we recived a payment in nepali currency",
                        }
                        
                        const superAgentResponse:any = await this.superAgent.superAgent({confidence:intent?.confidence,tone:intent?.tone,history:history,customer:customerDetails,business:business,message:webhookEvent.message.text,time:new Date()})
                        console.log(superAgentResponse)

                        for(const agent of superAgentResponse){
                            // console.log(agent.agent)
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                            this.eventEmitter.emit(agent.agent, {
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                                customerMessage: agent.customerMessage,
                                senderId: senderPsid,
                                history: history,
                                customerDetails: customerDetails,
                                businessDetails: business,
                                tone:intent?.tone,
                                confidence:intent?.confidence,
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                                messageToAgent:agent.messageToAgent,
                                time:new Date()
                            });
                            console.log("loop")
                        }



                        // const [message,product] = await Promise.all([
                        //     await this.messageAgent.Message({message:customerMessage.text,customer:cus, history:histroy,senderId:senderPsid,time:new Date(),business:business,tone:intent?.tone,confidence:intent?.confidence}),
                        //     await this.productAgent.Product({business:business,customer:cus,history:histroy,message:customerMessage?.text,product:products,time:new Date(),confident:intent?.confidence,tone:intent?.tone})
                        // ]);
                        // console.log(message)
                        // console.log(product)

                        // this.eventEmitter.emit('message', { payload: webhookEvent.message, senderId: senderPsid });

                        // if (this.MessageTimer.has(senderPsid)) {
                        //     clearTimeout(this.MessageTimer.get(senderPsid))
                        // }

                        // const timer = setTimeout(() => {
                        //     this.MessageTimer.delete(senderPsid)
                        //     this.eventEmitter.emit('llm', senderPsid);
                        // }, 0)
                        // this.MessageTimer.set(senderPsid, timer)
                        // console.log("send event")
                    } catch (err) {
                        console.log(err)
                    }
                }

            };


            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            res.status(200).send("EVENT_RECEIVED");

            // console.log(req)
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            res.sendStatus(404);
        }
    }
}