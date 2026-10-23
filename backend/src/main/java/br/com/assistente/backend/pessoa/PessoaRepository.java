package br.com.assistente.backend.pessoa;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PessoaRepository extends JpaRepository<Pessoa, Long> {

    Optional<Pessoa> findByUsuarioId(Long usuarioId);

    boolean existsByUsuarioId(Long usuarioId);
}
