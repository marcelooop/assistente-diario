package br.com.assistente.backend.refeicao;

import br.com.assistente.backend.usuario.Usuario;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Uma refeicao da dieta de um usuario (ex.: "Cafe da manha", 07:30) com seus alimentos. */
@Entity
@Table(indexes = @Index(name = "idx_refeicao_usuario", columnList = "usuario_id"))
@Getter
@Setter
@NoArgsConstructor
public class Refeicao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false)
    private LocalTime horario;

    /** Preenchido quando a refeicao foi recebida por compartilhamento: nome de usuario de quem enviou. */
    @Column(length = 30)
    private String origemNomeUsuario;

    @OneToMany(mappedBy = "refeicao", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<Alimento> alimentos = new ArrayList<>();

    public void adicionar(Alimento alimento) {
        alimento.setRefeicao(this);
        alimentos.add(alimento);
    }
}
