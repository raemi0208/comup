const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 5000; // <-- 아까 에러 났던 범인! 여기 꼭 있어야 해요.

app.use(cors());
app.use(express.json());

// 1. DB 연결 설정
const db = mysql.createConnection({
  host: 'localhost',
  port: 3307,
  user: 'travel_admin',
  password: '1234', 
  database: 'travel_office'
});

db.connect((err) => {
  if (err) {
    console.error('DB 연결 실패:', err.message);
    return;
  }
  console.log('MySQL DB 연결 성공! 🚀');
});

// 2. 서버 접속 테스트용
app.get('/', (req, res) => {
  res.send('여행사무소 백엔드 서버가 작동 중입니다!');
});

// 3. 국가 정보 가져오기 API
app.get('/countries', (req, res) => {
  db.query('SELECT * FROM countries', (err, results) => {
    if (err) return res.status(500).send(err.message);
    res.json(results);
  });
});

// 서버 api 수집 기능 
const axios = require('axios');
app.get('/api/update-safety', async (req, res) => {
  try {
    const SERVICE_KEY = 'YOUR_SERVICE_KEY'; // 공공데이터 포털에서 받은 서비스키
    const url = `http://apis.data.go.kr/1262000/CountrySafetyService2/getCountrySafetyList2?serviceKey=${SERVICE_KEY}&numOfRows=10&pageNo=1`;

    const response = await axios.get(url);
    const safetyData = response.data.data; // 실제 데이터 위치는 API 응답 구조에 따라 다를 수 있음

    // 가져온 데이터 db에 넣기
    items.forEach(item => {
      const sql = "INSERT INTO countries (country_name, title, content) VALUES (?, ?, ?)";
      db.query(sql, [item.country_name, item.title, item.content], (err) => {
        if (err) console.error('DB 삽입 실패:', err.message);
      });
    });

    res.send('안전 정보 업데이트 완료!');
  } catch (error) {
    console.error('API 호출 실패:', error.message);
    res.status(500).send('API 호출 실패');
  }
}); 

// 콘솔 로그
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});