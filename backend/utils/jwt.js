import jwt from "jsonwebtoken";

const DEFAULT_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "1h";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

export const signAccessToken = (payload, options = {}) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: DEFAULT_EXPIRES, ...options });
};


