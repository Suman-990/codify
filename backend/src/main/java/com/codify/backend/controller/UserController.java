package com.codify.backend.controller;

import com.codify.backend.dto.*;
import com.codify.backend.model.Discussion;
import com.codify.backend.model.Question;
import com.codify.backend.dto.QuestionPreview;
import com.codify.backend.model.Solution;
import com.codify.backend.model.Submission;
import com.codify.backend.model.User;
import com.codify.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    @GetMapping("/ping")
    public String ping() {
        return "pong";
    }

    private final UserService userService;

    // ==================== USER PROFILE ENDPOINTS ====================
    
    @GetMapping("/user/profile/{userId}")
    public ResponseEntity<ProfileDto> getUserProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getUserProfile(userId));
    }

   
    @GetMapping("/user/profile/basic/{userId}")
    public ResponseEntity<User> getUserProfileBasic(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getUser(userId));
    }

    @PutMapping("/user/profile/picture")
    public ResponseEntity<Void> updateProfilePicture(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam int profilePictureId) {
        User user = userService.getUserProfileByEmail(userDetails.getUsername());
        userService.updateUserProfilePicture(user.getId(), profilePictureId);
        return ResponseEntity.ok().build();
    }
    @PutMapping("/user/profile/country")
    public ResponseEntity<Void> updateUserCountry(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String country) {
        User user = userService.getUserProfileByEmail(userDetails.getUsername());
        userService.changeUserCountry(user.getId(), country);
        return ResponseEntity.ok().build();
    }

    // ==================== USER PROGRESS & STATS ENDPOINTS ====================

    @GetMapping("/user/progress/{userId}")
    public ResponseEntity<Map<String, Integer>> getUserProgress(@PathVariable Long userId) {
        Map<String, Integer> progress = new HashMap<>();
        progress.put("progress", userService.getUserProgress(userId));
        return ResponseEntity.ok(progress);
    }

    @GetMapping("/user/rank/{userId}")
    public ResponseEntity<Map<String, Long>> getUserRank(@PathVariable Long userId) {
        Map<String, Long> rank = new HashMap<>();
        rank.put("rank", userService.getUserRank(userId));
        return ResponseEntity.ok(rank);
    }

    @GetMapping("/user/accepted-percentage/{userId}")
    public ResponseEntity<Map<String, Integer>> getUserAcceptedPercentage(@PathVariable Long userId) {
        Map<String, Integer> percentage = new HashMap<>();
        percentage.put("acceptedPercentage", userService.getUserAcceptedPercentage(userId));
        return ResponseEntity.ok(percentage);
    }

    @GetMapping("/user/total-submissions/{userId}")
    public ResponseEntity<Map<String, Long>> getTotalSubmissions(@PathVariable Long userId) {
        Map<String, Long> submissions = new HashMap<>();
        submissions.put("totalSubmissions", userService.getTotalSubmissions(userId));
        return ResponseEntity.ok(submissions);
    }

    // ==================== QUESTIONS ENDPOINTS ====================

    @GetMapping("/questions")
    public ResponseEntity<List<QuestionPreview>> getQuestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.getQuestionsPage(page, size));
    }
    
    @GetMapping("/questions/search")
    public ResponseEntity<List<QuestionPreview>> searchQuestions(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.searchQuestions(query, page, size));
    }
    @GetMapping("/questions/{questionId}")
    public ResponseEntity<Question> getQuestionById(@PathVariable Long questionId) {
        return ResponseEntity.ok(userService.getQuestionById(questionId));
    }

    @GetMapping("/questions/difficulty/easy")
    public ResponseEntity<Page<Question>> getEasyQuestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.getEasyQuestionsPage(page, size));
    }

    @GetMapping("/questions/difficulty/medium")
    public ResponseEntity<Page<Question>> getMediumQuestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.getMediumQuestionsPage(page, size));
    }

    @GetMapping("/questions/difficulty/hard")
    public ResponseEntity<Page<Question>> getHardQuestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.getHardQuestionsPage(page, size));
    }

    @GetMapping("/questions/filter/difficulty")
    public ResponseEntity<List<QuestionPreview>> getQuestionsByDifficulty(
            @RequestParam String difficulty,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.getQuestionsByDifficulty(difficulty, page, size));
    }

    @GetMapping("/questions/filter/tag")
    public ResponseEntity<List<QuestionPreview>> getQuestionsByTag(
            @RequestParam String tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.getQuestionsByTag(tag, page, size));
    }

    // ==================== SOLUTIONS ENDPOINTS ====================

    @PostMapping("/solutions")
    public ResponseEntity<Solution> createSolution(@RequestBody CreateSolutionDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createSolution(dto));
    }

    @GetMapping("/solutions/question/{questionId}")
    public ResponseEntity<List<Solution>> getSolutionsByQuestion(
            @PathVariable Long questionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return ResponseEntity.ok(userService.getSolutions(questionId, page, size));
    }

    // ==================== DISCUSSIONS ENDPOINTS ====================

    @PostMapping("/discussions")
    public ResponseEntity<Discussion> createDiscussion(@RequestBody CreateDiscussionDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createDiscussion(dto));
    }

    @GetMapping("/discussions/question/{questionId}")
    public ResponseEntity<List<Discussion>> getDiscussionsByQuestion(
            @PathVariable Long questionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.getDiscussionsByQuestionId(questionId, page, size));
    }

    // ==================== SUBMISSIONS ENDPOINTS ====================

    @GetMapping("/submissions/{submissionId}")
    public ResponseEntity<Submission> getSubmissionById(@PathVariable Long submissionId) {
        return ResponseEntity.ok(userService.getSubmissionById(submissionId));
    }

    @GetMapping("/submissions/user/{userId}")
    public ResponseEntity<List<SubmissionPreview>> getSubmissionsByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.getSubmissionsByUserId(userId, page, size));
    }

    @GetMapping("/submissions/user/{userId}/question/{questionId}")
    public ResponseEntity<List<SubmissionPreview>> getSubmissionsByUserAndQuestion(
            @PathVariable Long userId,
            @PathVariable Long questionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.getSubmissionsByUserIdAndQuestionId(userId, questionId, page, size));
    }

    @GetMapping("/submissions/my")
    public ResponseEntity<List<SubmissionPreview>> getMySubmissions(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User user = userService.getUserProfileByEmail(userDetails.getUsername());
        return ResponseEntity.ok(userService.getSubmissionsByUserId(user.getId(), page, size));
    }

    @GetMapping("/submissions/my/question/{questionId}")
    public ResponseEntity<List<SubmissionPreview>> getMySubmissionsByQuestion(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long questionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User user = userService.getUserProfileByEmail(userDetails.getUsername());
        return ResponseEntity.ok(userService.getSubmissionsByUserIdAndQuestionId(user.getId(), questionId, page, size));
    }

    // ==================== ADMIN ENDPOINTS (Protected by ROLE_ADMIN) ====================

    @PostMapping("/admin/questions")
    public ResponseEntity<Question> createQuestion(@RequestBody CreateQuestionDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createQuestion(dto));
    }
}
