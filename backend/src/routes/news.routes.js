import express from 'express'
import Parser from 'rss-parser'
import * as cheerio from 'cheerio'

const router = express.Router()
const parser = new Parser()

const feeds = [
  'https://es.motorsport.com/rss/f1/news/',
  'https://es.motorsport.com/rss/wrc/news/',
  'https://es.motorsport.com/rss/wec/news/',
  'https://es.motorsport.com/rss/formula-e/news/',
]

async function getOmpNews() {
  try {
    const response = await fetch('https://www.us.ompracing.com/es/news/')
    const html = await response.text()
    const $ = cheerio.load(html)

    const news = []

    $('a').each((_index, element) => {
      const title = $(element).text().replace(/\s+/g, ' ').trim()
      const link = $(element).attr('href')

      if (
        title.length > 25 &&
        link &&
        !title.toLowerCase().includes('cargar más')
      ) {
        news.push({
          title,
          link: link.startsWith('http')
            ? link
            : `https://www.us.ompracing.com${link}`,
          source: 'OMP Racing',
          date: new Date().toISOString(),
        })
      }
    })

    return news.slice(0, 10)
  } catch (error) {
    console.error('Error OMP News:', error.message)
    return []
  }
}

router.get('/', async (_req, res) => {
  try {
    const ompNews = await getOmpNews()

    const results = await Promise.all(
      feeds.map((feedUrl) => parser.parseURL(feedUrl))
    )

    const motorsportNews = results.flatMap((feed) =>
      feed.items.map((item) => ({
        title: item.title,
        link: item.link,
        date: item.pubDate,
        source: feed.title,
      }))
    )

    // Primero OMP, luego Motorsport
    const news = [
      ...ompNews,
      ...motorsportNews
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 20),
    ]

    res.json(news)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Error cargando noticias',
    })
  }
})

export default router