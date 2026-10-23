package br.com.assistente.backend.refeicao;

public class DestinatarioNaoEncontradoException extends RuntimeException {

    public DestinatarioNaoEncontradoException() {
        super("Nao existe usuario com esse nome de usuario.");
    }
}
