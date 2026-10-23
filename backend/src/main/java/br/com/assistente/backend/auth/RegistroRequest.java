package br.com.assistente.backend.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegistroRequest(
        @NotBlank @Size(min = 3, max = 30)
        @Pattern(regexp = "^[A-Za-z0-9._-]*$", message = "use apenas letras, numeros, ponto, hifen e sublinhado")
        String nomeUsuario,
        @NotBlank @Email @Size(max = 254) String email,
        // 72 e o limite de bytes do BCrypt
        @NotBlank @Size(min = 8, max = 72) String senha) {
}
