const JWT_SECRET = process.env.JWT_SECRET_Key;
const JWT_EXPIRES_IN = "7d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET_Key is not configured in the environment");
}

export { JWT_SECRET, JWT_EXPIRES_IN };