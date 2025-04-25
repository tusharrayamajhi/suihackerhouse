import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/Customer.entities';
import { AiMessages } from './entities/AiMessages.entities';
import { CustomerMessages } from './entities/CustomerMessages.entities';
import { Orders } from './entities/Order.entities';
import { OrderItem } from './entities/OrderItem.entities';
import { Payment } from './entities/Payment.entities';
import { Product } from './entities/Product.entities';
import { Shipping } from './entities/Shipping.entities';
import { Attachments } from './entities/attachment.entities';
import { Payload } from './entities/payload.entities';
import { customerService } from './services/customer.services';
import { WebhookController } from './webhook/metaWebhook.webhook';
import { ModelService } from './services/model.services';
import { PromptServices } from './services/prompt.services';
import { MessageEventListener } from './event/message.events';
import { MessageServices } from './services/message.services';
import { OutputParser } from './services/outputparser.services';
import { MessageAgent } from './agent/message.agent';
import { IntentAgent } from './agent/intent.agent';
import { BusinessDetails } from './entities/business.entities';
import { ProductAgent } from './agent/product.agent';
import { SuperAgent } from './agent/superAgent';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ResponseClass } from './utils/response';
import { OrderAgent } from './agent/order.agent';
import { AskAgent } from './agent/ask.agent';
import { PaymentService } from './services/payment.services';
import { WalrusService } from './services/walarus.services';
import { SuiController } from './controller/sui.controllers';
import { OrderController } from './controller/order.controllers';
import { MailService } from './services/mail.services';
import { SendEmailListener } from './event/mail.event';
import { WalrusEvent } from './event/walurs.event';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal:true}),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory:(configService:ConfigService)=>({
        type:"mysql",
        database:configService.get("DB_DATABASE"),
        password:configService.get("DB_PASSWORD"),
        username:configService.get("DB_USERNAME"),        
        host:configService.get("DB_HOST"),
        port:+configService.get("DB_PORT"),
        entities:[
          Customer,
          AiMessages,
          CustomerMessages,
          Orders,
          OrderItem,
          Payment,
          Product,
          Shipping,
          Attachments,
          Payload,
          BusinessDetails

        ],
        synchronize:true
      }),
      inject:[ConfigService]
    }),
    TypeOrmModule.forFeature([
      Customer,
      AiMessages,
      CustomerMessages,
      Orders,
      OrderItem,
      Payment,
      Product,
      Shipping,
      Attachments,
      Payload,
      BusinessDetails
      ])
  ],
  controllers: [
    WebhookController,
    SuiController,
    OrderController,
  ],
  providers: [
    SendEmailListener,
    customerService,
    ModelService,
    PromptServices,
    MessageEventListener,
    MessageServices,
    MessageAgent,
    OutputParser,
    IntentAgent,
    ProductAgent,
    SuperAgent,
    OrderAgent,
    ResponseClass,
    AskAgent,
    PaymentService,
    WalrusService,
    WalrusEvent,
    MailService,

  ],
})
export class AppModule {}
