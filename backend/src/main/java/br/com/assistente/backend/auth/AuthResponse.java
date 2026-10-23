package br.com.assistente.backend.auth;

/** perfilCompleto = false indica usuario novo, que ainda precisa preencher os dados de Pessoa. */
public record AuthResponse(String token, String email, boolean perfilCompleto) {
}
