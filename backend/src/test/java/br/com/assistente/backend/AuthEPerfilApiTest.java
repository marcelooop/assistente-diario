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
    private static final String PERFIL =
            "{\"nome\":\"Marcelo\",\"altura\":1.75,\"peso\":70,\"metaPeso\":68}";

    @Autowired
    MockMvc mvc;

    private static String novoEmail() {
        return "u" + UUID.randomUUID() + "@teste.com";
    }

    private static String credenciais(String email, String senha) {
        return "{\"email\":\"" + email + "\",\"senha\":\"" + senha + "\"}";
    }

    private String registrar(String email) throws Exception {
        String corpo = mvc.perform(post("/api/auth/registrar").contentType(MediaType.APPLICATION_JSON)
                        .content(credenciais(email, SENHA)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.perfilCompleto").value(false))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(corpo, "$.token");
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }

    @Test
    void usuarioNovoNaoTemPerfilECadastraDepois() throws Exception {
        String email = novoEmail();
        String token = registrar(email);

        mvc.perform(get("/api/perfil").header("Authorization", bearer(token)))
                .andExpect(status().isNotFound());

        mvc.perform(post("/api/perfil").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(PERFIL))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.imc").value(22.86))
                .andExpect(jsonPath("$.massaMagra").value(nullValue()));

        // login seguinte indica usuario ja cadastrado
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(credenciais(email, SENHA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.perfilCompleto").value(true))
                .andExpect(jsonPath("$.token").isString());
    }

    @Test
    void emailEhNormalizadoERejeitaDuplicado() throws Exception {
        String email = novoEmail();
        registrar(email);
        mvc.perform(post("/api/auth/registrar").contentType(MediaType.APPLICATION_JSON)
                        .content(credenciais(email.toUpperCase(), SENHA)))
                .andExpect(status().isConflict());
    }

    @Test
    void loginComSenhaErradaOuEmailInexistenteRetorna401() throws Exception {
        String email = novoEmail();
        registrar(email);
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(credenciais(email, "senha-errada-999")))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(credenciais(novoEmail(), SENHA)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registroValidaEmailESenha() throws Exception {
        mvc.perform(post("/api/auth/registrar").contentType(MediaType.APPLICATION_JSON)
                        .content(credenciais("nao-e-email", "curta")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.email").exists())
                .andExpect(jsonPath("$.erros.senha").exists());
    }

    @Test
    void perfilExigeAutenticacao() throws Exception {
        mvc.perform(get("/api/perfil")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/perfil").header("Authorization", "Bearer token.invalido.aqui"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void cadaUsuarioSoEnxergaOProprioPerfil() throws Exception {
        String tokenA = registrar(novoEmail());
        String tokenB = registrar(novoEmail());
        mvc.perform(post("/api/perfil").header("Authorization", bearer(tokenA))
                .contentType(MediaType.APPLICATION_JSON).content(PERFIL)).andExpect(status().isCreated());

        mvc.perform(get("/api/perfil").header("Authorization", bearer(tokenB)))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/perfil").header("Authorization", bearer(tokenA))
                .contentType(MediaType.APPLICATION_JSON).content(PERFIL)).andExpect(status().isConflict());
    }

    @Test
    void atualizaPerfilRecalculandoImcEIgnoraImcDoCliente() throws Exception {
        String token = registrar(novoEmail());
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
        String token = registrar(novoEmail());
        mvc.perform(post("/api/perfil").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"\",\"altura\":9,\"peso\":70,\"metaPeso\":68}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.nome").exists())
                .andExpect(jsonPath("$.erros.altura").exists());
    }
}
