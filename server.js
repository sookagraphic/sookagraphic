// server.js
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 설정 (모든 도메인에서 접근 가능하도록)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공 (HTML, CSS, JS 등)
app.use(express.static('.'));

// SMTP 설정
const transporter = nodemailer.createTransport({
  host: 'smtp.naver.com',
  port: 465,
  secure: true, // 465 포트는 true, 다른 포트는 false
  auth: {
    user: process.env.EMAIL_USER || 'sookamail@naver.com',
    pass: process.env.EMAIL_PASSWORD || ''
  }
});

// 이메일 전송 API
app.post('/api/send-email', async (req, res) => {
  try {
    const {
      company,
      name,
      email,
      project,
      content,
      output,
      period,
      schedule,
      budget,
      fileName
    } = req.body;

    // 이메일 본문 생성
    const emailBody = `
작업 의뢰서

소속/업체명: ${company || ''}
담당자님 성함: ${name || ''}
이메일 주소: ${email || ''}
프로젝트명: ${project || ''}

의뢰 내용:
${content || ''}

결과물의 형태:
${output || ''}

사용 기간:
${period || ''}

일정:
${schedule || ''}

견적:
${budget || ''}

첨부 파일: ${fileName || '없음'}
    `.trim();

    // 이메일 전송
    const mailOptions = {
      from: process.env.EMAIL_USER || 'sookamail@naver.com',
      to: 'sookamail@naver.com',
      subject: '작업 의뢰서',
      text: emailBody,
      replyTo: email || undefined
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: '이메일이 성공적으로 전송되었습니다.' });
  } catch (error) {
    console.error('이메일 전송 실패:', error);
    res.status(500).json({ 
      success: false, 
      message: '이메일 전송에 실패했습니다.', 
      error: error.message 
    });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

