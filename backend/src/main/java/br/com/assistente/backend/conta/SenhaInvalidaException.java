package br.com.assistente.backend.conta;

/** Troca de senha recusada. Responde 400 (e nao 401) para o app nao encerrar a sessao por engano. */
public class SenhaInvalidaException extends RuntimeException {

    public SenhaInvalidaException(String mensagem) {
        super(mensagem);
    }
}
