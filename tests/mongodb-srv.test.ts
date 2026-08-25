import { describe, expect, it } from "vitest";
import {
  buildMongoStandardUri,
  isMongoSrvError,
  parseMongoSrvUri,
} from "@/lib/mongodb-srv";
import { handleRouteError } from "@/lib/api-route";

describe("isMongoSrvError", () => {
  it("treats querySrv ENOTFOUND as an SRV failure", () => {
    const error = Object.assign(new Error("querySrv ENOTFOUND _mongodb._tcp.example.mongodb.net"), {
      code: "ENOTFOUND",
      syscall: "querySrv",
    });
    expect(isMongoSrvError(error)).toBe(true);
  });

  it("treats querySrv ETIMEOUT as an SRV failure", () => {
    const error = Object.assign(new Error("querySrv ETIMEOUT _mongodb._tcp.example.mongodb.net"), {
      code: "ETIMEOUT",
      syscall: "querySrv",
    });
    expect(isMongoSrvError(error)).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isMongoSrvError(new Error("Unauthorized"))).toBe(false);
  });
});

describe("buildMongoStandardUri", () => {
  it("converts Atlas SRV hosts into a tls mongodb:// URI", () => {
    const uri = buildMongoStandardUri(
      "mongodb+srv://demo:p%40ss@cluster.example.com/app?retryWrites=true",
      [
        { name: "ac-1.example.com.", port: 27017, priority: 0 },
        { name: "ac-2.example.com.", port: 27017, priority: 0 },
      ],
      "authSource=admin&replicaSet=atlas-demo"
    );

    expect(uri.startsWith("mongodb://demo:p%40ss@")).toBe(true);
    expect(uri).toContain("ac-1.example.com:27017");
    expect(uri).toContain("ac-2.example.com:27017");
    expect(uri).toContain("retryWrites=true");
    expect(uri).toContain("authSource=admin");
    expect(uri).toContain("tls=true");
  });

  it("parses the Atlas hostname from a srv URI", () => {
    expect(parseMongoSrvUri("mongodb+srv://demo:secret@cluster.example.com/app").hostname).toBe(
      "cluster.example.com"
    );
  });
});

describe("handleRouteError SRV", () => {
  it("maps querySrv ENOTFOUND to 503", async () => {
    const error = Object.assign(new Error("querySrv ENOTFOUND _mongodb._tcp.example.mongodb.net"), {
      code: "ENOTFOUND",
      syscall: "querySrv",
    });
    const res = handleRouteError(error, "failed");
    expect(res.status).toBe(503);
  });
});
