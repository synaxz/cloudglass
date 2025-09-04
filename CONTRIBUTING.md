# Contributing to CloudGlass

Thank you for your interest in contributing to CloudGlass! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

Before creating an issue, please:

1. **Search existing issues** to avoid duplicates
2. **Check if it's already fixed** in the latest version
3. **Use the issue templates** when available

When reporting bugs, please include:
- **Clear description** of the issue
- **Steps to reproduce** the problem
- **Expected vs actual behavior**
- **Environment details** (OS, Node.js version, Docker version)
- **Screenshots** if applicable

### Suggesting Features

We welcome feature suggestions! Please:

1. **Check existing issues** for similar requests
2. **Describe the use case** and benefits
3. **Provide mockups or examples** if possible
4. **Consider implementation complexity**

### Code Contributions

#### Prerequisites

- **Node.js**: v18+ (recommended: v20+)
- **Docker & Docker Compose**: For full stack development
- **Git**: For version control
- **Code Editor**: VS Code recommended (with extensions)

#### Development Setup

1. **Fork the repository**:
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/yourusername/cloudglass.git
   cd cloudglass
   ```

2. **Set up upstream remote**:
   ```bash
   git remote add upstream https://github.com/synaxz/cloudglass.git
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start development environment**:
   ```bash
   # Using Docker (recommended)
   npm run docker:dev
   
   # Or local development
   npm run dev
   ```

5. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

#### Development Workflow

1. **Make your changes**:
   - Follow the coding standards
   - Add tests if applicable
   - Update documentation

2. **Test your changes**:
   ```bash
   # Run linting
   npm run lint
   
   # Test with Docker
   npm run docker:up
   npm run docker:logs
   ```

3. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new AWS service support"
   # or
   git commit -m "fix: resolve S3 upload issue"
   ```

4. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   # Then create a Pull Request on GitHub
   ```

## 📋 Coding Standards

### TypeScript Guidelines

- **Use strict typing**: Avoid `any` types
- **Define interfaces**: For all data structures
- **Use proper generics**: For reusable components
- **Explicit types**: For function parameters and return values

```typescript
// ✅ Good
interface ServiceConfig {
  id: string
  name: string
  status: 'active' | 'coming-soon'
}

// ❌ Avoid
const service: any = { id: 's3' }
```

### React Patterns

- **Functional components**: Use function components with hooks
- **Custom hooks**: Extract reusable logic
- **Component composition**: Prefer composition over inheritance
- **Props validation**: Use TypeScript interfaces

```typescript
// ✅ Good
interface ServiceManagerProps {
  isSettingsVisible: boolean
  onSettingsToggle: () => void
}

export function ServiceManager({ isSettingsVisible, onSettingsToggle }: ServiceManagerProps) {
  // Component logic
}
```

### Styling Guidelines

- **Tailwind CSS**: Use utility classes
- **Dark mode support**: Always include dark mode classes
- **Responsive design**: Mobile-first approach
- **Consistent spacing**: Use the 8px grid system

```typescript
// ✅ Good - Dark mode support
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  <h2 className="text-xl font-semibold mb-4">Service Title</h2>
</div>

// ❌ Avoid - No dark mode
<div className="bg-white text-gray-900">
  <h2>Service Title</h2>
</div>
```

### API Design

- **RESTful endpoints**: Follow REST conventions
- **Consistent responses**: Use standardized response format
- **Error handling**: Proper HTTP status codes
- **Input validation**: Validate all inputs

```typescript
// ✅ Good - Consistent API response
export async function GET(request: NextRequest) {
  try {
    const data = await fetchData()
    return createSuccessResponse(data, 'Data retrieved successfully')
  } catch (error) {
    return createErrorResponse('Failed to fetch data', 500)
  }
}
```

## 🏗️ Architecture Guidelines

### Adding New AWS Services

When adding a new AWS service, follow this pattern:

1. **Update service configuration**:
   ```typescript
   // src/lib/services-config.ts
   {
     id: 'new-service',
     name: 'New Service',
     fullName: 'AWS New Service',
     shortName: 'Service',
     icon: NewIcon,
     color: 'text-purple-600',
     bgColor: 'bg-purple-50',
     borderColor: 'border-purple-200',
     hoverColor: 'hover:bg-purple-100',
     status: 'active',
     category: 'Category',
     description: 'Service description',
     features: ['Feature 1', 'Feature 2']
   }
   ```

2. **Create service manager component**:
   ```typescript
   // src/components/NewServiceManager.tsx
   export function NewServiceManager({ isSettingsVisible }: Props) {
     // Service-specific UI and logic
     // Include dark mode support
     // Add proper error handling
     // Include loading states
   }
   ```

3. **Add API routes**:
   ```typescript
   // src/app/api/new-service/route.ts
   export async function GET(request: NextRequest) {
     // API implementation
   }
   ```

4. **Update service router**:
   ```typescript
   // src/app/[service]/page.tsx
   case 'new-service':
     return <NewServiceManager isSettingsVisible={isSettingsVisible} />
   ```

5. **Add AWS client**:
   ```typescript
   // src/lib/aws-config.ts
   export function createNewServiceClient(config: AWSConfigData): NewServiceClient {
     // Client configuration
   }
   ```

### Component Structure

```
src/components/
├── ui/                    # Reusable UI components
├── [Service]Manager.tsx   # Service-specific components
├── Layout.tsx            # Main layout
├── Sidebar.tsx           # Navigation sidebar
└── TopNavigation.tsx     # Top navigation bar
```

### File Naming Conventions

- **Components**: PascalCase (`ServiceManager.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAWSClient.ts`)
- **Utilities**: camelCase (`apiClient.ts`)
- **Types**: PascalCase (`ServiceConfig.ts`)

## 🧪 Testing Guidelines

### Testing Strategy

- **Unit tests**: For utility functions and hooks
- **Component tests**: For React components
- **Integration tests**: For API routes
- **E2E tests**: For critical user flows

### Test Structure

```typescript
// __tests__/components/ServiceManager.test.tsx
import { render, screen } from '@testing-library/react'
import { ServiceManager } from '@/components/ServiceManager'

describe('ServiceManager', () => {
  it('renders service title', () => {
    render(<ServiceManager isSettingsVisible={false} />)
    expect(screen.getByText('Service Management')).toBeInTheDocument()
  })
})
```

## 📝 Documentation

### Code Documentation

- **JSDoc comments**: For functions and classes
- **README updates**: For new features
- **Type definitions**: Clear and comprehensive
- **API documentation**: For new endpoints

```typescript
/**
 * Creates an AWS S3 client with the provided configuration
 * @param config - AWS configuration object
 * @returns Configured S3Client instance
 */
export function createS3Client(config: AWSConfigData): S3Client {
  // Implementation
}
```

### Pull Request Guidelines

#### PR Title Format

- `feat: add new AWS service support`
- `fix: resolve S3 upload issue`
- `docs: update contributing guidelines`
- `style: improve dark mode colors`
- `refactor: extract common API logic`
- `test: add component tests`

#### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots to help explain your changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes
```

## 🐛 Bug Fix Process

1. **Identify the issue**: Clear reproduction steps
2. **Create a branch**: `fix/issue-description`
3. **Write tests**: Cover the bug scenario
4. **Fix the issue**: Implement the solution
5. **Update tests**: Ensure they pass
6. **Update documentation**: If needed
7. **Submit PR**: With detailed description

## ✨ Feature Development Process

1. **Discuss the feature**: Open an issue first
2. **Plan the implementation**: Break down into tasks
3. **Create a branch**: `feature/feature-name`
4. **Implement incrementally**: Small, focused commits
5. **Add tests**: Unit and integration tests
6. **Update documentation**: README, code comments
7. **Submit PR**: With comprehensive description

## 🚀 Release Process

1. **Version bump**: Update package.json
2. **Changelog**: Document all changes
3. **Tag release**: Create git tag
4. **Docker images**: Build and push
5. **Documentation**: Update if needed

## 💬 Communication

### Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and ideas
- **Pull Request Comments**: For code review discussions

### Code Review Process

1. **Automated checks**: Must pass CI/CD
2. **Peer review**: At least one approval required
3. **Maintainer review**: For significant changes
4. **Testing**: Manual testing encouraged

## 📜 License

By contributing to CloudGlass, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- **README**: Contributors section
- **Releases**: Changelog mentions
- **GitHub**: Contributor statistics

---

Thank you for contributing to CloudGlass! Your efforts help make AWS management more accessible and beautiful. 🚀
