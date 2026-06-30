import { useEffect, useState } from 'react'

export default function NewsTicker() {
  const [news, setNews] = useState([])

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || '/api'}/news`)
      .then((res) => res.json())
      .then((data) => setNews(data))
      .catch((error) => console.error('Error cargando noticias', error))
  }, [])

  if (news.length === 0) return null

  return (
    <div className="news-ticker">
      <div className="news-track">
        {[...news, ...news].map((item, index) => (
          <a
            key={`${item.title}-${index}`}
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className={
                item.source === 'OMP Racing'
                ? 'news-item omp-news'
                : 'news-item'
            }
            >
            <strong>{item.source}</strong>
            <span>{item.title}</span>
            </a>
        ))}
      </div>
    </div>
  )
}