import { baixarArquivo, nomeDeArquivo } from './baixar-arquivo';

describe('baixar-arquivo', () => {
  it('gera nome de arquivo sem acentos nem símbolos', () => {
    expect(nomeDeArquivo('Café da manhã!')).toBe('cafe-da-manha');
    expect(nomeDeArquivo('  Almoço / Jantar  ')).toBe('almoco-jantar');
    expect(nomeDeArquivo('???')).toBe('refeicao');
  });

  it('dispara o download e libera a URL temporária', () => {
    spyOn(URL, 'createObjectURL').and.returnValue('blob:teste');
    const revogar = spyOn(URL, 'revokeObjectURL');
    const clique = spyOn(HTMLAnchorElement.prototype, 'click');

    baixarArquivo(new Blob(['x']), 'cafe.pdf');

    expect(clique).toHaveBeenCalledTimes(1);
    expect(revogar).toHaveBeenCalledWith('blob:teste');
  });
});
