// script.js

// 갤러리 이미지 로딩 함수
async function loadGalleryImages() {
  try {
    // 설정 파일 로드
    const response = await fetch('gallery-config.json');
    const config = await response.json();
    
    // 각 이미지 요소에 대해 설정 적용
    config.images.forEach(imageConfig => {
      const imageElement = document.querySelector(`[data-image-id="${imageConfig.id}"] img`);
      if (!imageElement) return;
      
      // 소스 타입에 따라 이미지 URL 결정
      if (imageConfig.source === 'instagram' && imageConfig.instagramUrl) {
        // 인스타그램 이미지 사용
        imageElement.src = imageConfig.instagramUrl;
        imageElement.onerror = function() {
          // 인스타그램 이미지 로드 실패 시 로컬 이미지로 fallback
          if (imageConfig.localPath) {
            this.src = imageConfig.localPath;
          }
        };
      } else if (imageConfig.source === 'local' && imageConfig.localPath) {
        // 로컬 이미지 사용
        imageElement.src = imageConfig.localPath;
      }
    });
    
    // 인스타그램 자동 동기화가 활성화된 경우
    if (config.instagram.autoSync && config.instagram.accessToken) {
      await syncInstagramImages(config);
    }
  } catch (error) {
    console.error('갤러리 설정 파일을 로드할 수 없습니다:', error);
    // 설정 파일 로드 실패 시 기본 이미지 유지
  }
}

// 인스타그램 이미지 동기화 함수
async function syncInstagramImages(config) {
  try {
    // Instagram Basic Display API를 사용하여 최신 이미지 가져오기
    const username = config.instagram.username;
    const accessToken = config.instagram.accessToken;
    
    // Instagram Graph API 엔드포인트
    const apiUrl = `https://graph.instagram.com/me/media?fields=id,media_type,media_url,permalink&access_token=${accessToken}&limit=16`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      // 이미지 타입만 필터링
      const imagePosts = data.data.filter(post => post.media_type === 'IMAGE');
      
      // 각 갤러리 아이템에 인스타그램 이미지 할당
      const galleryItems = document.querySelectorAll('[data-image-id]');
      galleryItems.forEach((item, index) => {
        if (index < imagePosts.length) {
          const imageElement = item.querySelector('img');
          if (imageElement) {
            // 인스타그램 이미지 URL 사용
            imageElement.src = imagePosts[index].media_url;
            imageElement.onerror = function() {
              // 로드 실패 시 설정 파일의 로컬 이미지로 fallback
              const imageId = item.getAttribute('data-image-id');
              const imageConfig = config.images.find(img => img.id === imageId);
              if (imageConfig && imageConfig.localPath) {
                this.src = imageConfig.localPath;
              }
            };
          }
        }
      });
    }
  } catch (error) {
    console.error('인스타그램 이미지 동기화 실패:', error);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // 갤러리 이미지 로드
  loadGalleryImages();
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  const header = document.querySelector(".site-header");

  if (toggle && nav) {
    // Dim 배경 요소 생성
    const dimOverlay = document.createElement("div");
    dimOverlay.className = "nav-dim-overlay";
    document.body.appendChild(dimOverlay);

    toggle.addEventListener("click", () => {
      const isOpening = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open");
      
      if (isOpening) {
        // 메뉴 열기
        dimOverlay.classList.add("is-visible");
        document.body.style.overflow = "hidden"; // 스크롤 방지
      } else {
        // 메뉴 닫기
        dimOverlay.classList.remove("is-visible");
        document.body.style.overflow = ""; // 스크롤 복원
      }
      // 햄버거 아이콘 애니메이션 (선택사항)
      toggle.classList.toggle("is-active");
    });

    // Dim 클릭 시 메뉴 닫기
    dimOverlay.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.classList.remove("is-active");
      dimOverlay.classList.remove("is-visible");
      document.body.style.overflow = ""; // 스크롤 복원
    });

    // 메뉴 링크 클릭 시 메뉴 닫기
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.classList.remove("is-active");
        dimOverlay.classList.remove("is-visible");
        document.body.style.overflow = ""; // 스크롤 복원
      });
    });
  }

  // 스크롤 시 헤더 배경 제거
  if (header) {
    let lastScrollTop = 0;
    
    window.addEventListener("scroll", () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop > 0) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
      
      lastScrollTop = scrollTop;
    });
  }

  // 스크롤 다운/업 시 work-01~work-16 이미지 scale 조정 (연속 스크롤: 0.9, 짧은 스크롤: 0.94)
  let lastScrollY = 0;
  let scrollTimeout = null;
  let scrollEventCount = 0;
  let lastScrollTime = 0;
  let continuousScrollTimer = null;
  let restoreTimer = null; // 복원 타이머 (리셋하지 않음)
  
  const galleryItems = document.querySelectorAll('.gallery-item');
  
  const restoreToOriginal = () => {
    galleryItems.forEach((item, index) => {
      if (index < 16) {
        item.classList.remove("is-scrolled-continuous", "is-scrolled-short");
      }
    });
    restoreTimer = null;
  };
  
  window.addEventListener("scroll", () => {
    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
    const isScrolling = currentScrollY !== lastScrollY && currentScrollY > 0;
    const now = Date.now();
    
    if (isScrolling) {
      // 스크롤 이벤트 카운트 증가
      scrollEventCount++;
      
      // 연속 스크롤 감지: 150ms 내에 스크롤 이벤트가 계속 발생하면 연속 스크롤
      if (now - lastScrollTime < 150) {
        // 연속 스크롤로 판단
        galleryItems.forEach((item, index) => {
          if (index < 16) {
            item.classList.remove("is-scrolled-short");
            item.classList.add("is-scrolled-continuous");
          }
        });
      } else {
        // 짧은 스크롤로 판단
        galleryItems.forEach((item, index) => {
          if (index < 16) {
            item.classList.remove("is-scrolled-continuous");
            item.classList.add("is-scrolled-short");
          }
        });
      }
      
      lastScrollTime = now;
      
      // 연속 스크롤 타이머 리셋
      if (continuousScrollTimer) {
        clearTimeout(continuousScrollTimer);
      }
      
      // 150ms 동안 스크롤 이벤트가 없으면 연속 스크롤 종료로 판단
      continuousScrollTimer = setTimeout(() => {
        scrollEventCount = 0;
      }, 150);
      
      // 복원 타이머가 없을 때만 새로 설정 (스크롤 지속 여부와 관계없이 100ms 후 복원)
      if (!restoreTimer) {
        restoreTimer = setTimeout(() => {
          restoreToOriginal();
        }, 100);
      }
    }
    
    lastScrollY = currentScrollY;
  }, { passive: true });

  // Store 링크 클릭 시 PC/모바일 감지하여 적절한 URL로 이동
  const storeLinks = document.querySelectorAll('a[data-store-link]');
  storeLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      // 모바일 감지
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                       (window.innerWidth <= 768);
      
      // HTML의 data 속성에서 URL 가져오기
      const storeUrl = isMobile 
        ? link.getAttribute('data-store-mobile') 
        : link.getAttribute('data-store-pc');
      
      if (storeUrl) {
        e.preventDefault();
        e.stopPropagation(); // 이벤트 전파 방지로 메뉴가 닫히지 않도록
        window.open(storeUrl, "_blank", "noopener,noreferrer");
        // 현재 페이지는 유지 (기본 동작)
      }
    }, true); // capture phase에서 먼저 처리
  });

  // Proposal 폼: 엔터 키로 인한 폼 제출 방지
  const proposalForm = document.querySelector('.proposal-form');
  if (proposalForm) {
    // form 제출을 기본적으로 막음 (HTML의 onsubmit="return false;"와 함께)
    proposalForm.addEventListener("submit", (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, true); // capture phase에서 먼저 처리

    // 모든 input과 textarea에서 엔터 키로 인한 form 제출 방지
    const formInputs = proposalForm.querySelectorAll('input, textarea');
    formInputs.forEach(input => {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          // textarea에서는 줄바꿈 허용 (기본 동작 유지, form 제출만 방지)
          if (input.tagName === "TEXTAREA") {
            // 줄바꿈은 기본 동작으로 유지 (preventDefault 하지 않음)
            // form 제출만 방지하기 위해 이벤트 전파를 막지 않음
            // 대신 form의 submit 이벤트에서 처리
            return true; // 기본 동작(줄바꿈) 허용
          } else {
            // input 필드에서는 엔터 키 동작 자체를 막음
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
          }
        }
      });
    });

    // "보내기" 버튼 클릭 시에만 실제 제출 로직 실행
    const submitButton = proposalForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 필수 필드 검증
        const company = proposalForm.querySelector('#company');
        const name = proposalForm.querySelector('#name');
        const email = proposalForm.querySelector('#email');
        
        let isValid = true;
        
        // 소속/업체명 검증
        if (!company.value || company.value.trim() === "") {
          company.focus();
          alert("소속/업체명을 입력해주세요.");
          isValid = false;
          return false;
        }
        
        // 담당자님 성함 검증
        if (!name.value || name.value.trim() === "") {
          name.focus();
          alert("담당자님 성함을 입력해주세요.");
          isValid = false;
          return false;
        }
        
        // 이메일 주소 검증
        if (!email.value || email.value.trim() === "") {
          email.focus();
          alert("이메일 주소를 입력해주세요.");
          isValid = false;
          return false;
        }
        
        // 이메일 형식 검증
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email.value.trim())) {
          email.focus();
          alert("올바른 이메일 주소를 입력해주세요.");
          isValid = false;
          return false;
        }
        
        if (!isValid) {
          return false;
        }
        
        // 폼 데이터 수집
        const formData = new FormData(proposalForm);
        const formValues = {};
        
        // 모든 입력 필드 값 수집
        formData.forEach((value, key) => {
          formValues[key] = value;
        });
        
        // 파일 정보 수집
        const fileInput = proposalForm.querySelector('#file');
        const fileName = fileInput && fileInput.files.length > 0 ? fileInput.files[0].name : "첨부 파일 없음";
        
        // 이메일 본문 생성 (HTML 형식)
        let emailBody = "<h2>작업 의뢰서</h2><br>";
        emailBody += "<p><strong>소속/업체명:</strong> " + (formValues.company || "") + "</p>";
        emailBody += "<p><strong>담당자님 성함:</strong> " + (formValues.name || "") + "</p>";
        emailBody += "<p><strong>이메일 주소:</strong> " + (formValues.email || "") + "</p>";
        emailBody += "<p><strong>프로젝트명:</strong> " + (formValues.project || "") + "</p>";
        emailBody += "<p><strong>의뢰 내용:</strong><br>" + (formValues.content || "").replace(/\n/g, "<br>") + "</p>";
        emailBody += "<p><strong>결과물의 형태:</strong><br>" + (formValues.output || "").replace(/\n/g, "<br>") + "</p>";
        emailBody += "<p><strong>사용 기간:</strong><br>" + (formValues.period || "").replace(/\n/g, "<br>") + "</p>";
        emailBody += "<p><strong>일정:</strong> " + (formValues.schedule || "") + "</p>";
        emailBody += "<p><strong>견적:</strong> " + (formValues.budget || "") + "</p>";
        emailBody += "<p><strong>첨부 파일:</strong> " + fileName + "</p>";
        
        // 텍스트 형식 본문도 생성 (fallback용)
        let emailBodyText = "작업 의뢰서\n\n";
        emailBodyText += "소속/업체명: " + (formValues.company || "") + "\n";
        emailBodyText += "담당자님 성함: " + (formValues.name || "") + "\n";
        emailBodyText += "이메일 주소: " + (formValues.email || "") + "\n";
        emailBodyText += "프로젝트명: " + (formValues.project || "") + "\n";
        emailBodyText += "의뢰 내용: " + (formValues.content || "") + "\n";
        emailBodyText += "결과물의 형태: " + (formValues.output || "") + "\n";
        emailBodyText += "사용 기간: " + (formValues.period || "") + "\n";
        emailBodyText += "일정: " + (formValues.schedule || "") + "\n";
        emailBodyText += "견적: " + (formValues.budget || "") + "\n";
        emailBodyText += "첨부 파일: " + fileName + "\n";
        
        // EmailJS 초기화 및 전송
        // EmailJS가 로드되었는지 확인
        if (typeof emailjs === 'undefined') {
          console.error('EmailJS가 로드되지 않았습니다.');
          alert('이메일 서비스가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
          return false;
        }
        
        try {
          // EmailJS 설정
          const EMAILJS_SERVICE_ID = 'service_gq19cdq';
          const EMAILJS_TEMPLATE_ID = 'template_lq1c94b';
          const EMAILJS_PUBLIC_KEY = 'kdoPofGSuVWRXXwMK';
          
          // EmailJS 초기화
          emailjs.init(EMAILJS_PUBLIC_KEY);
          
          // 전송 버튼 비활성화 및 로딩 표시
          submitButton.disabled = true;
          const originalButtonText = submitButton.textContent;
          submitButton.textContent = "전송 중...";
          
          // EmailJS를 통한 이메일 전송
          emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: 'sookamail@naver.com',
            from_name: formValues.name || '',
            from_email: formValues.email || '',
            subject: '작업 의뢰서',
            message_html: emailBody,
            message_text: emailBodyText,
            company: formValues.company || '',
            name: formValues.name || '',
            email: formValues.email || '',
            project: formValues.project || '',
            content: formValues.content || '',
            output: formValues.output || '',
            period: formValues.period || '',
            schedule: formValues.schedule || '',
            budget: formValues.budget || '',
            file_name: fileName
          })
          .then(() => {
            alert('작업 의뢰서가 성공적으로 전송되었습니다.');
            proposalForm.reset();
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
          })
          .catch((error) => {
            console.error('EmailJS 전송 실패:', error);
            alert('이메일 전송에 실패했습니다. 다시 시도해주세요.');
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
          });
        } catch (error) {
          // EmailJS가 로드되지 않은 경우 fallback으로 mailto 사용
          console.warn('EmailJS가 로드되지 않았습니다. mailto 링크를 사용합니다.', error);
          const subject = encodeURIComponent("작업 의뢰서");
          const body = encodeURIComponent(emailBodyText);
          const mailtoLink = `mailto:sookamail@naver.com?subject=${subject}&body=${body}`;
          window.location.href = mailtoLink;
        }
        
        console.log("Form submitted via button");
      });
    }
  }

  // Works 페이지 초기화
  if (document.body.classList.contains('works-page')) {
    initWorksPage();
    
    // 우클릭 방지
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });
    
    // 이미지 드래그 방지
    document.addEventListener('dragstart', (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    });
    
    // 키보드 단축키 방지 (F12, Ctrl+S, Ctrl+Shift+I 등)
    document.addEventListener('keydown', (e) => {
      // F12 (개발자 도구)
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I (개발자 도구)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+J (콘솔)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }
      // Ctrl+U (소스 보기)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }
      // Ctrl+S (저장)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        return false;
      }
      // Ctrl+P (인쇄)
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        return false;
      }
    });
    
    // 빈 공간 클릭 시 닫기
    const worksMain = document.querySelector('.works-main');
    const worksContainer = document.querySelector('.works-container');
    
    // 페이지 닫기 함수 (부드러운 애니메이션)
    function closeWorksPage() {
      // 썸네일 스크롤 애니메이션 중지
      if (window.worksThumbnailScroll) {
        window.worksThumbnailScroll.stop();
      }
      
      const body = document.body;
      body.classList.add('closing');
      
      // 애니메이션 완료 후 페이지 이동
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 400); // fadeOut 애니메이션 시간과 동일
    }
    
    function handleEmptySpaceClick(e) {
      const clickedElement = e.target;
      
      // 콘텐츠 요소인지 확인
      const isContentElement = clickedElement.closest('.works-image-main') ||
                               clickedElement.closest('.works-info') ||
                               clickedElement.closest('.works-thumbnails') ||
                               clickedElement.closest('.works-close-btn');
      
      // 빈 공간을 클릭한 경우에만 닫기
      if (!isContentElement) {
        e.preventDefault();
        e.stopPropagation();
        closeWorksPage();
      }
    }
    
    // X 버튼 클릭 시에도 부드럽게 닫기
    const closeBtn = document.querySelector('.works-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeWorksPage();
      });
    }
    
    if (worksMain) {
      worksMain.addEventListener('click', handleEmptySpaceClick);
    }
    
    if (worksContainer) {
      worksContainer.addEventListener('click', (e) => {
        // 컨테이너 자체를 클릭한 경우 (빈 공간)
        if (e.target === worksContainer) {
          e.preventDefault();
          e.stopPropagation();
          closeWorksPage();
        }
      });
    }
  }
});

// Works 페이지 초기화 함수
function initWorksPage() {
  // URL 파라미터에서 작품 번호 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  let workNumber = urlParams.get('work') || '01';
  
  // 작품 데이터 (실제로는 API나 JSON 파일에서 가져올 수 있음)
  const worksData = {};
  // work-01부터 work-16까지 데이터 생성
  for (let i = 1; i <= 16; i++) {
    const num = i.toString().padStart(2, '0');
    worksData[num] = {
      title: `Eng title`,
      description: `한국어 제목`,
      image: `assets/images/work-${num}.svg`
    };
  }
  
  // work-01 특별 설정
  worksData['01'] = {
    title: `Smoker`,
    description: `담배피는 사람`,
    image: `assets/images/work-01.svg`
  };
  
  // work-02 특별 설정
  worksData['02'] = {
    title: `Delivery Man`,
    description: `택배 배달부원`,
    image: `assets/images/work-02.svg`
  };
  
  // work-03 특별 설정
  worksData['03'] = {
    title: `Gas Man`,
    description: `방구뀌는 사람`,
    image: `assets/images/work-03.svg`
  };
  
  // work-04 특별 설정
  worksData['04'] = {
    title: `Hiker and Rabbit`,
    description: `등산인과 토끼`,
    image: `assets/images/work-04.svg`
  };
  
  // work-05 특별 설정
  worksData['05'] = {
    title: `Samuel Beckett 「Molloy」  `,
    description: `숲을 향해 걷는 사람들`,
    image: `assets/images/work-05.svg`
  };
  
  // work-06 특별 설정
  worksData['06'] = {
    title: `Swimmer`,
    description: `초급과 중급 수영인`,
    image: `assets/images/work-06.svg`
  };
  
  // work-07 특별 설정
  worksData['07'] = {
    title: `Delivery Man`,
    description: `택배기사`,
    image: `assets/images/work-07.svg`
  };
  
  // work-08 특별 설정
  worksData['08'] = {
    title: `Gas Man`,
    description: `방구뀌는 사람의 모습들`,
    image: `assets/images/work-08.svg`
  };
  
  // work-09 특별 설정
  worksData['09'] = {
    title: `Dad at Home`,
    description: `집에서의 아빠`,
    image: `assets/images/work-09.svg`
  };
  
  // work-10 특별 설정
  worksData['10'] = {
    title: `Swimmers`,
    description: `수영하는 사람들`,
    image: `assets/images/work-10.svg`
  };
  
  // work-11 특별 설정
  worksData['11'] = {
    title: `People with Different Looks`,
    description: `모든 생김새가 다른 사람들`,
    image: `assets/images/work-11.svg`
  };
  
  // work-12 특별 설정
  worksData['12'] = {
    title: `Gourmet`,
    description: `미식가`,
    image: `assets/images/work-12.svg`
  };
  
  // work-13 특별 설정
  worksData['13'] = {
    title: `People with Different Looks`,
    description: `생김새가 다른 사람들`,
    image: `assets/images/work-13.svg`
  };
  
  // work-14 특별 설정
  worksData['14'] = {
    title: `Gourmet and rice`,
    description: `미식가와 주먹밥`,
    image: `assets/images/work-14.svg`
  };
  
  // work-15 특별 설정
  worksData['15'] = {
    title: `Shy boy`,
    description: `부끄러운 소년`,
    image: `assets/images/work-15.svg`
  };
  
  // work-16 특별 설정
  worksData['16'] = {
    title: `sookagraphic`,
    description: `소오카그라픽`,
    image: `assets/images/work-16.svg`
  };

  // 현재 작품 데이터 가져오기
  let currentWork = worksData[workNumber] || worksData['01'];
  
  // 페이지 내용 업데이트
  updateWorksContent(currentWork, workNumber);
  
  // 썸네일 생성
  generateThumbnails(workNumber);
  
  // 웹사이트 크기 변경 시 이미지 크기 재조정
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // 현재 작품 번호 다시 가져오기
      const currentUrlParams = new URLSearchParams(window.location.search);
      const currentWorkNum = currentUrlParams.get('work') || '01';
      const currentWorkData = worksData[currentWorkNum] || worksData['01'];
      updateWorksContent(currentWorkData, currentWorkNum);
    }, 100); // 디바운싱
  });
  
  // 키보드 화살표 키로도 네비게이션
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      let currentNum = parseInt(workNumber);
      if (currentNum > 1) {
        currentNum--;
        workNumber = currentNum.toString().padStart(2, '0');
        window.location.href = `works.html?work=${workNumber}`;
      }
    } else if (e.key === 'ArrowRight') {
      let currentNum = parseInt(workNumber);
      if (currentNum < 16) {
        currentNum++;
        workNumber = currentNum.toString().padStart(2, '0');
        window.location.href = `works.html?work=${workNumber}`;
      }
    }
  });
  
  // 모바일 뷰에서 좌우 스와이프로 이전/다음 작업물 이동
  let touchStartX = null;
  let touchStartY = null;
  const minSwipeDistance = 50; // 최소 스와이프 거리 (px)
  
  document.addEventListener('touchstart', (e) => {
    // 모바일 뷰에서만 작동 (768px 이하)
    if (window.innerWidth <= 768) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });
  
  document.addEventListener('touchend', (e) => {
    // 모바일 뷰에서만 작동
    if (window.innerWidth <= 768 && touchStartX !== null && touchStartY !== null) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      
      // 수평 스와이프가 수직 스와이프보다 크고, 최소 거리 이상일 때만 작동
      if (absDeltaX > absDeltaY && absDeltaX > minSwipeDistance) {
        const currentUrlParams = new URLSearchParams(window.location.search);
        let currentWorkNum = currentUrlParams.get('work') || '01';
        let currentNum = parseInt(currentWorkNum);
        
        if (deltaX > 0) {
          // 오른쪽으로 스와이프 (이전 작업물)
          if (currentNum > 1) {
            currentNum--;
            const newWorkNum = currentNum.toString().padStart(2, '0');
            window.location.href = `works.html?work=${newWorkNum}`;
          }
        } else {
          // 왼쪽으로 스와이프 (다음 작업물)
          if (currentNum < 16) {
            currentNum++;
            const newWorkNum = currentNum.toString().padStart(2, '0');
            window.location.href = `works.html?work=${newWorkNum}`;
          }
        }
      }
      
      touchStartX = null;
      touchStartY = null;
    }
  }, { passive: true });
}

// Works 페이지 내용 업데이트
function updateWorksContent(work, workNumber) {
  // 메인 이미지
  const mainImage = document.getElementById('works-main-image');
  const mainImageContainer = document.querySelector('.works-image-main');
  
  if (mainImage) {
    mainImage.src = work.image;
    mainImage.alt = work.title;
  }
  
  // 가로가 긴 이미지인지 확인 (work-05, work-10, work-11, work-12)
  const wideImages = ['05', '10', '11', '12'];
  const isWideImage = wideImages.includes(workNumber);
  
  // 이미지 비율 및 크기 동적 조정
  if (mainImageContainer) {
    // 모바일 뷰인지 확인 (768px 이하)
    const isMobile = window.innerWidth <= 768;
    
    // placeholder도 함께 조정
    const placeholder = mainImageContainer.querySelector('.works-image-placeholder');
    
    if (isWideImage) {
      // 가로가 긴 이미지: 696x366 비율
      mainImageContainer.style.aspectRatio = '696 / 366';
      if (placeholder) {
        placeholder.style.aspectRatio = '696 / 366';
      }
      
      if (isMobile) {
        // 모바일 뷰: width 100% 유지, aspect-ratio만 적용
        mainImageContainer.style.width = '100%';
        mainImageContainer.style.maxWidth = 'none';
        // 가로가 긴 이미지일 때 140px 아래로 이동
        mainImageContainer.classList.add('is-wide-mobile');
        const infoElement = document.querySelector('.works-info');
        if (infoElement) {
          infoElement.classList.add('is-wide-mobile');
        }
      } else {
        // 웹 뷰에서는 클래스 제거
        mainImageContainer.classList.remove('is-wide-mobile');
        const infoElement = document.querySelector('.works-info');
        if (infoElement) {
          infoElement.classList.remove('is-wide-mobile');
          // 웹 뷰에서 가로가 긴 이미지일 때 클래스 추가
          infoElement.classList.add('is-wide');
        }
        // 웹 뷰: 가로가 짧은 이미지의 세로 길이와 동일하게 맞추기
        // 가로가 짧은 이미지의 세로 길이 계산
        // 가로가 짧은 이미지: width 90%, max-width 630px, aspect-ratio 344/366
        const viewportWidth = window.innerWidth;
        const shortImageWidth = Math.min(viewportWidth * 0.9, 630);
        const shortImageHeight = shortImageWidth * (366 / 344);
        
        // 가로가 긴 이미지의 세로 길이를 동일하게 설정하고, 그에 맞는 가로 길이 계산
        const wideImageHeight = shortImageHeight;
        const wideImageWidth = wideImageHeight * (696 / 366);
        
        // width를 퍼센트로 설정 (max-width도 함께 설정)
        const wideImageWidthPercent = (wideImageWidth / viewportWidth) * 100;
        mainImageContainer.style.width = `${Math.min(wideImageWidthPercent, 95)}%`;
        mainImageContainer.style.maxWidth = `${wideImageWidth}px`;
        
        // 가로가 긴 이미지의 왼쪽 끝 위치 계산하여 .works-info 위치 조정
        if (infoElement) {
          // 이미지가 렌더링된 후 실제 너비를 측정
          // requestAnimationFrame을 사용하여 레이아웃이 완료된 후 측정
          requestAnimationFrame(() => {
            const actualImageWidth = mainImageContainer.offsetWidth || mainImageContainer.getBoundingClientRect().width;
            // 이미지가 중앙 정렬되어 있으므로, 왼쪽 끝 위치는 50% - (이미지 너비 / 2)
            const leftPosition = `calc(50% - ${actualImageWidth / 2}px)`;
            infoElement.style.left = leftPosition;
          });
        }
      }
    } else {
      // 세로가 긴 이미지: 344x366 비율 (또는 기본 비율)
      mainImageContainer.style.aspectRatio = '344 / 366';
      if (placeholder) {
        placeholder.style.aspectRatio = '344 / 366';
      }
      if (isMobile) {
        mainImageContainer.style.width = '100%';
        mainImageContainer.style.maxWidth = 'none';
        // 세로가 긴 이미지일 때는 클래스 제거
        mainImageContainer.classList.remove('is-wide-mobile');
        const infoElement = document.querySelector('.works-info');
        if (infoElement) {
          infoElement.classList.remove('is-wide-mobile');
        }
      } else {
        mainImageContainer.style.width = '90%';
        mainImageContainer.style.maxWidth = '630px';
        // 웹 뷰에서는 클래스 제거
        mainImageContainer.classList.remove('is-wide-mobile');
        const infoElement = document.querySelector('.works-info');
        if (infoElement) {
          infoElement.classList.remove('is-wide-mobile');
          // 세로가 긴 이미지일 때는 is-wide 클래스 제거하고 기본 위치로
          infoElement.classList.remove('is-wide');
          infoElement.style.left = ''; // 기본 CSS 값으로 복원
        }
      }
    }
  }
  
  // 제목
  const titleElement = document.getElementById('works-title');
  if (titleElement) {
    titleElement.textContent = work.title;
  }
  
  // 설명
  const descriptionElement = document.getElementById('works-description');
  if (descriptionElement) {
    descriptionElement.textContent = work.description;
  }
}

// 썸네일 생성 (무한스크롤)
function generateThumbnails(currentWorkNumber) {
  const thumbnailsContainer = document.getElementById('works-thumbnails');
  if (!thumbnailsContainer) return;
  
  thumbnailsContainer.innerHTML = '';
  
  // 무한스크롤을 위해 이미지를 충분히 많이 반복 (5회)
  const repeatCount = 5;
  
  // 썸네일 생성 함수
  function createThumbnail(num, isActive) {
    const thumbnail = document.createElement('div');
    // 가로가 긴 이미지인지 확인 (work-05, work-10)
    const wideImages = ['05', '10'];
    const isWideImage = wideImages.includes(num);
    thumbnail.className = `works-thumbnail ${isActive ? 'active' : ''} ${isWideImage ? 'works-thumbnail--wide' : ''}`;
    thumbnail.dataset.workNumber = num;
    
    const img = document.createElement('img');
    img.src = `assets/images/work-${num}.svg`;
    img.alt = `Work ${num}`;
    
    thumbnail.appendChild(img);
    
    // 썸네일 클릭 시 해당 작품으로 이동
    thumbnail.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = `works.html?work=${num}`;
    });
    
    return thumbnail;
  }
  
  // Fisher-Yates 셔플 알고리즘으로 랜덤 배열 생성
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  // 1부터 16까지의 배열 생성 (work-11, work-12 제외)
  const allWorkNumbers = Array.from({ length: 16 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const workNumbers = allWorkNumbers.filter(num => num !== '11' && num !== '12');
  
  // 썸네일 생성 (랜덤 순서로, 중복 없이)
  for (let repeat = 0; repeat < repeatCount; repeat++) {
    // 각 반복마다 새로운 랜덤 순서 생성 (중복 방지)
    const currentShuffled = shuffleArray(workNumbers);
    
    for (let i = 0; i < currentShuffled.length; i++) {
      const num = currentShuffled[i];
      const isActive = (num === currentWorkNumber && repeat === Math.floor(repeatCount / 2));
      thumbnailsContainer.appendChild(createThumbnail(num, isActive));
    }
  }
  
  // 초기 스크롤 위치를 왼쪽 끝으로 설정 (모션 없이)
  thumbnailsContainer.scrollLeft = 0;
  
  // 일정한 속도로 왼쪽 방향으로 자동 스크롤
  let autoScrollAnimationId;
  const scrollSpeed = 30; // 픽셀/초 (일정한 속도)
  let isScrolling = true;
  let lastTime = null;
  
  // 전역에서 접근 가능하도록 window 객체에 저장
  window.worksThumbnailScroll = {
    stop: () => {
      isScrolling = false;
      if (autoScrollAnimationId) {
        cancelAnimationFrame(autoScrollAnimationId);
      }
    }
  };
  
  function autoScroll(currentTime) {
    if (!isScrolling) return;
    
    if (lastTime === null) {
      lastTime = currentTime;
    }
    
    const deltaTime = (currentTime - lastTime) / 1000; // 초 단위
    lastTime = currentTime;
    
    const maxScroll = thumbnailsContainer.scrollWidth - thumbnailsContainer.clientWidth;
    const currentScroll = thumbnailsContainer.scrollLeft;
    const newScroll = currentScroll + (scrollSpeed * deltaTime);
    
    if (newScroll < maxScroll) {
      thumbnailsContainer.scrollLeft = newScroll;
      autoScrollAnimationId = requestAnimationFrame(autoScroll);
    } else {
      // 끝에 도달하면 처음으로 돌아가기
      thumbnailsContainer.scrollLeft = 0;
      lastTime = null;
      autoScrollAnimationId = requestAnimationFrame(autoScroll);
    }
  }
  
  // 페이지 진입 후 자동 스크롤 시작
  setTimeout(() => {
    autoScrollAnimationId = requestAnimationFrame(autoScroll);
  }, 100);
  
  // 마우스 호버 시 스크롤 일시 정지
  thumbnailsContainer.addEventListener('mouseenter', () => {
    isScrolling = false;
    if (autoScrollAnimationId) {
      cancelAnimationFrame(autoScrollAnimationId);
    }
  });
  
  // 마우스를 치우면 멈춘 위치에서 다시 시작
  thumbnailsContainer.addEventListener('mouseleave', () => {
    isScrolling = true;
    lastTime = null; // 시간 초기화하여 부드럽게 재시작
    autoScrollAnimationId = requestAnimationFrame(autoScroll);
  });
  
  // 페이지를 나갈 때 애니메이션 중지
  window.addEventListener('beforeunload', () => {
    isScrolling = false;
    if (autoScrollAnimationId) {
      cancelAnimationFrame(autoScrollAnimationId);
    }
  });
  
  // 페이지 닫기 버튼 클릭 시에도 중지
  const closeBtn = document.querySelector('.works-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      isScrolling = false;
      if (autoScrollAnimationId) {
        cancelAnimationFrame(autoScrollAnimationId);
      }
    });
  }
}
