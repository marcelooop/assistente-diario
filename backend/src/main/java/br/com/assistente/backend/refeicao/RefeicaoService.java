package br.com.assistente.backend.refeicao;

import br.com.assistente.backend.usuario.Usuario;
import br.com.assistente.backend.usuario.UsuarioNaoEncontradoException;
import br.com.assistente.backend.usuario.UsuarioRepository;
import java.time.LocalTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Todas as operacoes valem so para as refeicoes do usuario autenticado. */
@Service
@RequiredArgsConstructor
public class RefeicaoService {

    private final RefeicaoRepository repository;
    private final UsuarioRepository usuarios;

    @Transactional(readOnly = true)
    public List<RefeicaoResponse> listar(Long usuarioId) {
        return repository.findByUsuarioIdOrderByHorarioAscNomeAsc(usuarioId).stream()
                .map(RefeicaoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public RefeicaoResponse obter(Long usuarioId, Long id) {
        return RefeicaoResponse.de(doUsuario(usuarioId, id));
    }

    @Transactional
    public RefeicaoResponse criar(Long usuarioId, RefeicaoRequest req) {
        Refeicao r = new Refeicao();
        r.setUsuario(usuarios.findById(usuarioId).orElseThrow(UsuarioNaoEncontradoException::new));
        return RefeicaoResponse.de(repository.save(preencher(r, req)));
    }

    @Transactional
    public RefeicaoResponse atualizar(Long usuarioId, Long id, RefeicaoRequest req) {
        return RefeicaoResponse.de(repository.save(preencher(doUsuario(usuarioId, id), req)));
    }

    @Transactional
    public void excluir(Long usuarioId, Long id) {
        repository.delete(doUsuario(usuarioId, id));
    }

    /** Envia uma copia da refeicao para o destinatario; a copia dele e independente da original. */
    @Transactional
    public void compartilhar(Long usuarioId, Long id, String nomeUsuarioDestino) {
        Refeicao origem = doUsuario(usuarioId, id);
        Usuario destino = usuarios.findByNomeUsuarioIgnoreCase(nomeUsuarioDestino.trim())
                .orElseThrow(DestinatarioNaoEncontradoException::new);
        if (destino.getId().equals(usuarioId)) {
            throw new CompartilhamentoInvalidoException("Voce nao pode compartilhar uma refeicao com voce mesmo.");
        }

        Refeicao copia = new Refeicao();
        copia.setUsuario(destino);
        copia.setNome(origem.getNome());
        copia.setHorario(origem.getHorario());
        copia.setOrigemNomeUsuario(origem.getUsuario().getNomeUsuario());
        for (Alimento a : origem.getAlimentos()) {
            Alimento nova = new Alimento();
            nova.setNome(a.getNome());
            nova.setCalorias(a.getCalorias());
            copia.adicionar(nova);
        }
        repository.save(copia);
    }

    @Transactional(readOnly = true)
    public byte[] gerarPdf(Long usuarioId, Long id) {
        Refeicao r = doUsuario(usuarioId, id);
        return RefeicaoPdf.gerar(r, r.getUsuario().getNomeUsuario());
    }

    private Refeicao doUsuario(Long usuarioId, Long id) {
        return repository.findByIdAndUsuarioId(id, usuarioId).orElseThrow(RefeicaoNaoEncontradaException::new);
    }

    private Refeicao preencher(Refeicao r, RefeicaoRequest req) {
        r.setNome(req.nome().trim());
        r.setHorario(LocalTime.parse(req.horario()));
        // troca a lista inteira: os antigos saem (orphanRemoval) e os novos entram na ordem enviada
        r.getAlimentos().clear();
        for (AlimentoRequest a : req.alimentos()) {
            Alimento item = new Alimento();
            item.setNome(a.nome().trim());
            item.setCalorias(a.calorias());
            r.adicionar(item);
        }
        return r;
    }
}
