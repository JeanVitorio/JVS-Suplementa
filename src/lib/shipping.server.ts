import Correios from "node-correios";

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

const PAC_SERVICE_CODE = "04510";
const REQUEST_TIMEOUT_MS = 8_000;

function parseCorreiosPrice(value: string) {
  return Number(value.replace(/\./g, "").replace(",", "."));
}

export async function calculateCorreiosQuote(pkg: CorreiosPackage): Promise<CorreiosQuote> {
  const correios = new Correios();
  const request = correios.calcPrecoPrazo({
    nCdServico: PAC_SERVICE_CODE,
    sCepOrigem: pkg.originCep,
    sCepDestino: pkg.destinationCep,
    nVlPeso: pkg.weight.toFixed(2),
    nCdFormato: 1,
    nVlComprimento: pkg.length,
    nVlAltura: pkg.height,
    nVlLargura: pkg.width,
    nVlDiametro: 0,
    sCdMaoPropria: "N",
    nVlValorDeclarado: 0,
    sCdAvisoRecebimento: "N",
  });

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error("Tempo limite excedido na consulta aos Correios.")),
      REQUEST_TIMEOUT_MS,
    );
  });
  const [result] = await Promise.race([request, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
  const errorCode = typeof result?.Erro === "string" ? result.Erro : "0";
  const price = result ? parseCorreiosPrice(result.Valor) : Number.NaN;
  const deliveryDays = Number(result?.PrazoEntrega);

  if (!result || (errorCode !== "" && errorCode !== "0") || !Number.isFinite(price) || price <= 0) {
    const message = typeof result?.MsgErro === "string" ? result.MsgErro : "Consulta de frete indisponível.";
    throw new Error(message);
  }

  return {
    price,
    deliveryDays: Number.isFinite(deliveryDays) && deliveryDays > 0 ? deliveryDays : 1,
    service: "PAC",
  };
}
