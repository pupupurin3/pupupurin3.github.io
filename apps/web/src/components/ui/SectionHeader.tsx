import { Reveal } from './Reveal'

interface SectionHeaderProps {
  index: string
  title: string
  lede?: string
}

export function SectionHeader({ index, title, lede }: SectionHeaderProps) {
  return (
    <header className="section-header">
      <Reveal className="section-index">{index}</Reveal>
      <div>
        <Reveal as="h2">{title}</Reveal>
        {lede && (
          <Reveal as="p" delay={0.08} className="section-lede">
            {lede}
          </Reveal>
        )}
      </div>
    </header>
  )
}
