package com.codify.backend.service;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import com.codify.backend.repository.UserRepository;
import com.codify.backend.repository.QuestionRepository;
import com.codify.backend.repository.SolutionRepository;
import com.codify.backend.repository.SubmissionRepository;
import com.codify.backend.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import java.util.stream.Collectors;
import java.time.Duration;
import java.util.List;
import org.springframework.data.domain.Sort;
import com.codify.backend.dto.CreateSolutionDto;
import com.codify.backend.dto.ProfileDto;
import com.codify.backend.dto.SubmissionPreview;
import com.codify.backend.model.Discussion;
import com.codify.backend.model.Question;
import com.codify.backend.dto.QuestionPreview;
import com.codify.backend.model.Solution;
import com.codify.backend.model.Submission;
import com.codify.backend.dto.CreateDiscussionDto;
import com.codify.backend.repository.DiscussionRepository;
import com.codify.backend.dto.CreateQuestionDto;

import java.util.ArrayList;
import java.util.HashMap;
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final SolutionRepository solutionRepository;
    private final SubmissionRepository submissionRepository;
    private final RedisTemplate<String, List<QuestionPreview>> redisTemplate;
    private final DiscussionRepository discussionRepository;

    public User getUser(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
    }
    public User getUserProfileByEmail(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }
    public void updateUserProfilePicture(Long userId, int profilePictureId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        user.setProfilePictureId(profilePictureId);
        userRepository.save(user);
    }
    public void changeUserCountry(Long userId, String Country){
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        user.setCountry(Country);
        userRepository.save(user);
    }
    public int getUserProgress(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        long totalQuestions = questionRepository.count();
        int solvedQuestions = user.getSolvedQuestions().size();
        return (int) ((double) solvedQuestions / totalQuestions * 100);
    }
   
    public Page<Question> getEasyQuestionsPage(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return questionRepository.findByDifficulty("Easy", pageable);
    }
    public Page<Question> getMediumQuestionsPage(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return questionRepository.findByDifficulty("Medium", pageable);
    }
    public Page<Question> getHardQuestionsPage(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return questionRepository.findByDifficulty("Hard", pageable);
    }
        public long getUserRank(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        return  userRepository.countByTotalSolvedGreaterThan(user.getTotalSolved()) + 1;
    }
    public int getUserAcceptedPercentage(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        long totalSubmissions = submissionRepository.countByUserId(userId);
        long acceptedSubmissions = submissionRepository.countByUserIdAndVerdict(userId, "PASS");
        return totalSubmissions == 0 ? 0 : (int) ((double) acceptedSubmissions / totalSubmissions * 100);
    }
    public long getTotalSubmissions(Long userId) {
        return submissionRepository.countByUserId(userId);
    }
    public long getTotalQuestions(){
        return questionRepository.count();
    }
    public Question getQuestionById(Long questionId) {
        return questionRepository.findById(questionId).orElseThrow(() -> new RuntimeException("Question not found"));
    }
     public List<QuestionPreview> getQuestionsPage(int page, int size) {

        Pageable pageable = PageRequest.of(page, size);
        String cacheKey = "questions_page_" + page + "_" + size;
        List<QuestionPreview> cachedQuestions = (List<QuestionPreview>) redisTemplate.opsForValue().get(cacheKey);
        if (cachedQuestions != null) {
            return cachedQuestions;
        }
        Page<Question> questionPage = questionRepository.findAll(pageable);
        List<QuestionPreview> questions = questionPage.getContent().stream()
                .map(question -> QuestionPreview.builder()
                        .id(question.getId())
                        .title(question.getTitle())
                        .difficulty(question.getDifficulty())
                        .acceptanceRate(question.getAcceptanceRate())
                        .tags(new ArrayList<>(question.getTags()))
                        .build())
                .collect(Collectors.toList());
        redisTemplate.opsForValue().set(cacheKey, questions,Duration.ofMinutes(30));
        return questions;
    }
    public List<QuestionPreview> getQuestionsByTag(String tag, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        String cacheKey = "questions_tag_" + tag + "_" + page + "_" + size;
        List<QuestionPreview> cachedQuestions = (List<QuestionPreview>) redisTemplate.opsForValue().get(cacheKey);
        if (cachedQuestions != null) {
            return cachedQuestions;
        }
        Page<Question> questionPage = questionRepository.findByTagsContaining(tag, pageable);
                
        List<QuestionPreview> questions = questionPage.getContent().stream()
                .map(question -> QuestionPreview.builder()
                        .id(question.getId())
                        .title(question.getTitle())
                        .difficulty(question.getDifficulty())
                        .acceptanceRate(question.getAcceptanceRate())
                        .tags(new ArrayList<>(question.getTags()))
                        .build())
                .collect(Collectors.toList());
        redisTemplate.opsForValue().set(cacheKey, questions,Duration.ofMinutes(30));
        return questions;
    }
    public List<QuestionPreview> searchQuestions(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        String cacheKey = "questions_search_" + query + "_" + page + "_" + size;
        List<QuestionPreview> cachedQuestions = (List<QuestionPreview>) redisTemplate.opsForValue().get(cacheKey);
        if (cachedQuestions != null) {
            return cachedQuestions;
        }
        Page<Question> questionPage = questionRepository.findByTitleContainingIgnoreCase(query, pageable);
        List<QuestionPreview> questions = questionPage.getContent().stream()
                .map(question -> QuestionPreview.builder()
                        .id(question.getId())
                        .title(question.getTitle())
                        .difficulty(question.getDifficulty())
                        .acceptanceRate(question.getAcceptanceRate())
                        .tags(new ArrayList<>(question.getTags()))
                        .build())
                .collect(Collectors.toList());
        redisTemplate.opsForValue().set(cacheKey, questions,Duration.ofMinutes(30));
        return questions;
    }
    
    public List<QuestionPreview> getQuestionsByDifficulty(String difficulty, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        String cacheKey = "questions_difficulty_" + difficulty + "_" + page + "_" + size;
        List<QuestionPreview> cachedQuestions = (List<QuestionPreview>) redisTemplate.opsForValue().get(cacheKey);
        if (cachedQuestions != null) {
            return cachedQuestions;
        }
        Page<Question> questionPage = questionRepository.findByDifficulty(difficulty, pageable);
        List<QuestionPreview> questions = questionPage.getContent().stream()
                .map(question -> QuestionPreview.builder()
                        .id(question.getId())
                        .title(question.getTitle())
                        .difficulty(question.getDifficulty())
                        .acceptanceRate(question.getAcceptanceRate())
                        .tags(new ArrayList<>(question.getTags()))
                        .build())
                .collect(Collectors.toList());
        redisTemplate.opsForValue().set(cacheKey, questions,Duration.ofMinutes(30));
        return questions;
    }
    public Solution createSolution(CreateSolutionDto dto) {

        User user = userRepository.findById(dto.getUserId()).orElseThrow(() -> new RuntimeException("User not found"));
       
        Solution solution = Solution.builder()
                .questionId(dto.getQuestionId())
                .userId(dto.getUserId())
                .userName(user.getUsername())
                .language(dto.getLanguage())
                .userProfilePicture(user.getProfilePictureId())
                .code(dto.getCode())
                .executionTime(dto.getExecutionTime())
                .aproach(dto.getAproach())
                .timeComplexity(dto.getTimeComplexity())
                .spaceComplexity(dto.getSpaceComplexity())
                .createdAt(java.time.LocalDateTime.now())
                .build();

        return solutionRepository.save(solution);
    }
    public List<Solution> getSolutions(long questionId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Solution> solutionPage = solutionRepository.findByQuestionId(questionId, pageable);
        return solutionPage.getContent();
    }
    public Discussion  createDiscussion(CreateDiscussionDto dto) {
        Discussion discussion = Discussion.builder()
                .questionId(dto.getQuestionId())
                .userId(dto.getUserId())
                .userName(dto.getUserName())
                .userProfilePicture(dto.getUserProfilePicture())
                .content(dto.getContent())
                .timestamp(java.time.LocalDateTime.now())
                .build();
        return discussionRepository.save(discussion);
    }
    public List<Discussion> getDiscussionsByQuestionId(Long questionId, int page, int size) {
         Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
         Page<Discussion> discussionPage = discussionRepository.findByQuestionId(questionId, pageable);
         return discussionPage.getContent();
    }
    public Submission getSubmissionById(Long submissionId) {
        return submissionRepository.findById(submissionId).orElseThrow(() -> new RuntimeException("Submission not found"));
    }
    public List<SubmissionPreview> getSubmissionsByUserId(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Submission> submissionPage = submissionRepository.findByUserId(userId, pageable);
        return submissionPage.getContent().stream()
                .map(submission -> SubmissionPreview.builder()
                        .submissionId(submission.getId())
                        .questionTitle(submission.getQuestionTitle())
                        .language(submission.getLanguage())
                        .status(submission.getStatus())
                        .verdict(submission.getVerdict())
                        .build())
                .collect(Collectors.toList());
    }
    public List<SubmissionPreview> getSubmissionsByUserIdAndQuestionId(Long userId, Long questionId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Submission> submissionPage = submissionRepository.findByUserIdAndQuestionId(userId, questionId, pageable);
        return submissionPage.getContent().stream()
                .map(submission -> SubmissionPreview.builder()
                        .submissionId(submission.getId())
                        .questionTitle(submission.getQuestionTitle())
                        .language(submission.getLanguage())
                        .status(submission.getStatus())
                        .verdict(submission.getVerdict())
                        .build())
                .collect(Collectors.toList());
    }
    public ProfileDto getUserProfile(long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        return ProfileDto.builder()
                .username(user.getUsername())
                .country(user.getCountry())
                .profilePictureId(user.getProfilePictureId())
                .totalSubmissions(user.getTotalSubmissions())
                .acceptanceRate(user.getTotalSubmissions() == 0 ? 0 : (double) user.getTotalSolved() / user.getTotalSubmissions() * 100)
                .totalSolved(user.getTotalSolved())
                .easySolved(user.getEasySolved())
                .mediumSolved(user.getMediumSolved())
                .hardSolved(user.getHardSolved())
                .recentSubmissions(getSubmissionsByUserId(userId, 0, 5))
                .sharedSolutionsCount(solutionRepository.countByUserId(userId))
                .discussionsCount(discussionRepository.countByUserId(userId))
                .activeDays(user.getDailySubmissions().size())
                .dailySubmissions(user.getDailySubmissions())
                .rankPercentage((int) (getUserRank(userId) * 100 / userRepository.count()))
                .rank(getUserRank(userId))
                .joined(user.getRegistrationDate())
                .build();
    }
    
    public Question createQuestion(CreateQuestionDto dto) {
        Question question = Question.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .exampleInput(dto.getExampleInput())
                .exampleOutput(dto.getExampleOutput())
                .difficulty(dto.getDifficulty())
                .main_java(dto.getMain_java())
                .main_python(dto.getMain_python())
                .main_cpp(dto.getMain_cpp())
                .solution_java(dto.getSolution_java())
                .solution_python(dto.getSolution_python())
                .solution_cpp(dto.getSolution_cpp())
                .tags(dto.getTags())
                .constraints(dto.getConstraints())
                .executionTimes(new HashMap<>())
                .totalAccepted(0)
                .totalSubmissions(0)
                .acceptanceRate(0.0)
                .build();
        return questionRepository.save(question);
    } 
    
}
