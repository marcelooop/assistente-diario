package br.com.assistente.backend.refeicao;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Nome de usuario de quem vai receber uma copia da refeicao. */
public record CompartilharRequest(@NotBlank @Size(max = 30) String nomeUsuario) {
}
