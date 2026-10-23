package br.com.assistente.backend.pessoa;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/** IMC nao faz parte da entrada: e sempre calculado pelo servidor. */
public record PessoaRequest(
        @NotBlank @Size(max = 120) String nome,
        @NotNull @DecimalMin("0.50") @DecimalMax("2.50") BigDecimal altura,
        @NotNull @DecimalMin("1.0") @DecimalMax("500.0") BigDecimal peso,
        @NotNull @DecimalMin("1.0") @DecimalMax("500.0") BigDecimal metaPeso,
        @DecimalMin("0.0") @DecimalMax("500.0") BigDecimal massaMagra,
        @DecimalMin("0.0") @DecimalMax("500.0") BigDecimal massaGorda) {
}
