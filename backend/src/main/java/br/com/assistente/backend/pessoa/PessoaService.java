package br.com.assistente.backend.pessoa;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PessoaService {

    private final PessoaRepository repository;

    @Transactional(readOnly = true)
    public List<PessoaResponse> listar() {
        return repository.findAll().stream().map(PessoaResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public PessoaResponse buscar(Long id) {
        return PessoaResponse.de(obter(id));
    }

    @Transactional
    public PessoaResponse criar(PessoaRequest req) {
        return PessoaResponse.de(repository.save(preencher(new Pessoa(), req)));
    }

    @Transactional
    public PessoaResponse atualizar(Long id, PessoaRequest req) {
        return PessoaResponse.de(repository.save(preencher(obter(id), req)));
    }

    @Transactional
    public void excluir(Long id) {
        repository.delete(obter(id));
    }

    private Pessoa obter(Long id) {
        return repository.findById(id).orElseThrow(() -> new PessoaNaoEncontradaException(id));
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
