package com.team9.tierlist;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import io.github.cdimascio.dotenv.Dotenv;


@SpringBootApplication
public class TierlistApplication {

	public static void main(String[] args) {
		Dotenv dotenv = Dotenv.load();
        System.setProperty("OAUTH_CLIENT_ID", dotenv.get("OAUTH_CLIENT_ID"));
        System.setProperty("OAUTH_CLIENT_SECRET", dotenv.get("OAUTH_CLIENT_SECRET"));
		System.setProperty("PORT", dotenv.get("PORT"));
		SpringApplication.run(TierlistApplication.class, args);
	}
}
