// 기술명 → 브랜드 로고(Simple Icons). 스킬·프로젝트 스택 칩에서 공용으로 사용.
// 로고 없는 항목은 null 반환 → 텍스트만 렌더.
import {
  siTypescript, siGo, siNestjs, siExpress, siGin, siNatsdotio, siRabbitmq,
  siMysql, siMariadb, siRedis, siPrisma, siTypeorm, siHtml5, siCss, siSvelte,
  siReact, siDocker, siHarbor, siGit, siGithubactions, siVim, siTmux,
  siNodedotjs, siPm2, siNginx, siPostgresql, siRaspberrypi,
} from 'simple-icons'

export const SKILL_ICON = {
  TypeScript: siTypescript,
  Go: siGo,
  NestJS: siNestjs,
  Express: siExpress,
  Gin: siGin,
  NATS: siNatsdotio,
  RabbitMQ: siRabbitmq,
  MySQL: siMysql,
  MariaDB: siMariadb,
  Redis: siRedis,
  Prisma: siPrisma,
  TypeORM: siTypeorm,
  HTML: siHtml5,
  CSS: siCss,
  SvelteKit: siSvelte,
  React: siReact,
  Docker: siDocker,
  'Docker-Compose': siDocker,
  Harbor: siHarbor,
  Git: siGit,
  'GitHub Actions': siGithubactions,
  Vim: siVim,
  tmux: siTmux,
  // 프로젝트 스택 전용
  PM2: siPm2,
  Nginx: siNginx,
  PostgreSQL: siPostgresql,
  'Node.js': siNodedotjs,
}

// 복합 라벨("Node.js(Koa)", "라즈베리파이 직접 운영" 등)은 키워드 포함으로 매칭. 긴 키 우선.
const ALIASES = [
  ['라즈베리파이', siRaspberrypi],
  ['PostgreSQL', siPostgresql],
  ['Node.js', siNodedotjs],
]

export function resolveIcon(label) {
  if (SKILL_ICON[label]) return SKILL_ICON[label]
  for (const [key, icon] of ALIASES) if (label.includes(key)) return icon
  return null
}
