import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle, Circle } from 'lucide-react-native';
import { Quiz, QuizQuestion } from '@/types/api';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { colors, spacing } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

interface QuizComponentProps {
  quiz: Quiz;
  onComplete: (score: number) => void;
}

export function QuizComponent({ quiz, onComplete }: QuizComponentProps) {
  const { isDark } = useThemeStore();
  const theme = isDark ? colors.dark : colors.light;
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const hasSelectedAnswer = selectedAnswers[currentQuestionIndex] !== undefined;

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Calculate score
      const correctAnswers = quiz.questions.reduce((count, question, index) => {
        return count + (selectedAnswers[index] === question.correctAnswer ? 1 : 0);
      }, 0);
      const score = (correctAnswers / quiz.questions.length) * 100;
      setShowResults(true);
      setTimeout(() => onComplete(score), 2000);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const calculateScore = () => {
    const correctAnswers = quiz.questions.reduce((count, question, index) => {
      return count + (selectedAnswers[index] === question.correctAnswer ? 1 : 0);
    }, 0);
    return (correctAnswers / quiz.questions.length) * 100;
  };

  if (showResults) {
    const score = calculateScore();
    return (
      <ThemedView surface style={styles.container}>
        <View style={styles.resultsContainer}>
          <ThemedText type="h2" style={styles.resultsTitle}>
            Quiz Tamamlandı!
          </ThemedText>
          <ThemedText type="h1" color="primary" style={styles.score}>
            %{Math.round(score)}
          </ThemedText>
          <ThemedText type="body" color="muted" style={styles.resultsText}>
            {quiz.questions.length} sorudan {quiz.questions.reduce((count, question, index) => {
              return count + (selectedAnswers[index] === question.correctAnswer ? 1 : 0);
            }, 0)} tanesini doğru cevapladınız.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView surface style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="h3">{quiz.title}</ThemedText>
        <ThemedText type="caption" color="muted">
          Soru {currentQuestionIndex + 1} / {quiz.questions.length}
        </ThemedText>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.primary,
                width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.questionContainer}>
        <ThemedText type="h3" style={styles.question}>
          {currentQuestion.question}
        </ThemedText>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswers[currentQuestionIndex] === index;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.option,
                  {
                    backgroundColor: isSelected ? theme.primary + '20' : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => handleAnswerSelect(index)}
              >
                <View style={styles.optionContent}>
                  {isSelected ? (
                    <CheckCircle size={20} color={theme.primary} />
                  ) : (
                    <Circle size={20} color={theme.textMuted} />
                  )}
                  <ThemedText type="body" style={styles.optionText}>
                    {option}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.nextButton,
          {
            backgroundColor: hasSelectedAnswer ? theme.primary : theme.border,
          },
        ]}
        onPress={handleNext}
        disabled={!hasSelectedAnswer}
      >
        <ThemedText
          type="body"
          style={[
            styles.nextButtonText,
            { color: hasSelectedAnswer ? theme.background : theme.textMuted },
          ]}
        >
          {isLastQuestion ? 'Tamamla' : 'Sonraki'}
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  progressContainer: {
    marginBottom: spacing.xl,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  questionContainer: {
    flex: 1,
  },
  question: {
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: spacing.md,
  },
  option: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionText: {
    flex: 1,
  },
  nextButton: {
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  nextButtonText: {
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  resultsTitle: {
    textAlign: 'center',
  },
  score: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  resultsText: {
    textAlign: 'center',
  },
});