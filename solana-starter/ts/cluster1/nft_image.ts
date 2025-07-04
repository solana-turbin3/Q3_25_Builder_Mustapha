import wallet from "../turbin3-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"
import { readFile } from "fs/promises"

// Create a devnet connection
const umi = createUmi('https://devnet.helius-rpc.com/?api-key=1655dca1-2ed6-4404-8774-4f127f2f9a31');

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

//umi.use(irysUploader());
umi.use(irysUploader({address: "https://devnet.irys.xyz/",}));
umi.use(signerIdentity(signer));

(async () => {
    try {
        //1. Load image
        const image = await readFile("/Users/mohibrahim/Downloads/Rug-Day/jeffy-jeffy.png")
        //2. Convert image to generic file.
        const genericFile = createGenericFile(image, "jeffy-jeffy.png", { contentType: "image/png" });
        //3. Upload image
        const [myUri] = await umi.uploader.upload([genericFile]);
        console.log("Your image URI: ", myUri);
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();
