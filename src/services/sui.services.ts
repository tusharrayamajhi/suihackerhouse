import { TransactionBlock } from '@mysten/sui.js/transactions';
import { getFullnodeUrl, SuiClient, SuiObjectChange } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { config } from "dotenv"
import { MIST_PER_SUI } from '@scallop-io/sui-kit';
config()
const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
console.log("Connected to network:", suiClient.network);

// Replace with your package ID from sui client publish output
const PACKAGE_ID = process.env.PACKAGE_ID; // TODO: Replace with actual package ID
console.log(PACKAGE_ID)
// Generate test keypairs (use secure storage in production)
const keypari = process.env.KEYPAIR
const user1Keypair = Ed25519Keypair.fromSecretKey(String(keypari));

// Get addresses
const USER1_ADDRESS = user1Keypair.toSuiAddress();

console.log("User1 Address:", USER1_ADDRESS);


//get customer data
// Function to get customer data
export async function getCustomerData(customerId: string): Promise<{
    customerId: string;
    entries: { blobId: string; digest: string }[];
}> {
    console.log(`Getting customer data for ${customerId}...`);
    try {
        const store = await suiClient.getObject({
            id: 'customer_data_store_id', // Replace with actual store ID
            options: { showContent: true },
        });
        console.log("Customer data store object:", store);

        if (store.data?.content?.dataType !== 'moveObject') {
            throw new Error("Invalid customer data store object");
        }

        // Corrected type assertion for CustomerStore fields
        const fields = store.data.content.fields as {
            customer_ids: string[];
            customer_data: { [key: string]: { blob_id: string; digest: string }[] };
        };
        console.log("Raw customer store fields:", JSON.stringify(fields, null, 2));

        // Fetch entries for the specified customer_id
        const customerEntries = fields.customer_data[customerId] || [];

        // Prepare the response
        const customerData = {
            customerId,
            entries: customerEntries.map(entry => ({
                blobId: entry.blob_id,
                digest: entry.digest,
            })),
        };
        console.log("Customer data:", customerData);
        return customerData;
    } catch (error) {
        console.error(`Error getting customer data for ${customerId}:`, error);
        throw error;
    }
}


export async function addCustomerEntry({
    // customerStoreId,
    customerId,
    blobId,
    digest,
}: {
    // customerStoreId: string;
    customerId: string;
    blobId: string;
    digest: string;
}) {
    const tx = new Transaction();

    tx.moveCall({
        target: `${PACKAGE_ID}::customer_data::add_entry`,
        arguments: [
            tx.object('0x9e068ea46f676801c96f49b1174e29da0b21288705f8852285dc928bc24f4021'),
            tx.object(customerId),
            tx.object(blobId),
            tx.object(digest),
        ],
    });

    try {
        const result = await suiClient.signAndExecuteTransaction({
            signer: user1Keypair,
            transaction: tx,
            options: {
                showEffects: true,
                showObjectChanges: true,

            },
        })

        // const result = await signer.signAndExecuteTransactionBlock({
        //     transactionBlock: tx,
        //     options: {
        //         showEffects: true,
        //         showObjectChanges: true,
        //     },
        // });

        console.log("✅ Successfully added customer entry:", result);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return result;
    } catch (error) {
        console.error("❌ Failed to add customer entry:", error);
        throw error;
    }
}
export const getBalance = async (address: string): Promise<number> => {
    try {
        const balance = await suiClient.getBalance({
            owner: address,
        });
        return formatBalance(balance.totalBalance);
    } catch (error) {
        console.error(`Error fetching balance for ${address}:`, error);
        throw error;
    }
};

const formatBalance = (balance: string | number): number => {
    return Number(balance) / Number(MIST_PER_SUI);
};