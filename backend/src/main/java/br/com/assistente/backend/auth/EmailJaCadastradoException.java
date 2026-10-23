package br.com.assistente.backend.auth;

public class EmailJaCadastradoException extends RuntimeException {

    public EmailJaCadastradoException() {
        super("Este e-mail ja esta cadastrado.");
    }
}
