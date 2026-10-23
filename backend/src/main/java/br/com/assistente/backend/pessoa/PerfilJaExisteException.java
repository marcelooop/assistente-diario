package br.com.assistente.backend.pessoa;

public class PerfilJaExisteException extends RuntimeException {

    public PerfilJaExisteException() {
        super("O cadastro de dados pessoais ja existe. Use a edicao.");
    }
}
