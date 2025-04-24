import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { v4 as uuid4 } from 'uuid';
import * as CryptoJS from 'crypto-js';


@Injectable()
export class PaymentService{
    
    constructor(
        private readonly configService:ConfigService
    ){
        
    }
    
    async getEsewaPaymentLink(data:{total:number,senderId:string,orderId:string}){
        const secretKey = '8gBm/:&EnhH.1/q'; // UAT Secret Key
        const baseUrl = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
        
        
        // Prepare payment data
        const transactionUuid = uuid4();
        
        const formData = {
            amount: data.total.toString(),
            tax_amount: '0',
            total_amount: data.total.toString(),
            transaction_uuid: transactionUuid,
            product_code: 'EPAYTEST',
            product_service_charge: '0',
            product_delivery_charge: '0',
                    success_url: `${await this.configService.get("ESEWAREDIRECT")}/success/${data.senderId}/${data.orderId}`,
                    failure_url: `${await this.configService.get("ESEWAREDIRECT")}/fail/${data.senderId}/${data.orderId}`,
                    signed_field_names: 'total_amount,transaction_uuid,product_code',
                };
                console.log(formData)
                // Generate HMAC SHA256 signature
                const dataToSign = `total_amount=${formData.total_amount},transaction_uuid=${formData.transaction_uuid},product_code=${formData.product_code}`;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                const hash = CryptoJS.HmacSHA256(dataToSign, secretKey);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                const signature = CryptoJS.enc.Base64.stringify(hash);
                
                // Complete payload with signature
                const payload = {
                    ...formData,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    signature: signature
                };
                
                const urlEncodedData = new URLSearchParams(payload).toString();
                
                // Send POST request to eSewa
                const response = await axios.post(baseUrl, urlEncodedData, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                });
                
                // Return successful response
                if (response.status == 200) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
                    return await response.request.res.responseUrl
                }
            }
            
            getSuiPaymentLink() {
                return ''
            }
}