import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import axios from "axios";
import { AiMessages } from "src/entities/AiMessages.entities";
import { Customer } from "src/entities/Customer.entities";
import { Repository } from "typeorm";
import { Payload } from "src/entities/payload.entities";
import { Attachments, AttachmentType } from "src/entities/attachment.entities";

@Injectable()
export class ResponseClass{

    constructor(
        @InjectRepository(Customer) private customerRepo: Repository<Customer>,
        @InjectRepository(AiMessages) private aiMessageRepo: Repository<AiMessages>,
        @InjectRepository(Attachments) private attachmentRepo: Repository<Attachments>,
        @InjectRepository(Payload) private payloadRepo: Repository<Payload>,    
        private configService: ConfigService
    ){}

    async sendTextResponseToCustomer(data:{senderId: string,textMessage: string}){
    
        try {
            if (!data.senderId) {
                console.log("No sender ID");
                return { message: "empty senderId" };
            }
    
            const customer = await this.customerRepo.findOneBy({ CustomerId: data.senderId.toString() });
    
            if (!customer) {
                console.log("Customer not found");
                return { message: "invalid sender id" };
            }
    
            if (!data.textMessage) {
                console.log("No text message");
                return { message: "empty textMessage" };
            }
    
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const token = this.configService.get("MESSANGER_API");
    
            if (!token) {
                console.log("Token not found");
                return { message: "api token is empty" };
            }
    
            const response = await axios.post(
                `https://graph.facebook.com/v21.0/me/messages`,
                {
                    message: { text: data.textMessage },
                    recipient: { id: data.senderId }
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
    
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const result =  response.data;
    
            if (result) {
                const aiMsg = this.aiMessageRepo.create({
                    AiMessage: data.textMessage,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    AiMessageId: result.message_id
                });
    
                try {
                    await this.aiMessageRepo.save({ ...aiMsg, customer });
                } catch (err) {
                    console.log("Failed to save message:", err);
                    return { message: "failed to save data in database"+ err };
                }
            }
    
            if (response.status) {
                console.log(result);
                return { message: "successfully sent message" + result };
            }
        } catch (err) {
            console.log("Error while sending message:", err);
            return { message: "error while sending message" + err };
        }
    }


    async sendAttachmentResponseToCustomer(
        data:{
        senderId: string,
        attachment: {
            type: AttachmentType,
            payload: {
                url: string
            }
        }
    }
    ){
        try {
            if (!data.senderId) {
                return { message: "empty senderId" };
            }
    
            if (!data.attachment) {
                return { message: "empty attachment" };
            }
    
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const token = this.configService.get("MESSANGER_API");
    
            if (!token) {
                return { message: "api token is empty" };
            }
    
            const response:any = await axios.post(
                `https://graph.facebook.com/v21.0/me/messages`,
                {
                    message: {
                        attachment: {
                            type: data.attachment.type,
                            payload: {
                                url: data.attachment.payload.url
                            }
                        }
                    },
                    recipient: {
                        id: data.senderId
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
    
            const payload = this.payloadRepo.create({ url: data.attachment.payload.url });
            const attach = this.attachmentRepo.create({
                type: data.attachment.type,
                payload: payload,
                customerId: data.senderId,
            });
    
            const result = await this.attachmentRepo.save(attach);
            console.log("Attachment saved:", result);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        } catch (err) {
            console.log("Error while sending attachment:"+ err);
            return { message: "error while sending attachment" + err };
        }
    }

    async sendPaymentLink(data:{senderId:string,suilink:string}){
        await axios.post(
            `https://graph.facebook.com/v21.0/me/messages`,
            {
                recipient: {
                    id: data.senderId
                },
                message: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "button",
                            text: "pay with sui",
                            buttons: [
                                {
                                    type: "web_url",
                                    url: data.suilink,
                                    title: "pay with sui"
                                }
                            ]
                        }
                    }
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.configService.get('MESSANGER_API')}`
                }
            }
        );
        
    }

}