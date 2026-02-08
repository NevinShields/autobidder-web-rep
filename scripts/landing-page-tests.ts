import { slugifyLandingPage, validateLandingPageBasics } from "../server/landing-page-utils";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function run() {
  // Slug tests
  assert(slugifyLandingPage("My Great Business!") === "my-great-business", "Slugify failed");
  assert(slugifyLandingPage("") === "business", "Empty slug fallback failed");

  // Publish validation tests
  const basePage: any = {
    businessName: "Acme",
    services: [{ serviceId: 1, enabled: true }],
    primaryServiceId: 1,
  };
  assert(validateLandingPageBasics(basePage).length === 0, "Valid landing page flagged as invalid");

  const missingName = { ...basePage, businessName: "" };
  assert(validateLandingPageBasics(missingName).length > 0, "Missing name not detected");

  const noServices = { ...basePage, services: [] };
  assert(validateLandingPageBasics(noServices).length > 0, "Missing services not detected");

  const primaryNotEnabled = { ...basePage, services: [{ serviceId: 2, enabled: true }], primaryServiceId: 1 };
  assert(validateLandingPageBasics(primaryNotEnabled).length > 0, "Primary service mismatch not detected");

  console.log("Landing page unit tests passed");
}

run();

async function runIntegration() {
  const baseUrl = process.env.LANDING_TEST_BASE_URL;
  const draftSlug = process.env.LANDING_TEST_DRAFT_SLUG;
  if (!baseUrl || !draftSlug) return;

  const res = await fetch(`${baseUrl}/api/landing-page/public?slug=${encodeURIComponent(draftSlug)}`);
  if (res.status !== 404) {
    throw new Error(`Expected 404 for draft slug, got ${res.status}`);
  }
  console.log("Landing page integration tests passed");
}

runIntegration().catch((err) => {
  console.error(err);
  process.exit(1);
});
