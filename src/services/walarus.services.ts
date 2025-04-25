import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Orders } from 'src/entities/Order.entities';





@Injectable()
export class WalrusService {

    constructor(
        private readonly Config: ConfigService
    ) {

    }

    async uploadOrder(order: any, epochs = 5) {
        const json = JSON.stringify(order, null, 2);
        const blob = new Blob([json],{"type":"application/json"})
        // const buffer = Buffer.from(json);

        try {
            const response = await fetch(`${this.Config.get("PUBLISHER_URL")}/v1/blobs?epochs=${epochs}`, {
              method: "PUT",
              body: blob,
            });
        
            if (!response.ok) {
              throw new Error(`Failed to upload: ${response.statusText}`);
            }
        
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const result = await response.json();
            console.log("Upload successful:", result);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return result;
          } catch (err) {
            console.error("Upload error:", err);
            return null;
          }
    }

    async fetchOrder(blobId: string): Promise<Orders | null> {
        try {
            const url = `${this.Config.get('AGGREGATOR_URL')}/v1/blobs/${blobId}`;
            const response = await axios.get(url);

            return response.data as Orders;
        } catch (err) {
            console.log(err)
            return null;
        }
    }
}
