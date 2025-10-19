/**
 * PayOS SDK initialization helper
 *
 * The @payos/node SDK's PayOS constructor expects an options object. Prior
 * code attempted to call `new PayOS(clientId, apiKey, checksumKey)` which
 * does not match the SDK. This file initializes the client using the
 * correct shape and exposes wrapper functions used across the project:
 * - createPaymentLink(paymentData)
 * - getPaymentLinkInformation(paymentLinkId)
 * - verifyPaymentWebhookData(webhookBody)
 *
 * Also export `client` for advanced usage.
 */
import { PayOS } from "@payos/node";
import dotenv from "dotenv";

dotenv.config();

const { PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY, PAYOS_PARTNER_CODE, PAYOS_BASE_URL } = process.env;

// Initialize PayOS SDK correctly. The PayOS constructor expects an options object.
const initializePayOS = () => {
  if (!PAYOS_CLIENT_ID) {
    throw new Error("PAYOS_CLIENT_ID is not defined in your .env file.");
  }
  if (!PAYOS_API_KEY) {
    throw new Error("PAYOS_API_KEY is not defined in your .env file.");
  }
  if (!PAYOS_CHECKSUM_KEY) {
    throw new Error("PAYOS_CHECKSUM_KEY is not defined in your .env file.");
  }

  try {
    // Pass configuration as an object as required by the SDK.
    return new PayOS({
      clientId: PAYOS_CLIENT_ID,
      apiKey: PAYOS_API_KEY,
      checksumKey: PAYOS_CHECKSUM_KEY,
      partnerCode: PAYOS_PARTNER_CODE,
      baseURL: PAYOS_BASE_URL,
    });
  } catch (error) {
    console.error("Error initializing PayOS SDK:", error);
    throw new Error("Could not initialize PayOS SDK. Please check the constructor arguments.");
  }
};

const client = initializePayOS();

// Wrapper functions to keep current project code working. The SDK exposes
// paymentRequests.create/get and webhooks.verify, so provide the project's
// expected API surface: createPaymentLink, getPaymentLinkInformation,
// verifyPaymentWebhookData.
const createPaymentLink = async (paymentData, options = {}) => {
  // SDK: client.paymentRequests.create(paymentData)
  return client.paymentRequests.create(paymentData, options);
};

const getPaymentLinkInformation = async (paymentLinkId, options = {}) => {
  // SDK: client.paymentRequests.get(id)
  return client.paymentRequests.get(paymentLinkId, options);
};

const verifyPaymentWebhookData = async (webhookBody) => {
  // SDK expects { data, signature } object; the controller passes req.body
  // so forward directly to client.webhooks.verify
  return client.webhooks.verify(webhookBody);
};

export default {
  createPaymentLink,
  getPaymentLinkInformation,
  verifyPaymentWebhookData,
  // expose the raw client in case other code needs advanced APIs
  client,
};
