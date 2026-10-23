# Back end

Spring Boot 4 · Java 17 · Maven · API REST com login JWT.

## Rodar (desenvolvimento, H2 em memoria)

```bash
./mvnw spring-boot:run        # Windows: .\mvnw.cmd spring-boot:run
```

- Saude: http://localhost:8080/actuator/health
- O H2 e em memoria: ao reiniciar, os usuarios e cadastros somem (e sessoes antigas deixam de valer).
- Em desenvolvimento a chave dos tokens ja tem um valor padrao. **Nunca use esse valor em producao.**

## API

| Metodo | Rota | Acesso | Descricao |
|---|---|---|---|
| POST | `/api/auth/registrar` | publico | Cria conta (`nome`, `nomeUsuario` unico de 3 a 30 caracteres `A-Z a-z 0-9 . _ -`, `email`, `senha` de 8 a 72 caracteres) e ja devolve o token |
| POST | `/api/auth/login` | publico | Devolve `token`, `email`, `nome`, `nomeUsuario` e `perfilCompleto` |
| GET | `/api/conta` | token | Dados do cadastro: `nome`, `nomeUsuario`, `email` |
| PUT | `/api/conta` | token | Edita nome, nome de usuario e e-mail (409 se ja estiverem em uso por outra conta) |
| PUT | `/api/conta/senha` | token | Troca a senha (`senhaAtual`, `novaSenha` de 8 a 72 caracteres). 204; 400 se a senha atual estiver errada |
| GET | `/api/refeicoes` | token | Lista as refeicoes do usuario, ordenadas por horario, com alimentos e `totalCalorias` |
| GET | `/api/refeicoes/{id}` | token | Uma refeicao (404 se nao existir ou for de outro usuario) |
| POST | `/api/refeicoes` | token | Cria: `nome`, `horario` (`HH:mm`) e `alimentos` (1 a 100 itens com `nome` e `calorias`) |
| PUT | `/api/refeicoes/{id}` | token | Atualiza; a lista de alimentos enviada substitui a anterior |
| DELETE | `/api/refeicoes/{id}` | token | Exclui |
| POST | `/api/refeicoes/{id}/compartilhar` | token | Envia uma **copia** para o usuario `nomeUsuario` informado (a copia e independente; mostra `compartilhadaPor`) |
| GET | `/api/refeicoes/{id}/pdf` | token | Baixa o PDF da refeicao |
| GET | `/api/perfil` | token | Medidas do usuario logado (404 se ainda nao cadastrou) |
| POST | `/api/perfil` | token | Primeiro cadastro das medidas (409 se ja existe) |
| PUT | `/api/perfil` | token | Atualiza as medidas |

Enviar o token em `Authorization: Bearer <token>`. O IMC e sempre calculado pelo servidor.
`perfilCompleto = false` indica usuario novo (deve preencher os dados pessoais).

## Producao (PostgreSQL)

Variaveis obrigatorias: `APP_JWT_SECRET` (minimo 32 caracteres, aleatorio e secreto), `DB_PASSWORD`.
Opcionais: `DB_URL`, `DB_USER`, `APP_CORS_ORIGENS` (lista separada por virgula).

```bash
SPRING_PROFILES_ACTIVE=prod APP_JWT_SECRET=... DB_PASSWORD=... ./mvnw spring-boot:run
```

Sem `APP_JWT_SECRET` a aplicacao se recusa a iniciar em producao.

## Testes

```bash
./mvnw test
```
