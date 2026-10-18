import React from 'react';
import { TestCategory } from '../../types.ts';
import { TestStoriesModal } from './TestStoriesModal.tsx';

interface TestCompletedModalProps {
  test: TestCategory | null;
  userAnswers?: Record<string, any>;
  partnerAnswers?: Record<string, any>;
  isPaired: boolean;
  partnerName: string;
  onViewReport: () => void;
  onViewTestResult?: () => void;
  onClose: () => void;
}

export const TestCompletedModal: React.FC<TestCompletedModalProps> = ({
  test,
  userAnswers = {},
  partnerAnswers,
  isPaired,
  partnerName,
  onViewReport,
  onViewTestResult,
  onClose,
}) => {
  if (!test) return null;

  return (
    <TestStoriesModal
      test={test}
      userAnswers={userAnswers}
      partnerAnswers={partnerAnswers}
      isPaired={isPaired}
      partnerName={partnerName}
      onViewReport={onViewReport}
      onViewTestResult={onViewTestResult}
      onClose={onClose}
    />
  );
};
