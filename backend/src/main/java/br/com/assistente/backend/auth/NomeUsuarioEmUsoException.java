package br.com.assistente.backend.auth;

public class NomeUsuarioEmUsoException extends RuntimeException {

    public NomeUsuarioEmUsoException() {
        super("Este nome de usuario ja esta em uso.");
    }
}
