declare module "node-correios" {
  interface CalculoPrecoPrazoParams {
    nCdServico: string;
    sCepOrigem: string;
    sCepDestino: string;
    nVlPeso: string;
    nCdFormato: number;
    nVlComprimento: number;
    nVlAltura: number;
    nVlLargura: number;
    nVlDiametro: number;
    nCdEmpresa?: string;
    sDsSenha?: string;
    sCdMaoPropria?: "S" | "N";
    nVlValorDeclarado?: number;
    sCdAvisoRecebimento?: "S" | "N";
  }

  interface ResultadoPrecoPrazo {
    Codigo: string | number;
    Valor: string;
    PrazoEntrega?: string;
    Erro?: string | Record<string, never>;
    MsgErro?: string | Record<string, never>;
  }

  export default class Correios {
    calcPrecoPrazo(params: CalculoPrecoPrazoParams): Promise<ResultadoPrecoPrazo[]>;
  }
}
