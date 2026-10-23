package br.com.assistente.backend.usuario;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Sempre em minusculas. */
    @Column(nullable = false, unique = true, length = 254)
    private String email;

    /** Hash BCrypt; a senha em texto puro nunca e guardada. */
    @Column(nullable = false, length = 100)
    private String senhaHash;

    @Column(nullable = false)
    private Instant criadoEm = Instant.now();
}
