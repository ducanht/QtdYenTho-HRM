import React from 'react';
import TrustEvaluationContainer from '../features/trust';
import ErrorBoundary from '../components/common/ErrorBoundary';

/**
 * Trang Đánh giá Tín nhiệm Cán bộ 10 Tiêu chí Chuẩn NHNN
 * Đại diện phân hệ Module A, sử dụng container phân rã sạch từ src/features/trust
 */
const TrustEvaluation = () => {
  return (
    <ErrorBoundary title="Phân Hệ Đánh Giá Tín Nhiệm Cán Bộ">
      <TrustEvaluationContainer />
    </ErrorBoundary>
  );
};

export default TrustEvaluation;

