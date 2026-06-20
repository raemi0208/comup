/**
 * @file supabaseClient.js
 * @description Supabase 클라이언트 인스턴스를 생성하고 내보내는 설정 파일입니다.
 * 주요 기능: 환경 변수를 기반으로 Supabase API와 통신하기 위한 클라이언트 초기화.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);