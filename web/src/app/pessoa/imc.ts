/** IMC = peso (kg) / altura (m)^2, arredondado a 2 casas. Mesma regra do back end. */
export function calcularImc(pesoKg: number, alturaM: number): number {
  return Math.round((pesoKg / (alturaM * alturaM)) * 100) / 100;
}

/** Classificação da OMS para adultos. */
export function classificarImc(imc: number): string {
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc < 25) return 'Peso normal';
  if (imc < 30) return 'Sobrepeso';
  if (imc < 35) return 'Obesidade grau I';
  if (imc < 40) return 'Obesidade grau II';
  return 'Obesidade grau III';
}
