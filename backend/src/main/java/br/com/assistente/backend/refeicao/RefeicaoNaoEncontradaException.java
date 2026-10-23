package br.com.assistente.backend.refeicao;

public class RefeicaoNaoEncontradaException extends RuntimeException {

    public RefeicaoNaoEncontradaException() {
        super("Refeicao nao encontrada.");
    }
}
