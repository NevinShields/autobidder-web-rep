import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Embed routes that should serve the lightweight embed.html
const EMBED_ROUTE_PREFIXES = ['/styled-calculator', '/custom-form/', '/embed/', '/f/'];

function isEmbedRoute(url: string): boolean {
  return EMBED_ROUTE_PREFIXES.some(prefix => url.startsWith(prefix));
}

function titleCaseSlug(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDirectoryTitleForUrl(rawUrl: string): string | null {
  const pathname = decodeURIComponent(rawUrl.split("?")[0]).replace(/\/+$/, "") || "/";

  if (pathname === "/directory") {
    return "Local Service Prices Near You";
  }

  const pricesCityMatch = pathname.match(/^\/prices\/([^/]+)\/([^/]+)$/);
  if (pricesCityMatch) {
    const [, categorySlug, citySlug] = pricesCityMatch;
    const cityParts = citySlug.split("-").filter(Boolean);
    const state = cityParts.pop()?.toUpperCase() || "";
    const city = cityParts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
    return `${titleCaseSlug(categorySlug)} Prices in ${city}, ${state}`;
  }

  const pricesCategoryMatch = pathname.match(/^\/prices\/([^/]+)$/);
  if (pricesCategoryMatch) {
    const [, categorySlug] = pricesCategoryMatch;
    return `${titleCaseSlug(categorySlug)} Prices`;
  }

  const companyMatch = pathname.match(/^\/directory\/company\/([^/]+)$/);
  if (companyMatch) {
    const [, companySlug] = companyMatch;
    return `${titleCaseSlug(companySlug)} Prices`;
  }

  return null;
}

function injectTitle(template: string, rawUrl: string): string {
  const title = getDirectoryTitleForUrl(rawUrl);
  if (!title) return template;
  return template.replace(
    /<title>.*?<\/title>/i,
    `<title>${title}</title>`,
  );
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Serve lightweight embed.html for embed routes (no analytics scripts)
      const useEmbed = isEmbedRoute(url);
      const templateFile = useEmbed ? "embed.html" : "index.html";
      const entryScript = useEmbed ? "/src/embed-entry.tsx" : "/src/main.tsx";

      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        templateFile,
      );

      // always reload the html file from disk in case it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = injectTitle(template, url);
      template = template.replace(
        `src="${entryScript}"`,
        `src="${entryScript}?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Serve embed.html for embed routes, index.html for everything else
  app.use("*", (req, res) => {
    const url = req.originalUrl;
    if (isEmbedRoute(url)) {
      const embedPath = path.resolve(distPath, "embed.html");
      if (fs.existsSync(embedPath)) {
        return res.sendFile(embedPath);
      }
    }
    const indexPath = path.resolve(distPath, "index.html");
    const template = fs.readFileSync(indexPath, "utf-8");
    res.status(200).set({ "Content-Type": "text/html" }).send(injectTitle(template, url));
  });
}
