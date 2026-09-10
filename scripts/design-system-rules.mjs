import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAW_COLOR_PATTERN = /#[\da-f]{3,8}\b|(?:rgb|hsl)a?\([^)]*\)/gi
const FULL_NUTUI_STYLE_PATTERN = /@nutui\/nutui-react-taro\/dist\/style(?:\.css)?/g

export function findRawColorViolations(source) {
  return Array.from(source.matchAll(RAW_COLOR_PATTERN), match => ({
    index: match.index ?? 0,
    value: match[0],
  }))
}

export function findForbiddenNutuiImports(source) {
  return Array.from(source.matchAll(FULL_NUTUI_STYLE_PATTERN), match => ({
    index: match.index ?? 0,
    value: match[0],
  }))
}

async function collectFiles(directory, extensions) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async entry => {
      const absolutePath = path.join(directory, entry.name)
      if (entry.isDirectory()) return collectFiles(absolutePath, extensions)
      return extensions.has(path.extname(entry.name)) ? [absolutePath] : []
    })
  )
  return files.flat()
}

export async function checkDesignSystem(projectRoot = process.cwd()) {
  const srcRoot = path.join(projectRoot, 'src')
  const files = await collectFiles(srcRoot, new Set(['.less', '.ts', '.tsx']))
  const violations = []

  for (const file of files) {
    const relativePath = path.relative(projectRoot, file).replaceAll('\\', '/')
    const source = await readFile(file, 'utf8')

    if (file.endsWith('.less') && !relativePath.startsWith('src/styles/')) {
      for (const match of findRawColorViolations(source)) {
        violations.push(`${relativePath}: raw color ${match.value}`)
      }
    }

    for (const match of findForbiddenNutuiImports(source)) {
      violations.push(`${relativePath}: full NutUI style import ${match.value}`)
    }

    if (source.includes('SpecificationColors')) {
      violations.push(`${relativePath}: deprecated SpecificationColors reference`)
    }
  }

  return violations
}

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isDirectRun) {
  const violations = await checkDesignSystem()
  if (violations.length > 0) {
    console.error(
      ['Design system check failed:', ...violations.map(item => `- ${item}`)].join('\n')
    )
    process.exitCode = 1
  } else {
    console.log('Design system check passed.')
  }
}
