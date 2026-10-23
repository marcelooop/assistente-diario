package br.com.assistente.backend.auth;

import br.com.assistente.backend.pessoa.PessoaRepository;
import br.com.assistente.backend.usuario.Usuario;
import br.com.assistente.backend.usuario.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UsuarioRepository usuarios;
    private final PessoaRepository pessoas;
    private final PasswordEncoder encoder;
    private final TokenService tokens;
    /** Usado para gastar o mesmo tempo quando o e-mail nao existe. */
    private final String hashFalso;

    public AuthService(UsuarioRepository usuarios, PessoaRepository pessoas, PasswordEncoder encoder,
            TokenService tokens) {
        this.usuarios = usuarios;
        this.pessoas = pessoas;
        this.encoder = encoder;
        this.tokens = tokens;
        this.hashFalso = encoder.encode("senha-falsa");
    }

    @Transactional
    public AuthResponse registrar(RegistroRequest req) {
        String email = normalizar(req.email());
        if (usuarios.existsByEmail(email)) {
            throw new EmailJaCadastradoException();
        }
        if (usuarios.existsByNomeUsuarioIgnoreCase(req.nomeUsuario())) {
            throw new NomeUsuarioEmUsoException();
        }
        Usuario u = new Usuario();
        u.setEmail(email);
        u.setNome(req.nome().trim());
        u.setNomeUsuario(req.nomeUsuario());
        u.setSenhaHash(encoder.encode(req.senha()));
        u = usuarios.saveAndFlush(u);
        return new AuthResponse(tokens.gerar(u), u.getEmail(), u.getNome(), u.getNomeUsuario(), false);
    }

    @Transactional(readOnly = true)
    public AuthResponse entrar(LoginRequest req) {
        Usuario u = usuarios.findByEmail(normalizar(req.email())).orElse(null);
        if (u == null) {
            encoder.matches(req.senha(), hashFalso);
            throw new CredenciaisInvalidasException();
        }
        if (!encoder.matches(req.senha(), u.getSenhaHash())) {
            throw new CredenciaisInvalidasException();
        }
        return new AuthResponse(tokens.gerar(u), u.getEmail(), u.getNome(), u.getNomeUsuario(),
                pessoas.existsByUsuarioId(u.getId()));
    }

    private static String normalizar(String email) {
        return Usuario.normalizarEmail(email);
    }
}
