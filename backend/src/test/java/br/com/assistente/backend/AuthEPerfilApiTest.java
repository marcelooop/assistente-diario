package br.com.assistente.backend;

import static org.hamcrest.Matchers.nullValue;
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
class AuthEPerfilApiTest {

    private static final String SENHA = "senha-forte-123";
    private static final String NOME_COMPLETO = "Marcelo Silva";
    private static final String PERFIL =
            "{\"nome\":\"Marcelo\",\"altura\":1.75,\"peso\":70,\"metaPeso\":68}";

    @Autowired
    MockMvc mvc;

    private static String novoEmail() {
        return "u" + UUID.randomUUID() + "@teste.com";
    }

    private static String novoNome() {
        return "u" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private static String login(String email, String senha) {
        return "{\"email\":\"" + email + "\",\"senha\":\"" + senha + "\"}";
    }

    private static String registro(String nome, String email, String senha) {
        return "{\"nome\":\"" + NOME_COMPLETO + "\",\"nomeUsuario\":\"" + nome + "\",\"email\":\"" + email + "\",\"senha\":\"" + senha + "\"}";
    }

    private String registrar(String nome, String email) throws Exception {
        String corpo = mvc.perform(post("/api/auth/registrar").contentType(MediaType.APPLICATION_JSON)
                        .content(registro(nome, email, SENHA)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nome").value(NOME_COMPLETO))
                .andExpect(jsonPath("$.nomeUsuario").value(nome))
                .andExpect(jsonPath("$.perfilCompleto").value(false))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(corpo, "$.token");
    }

    private String registrar() throws Exception {
        return registrar(novoNome(), novoEmail());
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }

    @Test
    void usuarioNovoNaoTemPerfilECadastraDepois() throws Exception {
        String nome = novoNome();
        String email = novoEmail();
        String token = registrar(nome, email);

        mvc.perform(get("/api/perfil").header("Authorization", bearer(token)))
                .andExpect(status().isNotFound());

        mvc.perform(post("/api/perfil").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(PERFIL))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.imc").value(22.86))
                .andExpect(jsonPath("$.massaMagra").value(nullValue()));

        // login seguinte indica usuario ja cadastrado e devolve o nome de usuario
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(login(email, SENHA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.perfilCompleto").value(true))
                .andExpect(jsonPath("$.nome").value(NOME_COMPLETO))
                .andExpect(jsonPath("$.nomeUsuario").value(nome))
                .andExpect(jsonPath("$.token").isString());
    }

    @Test
    void emailEhNormalizadoERejeitaDuplicado() throws Exception {
        String email = novoEmail();
        registrar(novoNome(), email);
        mvc.perform(post("/api/auth/registrar").contentType(MediaType.APPLICATION_JSON)
                        .content(registro(novoNome(), email.toUpperCase(), SENHA)))
                .andExpect(status().isConflict());
    }

    @Test
    void nomeDeUsuarioEhUnicoSemDiferenciarMaiusculas() throws Exception {
        String nome = novoNome();
        registrar(nome, novoEmail());
        mvc.perform(post("/api/auth/registrar").contentType(MediaType.APPLICATION_JSON)
                        .content(registro(nome.toUpperCase(), novoEmail(), SENHA)))
                .andExpect(status().isConflict());
    }

    @Test
    void loginComSenhaErradaOuEmailInexistenteRetorna401() throws Exception {
        String email = novoEmail();
        registrar(novoNome(), email);
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(login(email, "senha-errada-999")))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(login(novoEmail(), SENHA)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registroValidaNomeEmailESenha() throws Exception {
        mvc.perform(post("/api/auth/registrar").contentType(MediaType.APPLICATION_JSON)
                        .content(registro("a b", "nao-e-email", "curta")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.nomeUsuario").exists())
                .andExpect(jsonPath("$.erros.email").exists())
                .andExpect(jsonPath("$.erros.senha").exists());
    }

    @Test
    void registroExigeNome() throws Exception {
        mvc.perform(post("/api/auth/registrar").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"  \",\"nomeUsuario\":\"" + novoNome() + "\",\"email\":\""
                                + novoEmail() + "\",\"senha\":\"" + SENHA + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.nome").exists());
    }

    @Test
    void perfilExigeAutenticacao() throws Exception {
        mvc.perform(get("/api/perfil")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/perfil").header("Authorization", "Bearer token.invalido.aqui"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void cadaUsuarioSoEnxergaOProprioPerfil() throws Exception {
        String tokenA = registrar();
        String tokenB = registrar();
        mvc.perform(post("/api/perfil").header("Authorization", bearer(tokenA))
                .contentType(MediaType.APPLICATION_JSON).content(PERFIL)).andExpect(status().isCreated());

        mvc.perform(get("/api/perfil").header("Authorization", bearer(tokenB)))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/perfil").header("Authorization", bearer(tokenA))
                .contentType(MediaType.APPLICATION_JSON).content(PERFIL)).andExpect(status().isConflict());
    }

    @Test
    void atualizaPerfilRecalculandoImcEIgnoraImcDoCliente() throws Exception {
        String token = registrar();
        mvc.perform(post("/api/perfil").header("Authorization", bearer(token))
                .contentType(MediaType.APPLICATION_JSON).content(PERFIL)).andExpect(status().isCreated());

        mvc.perform(put("/api/perfil").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Marcelo\",\"altura\":1.75,\"peso\":80,\"metaPeso\":70,\"imc\":1,"
                                + "\"massaMagra\":50.5,\"massaGorda\":29.5}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imc").value(26.12))
                .andExpect(jsonPath("$.classificacaoImc").value("Sobrepeso"))
                .andExpect(jsonPath("$.massaGorda").value(29.5));
    }

    @Test
    void perfilRejeitaDadosInvalidos() throws Exception {
        String token = registrar();
        mvc.perform(post("/api/perfil").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"\",\"altura\":9,\"peso\":70,\"metaPeso\":68}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.nome").exists())
                .andExpect(jsonPath("$.erros.altura").exists());
    }
}
