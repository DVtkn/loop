export interface RawUserAnswer {
  questionId: string;
  selectedValue: string | number;
  weight?: string | number;
  reactionTimeMs?: number | null;
  toggleCount?: number | null;
  targetType?: string | null;
  rawPayload?: any;
}

export interface PsychProfile24Scales {
  // Vector 1: Доверие и безопасность
  s1: number; // Тревожность привязанности (ECR-R)
  s2: number; // Избегание близости (ECR-R)
  s3: number; // Базовый уровень подозрительности
  s4: number; // Допуск партнёра к уязвимости

  // Vector 2: Эмоциональная близость
  s5: number; // Ведущий канал: Слова и валидация
  s6: number; // Ведущий канал: Время и внимание
  s7: number; // Ведущий канал: Помощь и забота
  s8: number; // Ведущий канал: Физический контакт

  // Vector 3: Конфликтная динамика
  s9: number;  // Склонность к преследованию (Pursuit)
  s10: number; // Склонность к отстранению (Withdrawal)
  s11: number; // Реактивная критика / сарказм
  s12: number; // Скорость физиологического остывания

  // Vector 4: Ценности и горизонт
  s13: number; // Автономия против слияния
  s14: number; // Материальные амбиции vs комфорт
  s15: number; // Отношение к детям и воспитанию
  s16: number; // Роль традиций и внешней семьи

  // Vector 5: Интимность и страсть
  s17: number; // Эмоциональный триггер возбуждения
  s18: number; // Спонтанность против предсказуемости
  s19: number; // Инициативность в контакте
  s20: number; // Степень табуированности желаний

  // Vector 6: Быт и жизнестойкость
  s21: number; // Контроль и порядок (Big Five C)
  s22: number; // Отношение к совместным финансам
  s23: number; // Социальная батарейка (Big Five E)
  s24: number; // Готовность к внешним кризисам
}

export interface PsychProfileVectorResult {
  traitScores: PsychProfile24Scales;
  dominantVectors: {
    trustSafety: number;
    emotionalCloseness: number;
    conflictDynamics: number;
    valuesHorizon: number;
    intimacyPassion: number;
    lifestyleResilience: number;
  };
  eSafety: number;
  aAutonomy: number;
  cCloseness: number;
  rRepair: number;
  vFuture: number;
  consistencyScore: number;
}

/** Экспорт для использования в tests.service.ts */
export { calculateIndividualVector as calculatePsychProfile };
export function calculateIndividualVector(userAnswers: RawUserAnswer[]): PsychProfileVectorResult {
  // Initialize all 24 scales with neutral baseline (50)
  const scales: PsychProfile24Scales = {
    s1: 50, s2: 50, s3: 50, s4: 50,
    s5: 50, s6: 50, s7: 50, s8: 50,
    s9: 50, s10: 50, s11: 50, s12: 50,
    s13: 50, s14: 50, s15: 50, s16: 50,
    s17: 50, s18: 50, s19: 50, s20: 50,
    s21: 50, s22: 50, s23: 50, s24: 50,
  };

  let totalToggles = 0;
  let rapidClicks = 0;
  let totalValidAnswers = 0;

  for (const ans of userAnswers) {
    if (!ans) continue;
    totalValidAnswers++;

    const val = Number(ans.selectedValue) || 0;
    let baseWeight = Number(ans.weight) || 1.0;

    const reactionMs = ans.reactionTimeMs != null ? Number(ans.reactionTimeMs) : null;
    const toggles = ans.toggleCount != null ? Number(ans.toggleCount) : 0;
    totalToggles += toggles;

    if (reactionMs !== null && reactionMs < 800) {
      rapidClicks++;
      baseWeight *= 0.85; // Low confidence for instant click
    }

    if (toggles >= 3) {
      baseWeight *= 0.9; // Uncertainty penalty
    }

    // 1. Process trade-off payloads if present
    if (ans.rawPayload && typeof ans.rawPayload === 'object') {
      const p = ans.rawPayload;
      if (p.s1 != null) scales.s1 += (Number(p.s1) - 2.5) * 6 * baseWeight;
      if (p.s2 != null) scales.s2 += (Number(p.s2) - 2.5) * 6 * baseWeight;
      if (p.s3 != null) scales.s3 += (Number(p.s3) - 2.5) * 6 * baseWeight;
      if (p.s4 != null) scales.s4 += (Number(p.s4) - 2.5) * 6 * baseWeight;
      if (p.s5 != null) scales.s5 += (Number(p.s5) - 2.5) * 6 * baseWeight;
      if (p.s6 != null) scales.s6 += (Number(p.s6) - 2.5) * 6 * baseWeight;
      if (p.s7 != null) scales.s7 += (Number(p.s7) - 2.5) * 6 * baseWeight;
      if (p.s8 != null) scales.s8 += (Number(p.s8) - 2.5) * 6 * baseWeight;
      if (p.words != null) scales.s5 += (Number(p.words) - 2.5) * 5 * baseWeight;
      if (p.time != null) scales.s6 += (Number(p.time) - 2.5) * 5 * baseWeight;
      if (p.acts != null) scales.s7 += (Number(p.acts) - 2.5) * 5 * baseWeight;
      if (p.touch != null) scales.s8 += (Number(p.touch) - 2.5) * 5 * baseWeight;
      if (p.intimacy != null) scales.s17 += (Number(p.intimacy) - 3.3) * 5 * baseWeight;
      if (p.passion != null) scales.s18 += (Number(p.passion) - 3.3) * 5 * baseWeight;
      if (p.commitment != null) scales.s15 += (Number(p.commitment) - 3.3) * 5 * baseWeight;
      // Big Five trade-off (TEST-PT): energy → S23, order → S21, novelty → S24, harmony → S5
      if (p.energy != null) scales.s23 += (Number(p.energy) - 2.5) * 5 * baseWeight;
      if (p.order != null) scales.s21 += (Number(p.order) - 2.5) * 5 * baseWeight;
      if (p.novelty != null) scales.s24 += (Number(p.novelty) - 2.5) * 5 * baseWeight;
      if (p.harmony != null) scales.s5 += (Number(p.harmony) - 2.5) * 5 * baseWeight;
    }

    // 2. Direct question mapping by IDs (q-s1..q-s6, situations)
    const qId = ans.questionId || '';
    const valStr = String(ans.selectedValue);

    // Module 1: Стресс-контур и автоматические защиты (S1, S2, S9, S10)
    if (qId.startsWith('q-s1') || qId.startsWith('sit-1')) {
      if (valStr.includes('anxiety') || valStr.includes('pursuit') || valStr.includes('urgent')) {
        scales.s1 += 12 * baseWeight;
        scales.s9 += 10 * baseWeight;
      } else if (valStr.includes('avoid') || valStr.includes('solitary') || valStr.includes('silence')) {
        scales.s2 += 12 * baseWeight;
        scales.s10 += 10 * baseWeight;
      } else if (valStr.includes('secure') || valStr.includes('team') || valStr.includes('calm')) {
        scales.s4 += 12 * baseWeight;
        scales.s12 += 10 * baseWeight;
        scales.s1 -= 6 * baseWeight;
        scales.s2 -= 6 * baseWeight;
      } else if (valStr.includes('care') || valStr.includes('tea')) {
        scales.s7 += 10 * baseWeight;
        scales.s4 += 6 * baseWeight;
      }
    }

    // Module 2: Архитектура заботы (S5, S6, S7, S8)
    else if (qId.startsWith('q-s2') || qId.startsWith('sit-2')) {
      if (valStr.includes('words')) scales.s5 += 14 * baseWeight;
      else if (valStr.includes('time')) scales.s6 += 14 * baseWeight;
      else if (valStr.includes('acts')) scales.s7 += 14 * baseWeight;
      else if (valStr.includes('touch')) scales.s8 += 14 * baseWeight;
      else if (valStr.includes('gifts')) {
        scales.s7 += 8 * baseWeight;
        scales.s5 += 6 * baseWeight;
      }
    }

    // Module 3: Границы «Я» и «Мы» & Конфликты (S13, S23, S9..S12)
    else if (qId.startsWith('q-s3') || qId.startsWith('sit-3')) {
      if (valStr.includes('soft_startup') || valStr.includes('empathy') || valStr.includes('gottman')) {
        scales.s12 += 14 * baseWeight;
        scales.s4 += 8 * baseWeight;
        scales.s11 -= 8 * baseWeight;
      } else if (valStr.includes('bottle') || valStr.includes('snark') || valStr.includes('criticism')) {
        scales.s11 += 14 * baseWeight;
        scales.s9 += 8 * baseWeight;
      } else if (valStr.includes('stonewall') || valStr.includes('shut_down')) {
        scales.s10 += 14 * baseWeight;
        scales.s2 += 8 * baseWeight;
      } else if (valStr.includes('autonomy') || valStr.includes('solitude')) {
        scales.s13 += 14 * baseWeight;
        scales.s23 -= 8 * baseWeight;
      } else if (valStr.includes('together') || valStr.includes('fusion')) {
        scales.s13 -= 10 * baseWeight;
        scales.s6 += 8 * baseWeight;
      }
    }

    // Module 4: Финансово-бытовой код (S14, S21, S22)
    else if (qId.startsWith('q-c1') || qId.startsWith('sit-4')) {
      if (valStr.includes('order') || valStr.includes('active') || valStr.includes('clean')) {
        scales.s21 += 12 * baseWeight;
      } else if (valStr.includes('cozy') || valStr.includes('relax') || valStr.includes('flexible')) {
        scales.s21 -= 8 * baseWeight;
      }
      if (valStr.includes('common') || valStr.includes('shared_budget')) {
        scales.s22 += 14 * baseWeight;
      } else if (valStr.includes('split') || valStr.includes('separate')) {
        scales.s22 -= 10 * baseWeight;
        scales.s13 += 8 * baseWeight;
      }
      if (valStr.includes('ambition') || valStr.includes('invest')) {
        scales.s14 += 12 * baseWeight;
      } else if (valStr.includes('comfort') || valStr.includes('present')) {
        scales.s14 -= 8 * baseWeight;
      }
    }

    // Module 5: Интимность и страсть (S17, S18, S19, S20)
    else if (qId.startsWith('q-s4') || qId.startsWith('sit-5')) {
      if (valStr.includes('passion') || valStr.includes('spark') || valStr.includes('spontaneous')) {
        scales.s18 += 14 * baseWeight;
        scales.s19 += 10 * baseWeight;
      } else if (valStr.includes('gentle') || valStr.includes('safety_first')) {
        scales.s17 += 14 * baseWeight;
      }
      if (valStr.includes('open_fantasies') || valStr.includes('taboo_low')) {
        scales.s20 += 14 * baseWeight;
      } else if (valStr.includes('deep_dialogue')) {
        scales.s4 += 10 * baseWeight;
        scales.s17 += 8 * baseWeight;
      }
    }

    // Module 6: Ценностный компас и кризисы (S15, S16, S24)
    else if (qId.startsWith('q-d1') || qId.startsWith('q-d2') || qId.startsWith('sit-6')) {
      if (valStr.includes('traditions') || valStr.includes('family')) scales.s16 += 14 * baseWeight;
      if (valStr.includes('children') || valStr.includes('solid_commitment')) scales.s15 += 14 * baseWeight;
      if (valStr.includes('crisis_hardy') || valStr.includes('team_bond') || valStr.includes('collaborating')) {
        scales.s24 += 14 * baseWeight;
        scales.s12 += 10 * baseWeight;
      }
    }

    // Module 7: Тип личности Big Five (TEST-PT): S21, S23, S24, S12 (+ корреляции S1/S5)
    else if (qId.startsWith('q-pt')) {
      if (valStr.includes('extravert') || valStr === 'connector' || valStr === 'social_support' || valStr === 'novelty_craving') {
        scales.s23 += 12 * baseWeight;
      } else if (valStr.includes('introvert') || valStr === 'deep_observer') {
        scales.s23 -= 10 * baseWeight;
        scales.s13 += 6 * baseWeight; // интроверсия ~ автономия
      }
      if (valStr === 'structured' || valStr === 'order_architect' || valStr === 'duty_first' || valStr === 'quiet_anchor' || valStr === 'host_control') {
        scales.s21 += 12 * baseWeight;
      } else if (valStr === 'spontaneous' || valStr === 'creative_chaos' || valStr === 'options_open') {
        scales.s21 -= 8 * baseWeight;
        scales.s18 += 6 * baseWeight;
      } else if (valStr === 'cyclic_order') {
        scales.s21 += 4 * baseWeight;
      }
      if (valStr === 'generator' || valStr === 'curious_problem' || valStr === 'novelty_craving' || valStr === 'options_open') {
        scales.s24 += 12 * baseWeight;
      }
      if (valStr === 'neurotic_reaction') {
        scales.s1 += 10 * baseWeight;
        scales.s12 -= 8 * baseWeight;
      } else if (valStr === 'stable_focus') {
        scales.s12 += 12 * baseWeight;
        scales.s1 -= 6 * baseWeight;
      }
      if (valStr === 'empathic_probe' || valStr === 'deep_bond') {
        scales.s5 += 8 * baseWeight;
        scales.s4 += 6 * baseWeight;
      }
      if (valStr === 'direct_logic' || valStr === 'calm_assertive') {
        scales.s12 += 8 * baseWeight;
      }
      if (valStr === 'ritual_home') {
        scales.s16 += 8 * baseWeight;
        scales.s24 -= 4 * baseWeight;
      }
    }
  }

  // Bound all 24 scales to [10..100]
  const clamp = (v: number) => Math.round(Math.min(100, Math.max(10, v)) * 10) / 10;
  for (const k of Object.keys(scales) as Array<keyof PsychProfile24Scales>) {
    scales[k] = clamp(scales[k]);
  }

  // Calculate dominant vectors
  const dominantVectors = {
    trustSafety: clamp((scales.s4 + (100 - scales.s1) + (100 - scales.s2) + (100 - scales.s3)) / 4),
    emotionalCloseness: clamp((scales.s5 + scales.s6 + scales.s7 + scales.s8) / 4),
    conflictDynamics: clamp((scales.s12 + (100 - scales.s9) + (100 - scales.s10) + (100 - scales.s11)) / 4),
    valuesHorizon: clamp((scales.s13 + scales.s14 + scales.s15 + scales.s16) / 4),
    intimacyPassion: clamp((scales.s17 + scales.s18 + scales.s19 + scales.s20) / 4),
    lifestyleResilience: clamp((scales.s21 + scales.s22 + scales.s23 + scales.s24) / 4),
  };

  // Calculate consistency score [0-100]
  let consistency = 95;
  if (totalValidAnswers > 0) {
    const rapidRate = rapidClicks / totalValidAnswers;
    const toggleRate = totalToggles / totalValidAnswers;
    consistency -= rapidRate * 30;
    consistency -= Math.min(25, toggleRate * 10);
  }
  consistency = Math.max(40, Math.min(100, Math.round(consistency)));

  return {
    traitScores: scales,
    dominantVectors,
    eSafety: dominantVectors.trustSafety,
    aAutonomy: scales.s13,
    cCloseness: dominantVectors.emotionalCloseness,
    rRepair: dominantVectors.conflictDynamics,
    vFuture: dominantVectors.valuesHorizon,
    consistencyScore: consistency,
  };
}
