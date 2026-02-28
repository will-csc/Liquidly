package com.liquidly.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;

@Configuration
public class DatabaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseConfig.class);

    // Primary Database (Supabase)
    @Value("${app.datasource.primary.url:}")
    private String primaryUrl;

    @Value("${app.datasource.primary.username:}")
    private String primaryUsername;

    @Value("${app.datasource.primary.password:}")
    private String primaryPassword;

    // Backup Database (Local PostgreSQL)
    @Value("${app.datasource.backup.url:}")
    private String backupUrl;

    @Value("${app.datasource.backup.username:}")
    private String backupUsername;

    @Value("${app.datasource.backup.password:}")
    private String backupPassword;

    @Bean
    public DataSource dataSource() {
        logger.info("Initializing Database Connection Strategy...");

        // 1. Try Primary (Supabase)
        logger.info("Step 1: Checking Primary Database (Supabase)...");
        DataSource primary = createDataSource("Primary (Supabase)", primaryUrl, primaryUsername, primaryPassword);
        if (primary != null) {
            logger.info(">>> CONNECTED to PRIMARY database.");
            return primary;
        }
        
        logger.warn(">>> Primary database UNAVAILABLE or NOT CONFIGURED. Attempting switch to BACKUP...");

        // 2. Try Backup (Local PostgreSQL)
        logger.info("Step 2: Checking Backup Database (Local)...");
        DataSource backup = createDataSource("Backup (Local)", backupUrl, backupUsername, backupPassword);
        if (backup != null) {
            logger.info(">>> CONNECTED to BACKUP database.");
            return backup;
        }
        
        logger.error(">>> Backup database UNAVAILABLE.");

        // 3. Fallback to H2 (In-Memory)
        logger.warn("Step 3: All external databases failed. Falling back to local H2 in-memory database.");
        return DataSourceBuilder.create()
                .driverClassName("org.h2.Driver")
                .url("jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE")
                .username("sa")
                .password("password")
                .build();
    }

    private DataSource createDataSource(String name, String url, String username, String password) {
        if (url != null && !url.isEmpty()) {
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
}
