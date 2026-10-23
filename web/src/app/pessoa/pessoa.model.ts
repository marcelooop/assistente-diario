/** Dados enviados ao cadastrar/editar. O IMC não é enviado: o servidor calcula. */
export interface PessoaRequest {
  nome: string;
  altura: number;
  peso: number;
  metaPeso: number;
  massaMagra: number | null;
  massaGorda: number | null;
}

export interface Pessoa extends PessoaRequest {
  id: number;
  imc: number;
  classificacaoImc: string;
}
