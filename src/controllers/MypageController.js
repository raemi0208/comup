/**
 * @file mypageController.js
 * @description 사용자의 마이페이지 조회, 프로필 정보 및 아바타 URL 수정을 처리하는 컨트롤러입니다.
 * 사용자 기본 정보(User), 확장 프로필/통계(UserStats), 뱃지 정의(BadgeDef) 테이블을 연동하여 처리합니다.
 */

const { User, UserStats, BadgeDef } = require('../models');

/**
 * 사용자 통계(UserStats) 레코드의 존재를 보장하는 헬퍼 함수
 * 테이블 생성 전에 가입한 유저 등을 위해, 데이터가 없을 경우 기본값으로 자동 생성합니다.
 * @param {number} userId - 사용자 고유 ID
 * @returns {Promise<Object>} UserStats 인스턴스
 */
const ensureUserStats = async (userId) => {
    let stats = await UserStats.findOne({ where: { user_id: userId } });
    if (!stats) {
        stats = await UserStats.create({ user_id: userId });
    }
    return stats;
};

/**
 * 마이페이지 정보 조회
 * 유저 기본 정보, 활동 통계 카운트, 전체 뱃지 목록을 취합하여 반환합니다.
 * @route GET /api/mypage
 */
exports.getMyPage = async (req, res) => {
    try {
        const userId = req.userId;

        // 1. 유저 기본 정보 조회
        const user = await User.findByPk(userId, {
            attributes: ['id', 'email', 'nickname']
        });
        if (!user) {
            return res.status(404).json({ success: false, message: "존재하지 않는 사용자입니다." });
        }

        // 2. 확장 프로필/통계 및 전체 뱃지 목록 조회
        const stats = await ensureUserStats(userId);
        const badges = await BadgeDef.findAll({ order: [['category', 'ASC'], ['threshold', 'ASC']] });

        // 3. 결합된 프로필 데이터 반환
        res.status(200).json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                nickname: user.nickname,
                bio: stats.bio || "",
                avatar_url: stats.avatar_url || null,
                counts: {
                    attendance_count: stats.attendance_count,
                    post_count: stats.post_count,
                    landmark_count: stats.landmark_count,
                    friend_count: stats.friend_count
                },
                badges // [{ id, name, category, threshold }, ...]
            }
        });
    } catch (error) {
        console.error("❌ getMyPage 에러 발생:", error);
        res.status(500).json({ success: false, message: "서버 오류" });
    }
};

/**
 * 프로필 정보(닉네임 및 자기소개) 수정
 * @route PUT /api/mypage
 */
exports.updateMyPage = async (req, res) => {
    try {
        const userId = req.userId;
        const { nickname, bio } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "존재하지 않는 사용자입니다." });
        }

        // 유효한 값인 경우 User 테이블의 닉네임 변경 및 저장
        if (typeof nickname === "string" && nickname.trim()) {
            user.nickname = nickname.trim();
            await user.save();
        }

        // 유효한 값인 경우 UserStats 테이블의 자기소개 변경 및 저장
        const stats = await ensureUserStats(userId);
        if (typeof bio === "string") {
            stats.bio = bio;
            await stats.save();
        }

        res.status(200).json({
            success: true,
            message: "프로필이 수정되었습니다.",
            data: { nickname: user.nickname, bio: stats.bio }
        });
    } catch (error) {
        console.error("❌ updateMyPage 에러 발생:", error);
        res.status(500).json({ success: false, message: "서버 오류" });
    }
};

/**
 * 프로필 아바타 이미지 URL 갱신
 * 스토리지 업로드는 프론트엔드에서 직행하며, 백엔드는 발급된 public URL만 받아 DB에 반영합니다.
 * @route PUT /api/mypage/avatar
 */
exports.updateAvatar = async (req, res) => {
    try {
        const userId = req.userId;
        const { avatarUrl } = req.body;

        if (!avatarUrl) {
            return res.status(400).json({ success: false, message: "avatarUrl이 필요합니다." });
        }

        // UserStats 테이블의 avatar_url 필드 갱신
        const stats = await ensureUserStats(userId);
        stats.avatar_url = avatarUrl;
        await stats.save();

        res.status(200).json({ success: true, data: { avatar_url: stats.avatar_url } });
    } catch (error) {
        console.error("❌ updateAvatar 에러 발생:", error);
        res.status(500).json({ success: false, message: "서버 오류" });
    }
};