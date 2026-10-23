package br.com.assistente.backend.pessoa;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** IMC = peso (kg) / altura (m)^2. Classificacao conforme a OMS (adultos). */
public final class ImcCalculator {

    private ImcCalculator() {
    }

    public static BigDecimal calcular(BigDecimal pesoKg, BigDecimal alturaM) {
        BigDecimal alturaAoQuadrado = alturaM.multiply(alturaM);
        return pesoKg.divide(alturaAoQuadrado, 2, RoundingMode.HALF_UP);
    }

    public static String classificar(BigDecimal imc) {
        if (imc.compareTo(new BigDecimal("18.5")) < 0) {
            return "Abaixo do peso";
        }
        if (imc.compareTo(new BigDecimal("25")) < 0) {
            return "Peso normal";
        }
        if (imc.compareTo(new BigDecimal("30")) < 0) {
            return "Sobrepeso";
        }
        if (imc.compareTo(new BigDecimal("35")) < 0) {
            return "Obesidade grau I";
        }
        if (imc.compareTo(new BigDecimal("40")) < 0) {
            return "Obesidade grau II";
        }
        return "Obesidade grau III";
    }
}
