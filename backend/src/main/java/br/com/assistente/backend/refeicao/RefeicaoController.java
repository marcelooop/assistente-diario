package br.com.assistente.backend.refeicao;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Refeicoes do usuario logado; o dono vem do token, nunca da URL. */
@RestController
@RequestMapping("/api/refeicoes")
@RequiredArgsConstructor
public class RefeicaoController {

    private final RefeicaoService service;

    @GetMapping
    public List<RefeicaoResponse> listar(@AuthenticationPrincipal Jwt jwt) {
        return service.listar(usuarioId(jwt));
    }

    @GetMapping("/{id}")
    public RefeicaoResponse obter(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.obter(usuarioId(jwt), id);
    }

    @PostMapping
    public ResponseEntity<RefeicaoResponse> criar(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody RefeicaoRequest req) {
        RefeicaoResponse criada = service.criar(usuarioId(jwt), req);
        return ResponseEntity.created(URI.create("/api/refeicoes/" + criada.id())).body(criada);
    }

    @PutMapping("/{id}")
    public RefeicaoResponse atualizar(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
            @Valid @RequestBody RefeicaoRequest req) {
        return service.atualizar(usuarioId(jwt), id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        service.excluir(usuarioId(jwt), id);
    }

    @PostMapping("/{id}/compartilhar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void compartilhar(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
            @Valid @RequestBody CompartilharRequest req) {
        service.compartilhar(usuarioId(jwt), id, req.nomeUsuario());
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> pdf(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        byte[] conteudo = service.gerarPdf(usuarioId(jwt), id);
        // nome do arquivo fixo e sem texto do usuario, para nao permitir injecao no cabecalho
        ContentDisposition anexo = ContentDisposition.attachment().filename("refeicao-" + id + ".pdf").build();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, anexo.toString())
                .body(conteudo);
    }

    private static Long usuarioId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
