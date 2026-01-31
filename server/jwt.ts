import crypto from "crypto";

type JwtType = "access" | "refresh";

export interface JwtPayload {
  sub: string;
  type: JwtType;
  iat: number;
  exp: number;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string): Buffer {
  const padLength = (4 - (input.length % 4)) % 4;
  const padded = input + "=".repeat(padLength);
  const normalized = padded.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64");
}

function signJwt(payload: JwtPayload, secret: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const headerSegment = base64UrlEncode(JSON.stringify(header));
  const payloadSegment = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerSegment}.${payloadSegment}`;
  const signature = crypto.createHmac("sha256", secret).update(data).digest();
  const signatureSegment = base64UrlEncode(signature);
  return `${data}.${signatureSegment}`;
}

function verifyJwt(token: string, secret: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token");
  }

  const [headerSeg, payloadSeg, signatureSeg] = parts;
  const data = `${headerSeg}.${payloadSeg}`;
  const expectedBuf = crypto.createHmac("sha256", secret).update(data).digest();
  const sigBuf = base64UrlDecode(signatureSeg);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    throw new Error("Invalid signature");
  }

  const payloadJson = base64UrlDecode(payloadSeg).toString("utf8");
  const payload = JSON.parse(payloadJson) as JwtPayload;
  if (!payload.exp || Date.now() / 1000 >= payload.exp) {
    throw new Error("Token expired");
  }
  return payload;
}

export function issueAccessToken(userId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: userId,
    type: "access",
    iat: now,
    exp: now + 15 * 60,
  };
  return signJwt(payload, getJwtSecret());
}

export function issueRefreshToken(userId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: userId,
    type: "refresh",
    iat: now,
    exp: now + 30 * 24 * 60 * 60,
  };
  return signJwt(payload, getJwtSecret());
}

export function verifyAccessToken(token: string): JwtPayload {
  const payload = verifyJwt(token, getJwtSecret());
  if (payload.type !== "access") {
    throw new Error("Invalid token type");
  }
  return payload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  const payload = verifyJwt(token, getJwtSecret());
  if (payload.type !== "refresh") {
    throw new Error("Invalid token type");
  }
  return payload;
}
