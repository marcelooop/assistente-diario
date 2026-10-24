export interface Alimento {
  id?: number;
  nome: string;
  /** Calorias (kcal) do alimento nesta refeição. */
  calorias: number;
}

export interface Refeicao {
  id: number;
  nome: string;
  /** Horário no formato HH:mm. */
  horario: string;
  totalCalorias: number;
  /** Nome de usuário de quem enviou, se a refeição foi recebida por compartilhamento. */
  compartilhadaPor: string | null;
  alimentos: Alimento[];
}

export interface RefeicaoRequest {
  nome: string;
  horario: string;
  alimentos: { nome: string; calorias: number }[];
}
