package br.com.assistente.backend.conta;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Dados da conta (nome, nome de usuario, e-mail) do usuario logado; o id vem do token. */
@RestController
@RequestMapping("/api/conta")
@RequiredArgsConstructor
public class ContaController {

    private final ContaService service;

    @GetMapping
    public ContaResponse obter(@AuthenticationPrincipal Jwt jwt) {
        return service.obter(Long.valueOf(jwt.getSubject()));
    }

    @PutMapping
    public ContaResponse atualizar(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ContaRequest req) {
        return service.atualizar(Long.valueOf(jwt.getSubject()), req);
    }
}
