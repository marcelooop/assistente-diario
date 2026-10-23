package br.com.assistente.backend.pessoa;

public class PessoaNaoEncontradaException extends RuntimeException {

    public PessoaNaoEncontradaException(Long id) {
        super("Pessoa nao encontrada: " + id);
    }
}
