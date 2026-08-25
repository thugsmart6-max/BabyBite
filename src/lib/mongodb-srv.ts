export type SrvHost = {
  name: string;
  port: number;
  priority?: number;
  weight?: number;
};

const SRV_CODES = new Set([
  "ENOTFOUND",
  "ETIMEOUT",
  "ECONNREFUSED",
  "ESERVFAIL",
  "ENODATA",
  "EBUSY",
  "EAI_AGAIN",
]);

export function isMongoSrvError(error: unknown): boolean {
  const err = error as NodeJS.ErrnoException;
  const message = error instanceof Error ? error.message : String(error);
  const looksLikeSrv =
    err.syscall === "querySrv" ||
    err.syscall === "queryTxt" ||
    message.includes("querySrv") ||
    message.includes("_mongodb._tcp.");
  if (!looksLikeSrv) return false;
  return !err.code || SRV_CODES.has(err.code);
}

export function parseMongoSrvUri(uri: string) {
  if (!uri.startsWith("mongodb+srv://")) {
    throw new Error("Not a mongodb+srv URI");
  }
  const parsed = new URL(uri.replace("mongodb+srv://", "https://"));
  return {
    username: parsed.username,
    password: parsed.password,
    hostname: parsed.hostname,
    pathname: parsed.pathname || "/",
    searchParams: parsed.searchParams,
  };
}

export function buildMongoStandardUri(
  srvUri: string,
  hosts: SrvHost[],
  txtFlat?: string
): string {
  if (hosts.length === 0) {
    throw new Error("No MongoDB SRV hosts");
  }

  const parsed = parseMongoSrvUri(srvUri);
  const rest = srvUri.slice("mongodb+srv://".length);
  const at = rest.lastIndexOf("@");
  const auth = parsed.username && at > 0 ? `${rest.slice(0, at)}@` : "";
  const hostList = [...hosts]
    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
    .map((host) => `${host.name.replace(/\.$/, "")}:${host.port}`)
    .join(",");

  const params = new URLSearchParams(parsed.searchParams.toString());
  if (txtFlat) {
    const txtParams = new URLSearchParams(txtFlat.replace(/"/g, "").replace(/\s+/g, "&"));
    txtParams.forEach((value, key) => {
      if (!params.has(key)) params.set(key, value);
    });
  }
  if (!params.has("tls")) params.set("tls", "true");

  const path = parsed.pathname.startsWith("/") ? parsed.pathname : `/${parsed.pathname}`;
  return `mongodb://${auth}${hostList}${path}?${params.toString()}`;
}

function parseDohSrvData(data: string): SrvHost {
  const parts = data.trim().split(/\s+/);
  if (parts.length < 4) {
    throw new Error(`Unexpected SRV record: ${data}`);
  }
  return {
    priority: Number(parts[0]),
    weight: Number(parts[1]),
    port: Number(parts[2]),
    name: parts[3],
  };
}

type DohAnswer = { type?: number; data: string };

async function dohQuery(name: string, type: "SRV" | "TXT"): Promise<DohAnswer[]> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url, {
    headers: { Accept: "application/dns-json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`DNS lookup failed (${res.status})`);
  }
  const json = (await res.json()) as { Answer?: DohAnswer[] };
  return json.Answer ?? [];
}

/** Bypass Windows/c-ares querySrv by resolving Atlas SRV over HTTPS, then connecting with mongodb://. */
export async function resolveMongoSrvUri(srvUri: string): Promise<string> {
  const { hostname } = parseMongoSrvUri(srvUri);
  const srvAnswers = await dohQuery(`_mongodb._tcp.${hostname}`, "SRV");
  const hosts = srvAnswers.map((answer) => parseDohSrvData(answer.data));
  if (hosts.length === 0) {
    throw new Error(`No SRV records for ${hostname}`);
  }

  let txt: string | undefined;
  try {
    const txtAnswers = await dohQuery(hostname, "TXT");
    txt = txtAnswers.map((answer) => answer.data.replace(/^"|"$/g, "")).join("&");
  } catch {
    txt = undefined;
  }

  return buildMongoStandardUri(srvUri, hosts, txt);
}
