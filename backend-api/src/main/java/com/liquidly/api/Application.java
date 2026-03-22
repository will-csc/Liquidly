package com.liquidly.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {

	public static void main(String[] args) {
		// Bootstrap the Spring Boot application (loads the context, config, controllers, and startup runners).
		SpringApplication.run(Application.class, args);
	}

}
