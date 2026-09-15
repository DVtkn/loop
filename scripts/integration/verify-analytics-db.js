import { config } from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

config(); // load .env

async function run() {
  console.log('====================================================');
  console.log('🔎 [Analytics & Psychometrics DB Verifier v2.2.0]');
  console.log('====================================================');

  const isPostgres = !!process.env.DATABASE_URL;
  let dataStore = {};

  if (isPostgres) {
    console.log('[INFO] Подключение к PostgreSQL...');
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    try {
      // Ensure migrations for columns if running script standalone
      await pool.query(`
        ALTER TABLE IF EXISTS test_answers ADD COLUMN IF NOT EXISTS reaction_time_ms integer;
        ALTER TABLE IF EXISTS test_answers ADD COLUMN IF NOT EXISTS toggle_count integer NOT NULL DEFAULT 0;
        ALTER TABLE IF EXISTS test_answers ADD COLUMN IF NOT EXISTS target_type varchar(24) NOT NULL DEFAULT 'self';
        ALTER TABLE IF EXISTS test_answers ADD COLUMN IF NOT EXISTS raw_payload jsonb;
        ALTER TABLE IF EXISTS user_psych_profiles ADD COLUMN IF NOT EXISTS consistency_score numeric(5, 2);
        ALTER TABLE IF EXISTS couple_reports ADD COLUMN IF NOT EXISTS radar_trust numeric(5, 2);
        ALTER TABLE IF EXISTS couple_reports ADD COLUMN IF NOT EXISTS radar_closeness numeric(5, 2);
        ALTER TABLE IF EXISTS couple_reports ADD COLUMN IF NOT EXISTS radar_communication numeric(5, 2);
        ALTER TABLE IF EXISTS couple_reports ADD COLUMN IF NOT EXISTS radar_intimacy numeric(5, 2);
        ALTER TABLE IF EXISTS couple_reports ADD COLUMN IF NOT EXISTS radar_values numeric(5, 2);
        ALTER TABLE IF EXISTS couple_reports ADD COLUMN IF NOT EXISTS archetype_title text;
        ALTER TABLE IF EXISTS couple_reports ADD COLUMN IF NOT EXISTS archetype_description text;
        ALTER TABLE IF EXISTS couple_reports ADD COLUMN IF NOT EXISTS lead_spheres jsonb;
        ALTER TABLE IF EXISTS couple_reports ADD COLUMN IF NOT EXISTS blind_spots jsonb;
        ALTER TABLE IF EXISTS couple_reports ADD COLUMN IF NOT EXISTS calculated_at timestamp with time zone DEFAULT now();
      `).catch(() => {});

      // 1. Check couple_data
      try {
        const res = await pool.query('SELECT * FROM couple_data ORDER BY last_updated_at DESC LIMIT 1');
        if (res.rows.length > 0) {
          dataStore = res.rows[0].data;
        }
      } catch (e) {
        console.warn('[INFO] couple_data query note:', e.message);
      }

      // 2. Check test_answers with latency & toggles
      try {
        const answersRes = await pool.query(`
          SELECT 
            user_id,
            question_id,
            selected_value,
            reaction_time_ms,
            toggle_count,
            target_type,
            created_at
          FROM test_answers
          ORDER BY created_at DESC
          LIMIT 20
        `);

        if (answersRes.rows.length > 0) {
          console.log('\n📊 [Сырые психометрические ответы (последние 20)]');
          console.table(answersRes.rows.map(r => ({
            Пользователь: r.user_id,
            Вопрос: r.question_id,
            Балл: r.selected_value,
            'Латентность (мс)': r.reaction_time_ms ?? 'N/A',
            'Смен ответа': r.toggle_count,
            Тип: r.target_type,
          })));
        } else {
          console.log('\n[INFO] Таблица test_answers пуста (ответы сохраняются при прохождении).');
        }
      } catch (e) {
        console.warn('[INFO] test_answers query note:', e.message);
      }

      // 3. Check user_psych_profiles
      try {
        const profilesRes = await pool.query(`
          SELECT 
            user_id,
            e_safety,
            a_autonomy,
            c_closeness,
            r_repair,
            v_future,
            consistency_score,
            updated_at
          FROM user_psych_profiles
          ORDER BY updated_at DESC
          LIMIT 10
        `);

        if (profilesRes.rows.length > 0) {
          console.log('\n🧠 [Психометрические векторы пользователей (Слой 2)]');
          console.table(profilesRes.rows.map(p => ({
            'User ID': p.user_id,
            'Безопасность (E)': p.e_safety,
            'Автономия (A)': p.a_autonomy,
            'Близость (C)': p.c_closeness,
            'Восстановление (R)': p.r_repair,
            'Будущее (V)': p.v_future,
            'Индекс честности': p.consistency_score ? `${p.consistency_score}%` : 'N/A',
          })));
        }
      } catch (e) {
        console.warn('[INFO] user_psych_profiles query note:', e.message);
      }

      // 4. Check couple_reports
      try {
        const reportsRes = await pool.query(`
          SELECT 
            couple_id,
            radar_trust,
            radar_closeness,
            radar_communication,
            radar_intimacy,
            radar_values,
            archetype_title,
            lead_spheres,
            calculated_at
          FROM couple_reports
          ORDER BY calculated_at DESC
          LIMIT 5
        `);

        if (reportsRes.rows.length > 0) {
          console.log('\n❤️ [Итоговые радары и архетипы пары (Вершина пирамиды)]');
          console.table(reportsRes.rows.map(r => ({
            'Пара': r.couple_id,
            'Доверие': r.radar_trust,
            'Близость': r.radar_closeness,
            'Общение': r.radar_communication,
            'Интимность': r.radar_intimacy,
            'Ценности': r.radar_values,
            'Архетип': r.archetype_title,
          })));
          console.log('\n[FSM СТАТУС]: ✅ COUPLE_HARMONY_READY (Оба партнёра заполнили данные, радар активен)');
        } else {
          console.log('\n[FSM СТАТУС]: ⏳ WAITING_FOR_PARTNER (Ожидание завершения тестов вторым партнёром)');
        }
      } catch (e) {
        console.warn('[INFO] couple_reports query note:', e.message);
      }
    } catch (e) {
      console.error('[ERROR] Ошибка подключения к БД:', e);
    } finally {
      await pool.end();
    }
  } else {
    console.log('[INFO] Использование локального fallback-файла /data/db_store.json...');
    const dbPath = path.resolve(process.cwd(), 'data/db_store.json');
    if (fs.existsSync(dbPath)) {
      const dbContent = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      const couples = dbContent.coupleData || {};
      const keys = Object.keys(couples);
      if (keys.length > 0) {
        dataStore = couples[keys[keys.length - 1]];
      }
    }
  }

  if (dataStore && dataStore.tests) {
    const tests = dataStore.tests;
    let p1Completed = 0;
    let p2Completed = 0;
    const spheres = [];

    for (const t of tests) {
      if (t.partner1Done) p1Completed++;
      if (t.partner2Done) p2Completed++;

      spheres.push({
        Сфера: t.title,
        'Пользователь 1': t.partner1Done ? 'Завершено ✓' : '—',
        'Пользователь 2': t.partner2Done ? 'Завершено ✓' : '—',
      });
    }

    console.log(`\n[STAT] Пользователь 1 завершил тестов: ${p1Completed} из ${tests.length}`);
    console.log(`[STAT] Пользователь 2 завершил тестов: ${p2Completed} из ${tests.length}`);
    console.log('');
    console.table(spheres);
  }

  console.log('\n====================================================');
  console.log('✅ [Analytics DB Verifier] Проверка завершена.');
  console.log('====================================================');
}

run();
