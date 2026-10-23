package br.com.assistente.backend.usuario;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByNomeUsuarioIgnoreCase(String nomeUsuario);

    boolean existsByEmailAndIdNot(String email, Long id);

    boolean existsByNomeUsuarioIgnoreCaseAndIdNot(String nomeUsuario, Long id);
}
