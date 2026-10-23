package br.com.assistente.backend.auth;

public class CredenciaisInvalidasException extends RuntimeException {

    /** Mensagem unica para e-mail inexistente ou senha errada (nao revela qual). */
    public CredenciaisInvalidasException() {
        super("E-mail ou senha invalidos.");
    }
}
