/**
 * @file authRoutes.js
 * @description 사용자 인증(Authentication) 및 계정 관리를 위한 API 엔드포인트 라우팅 레이어입니다.
 * 회원가입(Register)을 통한 사용자 리소스 생성 및 로그인(Login)을 통한 인증 토큰 발급 프로세스를 라우팅합니다.
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * @swagger
 * /api/auth/register:
 * post:
 * summary: 신규 회원가입 수락
 * description: 사용자 정보(이메일, 비밀번호, 활동 닉네임)를 전달받아 신규 사용자로 시스템에 등록합니다.
 * tags:
 * - Authentication
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - password
 * - nickname
 * properties:
 * email:
 * type: string
 * format: email
 * description: 고유 인증 수단으로 활용될 이메일 주소
 * example: "traveler@example.com"
 * password:
 * type: string
 * format: password
 * description: 단방향 암호화 처리 후 적재될 원본 패스워드 문자열
 * example: "SecurePass123!"
 * nickname:
 * type: string
 * description: 애플리케이션 내에서 식별자로 활용될 고유 활동 활동 닉네임
 * example: "글로벌방랑자"
 * responses:
 * 201:
 * description: 사용자 리소스 생성 완료 (회원가입 성공)
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success:
 * type: boolean
 * example: true
 * message:
 * type: string
 * example: "회원가입이 정상적으로 완료되었습니다."
 * userId:
 * type: integer
 * example: 7
 * 400:
 * description: 데이터 유효성 검증 실패 또는 이미 가입된 이메일 주소 중복 발생
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success:
 * type: boolean
 * example: false
 * message:
 * type: string
 * example: "이미 사용 중인 이메일 주소입니다."
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 * post:
 * summary: 사용자 인증 및 액세스 토큰 발급
 * description: 자격 증명(이메일, 패스워드) 정보를 검증하여 세션 접근 권한을 허가하고 인증 수단(예: JWT 토큰)을 반환합니다.
 * tags:
 * - Authentication
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - password
 * properties:
 * email:
 * type: string
 * format: email
 * description: 인증 대상 사용자 이메일 계정
 * example: "traveler@example.com"
 * password:
 * type: string
 * format: password
 * description: 해당 이메일 계정의 패스워드
 * example: "SecurePass123!"
 * responses:
 * 200:
 * description: 사용자 자격 증명 성공 (인증 토큰 발급 완료)
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success:
 * type: boolean
 * example: true
 * message:
 * type: string
 * example: "로그인에 성공했습니다."
 * token:
 * type: string
 * description: API 보호 라우트 접근을 위한 인증용 Bearer 토큰 문자열
 * example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * 401:
 * description: 자격 증명 실패 (비밀번호 불일치 또는 미등록 회원 계정 조회)
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success:
 * type: boolean
 * example: false
 * message:
 * type: string
 * example: "이메일 또는 비밀번호가 올바르지 않습니다."
 */
router.post('/login', authController.login);

module.exports = router;