package com.at;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.ServletComponentScan;



@ServletComponentScan
@SpringBootApplication
public class ChemicalApplication {

    public static void main(String[] args) {
        SpringApplication.run(ChemicalApplication.class, args);
    }

}
