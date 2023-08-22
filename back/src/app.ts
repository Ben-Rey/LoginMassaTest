import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
// @ts-ignore
import { blake3 } from "@noble/hashes/blake3";

import * as middlewares from "./middlewares";
import api from "./api";
import MessageResponse from "./interfaces/MessageResponse";
import {
  ClientFactory,
  WalletClient,
  DefaultProviderUrls,
} from "@massalabs/massa-web3";

require("dotenv").config();

const app = express();

app.use(morgan("dev"));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get<{}, MessageResponse>("/", (req, res) => {
  res.json({
    message: "Test API for Massa Signature Verification",
  });
});

/**
 * Instantiates a Massa Client
 *
 * @returns Massa Client
 */
async function createClient() {
  const account = await WalletClient.getAccountFromSecretKey(
    "S1a1rC1Aar9gEe8VwpWtN5MTaxaKXqrj6vGr9a3WDxbRMDC8spM"
  );

  const client = await ClientFactory.createDefaultClient(
    DefaultProviderUrls.BUILDNET,
    false,
    account
  );

  return client;
}

app.post<MessageResponse>("/login", async (req, res) => {
  let { publicKey, message, signature, provider } = req.body;

  console.log("publicKey: ", publicKey);
  console.log("message: ", message);
  console.log("signature: ", signature);
  console.log("providerName: ", provider);

  if (!publicKey) {
    res.status(400).send({ message: "No public key found!" });
  }
  if (!message) {
    res.status(400).send({ message: "No message found!" });
  }
  if (!signature) {
    res.status(400).send({ message: "No signature found!" });
  }
  if (!provider) {
    res.status(400).send({ message: "No provider found!" });
  }

  // This is a workaround for Bearby - we might need to remove this in the future
  if (provider === "BEARBY") {
    message = blake3(message);
  }

  const client = await createClient();

  try {
    const result = await client.wallet().verifySignature(message, {
      publicKey,
      base58Encoded: signature,
    });

    const responseMessage = result
      ? "Signature verified successfully!"
      : "Signature verification failed!";

    res.status(200).send({ isValid: result, message: responseMessage });
  } catch (error) {
    console.log("Error verifying signature: ", error);
    res.status(400).send({ message: "Error verifying signature!" });
  }
});

app.use("/api/v1", api);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;
