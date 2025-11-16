# Git LFS 설정 가이드

## 1. Git LFS 설치

macOS에서 Homebrew를 사용하여 설치:
```bash
brew install git-lfs
```

## 2. Git LFS 초기화

프로젝트 디렉토리에서 실행:
```bash
git lfs install
```

## 3. Git 저장소 초기화 (아직 안 했다면)

```bash
git init
git add .gitattributes
git commit -m "Add Git LFS configuration"
```

## 4. 큰 파일들을 Git LFS로 추가

이미 .gitattributes 파일이 설정되어 있으므로, 파일을 추가하면 자동으로 Git LFS로 추적됩니다:

```bash
git add assets/images/photo.svg
git add assets/images/work-05.svg
git add assets/images/work-10.svg
git add assets/images/work-08.svg
git add assets/images/work-13.svg
git add assets/images/work-02.svg
git add .
git commit -m "Initial commit with Git LFS"
```

## 5. GitHub에 푸시

```bash
git remote add origin <your-github-repo-url>
git push -u origin main
```

## 참고사항

- Git LFS는 GitHub에서 무료로 1GB 저장공간과 1GB/month 대역폭을 제공합니다
- photo.svg (11MB)와 같은 큰 파일은 Git LFS 없이는 GitHub에 업로드하기 어렵습니다
- .gitattributes 파일이 이미 생성되어 있으므로, Git LFS를 설치하고 초기화한 후 파일을 추가하면 됩니다
