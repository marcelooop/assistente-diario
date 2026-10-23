package br.com.assistente.backend.conta;

import br.com.assistente.backend.usuario.Usuario;

public record ContaResponse(String nome, String nomeUsuario, String email) {

    static ContaResponse de(Usuario u) {
        return new ContaResponse(u.getNome(), u.getNomeUsuario(), u.getEmail());
    }
}
