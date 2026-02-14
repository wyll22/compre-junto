export function parseApiError(err: any): string {
  try {
    const msg = err?.message || String(err) || "Erro desconhecido";
    const colonIdx = msg.indexOf(":");
    if (colonIdx > -1) {
      const afterColon = msg.slice(colonIdx + 1).trim();
      try {
        const parsed = JSON.parse(afterColon);
        if (parsed.message) return parsed.message;
      } catch {}
      if (afterColon && afterColon.length < 200) return afterColon;
    }
    return msg;
  } catch {
    return "Erro ao processar. Tente novamente.";
  }
}
