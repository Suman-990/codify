package com.codify.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestTemplate;
import com.codify.backend.model.Submission;
import com.codify.backend.model.User;
import com.codify.backend.dto.AiAnalysis;
import com.codify.backend.model.Question;
import com.codify.backend.repository.SubmissionRepository;
import com.codify.backend.repository.UserRepository;
import com.codify.backend.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.UUID;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.io.File;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Path;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubmitService {

    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final ContainerPoolService poolService;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();
    private final TransactionTemplate transactionTemplate;
    ExecutorService executor = Executors.newFixedThreadPool(9);

    @Value("${spring.gemini.api.key}")
    private String geminiApiKey;

    @KafkaListener(topics = "JavaSubmissions", groupId = "judge-workers")
    public void consumeJavaSubmission(Submission submission, Acknowledgment ack) {
        executor.submit(() -> {
            String containerId = null;
            try {
                containerId = poolService.acquire("java");
                submitCode(submission, containerId, "java");
                ack.acknowledge();
            } catch (Exception e) {
                log.error("Execution failed", e);
            } finally {
                if (containerId != null) {
                    poolService.release("java", containerId);
                }
            }
        });
    }

    @KafkaListener(topics = "PythonSubmissions", groupId = "judge-workers")
    public void consumePythonSubmission(Submission submission, Acknowledgment ack) {
        executor.submit(() -> {
            String containerId = null;
            try {
                containerId = poolService.acquire("python");
                submitCode(submission, containerId, "python");
                ack.acknowledge();
            } catch (Exception e) {
                log.error("Execution failed", e);
            } finally {
                if (containerId != null) {
                    poolService.release("python", containerId);
                }
            }
        });
    }

    @KafkaListener(topics = "CppSubmissions", groupId = "judge-workers")
    public void consumeCppSubmission(Submission submission, Acknowledgment ack) {
        executor.submit(() -> {
            String containerId = null;
            try {
                containerId = poolService.acquire("cpp");
                submitCode(submission, containerId, "cpp");
                ack.acknowledge();
            } catch (Exception e) {
                log.error("Execution failed", e);
            } finally {
                if (containerId != null) {
                    poolService.release("cpp", containerId);
                }
            }
        });
    }

    public void submitCode(Submission submission, String containerId, String language) throws Exception {
        log.info("submission received from kafka with id " + submission.getId());
        try {
            String userCode = submission.getUserCode();
            Question question = questionRepository.findById(submission.getQuestionId())
                    .orElseThrow(() -> new RuntimeException("Question not found"));

            String mainCode;
            String userExtension;
            String mainExtension;
            String executionCommand;

            if ("java".equals(language)) {
                mainCode = question.getMain_java();
                userExtension = "Solution.java";
                mainExtension = "Main.java";
                executionCommand = "javac *.java && java Main";
            } else if ("python".equals(language)) {
                mainCode = question.getMain_python();
                userExtension = "Solution.py";
                mainExtension = "Main.py";
                executionCommand = "python3 Main.py";
            } else if ("cpp".equals(language)) {
                mainCode = question.getMain_cpp();
                userExtension = "Solution.cpp";
                mainExtension = "Main.cpp";
                executionCommand = "g++ *.cpp -o main && ./main";
            } else {
                throw new RuntimeException("Unsupported language: " + language);
            }

            String folder = "sandbox/" + UUID.randomUUID();
            Files.createDirectories(Paths.get(folder));

            Files.write(Paths.get(folder + "/" + userExtension), userCode.getBytes());
            Files.write(Paths.get(folder + "/" + mainExtension), mainCode.getBytes());

            // STEP 1: Copy files into container
            new ProcessBuilder(
                    "docker", "cp",
                    new File(folder).getAbsolutePath(),
                    containerId + ":/app").start().waitFor();

            // STEP 2: Execute inside container
            ProcessBuilder pb = new ProcessBuilder(
                    "docker", "exec", "-u", "root", containerId,
                    "bash", "-c",
                    "cd /app/" + new File(folder).getName() +
                            " && " + executionCommand);

            pb.redirectErrorStream(true);
            Process process = pb.start();
            boolean finished = process.waitFor(10, TimeUnit.SECONDS);
            String result = null;
            if (!finished) {
                process.destroyForcibly();
                Files.walk(Paths.get(folder))
                        .sorted(Comparator.reverseOrder())
                        .map(Path::toFile)
                        .forEach(File::delete);
                result = "Time Limit Exceeded";
            }
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));

            StringBuilder output = new StringBuilder();
            String line;

            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }

            if (output.length() > 0) {
                output.setLength(output.length() - 1);
            }
            if (result == null)
                result = output.toString();

            Files.walk(Paths.get(folder))
                    .sorted(Comparator.reverseOrder())
                    .map(Path::toFile)
                    .forEach(File::delete);

            System.out.println(result);

            String verdict = result.contains("FAIL") ? "FAIL" : "PASS";
            String executionTime = null;
            String totalPassed = null;

            if (result.contains("Limit")) {
                verdict = "TIME_LIMIT_EXCEEDED";
                executionTime = "N/A";
                totalPassed = "N/A";
            } else if (result.contains("Exception") || result.contains("Error") || result.contains("error")
                    || result.contains("exception")) {
                verdict = "RUNTIME_ERROR";
                executionTime = "N/A";
                totalPassed = "N/A";
            } else if (result.contains("Compilation")) {
                verdict = "COMPILATION_ERROR";
                executionTime = "N/A";
                totalPassed = "N/A";
            }

            String[] lines = result.split("\n");

            for (String ln : lines) {
                if (ln.startsWith("TOTAL:")) {
                    totalPassed = ln.split(":")[1].trim();
                }
                if (ln.startsWith("TIME_TAKEN:")) {
                    executionTime = ln.split(":")[1].trim();
                    break;
                }
            }

            String timeComplexity = "N/A";
            String spaceComplexity = "N/A";
            submission.setVerdict(verdict);
            submission.setStatus("EXECUTED");
            submission.setOutput(result);
            submission.setExecutionTime(executionTime);
            submission.setTotalPassed(totalPassed);

            if (verdict.equals("PASS"))
                try {
                    AiAnalysis analysis = analyzeCode(question.getDescription(), userCode);
                    timeComplexity = analysis.getTimeComplexity();
                    spaceComplexity = analysis.getSpaceComplexity();
                    log.info("AI Analysis for submission ID {}: Time Complexity - {}, Space Complexity - {}",
                            submission.getId(), timeComplexity, spaceComplexity);
                } catch (Exception e) {
                    log.error("Error analyzing code for submission ID {}: {}", submission.getId(), e.getMessage());
                }

            submission.setTimeComplexity(timeComplexity);
            submission.setSpaceComplexity(spaceComplexity);

            submissionRepository.save(submission);

            final String finalVerdict = verdict;
            final String finalExecutionTime = executionTime;

            transactionTemplate.execute(status -> {
                User tUser = userRepository.findById(submission.getUserId())
                        .orElseThrow(() -> new RuntimeException("User not found"));
                Question tQuestion = questionRepository.findById(submission.getQuestionId())
                        .orElseThrow(() -> new RuntimeException("Question not found"));

                tUser.setTotalSubmissions(tUser.getTotalSubmissions() + 1);
                if (tUser.getAttemptedQuestions() == null) {
                    tUser.setAttemptedQuestions(new java.util.HashSet<>());
                }
                tUser.getAttemptedQuestions().add(tQuestion.getId());

                Map<String, Integer> dailySubmissions = tUser.getDailySubmissions();
                if (dailySubmissions == null) {
                    dailySubmissions = new HashMap<>();
                    tUser.setDailySubmissions(dailySubmissions);
                }
                String todayStr = LocalDate.now().toString();
                dailySubmissions.put(todayStr, dailySubmissions.getOrDefault(todayStr, 0) + 1);
                tQuestion.setTotalSubmissions(tQuestion.getTotalSubmissions() + 1);

                if (finalVerdict.equals("PASS")) {

                    if (tUser.getSolvedQuestions() == null) {
                        tUser.setSolvedQuestions(new java.util.HashSet<>());
                    }
                    boolean isNewSolve = tUser.getSolvedQuestions().add(tQuestion.getId());
                    tUser.getAttemptedQuestions().remove(tQuestion.getId());

                    if (isNewSolve) {
                        tUser.setTotalSolved(tUser.getTotalSolved() + 1);

                        if (tQuestion.getDifficulty().equalsIgnoreCase("Easy")) {
                            tUser.setEasySolved(tUser.getEasySolved() + 1);
                        } else if (tQuestion.getDifficulty().equalsIgnoreCase("Medium")) {
                            tUser.setMediumSolved(tUser.getMediumSolved() + 1);
                        } else if (tQuestion.getDifficulty().equalsIgnoreCase("Hard")) {
                            tUser.setHardSolved(tUser.getHardSolved() + 1);
                        }
                    }

                    Map<Integer, Integer> executionTimes = tQuestion.getExecutionTimes();
                    if (executionTimes == null) {
                        executionTimes = new HashMap<>();
                    }

                    int time = 0;
                    if (finalExecutionTime != null && !finalExecutionTime.equals("N/A")) {
                        try {
                            time = Integer.parseInt(finalExecutionTime.replace("ms", "").trim());
                        } catch (Exception e) {
                            log.warn("Could not parse execution time: " + finalExecutionTime);
                        }
                    }
                    if (time > 0) {
                        executionTimes.put(time, executionTimes.getOrDefault(time, 0) + 1);
                        tQuestion.setExecutionTimes(executionTimes);
                    }

                    tQuestion.setTotalAccepted(tQuestion.getTotalAccepted() + 1);
                    tQuestion.setAcceptanceRate(
                            (double) tQuestion.getTotalAccepted() / tQuestion.getTotalSubmissions() * 100);

                }

                questionRepository.save(tQuestion);
                userRepository.save(tUser);
                return null;
            });

        } finally {
            resetContainer(containerId);
        }
    }

    private void resetContainer(String containerId) throws Exception {
        new ProcessBuilder(
                "docker", "exec", containerId,
                "bash", "-c",
                "rm -rf /app/*").start().waitFor();
    }

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    public String aiHealthCheck() throws Exception {
        String prompt = "Respond with 'OK' if you receive this message.";
        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(textPart));
        Map<String, Object> requestBody = Map.of("contents", List.of(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        String urlWithKey = GEMINI_API_URL + "?key=" + geminiApiKey;
        Map<String, Object> response = restTemplate.postForObject(urlWithKey, entity, Map.class);
        return response.toString();
    }

    public AiAnalysis analyzeCode(String questionDescription, String userCode) throws Exception {
        String prompt = """
                Analyze the following code solution.
                Add a 2-3 sentence description of the code and mention if improvement is possible, and analyze its time and space complexity.

                Question:
                %s

                User Code:
                %s

                Return ONLY valid JSON with no markdown, no code fences, no extra text — just the raw JSON object in this exact format:

                {
                  "timeComplexity": "",
                  "spaceComplexity": "",
                  "description": ""
                }
                """
                .formatted(questionDescription, userCode);

        // Build Gemini request body
        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(textPart));
        Map<String, Object> requestBody = Map.of("contents", List.of(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        String urlWithKey = GEMINI_API_URL + "?key=" + geminiApiKey;
        Map<String, Object> response = restTemplate.postForObject(urlWithKey, entity, Map.class);

        // Parse: response -> candidates[0] -> content -> parts[0] -> text
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        Map<String, Object> firstCandidate = candidates.get(0);
        Map<String, Object> responseContent = (Map<String, Object>) firstCandidate.get("content");
        List<Map<String, Object>> parts = (List<Map<String, Object>>) responseContent.get("parts");
        String text = (String) parts.get(0).get("text");

        // Strip markdown code fences if present (defensive)
        text = text.strip();
        if (text.startsWith("```")) {
            text = text.replaceAll("^```[a-zA-Z]*\\n?", "").replaceAll("```$", "").strip();
        }

        return mapper.readValue(text, AiAnalysis.class);
    }
}
