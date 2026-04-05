import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { DirectoryPricingReferenceRow } from "@/components/directory-pricing-reference";

type FaqItem = {
  question: string;
  answer: string;
};

function currency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildStructuredData(pageUrl: string, faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

function buildFaqs(
  categoryName: string,
  city: string,
  state: string,
  listingCount: number,
  rows: DirectoryPricingReferenceRow[],
): FaqItem[] {
  const firstRow = rows[0];
  const lowestRate = rows.length > 0 ? Math.min(...rows.map((row) => row.minRate)) : null;
  const highestRate = rows.length > 0 ? Math.max(...rows.map((row) => row.maxRate)) : null;

  return [
    {
      question: `How much does ${categoryName.toLowerCase()} cost in ${city}, ${state}?`,
      answer: rows.length > 0 && lowestRate !== null && highestRate !== null
        ? `${categoryName} prices in ${city}, ${state} commonly start around ${lowestRate.toFixed(2)} per square foot and can climb to about ${highestRate.toFixed(2)} per square foot depending on the service type, surface, property size, and job complexity. The sample table above shows local pricing examples pulled from directory calculators or fallback planning ranges for this market.`
        : `${categoryName} prices in ${city}, ${state} depend on the service scope, square footage, surface conditions, and labor complexity. On this page, the pricing table provides a planning benchmark that helps homeowners compare likely cost ranges before using a live calculator.`,
    },
    {
      question: `What affects ${categoryName.toLowerCase()} pricing in ${city}?`,
      answer: `The main pricing drivers for ${categoryName.toLowerCase()} in ${city}, ${state} are total square footage, material or surface type, access difficulty, prep work, and whether the property needs add-ons or detail work. Local labor availability and seasonal demand in the ${city} market can also move pricing higher or lower.`,
    },
    {
      question: `Are the ${categoryName.toLowerCase()} prices on this page local to ${city}, ${state}?`,
      answer: listingCount > 0
        ? `Yes. This ${city}, ${state} page is built around ${listingCount} active local directory provider${listingCount === 1 ? "" : "s"} and their pricing calculators when that data is available. If local calculator data is limited for a specific row, the page falls back to broader service benchmarks so the page still provides a usable local SEO and planning reference.`
        : `This page is localized to ${city}, ${state}. When direct local calculator data is limited, it uses broader service benchmarks tailored to the city page so homeowners and search engines still have a useful planning reference tied to ${city}.`,
    },
    {
      question: `How accurate is the ${categoryName.toLowerCase()} pricing table for ${city}?`,
      answer: firstRow
        ? `The table is best used as a planning guide, not as a final bid. For example, a row like "${firstRow.label}" uses a representative ${firstRow.squareFeet.toLocaleString()} square foot project to show how totals can land between ${currency(firstRow.minTotal)} and ${currency(firstRow.maxTotal)}. Final quotes can still change based on access, property condition, stains, repairs, and optional add-ons.`
        : `The table is intended as a planning guide for ${city}, ${state}. It is useful for SEO, AI search, and early budgeting, but final quotes can still move based on property condition, access, service extras, and labor requirements.`,
    },
    {
      question: `How can I get an exact ${categoryName.toLowerCase()} quote in ${city}, ${state}?`,
      answer: `Use one of the live local pricing calculators on this ${city} page to enter your actual project details. That is the fastest way to move from general pricing guidance to a more exact ${categoryName.toLowerCase()} quote for your property in ${city}, ${state}.`,
    },
  ];
}

export function DirectoryCityFaq({
  categoryName,
  city,
  state,
  listingCount,
  rows,
}: {
  categoryName: string;
  city: string;
  state: string;
  listingCount: number;
  rows: DirectoryPricingReferenceRow[];
}) {
  const faqs = buildFaqs(categoryName, city, state, listingCount, rows);
  const pageUrl = typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}`
    : "";
  const structuredData = buildStructuredData(pageUrl, faqs);

  return (
    <section className="mt-12 rounded-[28px] border border-slate-200/80 bg-white px-5 py-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:px-7 sm:py-8">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
          Local FAQ
        </p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {categoryName} FAQs for {city}, {state}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-[15px]">
          These answers are written for homeowners comparing {categoryName.toLowerCase()} pricing in {city}, {state}. They are structured to help with local SEO, answer engines, and on-page decision support.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 sm:px-6">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={faq.question} value={`faq-${index}`} className="border-slate-200">
              <AccordionTrigger className="text-left text-sm font-semibold text-slate-900 hover:no-underline sm:text-base">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-6 text-slate-600 sm:text-[15px]">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </section>
  );
}
