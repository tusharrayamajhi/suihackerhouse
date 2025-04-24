import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Orders } from "src/entities/Order.entities";
import { WalrusService } from "src/services/walarus.services";
import { Repository } from "typeorm";


@Injectable()
export class WalrusEvent{

    constructor(
        private readonly walrusService:WalrusService,
        @InjectRepository(Orders) private readonly orderRepo:Repository<Orders>
    ){}

    @OnEvent('walrus')
    async walrusEvent(data:{orderId:string}){
        console.log("walrus event")
        const order = await this.orderRepo.findOne({where:{id:data.orderId},relations:{customer:true,orderItem:true}})
        if(!order){
            console.log("order not found")
            return
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const blob = await this.walrusService.uploadOrder(order)
        console.log(blob)
    }

}