package br.com.assistente.backend.refeicao;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/** Gera o PDF de uma refeicao: nome, horario, tabela de alimentos com calorias e o total. */
final class RefeicaoPdf {

    private static final Locale PT_BR = Locale.forLanguageTag("pt-BR");
    private static final Color CABECALHO = new Color(0xE3, 0xE8, 0xF0);
    private static final Color TOTAL = new Color(0xEE, 0xF3, 0xFB);

    private RefeicaoPdf() {
    }

    static byte[] gerar(Refeicao r, String nomeUsuario) {
        Font titulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20);
        Font normal = FontFactory.getFont(FontFactory.HELVETICA, 11);
        Font negrito = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
        Font discreta = FontFactory.getFont(FontFactory.HELVETICA, 9, Font.NORMAL, Color.GRAY);

        ByteArrayOutputStream saida = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 48, 48, 48, 48);
        try {
            PdfWriter.getInstance(doc, saida);
            doc.open();

            doc.add(new Paragraph(r.getNome(), titulo));
            Paragraph horario = new Paragraph("Horário: " + r.getHorario().format(RefeicaoResponse.HORA), normal);
            horario.setSpacingAfter(16);
            doc.add(horario);

            PdfPTable tabela = new PdfPTable(new float[] { 4f, 1.4f });
            tabela.setWidthPercentage(100);
            tabela.addCell(celula("Alimento", negrito, Element.ALIGN_LEFT, CABECALHO));
            tabela.addCell(celula("Calorias (kcal)", negrito, Element.ALIGN_RIGHT, CABECALHO));

            BigDecimal total = BigDecimal.ZERO;
            for (Alimento a : r.getAlimentos()) {
                tabela.addCell(celula(a.getNome(), normal, Element.ALIGN_LEFT, null));
                tabela.addCell(celula(formatar(a.getCalorias()), normal, Element.ALIGN_RIGHT, null));
                total = total.add(a.getCalorias());
            }
            tabela.addCell(celula("Total", negrito, Element.ALIGN_LEFT, TOTAL));
            tabela.addCell(celula(formatar(total), negrito, Element.ALIGN_RIGHT, TOTAL));
            doc.add(tabela);

            String quando = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
            Paragraph rodape = new Paragraph("Gerado em " + quando + " por @" + nomeUsuario
                    + " · Assistente Diário", discreta);
            rodape.setSpacingBefore(24);
            doc.add(rodape);
        } catch (DocumentException e) {
            throw new IllegalStateException("Falha ao gerar o PDF da refeicao", e);
        } finally {
            doc.close();
        }
        return saida.toByteArray();
    }

    private static PdfPCell celula(String texto, Font fonte, int alinhamento, Color fundo) {
        PdfPCell c = new PdfPCell(new Phrase(texto, fonte));
        c.setHorizontalAlignment(alinhamento);
        c.setPadding(7);
        if (fundo != null) {
            c.setBackgroundColor(fundo);
        }
        return c;
    }

    private static String formatar(BigDecimal valor) {
        NumberFormat nf = NumberFormat.getNumberInstance(PT_BR);
        nf.setMaximumFractionDigits(2);
        nf.setMinimumFractionDigits(0);
        return nf.format(valor);
    }
}
