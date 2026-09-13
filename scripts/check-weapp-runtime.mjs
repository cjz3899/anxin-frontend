import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)

export function hasHtmlRuntimeAdapter(runtimeJs, tagName) {
  const inlineSets = runtimeJs.matchAll(
    /([A-Za-z_$][\w$]*)\s*=\s*new Set\(\[([^\]]*)\]\)/g
  )

  for (const [, variableName, elementsSource] of inlineSets) {
    const elements = [...elementsSource.matchAll(/["']([^"']+)["']/g)].map(
      match => match[1]
    )
    if (!elements.includes(tagName)) continue

    const escapedVariable = variableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const mapsToText = new RegExp(
      `if\\s*\\(\\s*${escapedVariable}\\.has\\([^)]*\\)\\s*\\)\\s*(?:\\{\\s*)?return\\s*["']text["']`
    )
    return mapsToText.test(runtimeJs)
  }

  return false
}

export function getNutuiIconRootTag() {
  const { Home } = require('@nutui/icons-react-taro')
  const icon = Home({})
  const iconTemplate = icon.props.children
  return iconTemplate.type(iconTemplate.props).type
}

export async function checkWeappRuntime(projectRoot = process.cwd()) {
  const runtimeJsPath = path.join(projectRoot, 'dist', 'taro.js')
  const runtimeJs = await readFile(runtimeJsPath, 'utf8')
  const iconRootTag = getNutuiIconRootTag()

  return {
    path: runtimeJsPath,
    iconRootTag,
    passed: hasHtmlRuntimeAdapter(runtimeJs, iconRootTag),
  }
}

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isDirectRun) {
  try {
    const result = await checkWeappRuntime()
    if (!result.passed) {
      console.error(
        `The WeChat runtime does not map NutUI icon tag <${result.iconRootTag}> to a native node.`
      )
      process.exitCode = 1
    } else {
      console.log(`WeChat runtime compatibility check passed for <${result.iconRootTag}>.`)
    }
  } catch (error) {
    console.error(`Unable to check WeChat runtime templates: ${error.message}`)
    process.exitCode = 1
  }
}
