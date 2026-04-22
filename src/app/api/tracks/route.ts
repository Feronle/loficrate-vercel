import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl

    const search = searchParams.get('search') || ''
    const genres = searchParams.get('genres')?.split(',').filter(Boolean) || []
    const moods = searchParams.get('moods')?.split(',').filter(Boolean) || []
    const tempo = searchParams.get('tempo') || ''
    const instrument = searchParams.get('instrument') || ''
    const licenseTypes = searchParams.get('licenseTypes')?.split(',').filter(Boolean) || []
    const sourcePlatform = searchParams.get('sourcePlatform') || ''
    const excludedPlatforms = searchParams.get('excludedPlatforms')?.split(',').filter(Boolean) || []
    const youtubeSafeOnly = searchParams.get('youtubeSafeOnly') === 'true'
    const excludeIds = searchParams.get('excludeIds')?.split(',').filter(Boolean) || []

    const where: Prisma.TrackWhereInput = {
      AND: [],
    }

    // Search filter
    if (search) {
      (where.AND as Prisma.TrackWhereInput[]).push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { artist: { contains: search, mode: 'insensitive' } },
          { tags: { contains: search, mode: 'insensitive' } },
        ],
      })
    }

    // Genre filter
    if (genres.length > 0) {
      (where.AND as Prisma.TrackWhereInput[]).push({ genre: { in: genres } })
    }

    // Mood filter
    if (moods.length > 0) {
      (where.AND as Prisma.TrackWhereInput[]).push({ mood: { in: moods } })
    }

    // Tempo filter
    if (tempo) {
      (where.AND as Prisma.TrackWhereInput[]).push({ tempo })
    }

    // Instrument filter
    if (instrument) {
      (where.AND as Prisma.TrackWhereInput[]).push({ instrument })
    }

    // License type filter
    if (licenseTypes.length > 0) {
      (where.AND as Prisma.TrackWhereInput[]).push({ licenseType: { in: licenseTypes } })
    }

    // Source platform filter
    if (sourcePlatform) {
      (where.AND as Prisma.TrackWhereInput[]).push({ sourcePlatform })
    }

    // Exclude platforms
    if (excludedPlatforms.length > 0) {
      (where.AND as Prisma.TrackWhereInput[]).push({ sourcePlatform: { notIn: excludedPlatforms } })
    }

    // YouTube safe only
    if (youtubeSafeOnly) {
      (where.AND as Prisma.TrackWhereInput[]).push({ isYoutubeSafe: true })
    }

    // Exclude IDs (tracks already in playlist)
    if (excludeIds.length > 0) {
      (where.AND as Prisma.TrackWhereInput[]).push({ id: { notIn: excludeIds } })
    }

    // If no filters applied, remove empty AND
    if ((where.AND as Prisma.TrackWhereInput[]).length === 0) {
      delete (where as Record<string, unknown>).AND
    }

    const [tracks, allTracks] = await Promise.all([
      db.track.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      db.track.findMany(),
    ])

    const filterOptions = {
      genres: [...new Set(allTracks.map((t) => t.genre))].sort(),
      moods: [...new Set(allTracks.map((t) => t.mood))].sort(),
      tempos: [...new Set(allTracks.map((t) => t.tempo))].sort(),
      instruments: [...new Set(allTracks.map((t) => t.instrument))].sort(),
      licenseTypes: [...new Set(allTracks.map((t) => t.licenseType))].sort(),
      sourcePlatforms: [...new Set(allTracks.map((t) => t.sourcePlatform))].sort(),
    }

    return NextResponse.json({
      tracks: tracks.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      total: tracks.length,
      filterOptions,
    })
  } catch (error) {
    console.error('Failed to fetch tracks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tracks', tracks: [], total: 0, filterOptions: null },
      { status: 500 }
    )
  }
}
