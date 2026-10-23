package br.com.assistente.backend.pessoa;

import java.math.BigDecimal;

public record PessoaResponse(
        Long id,
        BigDecimal altura,
        BigDecimal peso,
        BigDecimal metaPeso,
        BigDecimal imc,
        String classificacaoImc,
        BigDecimal massaMagra,
        BigDecimal massaGorda) {

    static PessoaResponse de(Pessoa p) {
        return new PessoaResponse(p.getId(), p.getAltura(), p.getPeso(), p.getMetaPeso(),
                p.getImc(), ImcCalculator.classificar(p.getImc()), p.getMassaMagra(), p.getMassaGorda());
    }
}
