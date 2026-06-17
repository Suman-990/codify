package com.codify.backend.service;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.Map;
import java.util.HashMap;

@Service
public class ContainerPoolService {

    private final Map<String, BlockingQueue<String>> pools = new HashMap<>();
    private static final int POOL_SIZE = 3;
    private static final Map<String, String> IMAGES = Map.of(
        "java", "eclipse-temurin:21-jdk",
        "python", "python:3.9-slim",
        "cpp", "gcc:latest"
    );

    @PostConstruct
    public void init() {
        pools.put("java", new LinkedBlockingQueue<>());
        pools.put("python", new LinkedBlockingQueue<>());
        pools.put("cpp", new LinkedBlockingQueue<>());

        for(String lang : IMAGES.keySet()) {
            for (int i = 1; i <= POOL_SIZE; i++) {
                String containerId = "sandbox-" + lang + "-" + i;
                try {
                    ensureContainerRunning(containerId, IMAGES.get(lang));
                    pools.get(lang).offer(containerId);
                } catch (Exception e) {
                    throw new RuntimeException("Failed to initialize container: " + containerId, e);
                }
            }
        }
        System.out.println("✅ Container pools initialized for all languages with " + POOL_SIZE + " containers each");
    }

    public String acquire(String language) throws InterruptedException {
        return pools.get(language).take();
    }

    public void release(String language, String containerId) {
        pools.get(language).offer(containerId);
    }

    //   CORE LOGIC
    private void ensureContainerRunning(String containerId, String imageName) throws Exception {
        if (containerExists(containerId)) {
            if (!isContainerRunning(containerId)) {
                System.out.println("Starting existing container: " + containerId);
                runCommand("docker", "start", containerId);
            } else {
                System.out.println("Container already running: " + containerId);
            }
        } else {
            System.out.println("Creating new container: " + containerId);
            runCommand(
                    "docker", "run", "-d",
                    "--name", containerId,
                    "--network", "none",
                    "--memory", "256m",
                    "--cpus", "0.5",
                    imageName,
                    "sleep", "infinity"
            );
        }
    }

    private boolean containerExists(String containerId) throws Exception {
        Process process = new ProcessBuilder("docker", "ps", "-a", "--format", "{{.Names}}")
                .start();

        BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream())
        );

        String line;
        while ((line = reader.readLine()) != null) {
            if (line.equals(containerId)) return true;
        }
        return false;
    }

    private boolean isContainerRunning(String containerId) throws Exception {
        Process process = new ProcessBuilder("docker", "ps", "--format", "{{.Names}}")
                .start();

        BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream())
        );

        String line;
        while ((line = reader.readLine()) != null) {
            if (line.equals(containerId)) return true;
        }
        return false;
    }

    private void runCommand(String... command) throws Exception {
        Process process = new ProcessBuilder(command).start();
        int exit = process.waitFor();

        if (exit != 0) {
            throw new RuntimeException("Command failed: " + String.join(" ", command));
        }
    }
}