import express, { Request, Response } from 'express'
import { PrismaClient} from '@prisma/client'
import { convertHourStringToMinutes } from './utils/convert-hour-string-to-minutes'
import { convertMinutesToHourString } from './utils/convert-minutes-to-hour-string'
import cors from 'cors'

const app = express()
const prisma = new PrismaClient({
  log: ['query']
})

app.use(express.json())
app.use(cors())

app.get('/games', async (request: Request, response: Response) => {
  try{
    const games = await prisma.game.findMany({
      include: {
        _count: {
          select: {
            ads: true
          }
        }
      }
    })

    return response.status(200).json(games)
  }catch(error) {
    return response.status(500).json({error})
  }
})

app.get('/games/:id/ads', async (request: Request, response: Response) => {
  const gameId = request.params.id

  try {
    const ads = await prisma.ad.findMany({
      select: {
        id: true,
        name: true,
        weekDays: true,
        useVoiceChannel: true,
        yearsPlaying: true,
        hourStart: true,
        hourEnd: true
      },
      where: {
        gameId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return response.status(200).json(ads.map(ad => {
      return {
        ...ad,
        weekDays: ad.weekDays.split(','),
        hourStart: convertMinutesToHourString(ad.hourStart),
        hourEnd: convertMinutesToHourString(ad.hourEnd),
      }
    }))
  } catch(error) {
    return response.status(500).json({ error })
  }
  
})

app.post('/games/:id/ads', async (request: Request, response: Response) => {
  const gameId = request.params.id
  const {
    name,
    yearsPlaying,
    discord,
    weekDays,
    hourStart,
    hourEnd,
    useVoiceChannel,
  } = request.body

  try {
    const ad = await prisma.ad.create({
      data: {
        gameId,
        name,
        yearsPlaying,
        discord,
        weekDays: weekDays.join(","),
        hourStart: convertHourStringToMinutes(hourStart),
        hourEnd: convertHourStringToMinutes(hourEnd),
        useVoiceChannel
      }
    })
    
    return response.status(201).json(ad)
  } catch(error) {
    return response.status(500).json({ error })
  }
})

app.get('/ads/:id/discord', async (request: Request, response: Response) => {
  const adId = request.params.id

  try {
    const ad = await prisma.ad.findUniqueOrThrow({
      select: {
        discord: true
      },
      where: {
        id: adId
      }
    })

    return response.status(200).json({
      discord: ad.discord
    })
  } catch(error) {
    return response.status(500).json({ error })
  }
  
  return response.send(200).json([])
})

app.listen(3333, () => {
  console.log("Api running...")
})