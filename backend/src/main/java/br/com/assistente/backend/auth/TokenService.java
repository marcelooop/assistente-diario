package br.com.assistente.backend.auth;

import br.com.assistente.backend.usuario.Usuario;
import java.time.Duration;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class TokenService {

    private final JwtEncoder encoder;
    private final Duration validade;

    public TokenService(JwtEncoder encoder, @Value("${app.jwt.expiracao-horas:8}") long horas) {
        this.encoder = encoder;
        this.validade = Duration.ofHours(horas);
    }

    public String gerar(Usuario usuario) {
        Instant agora = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("assistente-diario")
                .subject(String.valueOf(usuario.getId()))
                .claim("email", usuario.getEmail())
                .issuedAt(agora)
                .expiresAt(agora.plus(validade))
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}
