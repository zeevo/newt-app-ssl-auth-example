function splitUnescaped(text: string, separator: string): string[] {
  const parts: string[] = [];
  let current = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "\\") {
      current += char + (text[i + 1] ?? "");
      i++;
    } else if (char === separator) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

function unescapeValue(value: string): string {
  const bytes: number[] = [];
  const encoder = new TextEncoder();
  for (let i = 0; i < value.length; i++) {
    const char = value[i] ?? "";
    const hex = value.slice(i + 1, i + 3);
    if (char === "\\" && /^[0-9a-fA-F]{2}$/.test(hex)) {
      bytes.push(parseInt(hex, 16));
      i += 2;
    } else if (char === "\\") {
      bytes.push(...encoder.encode(value[i + 1] ?? ""));
      i++;
    } else {
      bytes.push(...encoder.encode(char));
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

/**
 * The first (most specific) CN in an RFC 4514 DN string, as nginx's
 * `$ssl_client_s_dn` reports it, with escapes such as `\,` and `\C3\A9` undone.
 */
export function commonName(dn: string): string | null {
  for (const rdn of splitUnescaped(dn, ",")) {
    for (const attribute of splitUnescaped(rdn, "+")) {
      const [type, ...rest] = splitUnescaped(attribute, "=");
      if (type?.trim().toUpperCase() !== "CN" || rest.length === 0) continue;
      const value = unescapeValue(rest.join("=").trim());
      return value || null;
    }
  }
  return null;
}
