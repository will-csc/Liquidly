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
import java.util.HashMap;
import java.util.Map;

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

    @Value("${JDBC_DATABASE_URL:}")
    private String jdbcDatabaseUrl;

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    public DataSource dataSource() {
        logger.info("Initializing Database Connection Strategy...");

        logger.info("Step 1: Checking Primary Database (NEON/Env)...");
        String resolvedPrimaryUrl = primaryUrl;
        String resolvedPrimaryUsername = primaryUsername;
        String resolvedPrimaryPassword = primaryPassword;

        if (isBlank(resolvedPrimaryUrl)) {
            resolvedPrimaryUrl = firstNonBlank(jdbcDatabaseUrl, databaseUrl);
            if (!isBlank(resolvedPrimaryUrl)) {
                resolvedPrimaryUrl = normalizeJdbcUrl(resolvedPrimaryUrl);
            }
        }

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

        DataSource primary = createDataSource("Primary (NEON/Env)", resolvedPrimaryUrl, resolvedPrimaryUsername, resolvedPrimaryPassword);
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
        logger.warn(">>> FALLBACK H2 ACTIVE: data will NOT persist across restarts.");
        return DataSourceBuilder.create()
                .driverClassName("org.h2.Driver")
                .url("jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE")
                .username("sa")
                .password("password")
                .build();
    }

    private DataSource createDataSource(String name, String url, String username, String password) {
        if (isBlank(url)) {
            logger.info("{} database URL not configured, skipping.", name);
            return null;
        }

        String resolvedUrl = url.trim();
        String resolvedUsername = isBlank(username) ? "" : username.trim();
        String resolvedPassword = isBlank(password) ? "" : password.trim();

        Map<String, String> credentialsFromUrl = extractCredentialsFromJdbcUrl(resolvedUrl);
        if (isBlank(resolvedUsername) && credentialsFromUrl.containsKey("user")) {
            resolvedUsername = credentialsFromUrl.get("user");
        }
        if (isBlank(resolvedPassword) && credentialsFromUrl.containsKey("password")) {
            resolvedPassword = credentialsFromUrl.get("password");
        }

        if (isBlank(resolvedUsername) || isBlank(resolvedPassword)) {
            logger.info("{} database credentials not configured, skipping.", name);
            return null;
        }

        String jdbcUrlForConnection = stripUserInfoFromJdbcUrl(resolvedUrl);
        logger.info("Attempting to connect to {} database: {}", name, sanitizeJdbcUrlForLog(jdbcUrlForConnection));
        try {
            DataSource ds = DataSourceBuilder.create()
                    .driverClassName("org.postgresql.Driver")
                    .url(jdbcUrlForConnection)
                    .username(resolvedUsername)
                    .password(resolvedPassword)
                    .build();

            try (Connection connection = ds.getConnection()) {
                logger.info("Successfully connected to {} database.", name);
                return ds;
            }
        } catch (Exception e) {
            logger.error("Failed to connect to {} database: {}", name, e.getMessage());
            return null;
        }
    }

    private Map<String, String> extractCredentialsFromJdbcUrl(String jdbcUrl) {
        Map<String, String> out = new HashMap<>();
        if (isBlank(jdbcUrl)) return out;

        String value = jdbcUrl.trim();
        String uriValue = value.startsWith("jdbc:") ? value.substring(5) : value;

        try {
            URI uri = URI.create(uriValue);
            String userInfo = uri.getUserInfo();
            if (!isBlank(userInfo)) {
                int colon = userInfo.indexOf(':');
                if (colon > 0) {
                    String user = userInfo.substring(0, colon).trim();
                    String pass = userInfo.substring(colon + 1).trim();
                    if (!isBlank(user)) out.putIfAbsent("user", user);
                    if (!isBlank(pass)) out.putIfAbsent("password", pass);
                } else if (!isBlank(userInfo)) {
                    out.putIfAbsent("user", userInfo.trim());
                }
            }
        } catch (Exception ignored) {
        }

        int q = value.indexOf('?');
        if (q < 0 || q == value.length() - 1) return out;

        String query = value.substring(q + 1);
        for (String pair : query.split("&")) {
            if (pair.isBlank()) continue;
            int eq = pair.indexOf('=');
            if (eq <= 0 || eq == pair.length() - 1) continue;
            String key = pair.substring(0, eq).trim();
            String v = pair.substring(eq + 1).trim();
            if (key.isBlank() || v.isBlank()) continue;
            if (key.equals("user") || key.equals("username")) {
                out.put("user", v);
            } else if (key.equals("password")) {
                out.put("password", v);
            }
        }
        return out;
    }

    private String stripUserInfoFromJdbcUrl(String jdbcUrl) {
        if (isBlank(jdbcUrl)) return "";
        String value = jdbcUrl.trim();
        String uriValue = value.startsWith("jdbc:") ? value.substring(5) : value;
        try {
            URI uri = URI.create(uriValue);
            if (isBlank(uri.getUserInfo())) return value;
            String scheme = uri.getScheme();
            String host = uri.getHost();
            int port = uri.getPort();
            String path = uri.getRawPath();
            String query = uri.getRawQuery();
            if (isBlank(scheme) || isBlank(host)) return value;

            String rebuilt = scheme + "://" + host + (port == -1 ? "" : ":" + port) + (path == null ? "" : path) + (query == null ? "" : "?" + query);
            return value.startsWith("jdbc:") ? ("jdbc:" + rebuilt) : rebuilt;
        } catch (Exception e) {
            return value;
        }
    }

    private String firstNonBlank(String... values) {
        if (values == null) return "";
        for (String value : values) {
            if (!isBlank(value)) return value.trim();
        }
        return "";
    }

    private String normalizeJdbcUrl(String url) {
        String value = url.trim();
        if (value.startsWith("jdbc:")) return value;
        if (value.startsWith("postgres://")) return "jdbc:" + value.replaceFirst("^postgres://", "postgresql://");
        if (value.startsWith("postgresql://")) return "jdbc:" + value;
        return value;
    }

    private String sanitizeJdbcUrlForLog(String jdbcUrl) {
        if (isBlank(jdbcUrl)) return "";
        String value = stripUserInfoFromJdbcUrl(jdbcUrl);
        int q = value.indexOf('?');
        if (q < 0) return jdbcUrl;
        String base = value.substring(0, q);
        String query = value.substring(q + 1);
        StringBuilder out = new StringBuilder(base).append('?');

        boolean first = true;
        for (String pair : query.split("&")) {
            if (pair.isBlank()) continue;
            int eq = pair.indexOf('=');
            String key = eq < 0 ? pair.trim() : pair.substring(0, eq).trim();
            if (key.isBlank()) continue;

            if (!first) out.append('&');
            first = false;

            if (key.equals("password")) {
                out.append("password=").append("REDACTED");
            } else {
                out.append(pair.trim());
            }
        }

        return out.toString();
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
