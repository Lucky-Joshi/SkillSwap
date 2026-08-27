# SkillSwap — Release Process

## Versioning
This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

## Release Workflow

1. **Development**
   - Feature branches from `main`
   - PR review and merge

2. **Testing**
   - Manual testing checklist (see TESTING.md)
   - Verify all services start correctly
   - Check AI service fallback

3. **Version Bump**
   - Update version in package.json files
   - Update CHANGELOG.md

4. **Tag**
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push origin vX.Y.Z

5. **GitHub Release**
   - Create release from tag
   - Include CHANGELOG notes

6. **Deploy**
   - Push to main triggers CI/CD
   - Backend: Railway/Render
   - Frontend: Vercel/Netlify
   - AI Service: Railway

## Hotfix Process
1. Create `hotfix/xxx` branch from `main`
2. Fix the issue
3. PR → merge → tag → deploy
