import { calcularImc, classificarImc } from './imc';

describe('imc', () => {
  it('calcula peso / altura^2 com 2 casas', () => {
    expect(calcularImc(70, 1.75)).toBe(22.86);
    expect(calcularImc(80, 1.6)).toBe(31.25);
  });

  it('classifica conforme a OMS', () => {
    expect(classificarImc(18.49)).toBe('Abaixo do peso');
    expect(classificarImc(18.5)).toBe('Peso normal');
    expect(classificarImc(25)).toBe('Sobrepeso');
    expect(classificarImc(30)).toBe('Obesidade grau I');
    expect(classificarImc(35)).toBe('Obesidade grau II');
    expect(classificarImc(40)).toBe('Obesidade grau III');
  });
});
