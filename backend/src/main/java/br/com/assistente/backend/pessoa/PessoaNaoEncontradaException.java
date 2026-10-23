package br.com.assistente.backend.pessoa;

public class PessoaNaoEncontradaException extends RuntimeException {

    public PessoaNaoEncontradaException() {
        super("Cadastro de dados pessoais ainda nao realizado.");
    }
}
