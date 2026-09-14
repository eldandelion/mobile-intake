package com.medicalsystem.intake

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Bean
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder

@SpringBootApplication
class IntakeApplication {

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder(10)
}

fun main(args: Array<String>) {
    runApplication<IntakeApplication>(*args)
}
