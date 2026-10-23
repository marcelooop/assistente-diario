package br.com.assistente.backend;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.parser.PdfTextExtractor;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class RefeicaoApiTest {

    private static final String SENHA = "senha-forte-123";

    @Autowired
    MockMvc mvc;

    private record Usuario(String token, String nomeUsuario) {
    }

    private Usuario registrar() throws Exception {
        String s = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        String json = mvc.perform(post("/api/auth/registrar").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Nome " + s + "\",\"nomeUsuario\":\"u" + s + "\",\"email\":\"u" + s
                                + "@teste.com\",\"senha\":\"" + SENHA + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return new Usuario(JsonPath.read(json, "$.token"), "u" + s);
    }

    private static String bearer(Usuario u) {
        return "Bearer " + u.token();
    }

    private static String refeicao(String nome, String horario, String... alimentos) {
        StringBuilder itens = new StringBuilder();
        for (int i = 0; i < alimentos.length; i += 2) {
            if (i > 0) {
                itens.append(',');
            }
            itens.append("{\"nome\":\"").append(alimentos[i]).append("\",\"calorias\":").append(alimentos[i + 1]).append('}');
        }
        return "{\"nome\":\"" + nome + "\",\"horario\":\"" + horario + "\",\"alimentos\":[" + itens + "]}";
    }

    private int criar(Usuario u, String corpo) throws Exception {
        String json = mvc.perform(post("/api/refeicoes").header("Authorization", bearer(u))
                        .contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(json, "$.id");
    }

    @Test
    void criaRefeicaoComVariosAlimentosESomaOsTotais() throws Exception {
        Usuario u = registrar();
        mvc.perform(post("/api/refeicoes").header("Authorization", bearer(u))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(refeicao("Café da manhã", "07:30", "Pão integral", "120.5", "Ovo mexido", "155", "Café", "2")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nome").value("Café da manhã"))
                .andExpect(jsonPath("$.horario").value("07:30"))
                .andExpect(jsonPath("$.alimentos", hasSize(3)))
                .andExpect(jsonPath("$.alimentos[0].nome").value("Pão integral"))
                .andExpect(jsonPath("$.totalCalorias").value(277.5))
                .andExpect(jsonPath("$.compartilhadaPor").value(nullValue()));
    }

    @Test
    void listaSoAsDoUsuarioOrdenadasPorHorario() throws Exception {
        Usuario a = registrar();
        Usuario b = registrar();
        criar(a, refeicao("Jantar", "20:00", "Sopa", "180"));
        criar(a, refeicao("Almoço", "12:30", "Arroz", "200"));
        criar(a, refeicao("Café", "07:00", "Pão", "100"));
        criar(b, refeicao("De outro", "09:00", "Fruta", "50"));

        mvc.perform(get("/api/refeicoes").header("Authorization", bearer(a)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].nome").value("Café"))
                .andExpect(jsonPath("$[1].nome").value("Almoço"))
                .andExpect(jsonPath("$[2].nome").value("Jantar"));
    }

    @Test
    void usuarioNaoAcessaRefeicaoDeOutro() throws Exception {
        Usuario a = registrar();
        Usuario b = registrar();
        int id = criar(a, refeicao("Almoço", "12:00", "Arroz", "200"));

        mvc.perform(get("/api/refeicoes/" + id).header("Authorization", bearer(b))).andExpect(status().isNotFound());
        mvc.perform(put("/api/refeicoes/" + id).header("Authorization", bearer(b))
                .contentType(MediaType.APPLICATION_JSON).content(refeicao("X", "10:00", "Y", "1")))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/refeicoes/" + id).header("Authorization", bearer(b))).andExpect(status().isNotFound());
        mvc.perform(get("/api/refeicoes/" + id + "/pdf").header("Authorization", bearer(b))).andExpect(status().isNotFound());
        mvc.perform(post("/api/refeicoes/" + id + "/compartilhar").header("Authorization", bearer(b))
                .contentType(MediaType.APPLICATION_JSON).content("{\"nomeUsuario\":\"" + a.nomeUsuario() + "\"}"))
                .andExpect(status().isNotFound());

        // a original continua intacta para o dono
        mvc.perform(get("/api/refeicoes/" + id).header("Authorization", bearer(a)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.nome").value("Almoço"));
    }

    @Test
    void atualizaSubstituindoOsAlimentos() throws Exception {
        Usuario u = registrar();
        int id = criar(u, refeicao("Almoço", "12:00", "Arroz", "200", "Feijão", "150"));

        mvc.perform(put("/api/refeicoes/" + id).header("Authorization", bearer(u))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(refeicao("Almoço leve", "13:15", "Salada", "60")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Almoço leve"))
                .andExpect(jsonPath("$.horario").value("13:15"))
                .andExpect(jsonPath("$.alimentos", hasSize(1)))
                .andExpect(jsonPath("$.totalCalorias").value(60));

        mvc.perform(get("/api/refeicoes/" + id).header("Authorization", bearer(u)))
                .andExpect(jsonPath("$.alimentos", hasSize(1)));
    }

    @Test
    void excluiARefeicao() throws Exception {
        Usuario u = registrar();
        int id = criar(u, refeicao("Lanche", "16:00", "Maçã", "80"));
        mvc.perform(delete("/api/refeicoes/" + id).header("Authorization", bearer(u))).andExpect(status().isNoContent());
        mvc.perform(get("/api/refeicoes/" + id).header("Authorization", bearer(u))).andExpect(status().isNotFound());
    }

    @Test
    void validaOsDados() throws Exception {
        Usuario u = registrar();
        mvc.perform(post("/api/refeicoes").header("Authorization", bearer(u)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\" \",\"horario\":\"25:99\",\"alimentos\":[]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.nome").exists())
                .andExpect(jsonPath("$.erros.horario").exists())
                .andExpect(jsonPath("$.erros.alimentos").exists());

        mvc.perform(post("/api/refeicoes").header("Authorization", bearer(u)).contentType(MediaType.APPLICATION_JSON)
                        .content(refeicao("Lanche", "10:00", "", "-5")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros['alimentos[0].nome']").exists())
                .andExpect(jsonPath("$.erros['alimentos[0].calorias']").exists());
    }

    @Test
    void compartilharEnviaUmaCopiaIndependente() throws Exception {
        Usuario a = registrar();
        Usuario b = registrar();
        int id = criar(a, refeicao("Almoço", "12:00", "Arroz", "200", "Frango", "250"));

        mvc.perform(post("/api/refeicoes/" + id + "/compartilhar").header("Authorization", bearer(a))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nomeUsuario\":\"" + b.nomeUsuario().toUpperCase() + "\"}"))
                .andExpect(status().isNoContent());

        String listaB = mvc.perform(get("/api/refeicoes").header("Authorization", bearer(b)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nome").value("Almoço"))
                .andExpect(jsonPath("$[0].totalCalorias").value(450))
                .andExpect(jsonPath("$[0].compartilhadaPor").value(a.nomeUsuario()))
                .andReturn().getResponse().getContentAsString();
        int idCopia = JsonPath.read(listaB, "$[0].id");
        Assertions.assertNotEquals(id, idCopia);

        // editar a copia nao altera a original
        mvc.perform(put("/api/refeicoes/" + idCopia).header("Authorization", bearer(b))
                .contentType(MediaType.APPLICATION_JSON).content(refeicao("Meu almoço", "13:00", "Peixe", "300")))
                .andExpect(status().isOk());
        mvc.perform(get("/api/refeicoes/" + id).header("Authorization", bearer(a)))
                .andExpect(jsonPath("$.nome").value("Almoço"))
                .andExpect(jsonPath("$.alimentos", hasSize(2)));
    }

    @Test
    void compartilharRecusaSiMesmoEUsuarioInexistente() throws Exception {
        Usuario a = registrar();
        int id = criar(a, refeicao("Almoço", "12:00", "Arroz", "200"));

        mvc.perform(post("/api/refeicoes/" + id + "/compartilhar").header("Authorization", bearer(a))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"nomeUsuario\":\"" + a.nomeUsuario() + "\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/refeicoes/" + id + "/compartilhar").header("Authorization", bearer(a))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"nomeUsuario\":\"ninguem-assim\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/refeicoes/" + id + "/compartilhar").header("Authorization", bearer(a))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"nomeUsuario\":\" \"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void baixaOPdfDaRefeicao() throws Exception {
        Usuario u = registrar();
        int id = criar(u, refeicao("Café da manhã", "07:30", "Pão", "120", "Ovo", "78"));

        byte[] pdf = mvc.perform(get("/api/refeicoes/" + id + "/pdf").header("Authorization", bearer(u)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("refeicao-" + id + ".pdf")))
                .andReturn().getResponse().getContentAsByteArray();

        Assertions.assertEquals("%PDF-", new String(pdf, 0, 5, StandardCharsets.ISO_8859_1));

        // confere o conteudo: nome com acentos, horario, alimentos e total (120 + 78 = 198)
        PdfReader leitor = new PdfReader(pdf);
        String texto = new PdfTextExtractor(leitor).getTextFromPage(1);
        leitor.close();
        Assertions.assertTrue(texto.contains("Café da manhã"), texto);
        Assertions.assertTrue(texto.contains("Horário: 07:30"), texto);
        Assertions.assertTrue(texto.contains("Pão") && texto.contains("Ovo"), texto);
        Assertions.assertTrue(texto.contains("Total") && texto.contains("198"), texto);
    }

    @Test
    void exigeAutenticacao() throws Exception {
        mvc.perform(get("/api/refeicoes")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/refeicoes").contentType(MediaType.APPLICATION_JSON)
                .content(refeicao("X", "10:00", "Y", "1"))).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/refeicoes/1/pdf")).andExpect(status().isUnauthorized());
    }
}
