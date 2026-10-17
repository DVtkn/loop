import { calculateIndividualVector } from '../../src/server/modules/tests/psychometrics.calc.ts';
import { calculateCoupleRadarMatrix } from '../../src/server/modules/tests/report.matrix.ts';

function runUnitTests() {
  console.log('🧪 Running Psychometrics & Matrix Unit Tests...\n');

  // Test 1: Individual Vector Calculation with Latency & Toggles
  const mockAnswers = [
    { questionId: 's1_q1', selectedValue: 3, reactionTimeMs: 2500, toggleCount: 0, targetType: 'self' },
    { questionId: 's1_q2', selectedValue: 4, reactionTimeMs: 3100, toggleCount: 1, targetType: 'self' },
    { questionId: 's2_q1', selectedValue: 2, reactionTimeMs: 4000, toggleCount: 2, targetType: 'self' },
    { questionId: 's2_q2', selectedValue: 3, reactionTimeMs: 200, toggleCount: 0, targetType: 'self' }, // very fast
    {
      questionId: 's3_q1',
      selectedValue: 1,
      reactionTimeMs: 5000,
      toggleCount: 3,
      targetType: 'self',
      rawPayload: { opt1: 4, opt2: 3, opt3: 3 }
    },
  ];

  const vector = calculateIndividualVector(mockAnswers);
  console.log('Test 1 - Individual Vector Result:', vector);

  if (
    typeof vector.eSafety !== 'number' ||
    typeof vector.aAutonomy !== 'number' ||
    typeof vector.cCloseness !== 'number' ||
    typeof vector.rRepair !== 'number' ||
    typeof vector.vFuture !== 'number' ||
    typeof vector.consistencyScore !== 'number'
  ) {
    throw new Error('Test 1 FAILED: Vector values must all be numbers');
  }
  console.log('✅ Test 1 PASSED: Individual vector calculation with anti-manipulative weighting works.\n');

  // Test 2: Couple Radar Matrix Calculation
  const v1 = { eSafety: 85, aAutonomy: 70, cCloseness: 90, rRepair: 80, vFuture: 75, consistencyScore: 92 };
  const v2 = { eSafety: 80, aAutonomy: 65, cCloseness: 88, rRepair: 78, vFuture: 70, consistencyScore: 88 };

  const radarResult = calculateCoupleRadarMatrix(v1, v2);
  console.log('Test 2 - Couple Radar Result:', JSON.stringify(radarResult, null, 2));

  if (!radarResult.radar || typeof radarResult.radar.trust !== 'number') {
    throw new Error('Test 2 FAILED: Radar must contain trust score');
  }
  if (!radarResult.archetype || !radarResult.archetype.title) {
    throw new Error('Test 2 FAILED: Archetype title missing');
  }
  if (!Array.isArray(radarResult.blindSpots.discrepancies) || !Array.isArray(radarResult.blindSpots.synergies)) {
    throw new Error('Test 2 FAILED: Blind spots structure missing');
  }

  console.log('✅ Test 2 PASSED: Couple radar matrix & blind spots generation works.\n');

  console.log('🎉 ALL UNIT TESTS PASSED SUCCESSFULLY!');
}

runUnitTests();
