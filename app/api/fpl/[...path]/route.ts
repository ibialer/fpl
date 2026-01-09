import { NextRequest, NextResponse } from 'next/server'

const FPL_API_BASE = 'https://draft.premierleague.com/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const apiPath = path.join('/')
  const url = `${FPL_API_BASE}/${apiPath}`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FPL-Draft-League-App',
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `FPL API returned ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('FPL API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from FPL API' },
      { status: 500 }
    )
  }
}
