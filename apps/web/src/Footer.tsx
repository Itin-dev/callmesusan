type Props = {
  /** Full git commit SHA of this build; empty when unknown (e.g. no git). */
  commit: string
  /** Deploy environment: "production", "preview" or "development"; empty locally. */
  env: string
  repo?: string
}

export default function Footer({ commit, env, repo = 'Itin-dev/aihackaton_test' }: Props) {
  const label = env && env !== 'production' ? ` · ${env}` : ''
  return (
    <footer className="mt-auto pt-6 text-center text-xs text-muted-foreground">
      Version{' '}
      {commit ? (
        <a
          href={`https://github.com/${repo}/commit/${commit}`}
          className="font-mono underline hover:text-foreground"
        >
          {commit.slice(0, 7)}
        </a>
      ) : (
        'dev'
      )}
      {label}
    </footer>
  )
}
