package br.com.assistente.backend.pessoa;

import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Dados pessoais do usuario logado (o id vem do token, nunca da URL). */
@RestController
@RequestMapping("/api/perfil")
@RequiredArgsConstructor
public class PessoaController {

    private final PessoaService service;

    @GetMapping
    public PessoaResponse obter(@AuthenticationPrincipal Jwt jwt) {
        return service.obter(usuarioId(jwt));
    }

    @PostMapping
    public ResponseEntity<PessoaResponse> criar(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody PessoaRequest req) {
        return ResponseEntity.created(URI.create("/api/perfil")).body(service.criar(usuarioId(jwt), req));
    }

    @PutMapping
    public PessoaResponse atualizar(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody PessoaRequest req) {
        return service.atualizar(usuarioId(jwt), req);
    }

    private static Long usuarioId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
