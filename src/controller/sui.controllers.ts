import { Body, Controller, Post } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Orders } from "src/entities/Order.entities";
// import { Product } from "src/entities/Product.entities";
import { WalrusService } from "src/services/walarus.services";
import { Repository } from "typeorm";

@Controller()
export class SuiController {

    constructor(
        @InjectRepository(Orders) private readonly orderRepository: Repository<Orders>,
        // @InjectRepository(Product) private readonly productRepo: Repository<Product>,
        private readonly eventEmitter: EventEmitter2,
        private readonly walrusService: WalrusService
        

    ) { }

    @Post('/suiDigest')
    async getDigest(@Body() body: { orderId: string, digest: string }) {
        console.log(body)
        const order = await this.orderRepository.findOne({ where: { id: body.orderId } })
        if (!order) {
            console.log("no order found")
            return
        }
        order.paymentMethod = "SUI"
        order.status = "completed"
        order.suiDigest = body.digest
        const result = await this.orderRepository.save(order)
        console.log(result)
        console.log("walrus event")
        // const order2 = await this.orderRepository.findOne({where:{id:data.order_id},relations:{customer:true,orderItem:true}})
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const blob = await this.walrusService.uploadOrder(result)
        console.log(blob)
        // this.eventEmitter.emit("walrus", { orderId: order.id })
        // this.eventEmitter.emit("sendEmail", { orderId: order.id })
        // this.eventEmitter.emit("message", { orderId: order.id })
        return result

    }
}