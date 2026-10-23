package br.com.assistente.backend.conta;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TrocaSenhaRequest(
        @NotBlank @Size(max = 72) String senhaAtual,
        // 72 e o limite de bytes do BCrypt
        @NotBlank @Size(min = 8, max = 72) String novaSenha) {
}
