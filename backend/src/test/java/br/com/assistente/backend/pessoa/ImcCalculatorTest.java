package br.com.assistente.backend.pessoa;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class ImcCalculatorTest {

    @Test
    void calculaImcComDuasCasasDecimais() {
        // 70 / (1.75 * 1.75) = 22.857... -> 22.86
        assertEquals(new BigDecimal("22.86"),
                ImcCalculator.calcular(new BigDecimal("70"), new BigDecimal("1.75")));
    }

    @Test
    void classificaConformeOms() {
        assertEquals("Abaixo do peso", ImcCalculator.classificar(new BigDecimal("18.49")));
        assertEquals("Peso normal", ImcCalculator.classificar(new BigDecimal("18.50")));
        assertEquals("Sobrepeso", ImcCalculator.classificar(new BigDecimal("25.00")));
        assertEquals("Obesidade grau I", ImcCalculator.classificar(new BigDecimal("30.00")));
        assertEquals("Obesidade grau II", ImcCalculator.classificar(new BigDecimal("35.00")));
        assertEquals("Obesidade grau III", ImcCalculator.classificar(new BigDecimal("40.00")));
    }
}
