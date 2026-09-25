import process from "node:process";

export interface CorreiosPackage {
  originCep: string;
  destinationCep: string;
  weight: number;
  length: number;
  height: number;
  width: number;
}

export interface CorreiosQuote {
  price: number;
  deliveryDays: number;
  service: "PAC";
}

const REQUEST_TIMEOUT_MS = 8_000;
const SUPERFRETE_CALCULATOR_URL = "https://api.superfrete.com/api/v0/calculator";

interface SuperFreteQuote {
  id?: number;
  name?: string;
  price?: string | number;
  delivery_time?: number;
  delivery_range?: {
    max?: number;
  };
  error?: string | Record<string, unknown>;
}

export async function calculateCorreiosQuote(pkg: CorreiosPackage): Promise<CorreiosQuote> {
  const token = process.env.SUPERFRETE_TOKEN?.trim();
  if (!token) {
    throw new Error("SUPERFRETE_TOKEN não configurado no servidor.");
  }

  const response = await fetch(SUPERFRETE_CALCULATOR_URL, {
    method: "POST",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent":
        process.env.SUPERFRETE_USER_AGENT?.trim() ||
        "JVS Modelo (contato@jvsmodelo.com.br)",
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: { postal_code: pkg.originCep },
      to: { postal_code: pkg.destinationCep },
      services: "1",
      options: {
        own_hand: false,
        receipt: false,
        insurance_value: 0,
        use_insurance_value: false,
      },
      package: {
        height: pkg.height,
        width: pkg.width,
        length: pkg.length,
        weight: pkg.weight,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`SuperFrete respondeu com status ${response.status}.`);
  }

  const quotes = (await response.json()) as SuperFreteQuote[];
  const pac = quotes.find(
    (quote) =>
      !quote.error &&
      (quote.id === 1 || quote.name?.trim().toUpperCase() === "PAC"),
  );
  const price = Number(pac?.price);
  const deliveryDays = Number(pac?.delivery_time ?? pac?.delivery_range?.max);

  if (!pac || !Number.isFinite(price) || price <= 0) {
    throw new Error("A SuperFrete não retornou uma cotação PAC válida.");
  }

  return {
    price,
    deliveryDays: Number.isFinite(deliveryDays) && deliveryDays > 0 ? deliveryDays : 1,
    service: "PAC",
  };
}
