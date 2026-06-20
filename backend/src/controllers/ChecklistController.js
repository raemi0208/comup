/**
 * @file checklistController.js
 * @description 여행 준비물 체크리스트의 조회, 추가, 수정(토글), 삭제(CRUD)를 처리하는 컨트롤러입니다.
 * 모든 비즈니스 로직은 인가된 사용자(req.userId) 본인의 데이터에만 접근할 수 있도록 제한됩니다.
 */

const { Checklist } = require('../models');

/**
 * 로그인한 사용자의 체크리스트 전체 목록 조회
 * @route GET /api/checklist
 */
const getChecklist = async (req, res) => {
  try {
    // 현재 요청을 보낸 유저 ID와 일치하는 항목만 생성일 오름차순으로 조회
    const items = await Checklist.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'ASC']]
    });
    res.json(items);
  } catch (error) {
    console.error('getChecklist 오류:', error);
    res.status(500).json({ error: '체크리스트를 불러오지 못했습니다.' });
  }
};

/**
 * 새로운 체크리스트 항목 추가
 * @route POST /api/checklist
 */
const addItem = async (req, res) => {
  try {
    const { category, name, desc, isCustom } = req.body;
    
    // 유효성 검사: 이름이 비어있거나 공백만 있는 경우 예외 처리
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '준비물 이름을 입력해 주세요.' });
    }

    // 기본값을 고려하여 사용자 데이터 생성
    const newItem = await Checklist.create({
      userId: req.userId,
      category: category || '기타',
      name: name.trim(),
      desc: desc ?? '내가 직접 추가한 항목',
      checked: false,
      isCustom: isCustom ?? true
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('addItem 오류:', error);
    res.status(500).json({ error: '항목 추가에 실패했습니다.' });
  }
};

/**
 * 체크리스트 항목의 완료 여부 상태 토글 (true/false 반전)
 * @route PATCH /api/checklist/:itemId/toggle
 */
const toggleItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    // 해당 항목 존재 여부 확인
    const item = await Checklist.findByPk(itemId);
    if (!item) return res.status(404).json({ error: '항목을 찾을 수 없습니다.' });
    
    // 소유권 확인: 요청한 유저가 해당 항목의 주인이 아닌 경우 차단
    if (item.userId !== req.userId) return res.status(403).json({ error: '권한이 없습니다.' });

    // checked 상태를 현재의 반대값으로 업데이트
    await item.update({ checked: !item.checked });
    res.json(item);
  } catch (error) {
    console.error('toggleItem 오류:', error);
    res.status(500).json({ error: '체크 상태 변경에 실패했습니다.' });
  }
};

/**
 * 특정 체크리스트 항목 삭제
 * @route DELETE /api/checklist/:itemId
 */
const deleteItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    // 해당 항목 존재 여부 확인
    const item = await Checklist.findByPk(itemId);
    if (!item) return res.status(404).json({ error: '항목을 찾을 수 없습니다.' });
    
    // 소유권 확인: 요청한 유저가 해당 항목의 주인이 아닌 경우 차단
    if (item.userId !== req.userId) return res.status(403).json({ error: '권한이 없습니다.' });

    // 레코드 삭제 수행
    await item.destroy();
    res.status(200).json({ message: '삭제 완료' });
  } catch (error) {
    console.error('deleteItem 오류:', error);
    res.status(500).json({ error: '항목 삭제에 실패했습니다.' });
  }
};

module.exports = { getChecklist, addItem, toggleItem, deleteItem };