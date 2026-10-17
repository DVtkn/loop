import { describe, it, expect } from 'vitest';
import { initialCoupleProfile, initialTests } from '../../src/data/questionBank.ts';
import { calculateCoupleAnalysis } from '../../src/utils/psychologyEngine.ts';
import { CoupleProfile, TestCategory } from '../../src/types.ts';

describe('Real Couple Experience Simulation: Maxim & Anna', () => {
  it('simulates full psychological tests, Gottman radar, and action plan', () => {
    const couple: CoupleProfile = {
      ...initialCoupleProfile,
      partner1: {
        ...initialCoupleProfile.partner1,
        id: "partner1",
        name: "Максим",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        gender: "male",
        login: "max_analyst",
      },
      partner2: {
        ...initialCoupleProfile.partner2,
        id: "partner2",
        name: "Анна",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
        gender: "female",
        login: "anna_designer",
      },
      startDate: "2024-05-15",
      status: "ACTIVE",
    };

    const testsWithAnswers: TestCategory[] = initialTests.map((test) => {
      const p1Answers: Record<string, any> = {};
      const p2Answers: Record<string, any> = {};

      test.questions.forEach((q, idx) => {
        if (q.options && q.options.length > 0) {
          const mOption = q.options[idx % q.options.length];
          p1Answers[q.id] = mOption?.value ?? "default";
          const aOption = q.options[(idx + 1) % q.options.length];
          p2Answers[q.id] = aOption?.value ?? "default";
        } else if ((q as any).items && (q as any).items.length > 0) {
          const items = (q as any).items;
          p1Answers[q.id] = JSON.stringify({ [items[0].id]: 60, [items[1].id]: 40 });
          p2Answers[q.id] = JSON.stringify({ [items[0].id]: 30, [items[1].id]: 70 });
        } else {
          p1Answers[q.id] = "4";
          p2Answers[q.id] = "5";
        }
      });

      return {
        ...test,
        partner1Done: true,
        partner2Done: true,
        partner1Answers: p1Answers,
        partner2Answers: p2Answers,
      };
    });

    const analysis = calculateCoupleAnalysis(couple, [], testsWithAnswers);

    console.log("\n==================================================");
    console.log("   MAXIM & ANNA COUPLE PSYCHOLOGY AUDIT");
    console.log("==================================================");
    console.log(`• Compatibility Score: ${analysis.compatibilityScore}%`);
    console.log(`• Couple Archetype: ${analysis.archetypeTitle} — «${analysis.archetypeSubtitle}»`);
    console.log(`• Summary: ${analysis.summary}`);
    console.log("\n• Dimensions:");
    analysis.dimensions.forEach((d) => {
      console.log(`  - [${d.label}]: P1=${d.p1Score}%, P2=${d.p2Score}%, Avg=${d.averageScore}% (${d.status})`);
      console.log(`    Note: ${d.description}`);
    });
    console.log("\n• Strengths:");
    analysis.strengths.forEach((s) => console.log(`  + ${s.title}: ${s.description}`));
    console.log("\n• Growth Zones (Gottman):");
    analysis.growthZones.forEach((gz) => {
      console.log(`  ! ${gz.title} -> Antidote: ${gz.antidote}`);
    });
    console.log("\n• Weekly Action Plan:");
    analysis.weeklyActionPlan.forEach((wp) => {
      console.log(`  * ${wp.day}: ${wp.title} (${wp.duration}) - ${wp.instruction}`);
    });

    expect(analysis.hasData).toBe(true);
    expect(analysis.isCoupleReportReady).toBe(true);
    expect(analysis.compatibilityScore).toBeGreaterThan(0);
    expect(analysis.dimensions.length).toBeGreaterThan(0);
    expect(analysis.strengths.length).toBeGreaterThan(0);
    expect(analysis.growthZones.length).toBeGreaterThan(0);
    expect(analysis.weeklyActionPlan.length).toBeGreaterThan(0);
  });
});
