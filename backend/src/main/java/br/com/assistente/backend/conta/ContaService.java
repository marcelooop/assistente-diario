package br.com.assistente.backend.conta;

import br.com.assistente.backend.auth.EmailJaCadastradoException;
import br.com.assistente.backend.auth.NomeUsuarioEmUsoException;
import br.com.assistente.backend.usuario.Usuario;
import br.com.assistente.backend.usuario.UsuarioNaoEncontradoException;
import br.com.assistente.backend.usuario.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Dados da conta do proprio usuario autenticado. */
@Service
@RequiredArgsConstructor
public class ContaService {

    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;

    @Transactional(readOnly = true)
    public ContaResponse obter(Long usuarioId) {
        return ContaResponse.de(buscar(usuarioId));
    }

    @Transactional
    public ContaResponse atualizar(Long usuarioId, ContaRequest req) {
        Usuario u = buscar(usuarioId);
        String email = Usuario.normalizarEmail(req.email());
        if (usuarios.existsByEmailAndIdNot(email, usuarioId)) {
            throw new EmailJaCadastradoException();
        }
        if (usuarios.existsByNomeUsuarioIgnoreCaseAndIdNot(req.nomeUsuario(), usuarioId)) {
            throw new NomeUsuarioEmUsoException();
        }
        u.setNome(req.nome().trim());
        u.setNomeUsuario(req.nomeUsuario());
        u.setEmail(email);
        return ContaResponse.de(usuarios.saveAndFlush(u));
    }

    @Transactional
    public void trocarSenha(Long usuarioId, TrocaSenhaRequest req) {
        Usuario u = buscar(usuarioId);
        if (!encoder.matches(req.senhaAtual(), u.getSenhaHash())) {
            throw new SenhaInvalidaException("A senha atual esta incorreta.");
        }
        if (req.novaSenha().equals(req.senhaAtual())) {
            throw new SenhaInvalidaException("A nova senha deve ser diferente da atual.");
        }
        u.setSenhaHash(encoder.encode(req.novaSenha()));
    }

    private Usuario buscar(Long usuarioId) {
        return usuarios.findById(usuarioId).orElseThrow(UsuarioNaoEncontradoException::new);
    }
}
