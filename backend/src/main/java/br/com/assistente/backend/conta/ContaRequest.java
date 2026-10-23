package br.com.assistente.backend.conta;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Dados informados no registro, que o usuario pode editar. A senha nao muda por aqui. */
public record ContaRequest(
        @NotBlank @Size(max = 120) String nome,
        @NotBlank @Size(min = 3, max = 30)
        @Pattern(regexp = "^[A-Za-z0-9._-]*$", message = "use apenas letras, numeros, ponto, hifen e sublinhado")
        String nomeUsuario,
        @NotBlank @Email @Size(max = 254) String email) {
}
