import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import sharp from "sharp";

import { getSiteConfig } from "@/lib/cms/queries";
import { deployment } from "@/lib/site-config";

/**
 * `/share-image`: the card a shared link shows when its page has no image of
 * its own — the fallback in `resolveMetadata` (SEO requirement REQ-024).
 *
 * A route rather than an `opengraph-image` file on purpose. File-based
 * metadata outranks `generateMetadata`, so a root `opengraph-image` would
 * replace every page's own share image and every article's featured image.
 * As a plain URL it sits at the bottom of the order the resolver already
 * keeps.
 *
 * Built once, at build time (`force-static`), and rebuilt only when Site
 * Settings change, since it carries John's name and role from there — see
 * `lib/cms/revalidate.ts`.
 *
 * Served as JPEG, not the PNG `ImageResponse` produces. The card holds a
 * photograph, and a photograph as PNG runs to the better part of a megabyte;
 * WhatsApp, the preview that matters most here, is widely reported to drop
 * images much over 300 KB and show the link as bare text.
 */
export const dynamic = "force-static";

const width = 1200;
const height = 630;

/** The photograph's column, at the card's full height. */
const photoWidth = 460;

const colours = {
  navy: "#0d1b2a",
  gold: "#c9a84c",
  goldLight: "#e8c97a",
  cream: "#fafaf8",
  creamMuted: "rgba(250, 250, 248, 0.72)",
};

/*
 * Read once per process, not per render. The fonts are the site's own faces
 * in TTF, which `ImageResponse` needs (it cannot read the WOFF2 that
 * `next/font` serves); they are OFL-licensed, see `assets/fonts/README.md`.
 * The portrait is the one the home page hero uses.
 *
 * Each path is written out whole, never built from a variable: a path the
 * bundler cannot read statically makes it trace the entire project into the
 * function, `public/` and all.
 */
const fontFiles = Promise.all([
  readFile(join(process.cwd(), "assets/fonts/PlayfairDisplay-SemiBold.ttf")),
  readFile(join(process.cwd(), "assets/fonts/PlayfairDisplay-Italic.ttf")),
  readFile(join(process.cwd(), "assets/fonts/DMSans-Medium.ttf")),
]);

const portrait = readFile(join(process.cwd(), "public/john-violaris-portrait.webp")).then((photo) =>
  sharp(photo)
    // Cropped from the top, where the face is; the portrait is already close
    // to the column's shape, so little is lost.
    .resize(photoWidth, height, { fit: "cover", position: "top" })
    .jpeg({ quality: 88 })
    .toBuffer(),
);

export async function GET() {
  const [[serifBold, serifItalic, sans], photo, config] = await Promise.all([
    fontFiles,
    portrait,
    getSiteConfig(),
  ]);

  const card = new ImageResponse(
    (
      <div
        style={{
          width,
          height,
          display: "flex",
          backgroundColor: colours.navy,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "72px 64px 64px 80px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{ width: 44, height: 2, backgroundColor: colours.gold }}
            />
            <div
              style={{
                fontFamily: "DM Sans",
                fontSize: 22,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: colours.gold,
              }}
            >
              {config.role}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: "Playfair Display",
                fontWeight: 600,
                fontSize: 92,
                lineHeight: 1.05,
                color: colours.cream,
              }}
            >
              {config.name}
            </div>
            <div
              style={{
                marginTop: 22,
                fontFamily: "Playfair Display",
                fontStyle: "italic",
                // One line in the text column; at 40 it breaks before
                // "offences" and leaves the word stranded.
                fontSize: 35,
                color: colours.goldLight,
              }}
            >
              Criminal defence &amp; motoring offences
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: "DM Sans",
              fontSize: 24,
              color: colours.creamMuted,
            }}
          >
            <div style={{ display: "flex" }}>Across {config.jurisdiction}</div>
            <div style={{ display: "flex", color: colours.gold }}>
              {new URL(deployment.url).host}
            </div>
          </div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori, not the browser */}
        <img
          src={`data:image/jpeg;base64,${photo.toString("base64")}`}
          width={photoWidth}
          height={height}
          alt=""
          style={{ borderLeft: `4px solid ${colours.gold}` }}
        />
      </div>
    ),
    {
      width,
      height,
      fonts: [
        { name: "Playfair Display", data: serifBold, weight: 600, style: "normal" },
        { name: "Playfair Display", data: serifItalic, weight: 400, style: "italic" },
        { name: "DM Sans", data: sans, weight: 500, style: "normal" },
      ],
    },
  );

  const jpeg = await sharp(Buffer.from(await card.arrayBuffer()))
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  return new Response(new Uint8Array(jpeg), {
    headers: { "Content-Type": "image/jpeg" },
  });
}
