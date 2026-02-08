import { db } from "./db";
import { directoryProfiles } from "@shared/schema";
import { eq } from "drizzle-orm";
import { geocodeAddress } from "./location-utils";

interface BusinessInfoInput {
  businessName?: string;
  website?: string;
  phone?: string;
  serviceLocation?: string;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 50);
}

function parseServiceLocation(location: string): { city: string; state: string } | null {
  const value = location.trim();
  if (!value.includes(",")) {
    return null;
  }

  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  const state = parts[parts.length - 1];
  const city = parts.slice(0, parts.length - 1).join(", ").trim();

  if (!city || !state) {
    return null;
  }

  return { city, state };
}

export async function ensureDirectoryProfileFromBusinessInfo(
  userId: string,
  businessInfo?: BusinessInfoInput | null,
) {
  if (!businessInfo?.businessName || !businessInfo?.serviceLocation) {
    return null;
  }

  const parsedLocation = parseServiceLocation(businessInfo.serviceLocation);
  if (!parsedLocation) {
    return null;
  }

  const [existing] = await db
    .select()
    .from(directoryProfiles)
    .where(eq(directoryProfiles.userId, userId))
    .limit(1);

  if (existing) {
    return existing;
  }

  const baseSlug = generateSlug(businessInfo.businessName || "company");
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const [slugExists] = await db
      .select({ id: directoryProfiles.id })
      .from(directoryProfiles)
      .where(eq(directoryProfiles.companySlug, slug))
      .limit(1);
    if (!slugExists) break;
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  let latitude: string | null = null;
  let longitude: string | null = null;
  try {
    const geo = await geocodeAddress(`${parsedLocation.city}, ${parsedLocation.state}`);
    if (geo) {
      latitude = geo.latitude.toString();
      longitude = geo.longitude.toString();
    }
  } catch (error) {
    console.log("[Directory] Onboarding geocoding failed, continuing without coordinates");
  }

  const [profile] = await db
    .insert(directoryProfiles)
    .values({
      userId,
      companySlug: slug,
      companyName: businessInfo.businessName,
      websiteUrl: businessInfo.website || null,
      phoneNumber: businessInfo.phone || null,
      city: parsedLocation.city,
      state: parsedLocation.state,
      latitude,
      longitude,
      status: "approved",
    })
    .returning();

  return profile;
}
