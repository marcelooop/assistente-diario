package br.com.assistente.backend.refeicao;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record RefeicaoRequest(
        @NotBlank @Size(max = 120) String nome,
        @NotBlank @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "use o formato HH:mm") String horario,
        @NotEmpty @Size(max = 100) List<@Valid AlimentoRequest> alimentos) {
}
