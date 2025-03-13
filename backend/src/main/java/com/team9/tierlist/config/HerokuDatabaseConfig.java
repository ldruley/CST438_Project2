package com.team9.tierlist.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.web.servlet.server.ConfigurableServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

@Configuration
public class HerokuDatabaseConfig {

    @Value("${JAWSDB_MARIA_URL:}")
    private String databaseUrl;

    @Value("${spring.datasource.url:}")
    private String defaultDbUrl;

    @Value("${spring.datasource.username:}")
    private String defaultUsername;

    @Value("${spring.datasource.password:}")
    private String defaultPassword;

    @Value("${spring.datasource.driver-class-name:}")
    private String defaultDriver;

    @Bean
    @Primary
    public DataSource dataSource() {
        // Check if the JAWSDB_MARIA_URL environment variable exists
        if (databaseUrl != null && !databaseUrl.isEmpty()) {
            try {
                URI dbUri = new URI(databaseUrl);

                String username = dbUri.getUserInfo().split(":")[0];
                String password = dbUri.getUserInfo().split(":")[1];
                String dbUrl = "jdbc:mysql://" + dbUri.getHost() + dbUri.getPath()
                        + "?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=UTC";

                return DataSourceBuilder.create()
                        .url(dbUrl)
                        .username(username)
                        .password(password)
                        .driverClassName("com.mysql.cj.jdbc.Driver")
                        .build();
            } catch (URISyntaxException e) {
                throw new RuntimeException("Failed to parse JawsDB Maria URL", e);
            }
        }

        // If JAWSDB_MARIA_URL is not available, use the default database configuration
        return DataSourceBuilder.create()
                .url(defaultDbUrl)
                .username(defaultUsername)
                .password(defaultPassword)
                .driverClassName(defaultDriver)
                .build();
    }

    /**
     * Configure port for Heroku
     */
    @Bean
    public WebServerFactoryCustomizer<ConfigurableServletWebServerFactory> webServerFactoryCustomizer() {
        return factory -> {
            String port = System.getenv("PORT");
            if (port != null && !port.isEmpty()) {
                factory.setPort(Integer.parseInt(port));
            }
        };
    }
}