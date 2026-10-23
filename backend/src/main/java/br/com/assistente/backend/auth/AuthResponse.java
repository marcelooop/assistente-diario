package br.com.assistente.backend.auth;

/**
 * nomeUsuario e o apelido exibido em "Ola, ...". perfilCompleto = false indica usuario novo,
 * que ainda precisa preencher os dados de Pessoa.
 */
public record AuthResponse(String token, String email, String nome, String nomeUsuario, boolean perfilCompleto) {
}
