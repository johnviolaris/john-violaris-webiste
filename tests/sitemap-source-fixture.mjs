import { registerHooks } from "node:module";

const mode = process.argv[2];
globalThis.sitemapFixtureRpcCalls = [];
if (mode.startsWith("route-")) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://isolated.fixture.test";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "fixture-public-key";
}
globalThis.fetch = () => { throw new Error("Network is forbidden in this fixture"); };
const source = (code) => ({ url: `data:text/javascript,${encodeURIComponent(code)}`, shortCircuit: true });
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return source("export {};");
    if (specifier === "@/lib/cms/media/queries") return source("export async function getPublicMedia() { throw new Error('Unrelated media read forbidden'); }");
    if (specifier === "@/lib/cms/queries" && !mode.startsWith("route-")) return source("export async function getRouteIndex() { return { services: [], articles: [], sourceAvailable: true }; }");
    if (specifier === "@/utils/supabase/public") return source(`
      export function publicClient() {
        ${mode === "throws" ? "throw new Error('private transport details must not escape');" : ""}
        return { rpc(name) {
          if(!['get_sitemap_change_dates','get_sitemap_dependency_dates'].includes(name)) throw new Error('Unexpected RPC');
          globalThis.sitemapFixtureRpcCalls.push(name);
          if (name==='get_sitemap_dependency_dates' && ${JSON.stringify(mode)}.startsWith('legacy-')) return Promise.resolve({data:null,error:{message:'Unavailable new coverage'}});
          if (${JSON.stringify(mode)} === 'rpc-throws') throw new Error('private RPC transport details');
          return Promise.resolve({ data: ${JSON.stringify(mode)} === 'rpc-null' || ${JSON.stringify(mode)} === 'rpc-failure' ? null : ['rpc-dates','legacy-dates'].includes(${JSON.stringify(mode)}) ? [{path:'/fees',modified_at:'2026-10-03T09:00:00Z'}] : ${JSON.stringify(mode)} === 'rpc-malformed' ? [{path:{secret:'private'},modified_at:null}] : [], error: ${JSON.stringify(mode)} === 'rpc-failure' ? {message:'private RPC query details'} : null });
        }, from(table) { const chain = { select() { return chain; }, order() { return chain; }, eq() { return chain; }, or() { return chain; }, returns() {
          if (${JSON.stringify(mode)} === 'route-throws' && table === 'services') throw new Error('private collection transport details');
          if (${JSON.stringify(mode)} === 'route-failure' && table === 'services') return Promise.resolve({ data: null, error: { message: 'private collection query details' } });
          if (${JSON.stringify(mode)} === 'failure' && table === 'media_assets') return Promise.resolve({ data: null, error: { message: 'private query details' } });
          if (${JSON.stringify(mode)} === 'null' && table === 'seo_metadata') return Promise.resolve({ data: null, error: null });
          return Promise.resolve({ data: table === 'page_sections' ? [{ page: 'fees', section: 'body', portrait: null, updated_at: '2026-10-02T09:00:00Z' }] : [], error: null });
        } }; return chain; } };
      }
    `);
    return nextResolve(specifier, context);
  },
});
const { getSitemapDateSnapshot, getSitemapDateSources } = await import("../lib/cms/seo/sitemap-queries.ts");
const snapshot = await getSitemapDateSnapshot();
// Outside an RSC render React.cache does not deduplicate the second getter.
// Measure RPC count for one actual snapshot call, then also check getter parity.
const rpcCalls = [...globalThis.sitemapFixtureRpcCalls];
process.stdout.write(JSON.stringify({ snapshot, sources: await getSitemapDateSources(), rpcCalls }));
