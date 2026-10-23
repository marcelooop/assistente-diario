package br.com.assistente.backend.usuario;

/** Token valido de um usuario que nao existe mais (ex.: banco H2 reiniciado). */
public class UsuarioNaoEncontradoException extends RuntimeException {

    public UsuarioNaoEncontradoException() {
        super("Sessao invalida. Entre novamente.");
    }
}
