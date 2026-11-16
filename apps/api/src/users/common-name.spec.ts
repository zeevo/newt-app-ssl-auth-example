import { commonName } from "./common-name";

describe("commonName", () => {
  it("takes the CN from an nginx-style DN", () => {
    expect(commonName("CN=Devin E. Loper,OU=Development,O=Example,C=US")).toBe("Devin E. Loper");
  });

  it("takes the first, most specific CN", () => {
    expect(commonName("CN=Jane Doe,CN=Users,DC=example,DC=com")).toBe("Jane Doe");
  });

  it("finds a CN that is not the first attribute", () => {
    expect(commonName("emailAddress=j@example.com,CN=Jane Doe,O=Example")).toBe("Jane Doe");
  });

  it("matches the attribute type case-insensitively", () => {
    expect(commonName("cn=Jane Doe,o=Example")).toBe("Jane Doe");
  });

  it("undoes escaped separators", () => {
    expect(commonName("CN=Doe\\, Jane,O=Example")).toBe("Doe, Jane");
    expect(commonName("CN=A\\+B,O=Example")).toBe("A+B");
  });

  it("decodes hex-escaped UTF-8", () => {
    expect(commonName("CN=Ren\\C3\\A9e Dupont,O=Example")).toBe("Renée Dupont");
  });

  it("reads a CN in a multi-valued RDN", () => {
    expect(commonName("UID=jdoe+CN=Jane Doe,O=Example")).toBe("Jane Doe");
  });

  it("returns null without a CN", () => {
    expect(commonName("OU=Development,O=Example,C=US")).toBeNull();
    expect(commonName("CN=,O=Example")).toBeNull();
  });
});
