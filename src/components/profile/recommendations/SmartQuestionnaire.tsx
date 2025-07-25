/**
 * @fileoverview Smart Adaptive Questionnaire Component
 * @module components/profile/recommendations/SmartQuestionnaire
 * 
 * An intelligent questionnaire that adapts based on user responses and profile gaps
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  X, 
  Brain, 
  Target,
  Clock,
  DollarSign,
  ChefHat,
  Users,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  QuestionnaireQuestion,
  QuestionnaireOption 
} from '@/services/profile/ProfileRecommendationEngine';
import { useProfileActions } from '@/contexts/ProfileContext';
import { logger } from '@/services/logger';

// ============================================================================
// Types
// ============================================================================

interface SmartQuestionnaireProps {
  questions: QuestionnaireQuestion[];
  onComplete: (answers: QuestionnaireAnswers) => void;
  onSkip?: () => void;
  className?: string;
  autoSave?: boolean;
  showProgress?: boolean;
  allowSkipping?: boolean;
}

interface QuestionnaireAnswers {
  [questionId: string]: any;
}

interface QuestionState {
  answered: boolean;
  value: any;
  confidence: number;
}

// ============================================================================
// Smart Questionnaire Component
// ============================================================================

export function SmartQuestionnaire({
  questions,
  onComplete,
  onSkip,
  className,
  autoSave = true,
  showProgress = true,
  allowSkipping = true
}: SmartQuestionnaireProps) {
  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});
  const [questionStates, setQuestionStates] = useState<Record<string, QuestionState>>({});
  const [isCompleting, setIsCompleting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Profile actions
  const profileActions = useProfileActions();

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progressPercentage = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  // ========================================================================
  // Answer Handling
  // ========================================================================

  const updateAnswer = useCallback((questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    // Update question state
    setQuestionStates(prev => ({
      ...prev,
      [questionId]: {
        answered: value !== undefined && value !== null && value !== '',
        value,
        confidence: calculateAnswerConfidence(value, questions.find(q => q.id === questionId))
      }
    }));

    // Clear validation error if exists
    if (validationErrors[questionId]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });
    }

    // Auto-save if enabled
    if (autoSave) {
      saveAnswerToProfile(questionId, value);
    }
  }, [questions, validationErrors, autoSave]);

  const calculateAnswerConfidence = (value: any, question?: QuestionnaireQuestion): number => {
    if (!question || value === undefined || value === null) return 0;

    switch (question.type) {
      case 'multi_select':
        return Array.isArray(value) ? Math.min(100, value.length * 25) : 0;
      case 'single_select':
        return value ? 90 : 0;
      case 'range':
        return value > 0 ? 85 : 0;
      case 'number':
        return value > 0 ? 80 : 0;
      case 'text':
        return typeof value === 'string' && value.length > 2 ? 75 : 0;
      case 'yes_no':
        return value !== undefined ? 100 : 0;
      default:
        return 0;
    }
  };

  const saveAnswerToProfile = useCallback(async (questionId: string, value: any) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    try {
      // Map questionnaire answers to profile/preference fields
      const profileUpdate = mapAnswerToProfile(question, value);
      
      if (profileUpdate.profile) {
        await profileActions.updateProfile(profileUpdate.profile);
      }
      
      if (profileUpdate.preferences) {
        await profileActions.updatePreferences(profileUpdate.preferences);
      }

      logger.info('Auto-saved questionnaire answer', 'SmartQuestionnaire', {
        questionId,
        value,
        profileUpdate
      });

    } catch (error) {
      logger.error('Error auto-saving questionnaire answer', 'SmartQuestionnaire', error);
    }
  }, [questions, profileActions]);

  // ========================================================================
  // Navigation
  // ========================================================================

  const goToNextQuestion = useCallback(() => {
    const currentQ = questions[currentQuestionIndex];
    
    // Validate current question if required
    if (currentQ?.required && !isQuestionAnswered(currentQ.id)) {
      setValidationErrors(prev => ({
        ...prev,
        [currentQ.id]: 'This question is required'
      }));
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      completeQuestionnaire();
    }
  }, [currentQuestionIndex, questions]);

  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  }, [questions.length]);

  const isQuestionAnswered = (questionId: string): boolean => {
    const state = questionStates[questionId];
    return state?.answered || false;
  };

  // ========================================================================
  // Completion
  // ========================================================================

  const completeQuestionnaire = useCallback(async () => {
    setIsCompleting(true);

    try {
      // Final validation
      const requiredQuestions = questions.filter(q => q.required);
      const missingAnswers = requiredQuestions.filter(q => !isQuestionAnswered(q.id));
      
      if (missingAnswers.length > 0) {
        const errors: Record<string, string> = {};
        missingAnswers.forEach(q => {
          errors[q.id] = 'This question is required';
        });
        setValidationErrors(errors);
        
        // Go to first missing question
        const firstMissingIndex = questions.findIndex(q => q.id === missingAnswers[0].id);
        if (firstMissingIndex >= 0) {
          setCurrentQuestionIndex(firstMissingIndex);
        }
        
        return;
      }

      await onComplete(answers);
      toast.success('Profile questionnaire completed successfully!');

    } catch (error) {
      toast.error('Failed to complete questionnaire. Please try again.');
      logger.error('Error completing questionnaire', 'SmartQuestionnaire', error);
    } finally {
      setIsCompleting(false);
    }
  }, [answers, questions, onComplete, questionStates]);

  // ========================================================================
  // Question Rendering
  // ========================================================================

  const renderQuestion = (question: QuestionnaireQuestion) => {
    const currentValue = answers[question.id];
    const hasError = validationErrors[question.id];

    switch (question.type) {
      case 'single_select':
        return (
          <div className="space-y-4">
            <RadioGroup
              value={currentValue || ''}
              onValueChange={(value) => updateAnswer(question.id, value)}
              className="space-y-3"
            >
              {question.options?.map((option) => (
                <div key={option.value} className="flex items-start space-x-3">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor={option.value}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {option.label}
                    </Label>
                    {option.description && (
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'multi_select':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <div key={option.value} className="flex items-start space-x-3">
                <Checkbox
                  id={option.value}
                  checked={Array.isArray(currentValue) && currentValue.includes(option.value)}
                  onCheckedChange={(checked) => {
                    const currentArray = Array.isArray(currentValue) ? currentValue : [];
                    const newValue = checked
                      ? [...currentArray, option.value]
                      : currentArray.filter(v => v !== option.value);
                    updateAnswer(question.id, newValue);
                  }}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor={option.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option.label}
                  </Label>
                  {option.description && (
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      case 'range':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">
                  {question.unit ? `${currentValue || question.defaultValue || question.min} ${question.unit}` : (currentValue || question.defaultValue || question.min)}
                </Label>
                <span className="text-xs text-muted-foreground">
                  {question.min} - {question.max}
                </span>
              </div>
              <Slider
                value={[currentValue || question.defaultValue || question.min]}
                onValueChange={([value]) => updateAnswer(question.id, value)}
                min={question.min}
                max={question.max}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        );

      case 'number':
        return (
          <div className="space-y-2">
            <Input
              type="number"
              value={currentValue || ''}
              onChange={(e) => updateAnswer(question.id, parseInt(e.target.value) || 0)}
              min={question.min}
              max={question.max}
              placeholder={question.defaultValue?.toString() || ''}
              className={cn(hasError && 'border-red-500')}
            />
            {question.unit && (
              <p className="text-xs text-muted-foreground">Unit: {question.unit}</p>
            )}
          </div>
        );

      case 'text':
        return (
          <Input
            type="text"
            value={currentValue || ''}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            placeholder="Your answer..."
            className={cn(hasError && 'border-red-500')}
          />
        );

      case 'yes_no':
        return (
          <RadioGroup
            value={currentValue?.toString() || ''}
            onValueChange={(value) => updateAnswer(question.id, value === 'true')}
            className="flex space-x-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="yes" />
              <Label htmlFor="yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="no" />
              <Label htmlFor="no">No</Label>
            </div>
          </RadioGroup>
        );

      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'dietary': return <ChefHat className="h-4 w-4" />;
      case 'budget': return <DollarSign className="h-4 w-4" />;
      case 'cooking': return <Target className="h-4 w-4" />;
      case 'household': return <Users className="h-4 w-4" />;
      case 'lifestyle': return <Clock className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  // ========================================================================
  // Render
  // ========================================================================

  if (questions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Brain className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No recommendations available at the moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('max-w-2xl mx-auto', className)}>
      {/* Progress */}
      {showProgress && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Smart Profile Builder</h2>
            <span className="text-sm text-muted-foreground">
              {currentQuestionIndex + 1} of {totalQuestions}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      )}

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {getCategoryIcon(currentQuestion.category)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {currentQuestion.category}
                    </Badge>
                    {currentQuestion.required && (
                      <Badge className="text-xs bg-red-500 text-white">
                        Required
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">
                    {currentQuestion.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentQuestion.description}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {renderQuestion(currentQuestion)}
                
                {/* Validation Error */}
                {validationErrors[currentQuestion.id] && (
                  <div className="flex items-center space-x-2 text-red-500 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{validationErrors[currentQuestion.id]}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            size="sm"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {allowSkipping && (
            <Button
              variant="ghost"
              onClick={onSkip}
              size="sm"
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Skip for now
            </Button>
          )}
        </div>

        <div className="flex space-x-2">
          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={completeQuestionnaire}
              disabled={isCompleting}
              size="sm"
            >
              {isCompleting ? (
                'Completing...'
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Complete
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={goToNextQuestion}
              size="sm"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Question Navigation Dots */}
      <div className="flex justify-center mt-6 space-x-2">
        {questions.map((_, index) => (
          <button
            key={index}
            onClick={() => goToQuestion(index)}
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              index === currentQuestionIndex
                ? 'bg-primary'
                : isQuestionAnswered(questions[index].id)
                ? 'bg-green-500'
                : 'bg-gray-300'
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapAnswerToProfile(question: QuestionnaireQuestion, value: any) {
  const profileUpdate: { profile?: any; preferences?: any } = {};

  switch (question.id) {
    case 'dietary_restrictions':
      profileUpdate.preferences = { dietaryRestrictions: value };
      break;
    case 'allergies':
      profileUpdate.preferences = { allergies: value };
      break;
    case 'cooking_skill':
      profileUpdate.preferences = { cookingSkillLevel: value };
      break;
    case 'budget':
      profileUpdate.preferences = { 
        budget: { 
          weekly: value, 
          monthly: value * 4, 
          currency: 'USD' 
        } 
      };
      break;
    case 'household_size':
      profileUpdate.preferences = { householdSize: value };
      break;
    default:
      // Generic mapping
      profileUpdate.preferences = { [question.id]: value };
  }

  return profileUpdate;
}