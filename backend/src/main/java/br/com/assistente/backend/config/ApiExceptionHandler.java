package br.com.assistente.backend.config;

import br.com.assistente.backend.auth.CredenciaisInvalidasException;
import br.com.assistente.backend.auth.EmailJaCadastradoException;
import br.com.assistente.backend.auth.NomeUsuarioEmUsoException;
import br.com.assistente.backend.conta.SenhaInvalidaException;
import br.com.assistente.backend.pessoa.PerfilJaExisteException;
import br.com.assistente.backend.pessoa.PessoaNaoEncontradaException;
import br.com.assistente.backend.refeicao.CompartilhamentoInvalidoException;
import br.com.assistente.backend.refeicao.DestinatarioNaoEncontradoException;
import br.com.assistente.backend.refeicao.RefeicaoNaoEncontradaException;
import br.com.assistente.backend.usuario.UsuarioNaoEncontradoException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler({ PessoaNaoEncontradaException.class, RefeicaoNaoEncontradaException.class,
            DestinatarioNaoEncontradoException.class })
    public ProblemDetail naoEncontrado(RuntimeException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler({ EmailJaCadastradoException.class, NomeUsuarioEmUsoException.class,
            PerfilJaExisteException.class })
    public ProblemDetail conflito(RuntimeException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
    }

    /** Corrida entre duas requisicoes (e-mail ou perfil duplicado barrado pelo banco). */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail integridade(DataIntegrityViolationException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "Registro ja existe.");
    }

    @ExceptionHandler({ CredenciaisInvalidasException.class, UsuarioNaoEncontradoException.class })
    public ProblemDetail naoAutenticado(RuntimeException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler({ SenhaInvalidaException.class, CompartilhamentoInvalidoException.class })
    public ProblemDetail requisicaoInvalida(RuntimeException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail invalido(MethodArgumentNotValidException ex) {
        Map<String, String> erros = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> erros.putIfAbsent(e.getField(), e.getDefaultMessage()));
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Dados invalidos");
        pd.setProperty("erros", erros);
        return pd;
    }
}
