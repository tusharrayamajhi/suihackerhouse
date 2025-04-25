import { InjectRepository } from "@nestjs/typeorm";
import { Orders } from "src/entities/Order.entities";
import { Equal, Repository } from "typeorm";
import { Controller, Get, Param } from '@nestjs/common';
import { getCustomerData } from "src/services/sui.services";

@Controller()
export class OrderController{
    constructor(
        @InjectRepository(Orders) private orderRepo:Repository<Orders>,
        
        
    ){

    }
    
    @Get('/orders/:id')
    async getOrder(@Param('id') id:string){
        try{
            console.log(id)
            const order = await this.orderRepo.findOne({where:{id:Equal(id)},relations:{orderItem:true,customer:true}})
            if(!order){
                return {message:"order not found"}
            }
            return JSON.stringify(order)
        }catch(err){
            console.log(err)
            return {messgae:"something went wrong"}
        }
    }

    @Get('abc')
    async getCus(){
      const data =  await getCustomerData("")
      console.log(data)
    }
}