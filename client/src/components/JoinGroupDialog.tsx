import { useEffect, useMemo, useState } from "react";
import { Product, Group } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface JoinGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  existingGroup?: Group | undefined;
}

function formatPhoneBR(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

async function postJson(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  // tenta JSON se vier JSON
  let data: any = null;
  if (contentType.includes("application/json")) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      text ||
      `Erro ${res.status} ao chamar ${url}`;
    throw new Error(msg);
  }

  // se não veio json, devolve texto também
  return data ?? { ok: true, raw: text };
}

async function tryPostMany(urls: string[], body: any) {
  let lastErr: any = null;

  for (const url of urls) {
    try {
      const data = await postJson(url, body);
      return { url, data };
    } catch (e: any) {
      lastErr = e;
      // tenta o próximo
    }
  }

  throw (
    lastErr || new Error("Não foi possível salvar (nenhum endpoint funcionou).")
  );
}

export function JoinGroupDialog({
  isOpen,
  onClose,
  product,
  existingGroup,
}: JoinGroupDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setErrorMsg("");
      setLoading(false);
    } else {
      setErrorMsg("");
    }
  }, [isOpen]);

  const isJoiningExisting = !!existingGroup;

  const title = useMemo(() => {
    return isJoiningExisting ? "Entrar no grupo" : "Criar novo grupo";
  }, [isJoiningExisting]);

  const subtitle = useMemo(() => {
    if (isJoiningExisting) {
      const faltam = Math.max(
        0,
        product.minPeople - (existingGroup?.currentPeople ?? 0),
      );
      return `Faltam ${faltam} pessoas para fechar este grupo.`;
    }
    return `Garanta o preço de R$ ${Number(product.groupPrice).toFixed(2)} juntando-se a outras ${product.minPeople} pessoas.`;
  }, [isJoiningExisting, product.groupPrice, product.minPeople, existingGroup]);

  async function handleSubmit() {
    setErrorMsg("");

    const cleanName = name.trim();
    const formattedPhone = phone.trim();
    const digitsPhone = formattedPhone.replace(/\D/g, "");

    if (!cleanName) {
      setErrorMsg("Informe seu nome.");
      return;
    }
    if (!formattedPhone || digitsPhone.length < 8) {
      setErrorMsg("Informe um WhatsApp / telefone válido.");
      return;
    }

    setLoading(true);

    try {
      // ✅ payload com chaves “alternativas” pra bater com qualquer backend
      const basePayload = {
        name: cleanName,
        phone: formattedPhone,
        phone_digits: digitsPhone,
        phoneNumber: formattedPhone,
        whatsapp: formattedPhone,
      };

      // 1) ENTRAR em grupo existente
      if (isJoiningExisting && existingGroup?.id) {
        const gid = existingGroup.id;

        const joinPayload = {
          ...basePayload,
          groupId: gid,
          group_id: gid,
        };

        // ✅ tenta endpoints mais comuns
        const joinUrls = [
          "/api/groups/join",
          `/api/groups/${gid}/join`,
          `/api/groups/${gid}/members`,
          "/api/members/join",
        ];

        const { url, data } = await tryPostMany(joinUrls, joinPayload);

        // Se o backend não devolveu nada útil, ainda assim consideramos ok
        // mas ajudamos mostrando por onde foi
        console.log("JOIN OK via", url, data);

        onClose();
        // reload para re-buscar grupos
        window.location.reload();
        return;
      }

      // 2) CRIAR grupo e entrar
      const createPayload = {
        ...basePayload,
        productId: product.id,
        product_id: product.id,
        minPeople: product.minPeople,
        min_people: product.minPeople,
      };

      const createUrls = [
        "/api/groups/create",
        "/api/groups",
        "/api/group/create",
        "/api/groups/new",
      ];

      const { url, data } = await tryPostMany(createUrls, createPayload);

      console.log("CREATE OK via", url, data);

      onClose();
      window.location.reload();
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-[520px] rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-800">
              Seu nome
            </label>
            <input
              className="mt-2 w-full rounded-xl border border-orange-300 px-4 py-3 outline-none focus:border-orange-500"
              placeholder="Ex: Maria Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800">
              WhatsApp / Telefone
            </label>
            <input
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
              placeholder="(75) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
              inputMode="tel"
            />
          </div>

          {errorMsg ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMsg}
            </div>
          ) : null}

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="w-full rounded-xl border-2 border-gray-300 py-6 font-semibold"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>

            <Button
              className="w-full rounded-xl bg-orange-500 py-6 font-bold text-white hover:bg-orange-600"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? "Enviando..."
                : isJoiningExisting
                  ? "Entrar no grupo"
                  : "Criar e entrar"}
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            Ao continuar, você concorda em receber mensagens no WhatsApp sobre o
            andamento do grupo.
          </p>
        </div>
      </div>
    </div>
  );
}
