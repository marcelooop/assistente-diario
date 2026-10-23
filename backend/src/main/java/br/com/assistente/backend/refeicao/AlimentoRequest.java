package br.com.assistente.backend.refeicao;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record AlimentoRequest(
        @NotBlank @Size(max = 120) String nome,
        @NotNull @DecimalMin("0.0") @DecimalMax("100000.0") BigDecimal calorias) {
}
