# Contributing to SkillSwap

Thanks for your interest in contributing to SkillSwap! This guide will help you get started.

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/Lucky-Joshi/SkillSwap/issues) to avoid duplicates.
2. Open a new issue using the **Bug Report** template.
3. Include reproduction steps, expected vs. actual behavior, and your environment details.

### Requesting Features

1. Open a new issue using the **Feature Request** template.
2. Describe the problem you are solving and your proposed solution.
3. Include any mockups or examples if applicable.

### Submitting Changes

1. **Fork** the repository.
2. **Clone** your fork:
   ```bash
   git clone https://github.com/<your-username>/SkillSwap.git
   ```
3. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** following the code style guidelines below.
5. **Commit** your changes with a conventional commit message.
6. **Push** to your fork and open a **Pull Request**.

## Branch Naming Convention

Use the following prefixes:

| Prefix     | Purpose                        | Example                        |
|------------|--------------------------------|--------------------------------|
| `feature/` | New functionality              | `feature/hackathon-page`       |
| `fix/`     | Bug fixes                      | `fix/session-reminder-timing`  |
| `docs/`    | Documentation changes          | `docs/api-endpoints`           |
| `refactor/`| Code restructuring             | `refactor/auth-middleware`     |
| `test/`    | Adding or updating tests       | `test/recommendation-engine`   |

## Commit Format

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

**Types:**

- `feat` — A new feature
- `fix` — A bug fix
- `docs` — Documentation only changes
- `style` — Code style changes (formatting, missing semicolons, etc.)
- `refactor` — Code change that neither fixes a bug nor adds a feature
- `perf` — Performance improvement
- `test` — Adding or correcting tests
- `chore` — Maintenance tasks, dependencies, CI/CD

**Examples:**

```
feat(mentorship): add mentorship request flow
fix(chat): resolve message delivery delay
docs(readme): update installation instructions
refactor(backend): extract validation middleware
```

## Development Setup

### Prerequisites

- **Node.js** >= 18.x
- **Python** >= 3.10
- **MongoDB** >= 7.0
- **Docker** & **Docker Compose** (optional, for containerized setup)

### Backend

```bash
cd backend
npm install
cp .env.example .env   # configure environment variables
npm run dev
```

### AI Service

```bash
cd ai-service
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Docker Compose (Full Stack)

```bash
docker-compose up --build
```

## Code Style

### JavaScript / React

- **ESLint** is configured — run `npm run lint` before committing.
- **Prettier** handles formatting — run `npm run format` if needed.
- Follow the existing component patterns and naming conventions.
- Use **Tailwind CSS** utility classes for styling. Avoid inline styles.
- Wrap components in `React.memo` where performance requires it.

### Python

- Follow **PEP 8** conventions.
- Use type hints where practical.
- Format with `black` or the project's configured formatter.

## Pull Request Process

1. Ensure your branch is up to date with `main`.
2. Run linters and tests locally:
   ```bash
   # Backend
   cd backend && npm run lint && npm test

   # Frontend
   cd frontend && npm run lint && npm run build

   # AI Service
   cd ai-service && python -m pytest
   ```
3. Fill out the PR template completely.
4. Link any related issues using `Closes #<issue-number>`.
5. Request a review from a maintainer.
6. Address review feedback. Maintainers may request changes before merging.
7. Once approved, a maintainer will merge your PR.

## Questions?

Open an issue or reach out at [developer.lucky.joshi@gmail.com](mailto:developer.lucky.joshi@gmail.com).

Thank you for contributing to SkillSwap!
