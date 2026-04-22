package com.codify.backend.controller;

import com.codify.backend.dto.UserInput;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.codify.backend.model.Question;
import com.codify.backend.model.Submission;
import com.codify.backend.repository.SubmissionRepository;
import com.codify.backend.service.SubmitService;
import com.codify.backend.repository.QuestionRepository;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class SubmitController {
 
    private final SubmissionRepository submissionRepository;
    private final QuestionRepository questionRepository;
    private final KafkaTemplate<Long, Submission> kafkaTemplate;
    private final SubmitService submitService;
    @PostMapping("/submit/java")
    public ResponseEntity<Long> submitJava(@RequestBody UserInput userInput) throws Exception {
        return handleSubmission(userInput, "java", "JavaSubmissions");
    }

    @PostMapping("/submit/python")
    public ResponseEntity<Long> submitPython(@RequestBody UserInput userInput) throws Exception {
        return handleSubmission(userInput, "python", "PythonSubmissions");
    }

    @PostMapping("/submit/cpp")
    public ResponseEntity<Long> submitCpp(@RequestBody UserInput userInput) throws Exception {
        return handleSubmission(userInput, "cpp", "CppSubmissions");
    }

    private ResponseEntity<Long> handleSubmission(UserInput userInput, String language, String topicName) {
        Question question = questionRepository.findById(userInput.getQuestionId()).orElseThrow(() -> new RuntimeException("Question not found")); 
        Submission submission = Submission.builder()
                .userId(userInput.getUserId())
                .questionId(userInput.getQuestionId())
                .userCode(userInput.getUserCode())
                .questionTitle(question.getTitle())
                .status("PENDING")
                .verdict("QUEUED")
                .language(language)
                .createdAt(LocalDateTime.now())
                .build();

        submissionRepository.save(submission);
        log.info("{} submission created and saved", language);
        kafkaTemplate.send(topicName, submission.getId(), submission);
        log.info("{} submission sent to kafka topic {}", language, topicName);
        return ResponseEntity.ok(submission.getId());
    }
    @PostMapping("/aihealthcheck")
    public ResponseEntity<String> aiHealthCheck() throws Exception {
        String response = submitService.AiHealthCheck();
        return ResponseEntity.ok(response);
    }
    //this method is to keep the kafka connection alive, as it can time out after some time of inactivity. It sends a dummy message to a topic every 6 hours.
    private final KafkaTemplate<Long,String> kafkaTemplate2;
    @Scheduled(fixedDelay = 6 * 60 * 60 * 1000)
    public void keepKafkaAlive(){
        log.info("Sending heartbeat message to Kafka");
        kafkaTemplate2.send("KeepServiceAlive",(long)1,"hello");
        log.info("Heartbeat message sent to Kafka");
    }
    //method to keep database active
    @Scheduled(fixedDelay = 6 * 60 * 60 * 1000)
    public void keepDatabaseAlive(){
        log.info("Checking database connection");
        long count = questionRepository.count();
        log.info("Database connection is alive, question count: {}", count);
    } 
}
