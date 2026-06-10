import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = "E:/feiyigame/feiyi-game-main1";
const staticRoot = join(root, "src/main/resources/static");
const templatesRoot = join(root, "src/main/resources/templates");
const port = 7000;

const types = {
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".html": "text/html; charset=utf-8"
};

function renderThymeleafPreview(html) {
    return html
        .replace(/\s+xmlns:th="[^"]*"/g, "")
        .replace(/\s+th:href="@\{([^}]*)\}"/g, ' href="$1"')
        .replace(/\s+th:src="@\{([^}]*)\}"/g, ' src="$1"');
}

async function send(res, status, body, type) {
    res.writeHead(status, {
        "Content-Type": type,
        "Cache-Control": "no-store"
    });
    res.end(body);
}

async function serveFile(res, base, requestPath) {
    const safePath = normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
    const filePath = join(base, safePath);
    const body = await readFile(filePath);
    await send(res, 200, body, types[extname(filePath)] || "application/octet-stream");
}

createServer(async (req, res) => {
    try {
        const url = new URL(req.url || "/", `http://localhost:${port}`);
        if (url.pathname === "/" || url.pathname === "/index.html") {
            const html = await readFile(join(templatesRoot, "index.html"), "utf8");
            await send(res, 200, renderThymeleafPreview(html), types[".html"]);
            return;
        }

        if (url.pathname === "/levels") {
            const html = await readFile(join(templatesRoot, "levels.html"), "utf8");
            await send(res, 200, renderThymeleafPreview(html), types[".html"]);
            return;
        }

        await serveFile(res, staticRoot, url.pathname);
    } catch (error) {
        await send(res, 404, "Not found", "text/plain; charset=utf-8");
    }
}).listen(port, () => {
    console.log(`Preview server running at http://localhost:${port}`);
});
