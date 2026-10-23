# Mobile

Ionic 9 · Angular 22 (standalone) · Capacitor 8.

Telas: login, criar conta, visão geral (em branco por enquanto) e Meus dados (cadastro, medidas e troca de senha),
com menu lateral ("Olá, <nome de usuário>").

## Pré-requisitos

- Node.js 22.22.3+ ou 24.15+ (exigência do Angular 22).
- Back end rodando em `http://localhost:8080` (veja `../backend/README.md`).

## Rodar no navegador

```bash
npm install
npx ng serve --port 8100     # abre em http://localhost:8100
```

Use a visualização de celular do navegador (F12 → ícone de dispositivo) para ver o layout mobile.

## Testes e build

```bash
npx ng test --watch=false
npx ng build
```

## Endereço da API

Definido em `src/environments/environment.ts` (`apiUrl`):

| Onde roda | Valor |
|---|---|
| Navegador no computador | `http://localhost:8080/api` |
| Emulador Android | `http://10.0.2.2:8080/api` |
| Aparelho real (mesma rede) | `http://<IP-do-computador>:8080/api` |
| Produção | `environment.prod.ts` (precisa ser HTTPS) |

O back end já aceita as origens do navegador (8100) e do WebView do Capacitor (`http://localhost`,
`capacitor://localhost`). Para outras origens, defina `APP_CORS_ORIGENS`.

## App nativo (ainda não gerado)

```bash
npx ng build
npx ionic capacitor add android     # precisa do Android Studio
npx ionic capacitor sync
```

## Observações

- O token fica no `localStorage` do WebView. Para produção, avalie o plugin Capacitor Preferences ou um
  armazenamento seguro.
- A lógica de autenticação, serviços e IMC foi copiada de `../web` (`src/app/core`). Se mudar uma regra,
  altere nos dois. Uma biblioteca compartilhada pode ser criada no futuro.
