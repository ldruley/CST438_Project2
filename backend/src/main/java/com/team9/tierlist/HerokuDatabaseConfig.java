package com.team9.tierlist.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
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

        // Return null to let Spring use the application.properties configuration
        return null;
    }
}