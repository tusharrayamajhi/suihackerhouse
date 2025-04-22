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
@Controller()
export class WebhookController {


    constructor(
        private readonly config:ConfigService,
        @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
        private readonly CustomerService:customerService,
        private readonly MessageEvent:MessageEventListener,
        private readonly messageServices:MessageServices,
        private readonly messageAgent:MessageAgent,
        private readonly intentAgent:IntentAgent
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

                const webhookEvent:MessagingEvent = entry.messaging[0];
                const senderPsid = webhookEvent.sender.id;

                const customer = await this.customerRepo.findOneBy({ CustomerId: senderPsid })
                if (!customer) {
                    try {
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
                        await this.MessageEvent.handelMessage({payload:webhookEvent.message,senderId:senderPsid});
                        // await this.llmEvent.handelMessage(senderPsid);
                        const message:Message = webhookEvent.message;
                        const [histroy,intent] = await Promise.all([
                            await this.messageServices.getHistoryMessage({senderId:senderPsid}),
                            await this.intentAgent.calculateIntent({message:message.text})
                        ])

                        console.log("history message")
                        console.log(histroy)
                        console.log("intent")
                        console.log(intent)
                        // const [res1, res2, res3] = await Promise.all([
                        //     await this.messageAgent.Message()
                        // ]);

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