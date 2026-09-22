/**
 * 从微信返回的临时文件路径里取文件名。
 * chooseAvatar 给的是 wxfile://tmp_xxx.jpeg 这类路径，没有原始文件名，
 * 而后端签发直传凭证时要一个后缀来约束对象名，所以从路径尾巴上摘
 */
export function fileNameFromPath(path: string, fallbackName = 'avatar.jpg'): string {
  const clean = (path || '').split('?')[0].split('#')[0]
  const base = clean.slice(clean.lastIndexOf('/') + 1)
  return base.includes('.') ? base : fallbackName
}
