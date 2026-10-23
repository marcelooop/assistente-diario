package br.com.assistente.backend.pessoa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import br.com.assistente.backend.usuario.Usuario;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Pessoa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Dono do cadastro: cada usuario tem no maximo uma Pessoa. */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @Column(nullable = false, length = 120)
    private String nome;

    /** Altura em metros (ex.: 1.75). */
    @Column(nullable = false, precision = 4, scale = 2)
    private BigDecimal altura;

    /** Peso em kg. */
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal peso;

    /** Meta de peso em kg. */
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal metaPeso;

    /** Calculado automaticamente a partir de peso e altura. */
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal imc;

    /** Massa magra corporal em kg (opcional). */
    @Column(precision = 5, scale = 2)
    private BigDecimal massaMagra;

    /** Massa gorda corporal em kg (opcional). */
    @Column(precision = 5, scale = 2)
    private BigDecimal massaGorda;
}
