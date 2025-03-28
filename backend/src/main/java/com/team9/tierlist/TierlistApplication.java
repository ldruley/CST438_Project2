package com.team9.tierlist;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import com.team9.tierlist.service.UserService;
@SpringBootApplication
public class TierlistApplication implements CommandLineRunner {

    @Autowired
    private UserService userService;  
	
	public static void main(String[] args) {
		SpringApplication.run(TierlistApplication.class, args);
	}

	    @Override
    public void run(String... args) throws Exception {
        // This will create the admin account if it doesn't exist
        userService.createDefaultAdmin();

    }
}
