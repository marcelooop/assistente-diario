package br.com.assistente.backend.pessoa;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * Dados corporais. O nome fica na conta (Usuario). O IMC nao faz parte da entrada:
 * e sempre calculado pelo servidor.
 */
public record PessoaRequest(
        @NotNull @DecimalMin("0.50") @DecimalMax("2.50") BigDecimal altura,
        @NotNull @DecimalMin("1.0") @DecimalMax("500.0") BigDecimal peso,
        @NotNull @DecimalMin("1.0") @DecimalMax("500.0") BigDecimal metaPeso,
        @DecimalMin("0.0") @DecimalMax("500.0") BigDecimal massaMagra,
        @DecimalMin("0.0") @DecimalMax("500.0") BigDecimal massaGorda) {
}
