import wallet from "../turbin3-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"

// Create a devnet connection
const umi = createUmi('https://devnet.helius-rpc.com/?api-key=1655dca1-2ed6-4404-8774-4f127f2f9a31"');

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader({address: "https://devnet.irys.xyz"}));
umi.use(signerIdentity(signer));

(async () => {
    try {
        // Follow this JSON structure
        // https://docs.metaplex.com/programs/token-metadata/changelog/v1.0#json-structure

        const image = "https://gateway.irys.xyz/AHgpme55bkxvdpbVfuEkBQLc6EdM8EHorY3D9WscbaSB"
        const metadata = {
            name: "kanima",
            symbol: "KANIMA",
            description: "kanima the chill guy",
            image,
            attributes: [
                {trait_type: 'Special Edition', value: '1'}
            ],
            properties: {
                files: [
                    {
                        type: "image/png",
                        uri: "https://gateway.irys.xyz/AHgpme55bkxvdpbVfuEkBQLc6EdM8EHorY3D9WscbaSB"
                    },
                ]
            },
            creators: []
        };
        const myUri = await umi.uploader.uploadJson(metadata)
        console.log("Your metadata URI: ", myUri);
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();
