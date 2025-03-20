package com.team9.tierlist.config;


import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") //back end stuff?
//                .allowedOrigins("http://localhost:19006")
                .allowedOrigins("*") // frontend?
                .allowedMethods("GET", "POST", "PUT", "DELETE",  "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false);//not to sure what this does
    }
}