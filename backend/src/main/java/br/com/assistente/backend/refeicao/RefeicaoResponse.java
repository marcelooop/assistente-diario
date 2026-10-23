package br.com.assistente.backend.refeicao;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

/** horario no formato HH:mm; totalCalorias e a soma dos alimentos; origem so existe se foi compartilhada. */
public record RefeicaoResponse(
        Long id,
        String nome,
        String horario,
        BigDecimal totalCalorias,
        String compartilhadaPor,
        List<AlimentoResponse> alimentos) {

    public record AlimentoResponse(Long id, String nome, BigDecimal calorias) {
    }

    static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

    static RefeicaoResponse de(Refeicao r) {
        List<AlimentoResponse> itens = r.getAlimentos().stream()
                .map(a -> new AlimentoResponse(a.getId(), a.getNome(), a.getCalorias()))
                .toList();
        BigDecimal total = itens.stream().map(AlimentoResponse::calorias).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new RefeicaoResponse(r.getId(), r.getNome(), r.getHorario().format(HORA), total,
                r.getOrigemNomeUsuario(), itens);
    }
}
