package com.at.mapper;

import com.at.pojo.AiDecisionAdvice;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AiDecisionAdviceMapper {
    int insert(AiDecisionAdvice advice);

    AiDecisionAdvice selectById(Long id);

    AiDecisionAdvice selectLatestByAlertId(Integer alertId);

    int updateReview(AiDecisionAdvice advice);
}
