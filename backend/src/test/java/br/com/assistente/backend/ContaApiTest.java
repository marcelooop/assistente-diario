package br.com.assistente.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class ContaApiTest {

    private static final String SENHA = "senha-forte-123";

    @Autowired
    MockMvc mvc;

    private record Conta(String token, String nome, String usuario, String email) {
    }

    private static String sufixo() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private static String corpo(String nome, String usuario, String email) {
        return "{\"nome\":\"" + nome + "\",\"nomeUsuario\":\"" + usuario + "\",\"email\":\"" + email + "\"}";
    }

    private Conta registrar() throws Exception {
        String s = sufixo();
        Conta c = new Conta(null, "Nome " + s, "u" + s, "u" + s + "@teste.com");
        String json = mvc.perform(post("/api/auth/registrar").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"" + c.nome() + "\",\"nomeUsuario\":\"" + c.usuario()
                                + "\",\"email\":\"" + c.email() + "\",\"senha\":\"" + SENHA + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return new Conta(JsonPath.read(json, "$.token"), c.nome(), c.usuario(), c.email());
    }

    private static String bearer(Conta c) {
        return "Bearer " + c.token();
    }

    @Test
    void devolveOsDadosInformadosNoRegistro() throws Exception {
        Conta c = registrar();
        mvc.perform(get("/api/conta").header("Authorization", bearer(c)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value(c.nome()))
                .andExpect(jsonPath("$.nomeUsuario").value(c.usuario()))
                .andExpect(jsonPath("$.email").value(c.email()));
    }

    @Test
    void editaNomeNomeDeUsuarioEEmail() throws Exception {
        Conta c = registrar();
        String s = sufixo();
        mvc.perform(put("/api/conta").header("Authorization", bearer(c)).contentType(MediaType.APPLICATION_JSON)
                        .content(corpo("Novo Nome", "novo" + s, "NOVO" + s + "@Teste.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Novo Nome"))
                .andExpect(jsonPath("$.nomeUsuario").value("novo" + s))
                .andExpect(jsonPath("$.email").value("novo" + s + "@teste.com"));

        // o login passa a valer com o e-mail novo
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"novo" + s + "@teste.com\",\"senha\":\"" + SENHA + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nomeUsuario").value("novo" + s));
    }

    @Test
    void salvarSemMudarNadaNaoDaConflitoComOProprioUsuario() throws Exception {
        Conta c = registrar();
        mvc.perform(put("/api/conta").header("Authorization", bearer(c)).contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(c.nome(), c.usuario().toUpperCase(), c.email())))
                .andExpect(status().isOk());
    }

    @Test
    void rejeitaEmailOuNomeDeUsuarioDeOutraConta() throws Exception {
        Conta a = registrar();
        Conta b = registrar();
        mvc.perform(put("/api/conta").header("Authorization", bearer(b)).contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(b.nome(), b.usuario(), a.email())))
                .andExpect(status().isConflict());
        mvc.perform(put("/api/conta").header("Authorization", bearer(b)).contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(b.nome(), a.usuario().toUpperCase(), b.email())))
                .andExpect(status().isConflict());
    }

    @Test
    void validaOsCampos() throws Exception {
        Conta c = registrar();
        mvc.perform(put("/api/conta").header("Authorization", bearer(c)).contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(" ", "a b", "nao-e-email")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.nome").exists())
                .andExpect(jsonPath("$.erros.nomeUsuario").exists())
                .andExpect(jsonPath("$.erros.email").exists());
    }

    private static String senhas(String atual, String nova) {
        return "{\"senhaAtual\":\"" + atual + "\",\"novaSenha\":\"" + nova + "\"}";
    }

    private int login(Conta c, String senha) throws Exception {
        return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + c.email() + "\",\"senha\":\"" + senha + "\"}"))
                .andReturn().getResponse().getStatus();
    }

    @Test
    void trocaASenhaExigindoASenhaAtual() throws Exception {
        Conta c = registrar();
        mvc.perform(put("/api/conta/senha").header("Authorization", bearer(c))
                        .contentType(MediaType.APPLICATION_JSON).content(senhas(SENHA, "outra-senha-456")))
                .andExpect(status().isNoContent());

        org.junit.jupiter.api.Assertions.assertEquals(200, login(c, "outra-senha-456"));
        org.junit.jupiter.api.Assertions.assertEquals(401, login(c, SENHA));
    }

    @Test
    void recusaSenhaAtualErradaComo400ENaoMudaASenha() throws Exception {
        Conta c = registrar();
        // 400 (e nao 401): o app nao pode encerrar a sessao so porque o usuario errou a senha atual
        mvc.perform(put("/api/conta/senha").header("Authorization", bearer(c))
                        .contentType(MediaType.APPLICATION_JSON).content(senhas("errada-123456", "outra-senha-456")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("A senha atual esta incorreta."));

        org.junit.jupiter.api.Assertions.assertEquals(200, login(c, SENHA));
    }

    @Test
    void recusaNovaSenhaCurtaOuIgualAAtual() throws Exception {
        Conta c = registrar();
        mvc.perform(put("/api/conta/senha").header("Authorization", bearer(c))
                        .contentType(MediaType.APPLICATION_JSON).content(senhas(SENHA, "curta")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.novaSenha").exists());
        mvc.perform(put("/api/conta/senha").header("Authorization", bearer(c))
                        .contentType(MediaType.APPLICATION_JSON).content(senhas(SENHA, SENHA)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void trocaDeSenhaExigeAutenticacao() throws Exception {
        mvc.perform(put("/api/conta/senha").contentType(MediaType.APPLICATION_JSON)
                        .content(senhas(SENHA, "outra-senha-456")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void exigeAutenticacao() throws Exception {
        mvc.perform(get("/api/conta")).andExpect(status().isUnauthorized());
        mvc.perform(put("/api/conta").contentType(MediaType.APPLICATION_JSON).content(corpo("a", "abc", "a@a.com")))
                .andExpect(status().isUnauthorized());
    }
}
