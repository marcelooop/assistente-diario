package br.com.assistente.backend.pessoa;

import br.com.assistente.backend.usuario.UsuarioNaoEncontradoException;
import br.com.assistente.backend.usuario.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Todas as operacoes sao do proprio usuario autenticado: ele nunca ve nem altera dados de outro. */
@Service
@RequiredArgsConstructor
public class PessoaService {

    private final PessoaRepository repository;
    private final UsuarioRepository usuarios;

    @Transactional(readOnly = true)
    public PessoaResponse obter(Long usuarioId) {
        return PessoaResponse.de(doUsuario(usuarioId));
    }

    @Transactional
    public PessoaResponse criar(Long usuarioId, PessoaRequest req) {
        if (repository.existsByUsuarioId(usuarioId)) {
            throw new PerfilJaExisteException();
        }
        Pessoa p = new Pessoa();
        p.setUsuario(usuarios.findById(usuarioId).orElseThrow(UsuarioNaoEncontradoException::new));
        return PessoaResponse.de(repository.save(preencher(p, req)));
    }

    @Transactional
    public PessoaResponse atualizar(Long usuarioId, PessoaRequest req) {
        return PessoaResponse.de(repository.save(preencher(doUsuario(usuarioId), req)));
    }

    private Pessoa doUsuario(Long usuarioId) {
        return repository.findByUsuarioId(usuarioId).orElseThrow(PessoaNaoEncontradaException::new);
    }

    private Pessoa preencher(Pessoa p, PessoaRequest req) {
        p.setNome(req.nome().trim());
        p.setAltura(req.altura());
        p.setPeso(req.peso());
        p.setMetaPeso(req.metaPeso());
        p.setMassaMagra(req.massaMagra());
        p.setMassaGorda(req.massaGorda());
        p.setImc(ImcCalculator.calcular(req.peso(), req.altura()));
        return p;
    }
}
