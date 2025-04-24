// message.listener.ts

import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Orders } from "src/entities/Order.entities";
import { ResponseClass } from "src/utils/response";
import { Repository } from "typeorm";

@Injectable()
export class MessageListener {
  constructor(
    @InjectRepository(Orders) private orderRepo:Repository<Orders>,
    private readonly responseService:ResponseClass
  ) {}

  @OnEvent('message')
  async handleMessageEvent(payload: { orderId: string }) {
    const order = await this.orderRepo.findOne({where:{id:payload.orderId},relations:{customer:true}});
    if (!order || !order.customer) {
      console.warn('Order or customer not found.');
      return;
    }
    await this.responseService.sendTextResponseToCustomer({senderId:order.customer.CustomerId,textMessage:"payment received"})

    
  }
}
