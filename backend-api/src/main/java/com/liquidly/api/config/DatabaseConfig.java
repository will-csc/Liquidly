package com.liquidly.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.net.URI;
import java.sql.Connection;

@Configuration
public class DatabaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${app.datasource.primary.url:}")
    private String primaryUrl;

    @Value("${app.datasource.primary.username:}")
    private String primaryUsername;

    @Value("${app.datasource.primary.password:}")
    private String primaryPassword;

    @Value("${app.datasource.backup.url:}")
    private String backupUrl;

    @Value("${app.datasource.backup.username:}")
    private String backupUsername;

    @Value("${app.datasource.backup.password:}")
    private String backupPassword;

    @Value("${SUPABASE_URL:}")
    private String supabaseUrl;

    @Value("${SUPABASE_DB_USERNAME:postgres}")
    private String supabaseDbUsername;

    @Value("${SUPABASE_DB_PASSWORD:}")
    private String supabaseDbPassword;

    @Value("${SUPABASE_KEY:}")
    private String supabaseKey;

    @Value("${SUPABASE_DB_DATABASE:postgres}")
    private String supabaseDbDatabase;

    @Bean
    public DataSource dataSource() {
        logger.info("Initializing Database Connection Strategy...");

        logger.info("Step 1: Checking Primary Database (Supabase)...");
        String resolvedPrimaryUrl = primaryUrl;
        String resolvedPrimaryUsername = primaryUsername;
        String resolvedPrimaryPassword = primaryPassword;

        if (isBlank(resolvedPrimaryUrl) && !isBlank(supabaseUrl)) {
            resolvedPrimaryUrl = buildSupabaseJdbcUrl(supabaseUrl, supabaseDbDatabase);
            if (isBlank(resolvedPrimaryUsername)) {
                resolvedPrimaryUsername = supabaseDbUsername;
            }
            if (isBlank(resolvedPrimaryPassword)) {
                resolvedPrimaryPassword = supabaseDbPassword;
            }
            if (isBlank(resolvedPrimaryPassword)) {
                resolvedPrimaryPassword = supabaseKey;
            }
        }

        DataSource primary = createDataSource("Primary (Supabase)", resolvedPrimaryUrl, resolvedPrimaryUsername, resolvedPrimaryPassword);
        if (primary != null) {
            logger.info(">>> CONNECTED to PRIMARY database.");
            return primary;
        }
        
        logger.warn(">>> Primary database UNAVAILABLE or NOT CONFIGURED. Attempting switch to BACKUP...");

        logger.info("Step 2: Checking Backup Database (Local)...");
        DataSource backup = createDataSource("Backup (Local)", backupUrl, backupUsername, backupPassword);
        if (backup != null) {
            logger.info(">>> CONNECTED to BACKUP database.");
            return backup;
        }
        
        logger.error(">>> Backup database UNAVAILABLE.");

        logger.warn("Step 3: All external databases failed. Falling back to local H2 in-memory database.");
        return DataSourceBuilder.create()
                .driverClassName("org.h2.Driver")
                .url("jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE")
                .username("sa")
                .password("password")
                .build();
    }

    private DataSource createDataSource(String name, String url, String username, String password) {
        if (!isBlank(url) && !isBlank(username) && !isBlank(password)) {
            logger.info("Attempting to connect to {} database: {}", name, url);
            try {
                DataSource ds = DataSourceBuilder.create()
                        .driverClassName("org.postgresql.Driver")
                        .url(url)
                        .username(username)
                        .password(password)
                        .build();

                // Test connection
                try (Connection connection = ds.getConnection()) {
                    logger.info("Successfully connected to {} database.", name);
                    return ds;
                }
            } catch (Exception e) {
                logger.error("Failed to connect to {} database: {}", name, e.getMessage());
            }
        } else {
            logger.info("{} database URL not configured, skipping.", name);
        }
        return null;
    }

    private String buildSupabaseJdbcUrl(String supabaseUrl, String databaseName) {
        try {
            URI uri = URI.create(supabaseUrl.trim());
            String host = uri.getHost();
            if (isBlank(host)) {
                return "";
            }

            int firstDot = host.indexOf('.');
            if (firstDot <= 0) {
                return "";
            }

            String projectRef = host.substring(0, firstDot);
            if (isBlank(projectRef)) {
                return "";
            }

            String dbName = isBlank(databaseName) ? "postgres" : databaseName.trim();
            return "jdbc:postgresql://db." + projectRef + ".supabase.co:5432/" + dbName + "?sslmode=require";
        } catch (Exception e) {
            logger.warn("Invalid SUPABASE_URL format. Skipping Supabase auto-configuration.");
            return "";
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
