package br.com.assistente.backend.pessoa;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class PessoaApiTest {

    @Autowired
    MockMvc mvc;

    private static final String VALIDA =
            "{\"nome\":\"Marcelo\",\"altura\":1.75,\"peso\":70,\"metaPeso\":68}";

    @Test
    void criaCalculandoImcEMassasOpcionaisNulas() throws Exception {
        mvc.perform(post("/api/pessoas").contentType(MediaType.APPLICATION_JSON).content(VALIDA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.imc").value(22.86))
                .andExpect(jsonPath("$.classificacaoImc").value("Peso normal"))
                .andExpect(jsonPath("$.massaMagra").value(nullValue()))
                .andExpect(jsonPath("$.massaGorda").value(nullValue()));
    }

    @Test
    void ignoraImcEnviadoPeloCliente() throws Exception {
        String corpo = "{\"nome\":\"Ana\",\"altura\":1.60,\"peso\":80,\"metaPeso\":65,\"imc\":1,"
                + "\"massaMagra\":50.5,\"massaGorda\":29.5}";
        mvc.perform(post("/api/pessoas").contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.imc").value(31.25))
                .andExpect(jsonPath("$.classificacaoImc").value("Obesidade grau I"))
                .andExpect(jsonPath("$.massaMagra").value(50.5));
    }

    @Test
    void rejeitaDadosInvalidos() throws Exception {
        mvc.perform(post("/api/pessoas").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"\",\"altura\":9,\"peso\":70,\"metaPeso\":68}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.nome").exists())
                .andExpect(jsonPath("$.erros.altura").exists());
    }

    @Test
    void atualizaRecalculandoImcEExclui() throws Exception {
        String resposta = mvc.perform(post("/api/pessoas").contentType(MediaType.APPLICATION_JSON).content(VALIDA))
                .andReturn().getResponse().getContentAsString();
        String id = resposta.replaceAll(".*\"id\":(\\d+).*", "$1");

        mvc.perform(put("/api/pessoas/" + id).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Marcelo\",\"altura\":1.75,\"peso\":80,\"metaPeso\":70}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imc").value(26.12))
                .andExpect(jsonPath("$.classificacaoImc").value("Sobrepeso"));

        mvc.perform(delete("/api/pessoas/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/pessoas/" + id)).andExpect(status().isNotFound());
    }
}
