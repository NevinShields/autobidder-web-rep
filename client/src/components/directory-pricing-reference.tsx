import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type DirectoryPricingReferenceRow = {
  label: string;
  squareFeet: number;
  minRate: number;
  maxRate: number;
  minTotal: number;
  maxTotal: number;
  note: string;
};

function currency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function rate(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function buildStructuredData(
  title: string,
  pageUrl: string,
  rows: DirectoryPricingReferenceRow[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: title,
    mainEntityOfPage: pageUrl,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: title,
      itemListElement: rows.map((row) => ({
        "@type": "Offer",
        name: `${row.label} for ${row.squareFeet.toLocaleString()} square feet`,
        description: row.note,
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "USD",
          minPrice: row.minTotal,
          maxPrice: row.maxTotal,
          unitText: "project",
        },
        itemOffered: {
          "@type": "Service",
          name: row.label,
          floorSize: {
            "@type": "QuantitativeValue",
            value: row.squareFeet,
            unitCode: "FTK",
          },
        },
      })),
    },
  };
}

export function DirectoryPricingReference({
  title,
  intro,
  rows,
  sourceCount,
}: {
  title: string;
  intro: string;
  rows: DirectoryPricingReferenceRow[];
  sourceCount: number;
}) {
  if (!rows.length) {
    return null;
  }

  const pageUrl = typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}`
    : "";
  const structuredData = buildStructuredData(title, pageUrl, rows);

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white px-5 py-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:px-7 sm:py-8">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
          Local Pricing Reference
        </p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-[15px]">
          {intro}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          This table is built from {sourceCount} active local pricing calculator{sourceCount === 1 ? "" : "s"} in the directory. Each row is a representative service configuration rather than a generic national average.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        <div className="grid gap-3 md:hidden">
          {rows.map((row) => (
            <article
              key={`mobile-${row.label}-${row.squareFeet}`}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-slate-900">
                  {row.label}
                </h3>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-600 shadow-sm">
                  {row.squareFeet.toLocaleString()} sq ft
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Cost / Sq Ft
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {rate(row.minRate)} - {rate(row.maxRate)}
                  </p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Total Range
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {currency(row.minTotal)} - {currency(row.maxTotal)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {row.note}
              </p>
            </article>
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
          <div className="overflow-x-auto">
            <Table aria-label={title}>
              <TableHeader>
                <TableRow className="bg-slate-50/90">
                  <TableHead className="min-w-[220px] text-slate-700">Service Type</TableHead>
                  <TableHead className="min-w-[120px] text-slate-700">Project Size</TableHead>
                  <TableHead className="min-w-[150px] text-slate-700">Estimated Cost / Sq Ft</TableHead>
                  <TableHead className="min-w-[170px] text-slate-700">Sample Total Price</TableHead>
                  <TableHead className="min-w-[280px] text-slate-700">Pricing Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={`${row.label}-${row.squareFeet}`} className="align-top">
                    <TableCell className="font-medium text-slate-900">{row.label}</TableCell>
                    <TableCell className="text-slate-600">{row.squareFeet.toLocaleString()} sq ft</TableCell>
                    <TableCell className="text-slate-600">
                      {rate(row.minRate)} - {rate(row.maxRate)}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {currency(row.minTotal)} - {currency(row.maxTotal)}
                    </TableCell>
                    <TableCell className="text-sm leading-6 text-slate-600">{row.note}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
        Pricing ranges can still shift with access, prep work, stain level, add-ons, permits, and property-specific conditions. Use the live local calculators above for the most exact quote path.
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </section>
  );
}
