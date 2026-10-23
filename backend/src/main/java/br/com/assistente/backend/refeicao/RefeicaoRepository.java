package br.com.assistente.backend.refeicao;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefeicaoRepository extends JpaRepository<Refeicao, Long> {

    @EntityGraph(attributePaths = "alimentos")
    List<Refeicao> findByUsuarioIdOrderByHorarioAscNomeAsc(Long usuarioId);

    /** Sempre filtrando pelo dono: refeicao de outro usuario e tratada como inexistente. */
    @EntityGraph(attributePaths = "alimentos")
    Optional<Refeicao> findByIdAndUsuarioId(Long id, Long usuarioId);
}
