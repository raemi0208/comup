/**
 * @file Checklist.js
 * @description 사용자의 여행 준비물 체크리스트 항목을 관리하는 Sequelize 모델입니다.
 * 개별 유저(userId) 단위의 데이터 영속성을 보장하며, 카테고리별 분류 및 커스텀 추가 여부를 지원합니다.
 */

const { DataTypes } = require('sequelize');

/**
 * @swagger
 * components:
 * schemas:
 * Checklist:
 * type: object
 * required:
 * - userId
 * - name
 * properties:
 * id:
 * type: integer
 * description: 체크리스트 항목 고유 식별자 (자동 증가)
 * example: 1
 * userId:
 * type: integer
 * description: 해당 항목을 소유한 유저의 고유 식별 ID
 * example: 42
 * category:
 * type: string
 * description: 준비물 분류 카테고리
 * default: "기타"
 * example: "필수품"
 * name:
 * type: string
 * description: 준비물 항목 명칭
 * example: "여권 챙기기"
 * desc:
 * type: string
 * description: 준비물 관련 추가 메모 또는 상세 설명
 * nullable: true
 * example: "만료일이 6개월 이상 남았는지 확인"
 * checked:
 * type: boolean
 * description: 준비물 준비 완료(체크) 여부
 * default: false
 * example: false
 * isCustom:
 * type: boolean
 * description: 사용자가 직접 생성한 개인 항목인지 여부 (기본 제공 항목인 경우 false)
 * default: true
 * example: true
 * createdAt:
 * type: string
 * format: date-time
 * description: 레코드 생성 일시
 * updatedAt:
 * type: string
 * format: date-time
 * description: 레코드 최종 수정 일시
 */
module.exports = (sequelize) => {
  return sequelize.define('Checklist', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '기타'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    desc: {
      type: DataTypes.STRING,
      allowNull: true
    },
    checked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    isCustom: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    timestamps: true
  });
};