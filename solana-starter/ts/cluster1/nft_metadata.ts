import wallet from "../turbin3-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createGenericFile, createSignerFromKeypair, publicKey, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"

// Create a devnet connection (solana devnet was down i almost went crazy for this)
const umi = createUmi('https://devnet.helius-rpc.com/?api-key=1655dca1-2ed6-4404-8774-4f127f2f9a31');

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));


(async () => {
    try {
        //Follow this JSON structure
        //https://docs.metaplex.com/programs/token-metadata/changelog/v1.0#json-structure

        const image = "https://gateway.irys.xyz/6L6F4y4SpiuGJJqnptUhWKpvqZXwtHEgZnoeny3eV2cH"
        const metadata = {
            name: "jeffy-jeffy",
            symbol: "JEFFY",
            description: "A unique Jeffy-Jeffy NFT on Solana(Turbine Rug-day)",
            image: "https://gateway.irys.xyz/6L6F4y4SpiuGJJqnptUhWKpvqZXwtHEgZnoeny3eV2cH" ,
            attributes: [
                {trait_type: 'Character', value: 'Jeffy'}
            ],
            properties: {
                files: [
                    {
                        type: "image/png",
                        uri: "https://gateway.irys.xyz/6L6F4y4SpiuGJJqnptUhWKpvqZXwtHEgZnoeny3eV2cH"
                    },
                ]
            },
            creators: [{
                address: keypair.publicKey,
                share: 100
            }]
        };

        // Upload metadata to Irys in json format and return the URI
        const myUri = await umi.uploader.uploadJson(metadata)
        console.log("Your metadata URI: ", myUri);
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();
